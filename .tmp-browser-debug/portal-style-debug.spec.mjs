import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { expect, test } from 'playwright/test.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SCREENSHOT_DIR = __dirname;
const BASE_URL = process.env.PORTAL_DEBUG_BASE_URL ?? 'http://127.0.0.1:3201';
const LOGIN_NAME = process.env.PORTAL_LOGIN_NAME ?? '';
const LOGIN_PASSWORD = process.env.PORTAL_LOGIN_PASSWORD ?? '';

test.use({
  channel: 'chrome',
  viewport: {
    width: 1440,
    height: 1100,
  },
});

async function captureState(page, name) {
  await page.screenshot({
    path: path.join(SCREENSHOT_DIR, name),
    fullPage: true,
  });

  const styles = await page.evaluate(() => ({
    bodyBackground: getComputedStyle(document.body).backgroundImage,
    bodyColor: getComputedStyle(document.body).color,
    bodyFontFamily: getComputedStyle(document.body).fontFamily,
    rootBackground: getComputedStyle(document.documentElement).backgroundImage,
    rootFontFamily: getComputedStyle(document.documentElement).fontFamily,
    title: document.title,
    url: window.location.href,
  }));

  console.log(`[state:${name}] ${JSON.stringify(styles, null, 2)}`);
}

async function selectEmployee(page) {
  const employeeInput = page.locator('input[type="text"]').first();
  await employeeInput.click();
  await employeeInput.fill(LOGIN_NAME);
  await page.waitForTimeout(800);

  const directMatch = page.locator('button[type="button"]').filter({ hasText: LOGIN_NAME }).first();
  if (await directMatch.count()) {
    await directMatch.click();
    return;
  }

  await employeeInput.press('ArrowDown');
  await page.waitForTimeout(200);
  await employeeInput.press('Enter');
}

async function login(page) {
  await page.goto(`${BASE_URL}/designer`, { waitUntil: 'networkidle' });
  await captureState(page, '01-login.png');

  await selectEmployee(page);

  const passwordInput = page.locator('input[type="password"]').first();
  await passwordInput.fill(LOGIN_PASSWORD);
  await page.locator('button[type="submit"]').click();

  await page.waitForLoadState('networkidle');
}

async function activateFirstCompany(page) {
  const companyButton = page.locator('button[type="button"]').filter({
    has: page.locator('div.text-sm.font-black'),
  }).first();
  await expect(companyButton).toBeVisible({ timeout: 15000 });
  await companyButton.click();
  await page.waitForLoadState('networkidle');
}

test('capture portal login, system gate, and designer styles', async ({ page }) => {
  if (!LOGIN_NAME || !LOGIN_PASSWORD) {
    throw new Error('Missing PORTAL_LOGIN_NAME or PORTAL_LOGIN_PASSWORD.');
  }

  await login(page);
  await expect(page).toHaveURL(/\/systems/);
  await captureState(page, '02-systems-before-company.png');

  await activateFirstCompany(page);
  await page.waitForURL(/\/designer/, { timeout: 20000 });
  await captureState(page, '03-designer-after-company.png');
});
