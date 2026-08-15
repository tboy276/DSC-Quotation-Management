import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';
import { ResetPasswordPage } from './pages/ResetPasswordPage';

import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';

export function App() {
  return (
    <BrowserRouter>
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
    </BrowserRouter>
  );
}

export default App;
