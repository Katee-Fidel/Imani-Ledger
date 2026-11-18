import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { formatKES, formatDate } from '../lib/format';

export default function LoansPage() {
  const { user } = useAuth();
  const [loans, setLoans] = useState(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState(null);

  const load = () => api.get('/loans').then(setLoans).catch((err) => setError(err.message));

  useEffect(load, []);

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

  if (error) return <EmptyState title="The loan book didn't load" body={error} />;
  if (!loans) return null;
  if (loans.length === 0) {
    return <EmptyState title="No loans yet" body="Loans an admin creates will appear here, from application through to being cleared." />;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm ledger-figures">
        <thead>
          <tr className="text-left text-ink/60 border-b border-rule">
            <th className="py-2 pr-4 font-normal">Principal</th>
            <th className="py-2 pr-4 font-normal">Type</th>
            <th className="py-2 pr-4 font-normal">Total payable</th>
            <th className="py-2 pr-4 font-normal">Paid</th>
            <th className="py-2 pr-4 font-normal">Due</th>
            <th className="py-2 pr-4 font-normal">Status</th>
            {user?.role === 'admin' && <th className="py-2 pr-4 font-normal" />}
          </tr>
        </thead>
        <tbody>
          {loans.map((loan) => (
            <tr key={loan._id} className="border-b border-rule">
              <td className="py-2 pr-4">{formatKES(loan.principalAmount)}</td>
              <td className="py-2 pr-4 capitalize">{loan.loanType}</td>
              <td className="py-2 pr-4">{formatKES(loan.totalPayable)}</td>
              <td className="py-2 pr-4">{formatKES(loan.amountPaid)}</td>
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
  );
}
