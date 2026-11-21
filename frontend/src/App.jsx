import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/AppLayout';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import LedgerPage from './pages/LedgerPage';
import LoansPage from './pages/LoansPage';
import StatementPage from './pages/StatementPage';
import AllocatePaymentPage from './pages/AllocatePaymentPage';
import MembersPage from './pages/MembersPage';
import ProfilePage from './pages/ProfilePage';
import ChangePasswordPage from './pages/ChangePasswordPage';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route element={<ProtectedRoute />}>
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route element={<AppLayout />}>
            <Route path="/" element={<LedgerPage />} />
            <Route path="/loans" element={<LoansPage />} />
            <Route path="/statement" element={<StatementPage />} />
            <Route path="/profile" element={<ProfilePage />} />
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
