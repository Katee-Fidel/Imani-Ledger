import { Link } from 'react-router-dom';

// There's no self-service reset here on purpose: the system has no email
// sending set up, and accounts are only ever created by an admin (public
// signup is off by default). An admin can set a new password directly.
export default function ForgotPasswordPage() {
  return (
    <div className="min-h-screen bg-paper flex items-center justify-center px-6">
      <div className="w-full max-w-md flex flex-col gap-4 rounded-xl bg-paper-raised border-t-4 border-t-gold px-8 py-9 shadow-xl">
        <h1 className="font-serif text-2xl text-ink">Forgot your password?</h1>
        <p className="text-base text-ink/70 leading-relaxed">
          This ledger does not reset passwords by email. Ask your Chama admin (your Treasurer,
          Secretary, or Chairperson) to set a new password for your account, then sign in with
          that one.
        </p>
        <Link to="/login" className="text-base text-navy hover:text-gold-deep">
          Back to sign in
        </Link>
      </div>
    </div>
  );
}
