import React from 'react';
import ReactDOM from 'react-dom/client';
import { PortalAuthProvider } from '@lserp/auth';
import { PortalThemeProvider } from '@lserp/tokens';

import { PortalPresentationProvider } from './app/presentation/portal-presentation-provider';
import { PortalRouter } from './router';
import './styles/theme.css';
import './styles/foundation.css';
import './styles/auth.css';
import './styles/shell.css';
import './styles/system-gate.css';

const rootElement = document.getElementById('root');

if (!rootElement) {
  throw new Error('Portal root element was not found.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <PortalThemeProvider>
      <PortalPresentationProvider>
        <PortalAuthProvider>
          <PortalRouter />
        </PortalAuthProvider>
      </PortalPresentationProvider>
    </PortalThemeProvider>
  </React.StrictMode>,
);
