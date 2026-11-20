import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAvatar } from '../lib/avatar';
import GlyphMark from './brand/GlyphMark';
import Avatar from './ui/Avatar';

const tabClass = ({ isActive }) =>
  `px-3 py-3 text-sm rounded-t-sm border-b-[3px] transition-colors ${
    isActive
      ? 'font-semibold border-gold text-ink'
      : 'font-medium border-transparent text-ink/70 hover:text-ink hover:bg-navy/5'
  }`;

export default function AppLayout() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-rule bg-paper-raised">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <GlyphMark className="h-8 w-auto brand-glow" />
            <span className="font-serif text-lg text-ink">Imani Ledger</span>
          </div>
          <div className="flex items-center gap-5">
            <NavLink to="/profile" className="flex items-center gap-4 hover:opacity-80">
              <div className="text-right">
                <p className="text-sm text-ink">{user?.fullName}</p>
                <span className="inline-block mt-0.5 text-xs border border-rule px-1.5 py-0.5 text-ink/60 capitalize">
                  {user?.role}
                </span>
              </div>
              <Avatar src={user ? getAvatar(user.id) : null} name={user?.fullName} size={48} />
            </NavLink>
            <button onClick={logout} className="text-sm text-navy hover:text-gold-deep">
              Sign out
            </button>
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-6 flex gap-1 border-t border-rule">
          <NavLink to="/" end className={tabClass}>
            Ledger
          </NavLink>
          <NavLink to="/loans" className={tabClass}>
            Loans
          </NavLink>
          <NavLink to="/statement" className={tabClass}>
            My statement
          </NavLink>
          {user?.role === 'admin' && (
            <>
              <NavLink to="/allocate" className={tabClass}>
                Allocate payment
              </NavLink>
              <NavLink to="/members" className={tabClass}>
                Members
              </NavLink>
            </>
          )}
        </nav>
      </header>
      <main className="flex-1 max-w-6xl mx-auto w-full px-6 py-8">
        <Outlet />
      </main>
    </div>
  );
}
