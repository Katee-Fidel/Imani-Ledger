import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import LedgerPage from './pages/LedgerPage';
import LoansPage from './pages/LoansPage';
import StatementPage from './pages/StatementPage';
import AllocatePaymentPage from './pages/AllocatePaymentPage';
import MembersPage from './pages/MembersPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/" element={<LedgerPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/statement" element={<StatementPage />} />
            <Route element={<ProtectedRoute adminOnly />}>
              <Route path="/allocate" element={<AllocatePaymentPage />} />
              <Route path="/members" element={<MembersPage />} />
            </Route>
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
