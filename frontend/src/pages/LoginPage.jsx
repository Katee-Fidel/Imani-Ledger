import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import GlyphMark from '../components/brand/GlyphMark';
import Field, { inputClass } from '../components/ui/Field';
import PasswordInput from '../components/ui/PasswordInput';
import Button from '../components/ui/Button';

// A linear-gradient angle only guarantees its OWN axis hits a corner — the
// visible seam (perpendicular to that axis) drifts away from the other two
// corners on any non-square window. clip-path triangles don't have that
// problem: percentages on each axis are independent, so this line runs
// exactly from the bottom-left corner to the top-right corner regardless
// of the window's aspect ratio.
const NAVY_TRIANGLE = { clipPath: 'polygon(0% 0%, 100% 0%, 0% 100%)' };
const GOLD_SEAM = { clipPath: 'polygon(0% 0%, 100% 1.4%, 1.4% 100%)' };

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
    <div className="relative min-h-screen bg-paper">
      <div className="absolute inset-0" style={GOLD_SEAM}>
        <div className="absolute inset-0 bg-gold" />
      </div>
      <div className="absolute inset-0" style={NAVY_TRIANGLE}>
        <div className="absolute inset-0 bg-navy" />
      </div>

      {/* Three stacked grid rows (logo / card / tagline), not absolute
          positioning — the card can never overlap the corners because each
          lives in its own row, however tall the middle one grows. */}
      <div className="relative z-10 min-h-screen grid grid-rows-[auto_1fr_auto]">
        <div className="px-6 py-6 md:px-10 md:py-10 flex items-center gap-3">
          <GlyphMark
            className="h-10 w-auto"
            style={{
              filter:
                'drop-shadow(0 0 6px rgba(255,255,255,0.9)) drop-shadow(0 0 14px rgba(255,255,255,0.6))',
            }}
          />
          <span className="font-serif text-2xl text-paper-raised">Imani Ledger</span>
        </div>

        <div className="flex items-center justify-center px-6 py-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-md flex flex-col gap-5 rounded-xl bg-paper-raised/55 backdrop-blur-2xl border border-white/50 border-t-4 border-t-gold px-8 py-9 shadow-2xl ring-1 ring-white/20"
          >
            <h1 className="font-serif text-2xl text-ink">Sign in to your account</h1>

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
              <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} />
            </Field>

            <Link to="/forgot-password" className="-mt-2 self-end text-sm text-navy hover:text-gold-deep">
              Forgot password?
            </Link>

            {error && (
              <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">
                {error}
              </p>
            )}

            <Button type="submit" variant="gold" size="lg" disabled={submitting}>
              {submitting ? 'Signing in…' : 'Sign in'}
            </Button>
          </form>
        </div>

        <div className="px-6 py-6 md:px-10 md:py-10 flex justify-end">
          <p className="max-w-xs text-right text-sm text-ink/70 leading-relaxed">
            Every contribution, loan, and fine your Chama records lands here the moment it is
            posted. Nothing is ever deleted, only corrected in the open.
          </p>
        </div>
      </div>
    </div>
  );
}
