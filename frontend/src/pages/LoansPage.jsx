import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import Field, { inputClass } from '../components/ui/Field';
import { formatKES, formatDate } from '../lib/format';

const emptyForm = { userId: '', principalAmount: '', loanType: 'standard' };

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState(null);
  const [members, setMembers] = useState([]);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');
  const [creating, setCreating] = useState(false);

  const load = () => api.get('/loans').then(setLoans).catch((err) => setError(err.message));

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/users').then(setMembers).catch((err) => setFormError(err.message));
    }
  }, [user?.role]);

  const disburse = async (id) => {
    setBusyId(id);
    try {
      await api.post(`/loans/${id}/disburse`);
      await load();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusyId(null);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormSuccess('');
    setCreating(true);
    try {
      await api.post('/loans', {
        userId: form.userId,
        principalAmount: Number(form.principalAmount),
        loanType: form.loanType,
      });
      setFormSuccess('Loan created — it stays pending until disbursed below.');
      setForm(emptyForm);
      await load();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      {user?.role === 'admin' && (
        <section className="max-w-xl border-b border-rule pb-8">
          <h2 className="font-serif text-lg text-ink mb-1">New loan</h2>
          <p className="text-sm text-ink/60 mb-4">
            Standard loans get 10% flat interest and a 6-month term (12 months over KES 200,000).
            Emergency loans get a 2-month term at 0% interest. Both are calculated automatically.
          </p>
          <form onSubmit={handleCreate} className="flex flex-col gap-4">
            <div className="grid grid-cols-2 gap-4">
              <Field label="Member">
                <select
                  required
                  value={form.userId}
                  onChange={(e) => setForm({ ...form, userId: e.target.value })}
                  className={inputClass(false)}
                >
                  <option value="" disabled>
                    Choose a member
                  </option>
                  {members.map((m) => (
                    <option key={m._id} value={m._id}>
                      {m.fullName}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Loan type">
                <select
                  value={form.loanType}
                  onChange={(e) => setForm({ ...form, loanType: e.target.value })}
                  className={inputClass(false)}
                >
                  <option value="standard">Standard</option>
                  <option value="emergency">Emergency</option>
                </select>
              </Field>
            </div>

            <Field label="Principal amount (KES)">
              <input
                type="number"
                min="1"
                required
                value={form.principalAmount}
                onChange={(e) => setForm({ ...form, principalAmount: e.target.value })}
                className={inputClass(false)}
              />
            </Field>

            {formError && (
              <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">
                {formError}
              </p>
            )}
            {formSuccess && <p className="text-sm text-navy border-l-2 border-gold pl-3">{formSuccess}</p>}

            <Button type="submit" variant="gold" disabled={creating} className="self-start">
              {creating ? 'Creating…' : 'Create loan'}
            </Button>
          </form>
        </section>
      )}

      {error ? (
        <EmptyState title="The loan book didn't load" body={error} />
      ) : !loans ? null : loans.length === 0 ? (
        <EmptyState title="No loans yet" body="Loans an admin creates will appear here, from application through to being cleared." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm ledger-figures">
            <thead>
              <tr className="text-left text-ink/60 border-b border-rule">
                <th className="py-2 pr-4 font-normal">Member</th>
                <th className="py-2 pr-4 font-normal">Principal</th>
                <th className="py-2 pr-4 font-normal">Type</th>
                <th className="py-2 pr-4 font-normal">Total payable</th>
                <th className="py-2 pr-4 font-normal">Paid</th>
                <th className="py-2 pr-4 font-normal">Disbursed</th>
                <th className="py-2 pr-4 font-normal">Due</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                {user?.role === 'admin' && <th className="py-2 pr-4 font-normal" />}
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr key={loan._id} className="border-b border-rule">
                  <td className="py-2 pr-4">{loan.userId?.fullName || '—'}</td>
                  <td className="py-2 pr-4">{formatKES(loan.principalAmount)}</td>
                  <td className="py-2 pr-4 capitalize">{loan.loanType}</td>
                  <td className="py-2 pr-4">{formatKES(loan.totalPayable)}</td>
                  <td className="py-2 pr-4">{formatKES(loan.amountPaid)}</td>
                  <td className="py-2 pr-4">{loan.disbursedDate ? formatDate(loan.disbursedDate) : '—'}</td>
                  <td className="py-2 pr-4">{loan.dueDate ? formatDate(loan.dueDate) : '—'}</td>
                  <td className="py-2 pr-4 capitalize">{loan.status}</td>
                  {user?.role === 'admin' && (
                    <td className="py-2 pr-4">
                      {loan.status === 'pending' && (
                        <Button variant="ghost" onClick={() => disburse(loan._id)} disabled={busyId === loan._id}>
                          Disburse
                        </Button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
