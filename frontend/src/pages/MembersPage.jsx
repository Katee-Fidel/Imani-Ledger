import { useEffect, useState } from 'react';
import { api } from '../api/client';
import Field, { inputClass } from '../components/ui/Field';
import Button from '../components/ui/Button';
import EmptyState from '../components/ui/EmptyState';
import { formatDate } from '../lib/format';

const emptyForm = { fullName: '', email: '', phoneNumber: '', password: '', role: 'member' };

export default function MembersPage() {
  const [members, setMembers] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const load = () => api.get('/users').then(setMembers).catch((err) => setError(err.message));

  useEffect(load, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);
    try {
      await api.post('/auth/register-member', form);
      setSuccess(`${form.fullName} can now sign in.`);
      setForm(emptyForm);
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-10">
      <section>
        <h1 className="font-serif text-xl text-ink mb-4">Members</h1>
        {!members ? null : members.length === 0 ? (
          <EmptyState title="No members yet" />
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-ink/60 border-b border-rule">
                <th className="py-2 pr-4 font-normal">Name</th>
                <th className="py-2 pr-4 font-normal">Role</th>
                <th className="py-2 pr-4 font-normal">Status</th>
                <th className="py-2 pr-4 font-normal">Joined</th>
              </tr>
            </thead>
            <tbody>
              {members.map((m) => (
                <tr key={m._id} className="border-b border-rule">
                  <td className="py-2 pr-4">{m.fullName}</td>
                  <td className="py-2 pr-4 capitalize">{m.role}</td>
                  <td className="py-2 pr-4 capitalize">{m.status}</td>
                  <td className="py-2 pr-4">{formatDate(m.joinedDate)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      <section className="max-w-md border-t border-rule pt-8">
        <h2 className="font-serif text-lg text-ink mb-1">Add a member</h2>
        <p className="text-sm text-ink/60 mb-4">
          Public sign-up is off by default — this is how new members get access.
        </p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <Field label="Full name">
            <input required value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className={inputClass(false)} />
          </Field>
          <Field label="Email">
            <input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className={inputClass(false)} />
          </Field>
          <Field label="Phone number">
            <input required value={form.phoneNumber} onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })} className={inputClass(false)} />
          </Field>
          <Field label="Temporary password">
            <input type="password" required minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className={inputClass(false)} />
          </Field>
          <Field label="Role">
            <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className={inputClass(false)}>
              <option value="member">Member</option>
              <option value="admin">Admin</option>
            </select>
          </Field>

          {error && <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">{error}</p>}
          {success && <p className="text-sm text-navy border-l-2 border-gold pl-3">{success}</p>}

          <Button type="submit" disabled={submitting} className="self-start">
            {submitting ? 'Adding…' : 'Add member'}
          </Button>
        </form>
      </section>
    </div>
  );
}
