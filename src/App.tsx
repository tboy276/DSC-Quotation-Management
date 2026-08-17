import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';
import { ErrorBoundary } from './components/ErrorBoundary';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';
import { ToastProvider } from './context/ToastContext';

export function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <ToastProvider>
          <ConfirmDialogProvider>
            <Routes>
              <Route path="/reset-password" element={<ResetPasswordPage />} />
              <Route
                path="/*"
                element={
                  <AuthProvider>
                    <ProtectedRoute>
                      <DashboardPage />
                    </ProtectedRoute>
                  </AuthProvider>
                }
              />
            </Routes>
          </ConfirmDialogProvider>
        </ToastProvider>
      </ErrorBoundary>
    </BrowserRouter>
  );
}

export default App;
