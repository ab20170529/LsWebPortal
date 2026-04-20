import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { spawn } from 'node:child_process';

const BASE_URL = process.env.PORTAL_DEBUG_BASE_URL ?? 'http://127.0.0.1:3201';
const LOGIN_NAME = process.env.PORTAL_LOGIN_NAME ?? '';
const LOGIN_PASSWORD = process.env.PORTAL_LOGIN_PASSWORD ?? '';
const CHROME_EXE = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const DEBUG_PORT = 9222;
const OUTPUT_DIR = path.resolve('.tmp-browser-debug');
const USER_DATA_DIR = path.join(os.tmpdir(), 'lserp-portal-style-cdp');

if (!LOGIN_NAME || !LOGIN_PASSWORD) {
  throw new Error('Missing PORTAL_LOGIN_NAME or PORTAL_LOGIN_PASSWORD.');
}

await fs.mkdir(OUTPUT_DIR, { recursive: true });
await fs.rm(USER_DATA_DIR, { recursive: true, force: true });
await fs.mkdir(USER_DATA_DIR, { recursive: true });

const chrome = spawn(
  CHROME_EXE,
  [
    '--headless=new',
    '--disable-gpu',
    '--hide-scrollbars',
    `--remote-debugging-port=${DEBUG_PORT}`,
    `--user-data-dir=${USER_DATA_DIR}`,
    '--window-size=1440,1100',
    `${BASE_URL}/designer`,
  ],
  {
    stdio: ['ignore', 'pipe', 'pipe'],
  },
);

chrome.stdout.on('data', () => {});
chrome.stderr.on('data', () => {});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

async function waitForJsonList() {
  for (let index = 0; index < 50; index += 1) {
    try {
      const response = await fetch(`http://127.0.0.1:${DEBUG_PORT}/json/list`);
      if (response.ok) {
        const targets = await response.json();
        if (Array.isArray(targets) && targets.length > 0) {
          return targets;
        }
      }
    } catch {}

    await sleep(250);
  }

  throw new Error('Chrome remote debugging endpoint was not ready.');
}

const targets = await waitForJsonList();
const pageTarget = targets.find((target) => target.type === 'page' && String(target.url).includes(BASE_URL))
  ?? targets.find((target) => target.type === 'page');

if (!pageTarget?.webSocketDebuggerUrl) {
  throw new Error('No Chrome page target was available.');
}

const socket = new WebSocket(pageTarget.webSocketDebuggerUrl);
await new Promise((resolve, reject) => {
  socket.addEventListener('open', resolve, { once: true });
  socket.addEventListener('error', reject, { once: true });
});

let currentId = 0;
const pending = new Map();

socket.addEventListener('message', (event) => {
  const payload = JSON.parse(String(event.data));
  if (payload.id && pending.has(payload.id)) {
    const handler = pending.get(payload.id);
    pending.delete(payload.id);
    if (payload.error) {
      handler.reject(new Error(payload.error.message));
      return;
    }
    handler.resolve(payload.result);
  }
});

function call(method, params = {}) {
  currentId += 1;
  const id = currentId;
  socket.send(JSON.stringify({ id, method, params }));
  return new Promise((resolve, reject) => {
    pending.set(id, { resolve, reject });
  });
}

async function evaluate(expression) {
  const result = await call('Runtime.evaluate', {
    expression,
    awaitPromise: true,
    returnByValue: true,
  });
  return result.result?.value;
}

async function waitFor(expression, timeoutMs = 20000) {
  const deadline = Date.now() + timeoutMs;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const value = await evaluate(expression);
    if (value) {
      return value;
    }
    if (Date.now() > deadline) {
      throw new Error(`Timed out waiting for condition: ${expression}`);
    }
    await sleep(250);
  }
}

async function screenshot(name) {
  const result = await call('Page.captureScreenshot', {
    captureBeyondViewport: true,
    fromSurface: true,
  });
  await fs.writeFile(path.join(OUTPUT_DIR, name), Buffer.from(result.data, 'base64'));
}

