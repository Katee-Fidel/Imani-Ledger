import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import StatFigure from '../components/ui/StatFigure';
import Button from '../components/ui/Button';
import { formatKES, formatDate, formatType } from '../lib/format';

// Same set LedgerPage.jsx uses for the group-wide pool total — these are the
// only entry types that represent the member's own money going IN. A loan
// disbursement is money the Chama pays OUT to them (a debt, not equity), so
// it must never be summed alongside contributions into one "balance".
const CONTRIBUTION_TYPES = ['shares_savings', 'christmas_contrib', 'retreat_contrib', 'office_contrib', 'sitting_allowance'];

export default function StatementPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState(null);
  const [loans, setLoans] = useState([]);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    Promise.all([api.get(`/transactions?userId=${user.id}`), api.get(`/loans?userId=${user.id}`)])
      .then(([page, loanList]) => {
        setTransactions(page.items);
        setLoans(loanList);
      })
      .catch((err) => setError(err.message));
  }, [user.id]);

  const downloadPdf = async () => {
    setDownloading(true);
    try {
      const res = await fetch(`/api/statements/${user.id}`, {
        headers: { Authorization: `Bearer ${getToken()}` },
      });
      if (!res.ok) throw new Error('Could not generate the statement');
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `imani-statement-${user.id}.pdf`;
      link.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      setError(err.message);
    } finally {
      setDownloading(false);
    }
  };

  if (error) return <EmptyState title="Your statement didn't load" body={error} />;
  if (!transactions) return null;

  const active = transactions.filter((t) => t.status === 'active');
  const contributionsBalance = active
    .filter((t) => CONTRIBUTION_TYPES.includes(t.type))
    .reduce((sum, t) => sum + t.amount, 0);
  const finesCharged = active.filter((t) => t.type.startsWith('fine_')).reduce((sum, t) => sum + t.amount, 0);
  const outstandingLoans = loans
    .filter((l) => l.status === 'disbursed')
    .reduce((sum, l) => sum + (l.totalPayable - l.amountPaid), 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-6 border-b border-rule pb-6">
        <section className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          <StatFigure label="Contributions balance" value={formatKES(contributionsBalance)} />
          <StatFigure label="Outstanding loans" value={formatKES(outstandingLoans)} tone="rust" />
          <StatFigure label="Fines charged" value={formatKES(finesCharged)} tone="rust" />
        </section>
        <Button variant="gold" onClick={downloadPdf} disabled={downloading}>
          {downloading ? 'Preparing…' : 'Download statement'}
        </Button>
      </div>

      {transactions.length === 0 ? (
        <EmptyState title="Nothing recorded yet" body="Your contributions, loans, and fines will show up here as they're posted." />
      ) : (
        <table className="w-full text-sm ledger-figures">
          <thead>
            <tr className="text-left text-ink/60 border-b border-rule">
              <th className="py-2 pr-4 font-normal">Date</th>
              <th className="py-2 pr-4 font-normal">Entry</th>
              <th className="py-2 pr-4 font-normal text-right">Amount</th>
            </tr>
          </thead>
          <tbody>
            {transactions.map((t) => (
              <tr key={t._id} className={`border-b border-rule ${t.status === 'voided' ? 'opacity-40' : ''}`}>
                <td className="py-2 pr-4">{formatDate(t.createdAt)}</td>
                <td className="py-2 pr-4">{formatType(t.type)}</td>
                <td className="py-2 pr-4 text-right">{formatKES(t.amount)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
