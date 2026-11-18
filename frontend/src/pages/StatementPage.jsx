import { useEffect, useState } from 'react';
import { api, getToken } from '../api/client';
import { useAuth } from '../context/AuthContext';
import EmptyState from '../components/ui/EmptyState';
import Button from '../components/ui/Button';
import { formatKES, formatDate, formatType } from '../lib/format';

export default function StatementPage() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState(null);
  const [error, setError] = useState('');
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    api
      .get(`/transactions?userId=${user.id}`)
      .then((page) => setTransactions(page.items))
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

  const balance = transactions.filter((t) => t.status === 'active').reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between border-b border-rule pb-6">
        <div>
          <p className="text-sm text-ink/60">Net balance</p>
          <p className="font-serif text-3xl ledger-figures text-ink">{formatKES(balance)}</p>
        </div>
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