async function logState(name) {
  const state = await evaluate(`(() => ({
    bodyBackground: getComputedStyle(document.body).backgroundImage,
    bodyFontFamily: getComputedStyle(document.body).fontFamily,
    rootBackground: getComputedStyle(document.documentElement).backgroundImage,
    rootFontFamily: getComputedStyle(document.documentElement).fontFamily,
    geometry: (() => {
      const rect = (selector, matcher) => {
        const nodes = Array.from(document.querySelectorAll(selector));
        const target = nodes.find((node) => matcher(node));
        if (!target) {
          return null;
        }
        const bounds = target.getBoundingClientRect();
        return {
          height: Math.round(bounds.height),
          width: Math.round(bounds.width),
          x: Math.round(bounds.x),
          y: Math.round(bounds.y),
        };
      };

      return {
        card: rect('div', (node) => (node.textContent || '').includes('欢迎回来') && getComputedStyle(node).backdropFilter !== 'none'),
        heading: rect('h1', (node) => (node.textContent || '').includes('构建')),
        headingDetails: (() => {
          const nodes = Array.from(document.querySelectorAll('h1'));
          const target = nodes.find((node) => (node.textContent || '').includes('构建'));
          return target ? {
            className: target.className,
            fontSize: getComputedStyle(target).fontSize,
            lineHeight: getComputedStyle(target).lineHeight,
            text: target.textContent,
          } : null;
        })(),
        highlight: rect('h3', (node) => (node.textContent || '').includes('需求洞察')),
        logo: rect('span,div', (node) => (node.textContent || '').trim() === 'LANGSU AI'),
      };
    })(),
    textSample: document.body.innerText.slice(0, 240),
    url: location.href
  }))()`);
  console.log(`[state:${name}] ${JSON.stringify(state, null, 2)}`);
}

async function clickExpression(expression) {
  return evaluate(`(() => {
    const target = ${expression};
    if (!target) {
      return false;
    }
    target.click();
    return true;
  })()`);
}

try {
  await call('Page.enable');
  await call('Runtime.enable');

  await waitFor(`document.readyState === 'complete'`);
  await waitFor(`document.querySelectorAll('input').length >= 2`);
  await waitFor(`!document.body.innerText.includes('正在加载人员列表')`, 30000);

  await screenshot('01-login.png');
  await logState('01-login');

  await evaluate(`(() => {
    const input = document.querySelectorAll('input[type="text"]')[0];
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(LOGIN_NAME)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    input.focus();
    return true;
  })()`);

  await sleep(1200);

  const selectedEmployee = await clickExpression(`Array.from(document.querySelectorAll('button[type="button"]'))
    .find((button) => button.textContent?.includes(${JSON.stringify(LOGIN_NAME)}))`);
  if (!selectedEmployee) {
    throw new Error('Failed to select employee option.');
  }

  await evaluate(`(() => {
    const input = document.querySelector('input[type="password"]');
    const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
    setter.call(input, ${JSON.stringify(LOGIN_PASSWORD)});
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.dispatchEvent(new Event('change', { bubbles: true }));
    return true;
  })()`);

  const submitted = await clickExpression(`document.querySelector('button[type="submit"]')`);
  if (!submitted) {
    throw new Error('Failed to click submit button.');
  }

  await waitFor(`location.pathname === '/systems'`, 30000);
  await waitFor(`Array.from(document.querySelectorAll('button')).some((button) => button.querySelector('div.text-sm.font-black'))`, 30000);
  await screenshot('02-systems-before-company.png');
  await logState('02-systems-before-company');

  const activatedCompany = await clickExpression(`Array.from(document.querySelectorAll('button'))
    .find((button) => button.querySelector('div.text-sm.font-black'))`);
  if (!activatedCompany) {
    throw new Error('Failed to activate company button.');
  }

  await waitFor(`location.pathname === '/designer' || location.pathname.startsWith('/designer/')`, 30000);
  await sleep(1500);
  await screenshot('03-designer-after-company.png');
  await logState('03-designer-after-company');
} finally {
  socket.close();
  chrome.kill('SIGKILL');
}
