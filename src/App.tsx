import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DashboardPage } from './pages/DashboardPage';

export function App() {
  return (
    <AuthProvider>
      <ProtectedRoute>
        <DashboardPage />
      </ProtectedRoute>
    </AuthProvider>
  );
}

export default App;
