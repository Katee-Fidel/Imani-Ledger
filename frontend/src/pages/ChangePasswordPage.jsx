import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import Field, { inputClass } from '../components/ui/Field';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';

// Reached either because an admin just reset this account's password (the
// server locks every other route until this is done — see backend
// middleware/auth.js), or voluntarily from the Profile page later.
export default function ChangePasswordPage() {
  const { user, updateUser } = useAuth();
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (newPassword !== confirm) {
      setError('Those two passwords don’t match.');
      return;
    }
    setSubmitting(true);
    try {
      await api.patch('/users/me/password', { newPassword });
      updateUser({ mustChangePassword: false });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md flex flex-col gap-5 rounded-xl bg-paper-raised border-t-4 border-t-gold px-8 py-9 shadow-xl"
      >
        <div>
          <h1 className="font-serif text-2xl text-ink">Set a new password</h1>
          {user?.mustChangePassword && (
            <p className="mt-2 text-base text-ink/70 leading-relaxed">
              An admin reset your password. Choose a new one before continuing.
            </p>
          )}
        </div>

        <Field label="New password">
          <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} autoComplete="new-password" />
        </Field>

        <Field label="Confirm new password">
          <input
            type="password"
            required
            autoComplete="new-password"
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            className={inputClass(false)}
          />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">
            {error}
          </p>
        )}

        <Button type="submit" variant="gold" size="lg" disabled={submitting}>
          {submitting ? 'Saving…' : 'Set password'}
        </Button>
      </form>
    </div>
  );
}
