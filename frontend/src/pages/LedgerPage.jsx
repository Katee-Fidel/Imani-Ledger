import { useEffect, useState } from 'react';
import { api } from '../api/client';
import StatFigure from '../components/ui/StatFigure';
import EmptyState from '../components/ui/EmptyState';
import { formatKES, formatDate, formatType } from '../lib/format';

const CONTRIBUTION_TYPES = ['shares_savings', 'christmas_contrib', 'retreat_contrib', 'office_contrib', 'sitting_allowance'];

export default function LedgerPage() {
  const [state, setState] = useState({ loading: true, error: '', transactions: [], loans: [] });

  useEffect(() => {
    Promise.all([api.get('/transactions?limit=100'), api.get('/loans')])
      .then(([txnPage, loans]) =>
        setState({ loading: false, error: '', transactions: txnPage.items, loans })
      )
      .catch((err) => setState({ loading: false, error: err.message, transactions: [], loans: [] }));
  }, []);

  if (state.loading) return null;
  if (state.error) {
    return (
      <EmptyState
        title="The ledger didn't load"
        body={`${state.error}. Check your connection and refresh the page.`}
      />
    );
  }

  const active = state.transactions.filter((t) => t.status === 'active');
  const pool = active.filter((t) => CONTRIBUTION_TYPES.includes(t.type)).reduce((sum, t) => sum + t.amount, 0);
  const finesCollected = active.filter((t) => t.type.startsWith('fine_')).reduce((sum, t) => sum + t.amount, 0);
  const activeLoans = state.loans.filter((l) => l.status === 'disbursed').length;

  return (
    <div className="flex flex-col gap-10">
      <section className="grid grid-cols-1 sm:grid-cols-3 gap-8 pb-8 border-b border-rule">
        <StatFigure label="Total Chama pool" value={formatKES(pool)} />
        <StatFigure label="Active loans" value={activeLoans} />
        <StatFigure label="Fines collected" value={formatKES(finesCollected)} tone="rust" />
      </section>

      <section>
        <h2 className="font-serif text-lg text-ink mb-4">Recent ledger entries</h2>
        {active.length === 0 ? (
          <EmptyState title="No entries yet" body="Contributions and loan activity will appear here once an admin records them." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm ledger-figures">
              <thead>
                <tr className="text-left text-ink/60 border-b border-rule">
                  <th className="py-2 pr-4 font-normal">Date</th>
                  <th className="py-2 pr-4 font-normal">Category</th>
                  <th className="py-2 pr-4 font-normal">Month</th>
                  <th className="py-2 pr-4 font-normal text-right">Amount</th>
                </tr>
              </thead>
              <tbody>
                {state.transactions.map((t) => (
                  <tr key={t._id} className={`border-b border-rule ${t.status === 'voided' ? 'opacity-40' : ''}`}>
                    <td className="py-2 pr-4">{formatDate(t.createdAt)}</td>
                    <td className="py-2 pr-4">{formatType(t.type)}</td>
                    <td className="py-2 pr-4">{t.monthTarget || '—'}</td>
                    <td className="py-2 pr-4 text-right">{formatKES(t.amount)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
