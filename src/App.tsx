import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';

import { BrowserRouter } from 'react-router-dom';
import { ConfirmDialogProvider } from './context/ConfirmDialogContext';

export function App() {
  return (
    <BrowserRouter>
      <ConfirmDialogProvider>
        <AuthProvider>
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </AuthProvider>
    </ConfirmDialogProvider>
    </BrowserRouter>
  );
}

export default App;
