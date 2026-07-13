'use client';

import { BrowserRouter } from 'react-router-dom';
import App from '../src/App';
import { AuthProvider } from '../src/context/AuthContext';
import { AppThemeProvider } from '../src/theme';

export default function ClientApp() {
  return (
    <AppThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </AppThemeProvider>
  );
}
