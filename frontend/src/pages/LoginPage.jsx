import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import FullLockup from '../components/brand/FullLockup';
import Field, { inputClass } from '../components/ui/Field';
import Button from '../components/ui/Button';

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen grid md:grid-cols-2">
      <div className="bg-ink text-paper-raised flex flex-col justify-center px-10 py-16 md:px-16">
        <div className="max-w-sm motion-safe:animate-[fadeUp_0.6s_ease-out]">
          <FullLockup className="h-28 w-auto" />
          <p className="mt-8 text-paper-raised/70 leading-relaxed">
            One ledger your whole Chama can see. Every share, loan, and fine recorded the
            moment it happens — and never quietly erased.
          </p>
        </div>
      </div>

      <div className="flex items-center justify-center px-6 py-16">
        <form onSubmit={handleSubmit} className="w-full max-w-sm flex flex-col gap-6">
          <div>
            <h1 className="font-serif text-2xl text-ink">Sign in to your account</h1>
            <p className="mt-1 text-sm text-ink/60">Use the email and password your admin gave you.</p>
          </div>

          <Field label="Email">
            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          <Field label="Password">
            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={inputClass(false)}
            />
          </Field>

          {error && (
            <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">
              {error}
            </p>
          )}

          <Button type="submit" disabled={submitting}>
            {submitting ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </div>

      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
