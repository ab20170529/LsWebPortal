import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

const userAgent = typeof navigator !== 'undefined' ? navigator.userAgent : '';
const isChromiumBrowser = /Chrome|Chromium|Edg\//i.test(userAgent);
const isWebkitBrowser = /Safari/i.test(userAgent) && !isChromiumBrowser;

if (typeof document !== 'undefined') {
  document.documentElement.dataset.browserEngine = isChromiumBrowser
    ? 'chromium'
    : isWebkitBrowser
      ? 'webkit'
      : 'other';
  document.documentElement.dataset.appMode = import.meta.env.DEV ? 'dev' : 'prod';
}

const appNode = <App />;

createRoot(document.getElementById('root')!).render(
  import.meta.env.DEV ? appNode : (
    <StrictMode>
      <App />
    </StrictMode>
  ),
);
