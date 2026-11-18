import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Field, { inputClass } from '../components/ui/Field';
import Button from '../components/ui/Button';
import { formatType } from '../lib/format';

const CATEGORY_OPTIONS = [
  'shares_savings',
  'christmas_contrib',
  'retreat_contrib',
  'office_contrib',
  'sitting_allowance',
  'loan_repayment',
];

const emptyLine = () => ({ type: 'shares_savings', amount: '', referenceId: '' });

export default function AllocatePaymentPage() {
  const [members, setMembers] = useState([]);
  const [userId, setUserId] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('mpesa');
  const [receiptNumber, setReceiptNumber] = useState('');
  const [monthTarget, setMonthTarget] = useState(() => new Date().toISOString().slice(0, 7));
  const [lines, setLines] = useState([emptyLine()]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.get('/users').then(setMembers).catch((err) => setError(err.message));
  }, []);

  const allocated = lines.reduce((sum, l) => sum + (Number(l.amount) || 0), 0);
  const remaining = (Number(totalAmount) || 0) - allocated;

  const updateLine = (index, patch) =>
    setLines((prev) => prev.map((line, i) => (i === index ? { ...line, ...patch } : line)));

  const removeLine = (index) => setLines((prev) => prev.filter((_, i) => i !== index));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (remaining !== 0) {
      setError(`The line items must add up to the total deposit — currently KES ${remaining} unallocated.`);
      return;
    }
    setSubmitting(true);
    try {
      await api.post('/transactions/allocate', {
        userId,
        totalAmount: Number(totalAmount),
        paymentMethod,
        receiptNumber,
        monthTarget,
        allocations: lines.map((l) => ({
          type: l.type,
          amount: Number(l.amount),
          ...(l.type === 'loan_repayment' ? { referenceId: l.referenceId } : {}),
        })),
      });
      setSuccess('Payment allocated and posted to the ledger.');
      setLines([emptyLine()]);
      setTotalAmount('');
      setReceiptNumber('');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl flex flex-col gap-8">
      <div>
        <h1 className="font-serif text-xl text-ink">Allocate a payment</h1>
        <p className="mt-1 text-sm text-ink/60">
          Split one deposit across contribution categories or loan repayments. The lines below must add
          up to the total before this can be posted.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Field label="Member">
          <select required value={userId} onChange={(e) => setUserId(e.target.value)} className={inputClass(false)}>
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
        <Field label="Billing month">
          <input
            type="month"
            required
            value={monthTarget}
            onChange={(e) => setMonthTarget(e.target.value)}
            className={inputClass(false)}
          />
        </Field>
        <Field label="Total deposit (KES)">
          <input
            type="number"
            min="1"
            required
            value={totalAmount}
            onChange={(e) => setTotalAmount(e.target.value)}
            className={inputClass(false)}
          />
        </Field>
        <Field label="Payment method">
          <input required value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass(false)} />
        </Field>
        <Field label="Receipt number">
          <input required value={receiptNumber} onChange={(e) => setReceiptNumber(e.target.value)} className={inputClass(false)} />
        </Field>
      </div>

      <div className="flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-sm text-ink/80">Line items</h2>
          <span className={`text-sm ledger-figures ${remaining === 0 ? 'text-ink/60' : 'text-rust'}`}>
            {remaining === 0 ? 'Fully allocated' : `KES ${remaining} unallocated`}
          </span>
        </div>

        {lines.map((line, i) => (
          <div key={i} className="flex gap-3 items-start border-b border-rule pb-3">
            <select
              value={line.type}
              onChange={(e) => updateLine(i, { type: e.target.value })}
              className={`${inputClass(false)} flex-1`}
            >
              {CATEGORY_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {formatType(opt)}
                </option>
              ))}
            </select>
            {line.type === 'loan_repayment' && (
              <input
                placeholder="Loan ID"
                required
                value={line.referenceId}
                onChange={(e) => updateLine(i, { referenceId: e.target.value })}
                className={`${inputClass(false)} w-32`}
              />
            )}
            <input
              type="number"
              min="1"
              required
              placeholder="Amount"
              value={line.amount}
              onChange={(e) => updateLine(i, { amount: e.target.value })}
              className={`${inputClass(false)} w-32`}
            />
            {lines.length > 1 && (
              <button type="button" onClick={() => removeLine(i)} className="text-ink/50 hover:text-rust text-sm px-2 py-2">
                Remove
              </button>
            )}
          </div>
        ))}

        <Button type="button" variant="ghost" onClick={() => setLines((prev) => [...prev, emptyLine()])} className="self-start">
          Add line
        </Button>
      </div>

      {error && (
        <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">
          {error}
        </p>
      )}
      {success && <p className="text-sm text-navy border-l-2 border-gold pl-3">{success}</p>}

      <Button type="submit" variant="gold" disabled={submitting} className="self-start">
        {submitting ? 'Posting…' : 'Post to ledger'}
      </Button>
    </form>
  );
}
