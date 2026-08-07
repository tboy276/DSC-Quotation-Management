import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';

import { BrowserRouter } from 'react-router-dom';

export function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ProtectedRoute>
          <DashboardPage />
        </ProtectedRoute>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
