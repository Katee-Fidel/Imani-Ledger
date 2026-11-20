import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { api } from '../api/client';
import { getAvatar, setAvatar, removeAvatar } from '../lib/avatar';
import { getTheme, setTheme } from '../lib/theme';
import Avatar from '../components/ui/Avatar';
import Field, { inputClass } from '../components/ui/Field';
import Button from '../components/ui/Button';

const MAX_PHOTO_BYTES = 1.5 * 1024 * 1024;

export default function ProfilePage() {
  const { user, updateUser } = useAuth();
  const fileInputRef = useRef(null);

  const [fullName, setFullName] = useState(user.fullName);
  const [phoneNumber, setPhoneNumber] = useState(user.phoneNumber || '');
  const [photo, setPhoto] = useState(() => getAvatar(user.id));
  const [theme, setThemeState] = useState(getTheme);
  const [error, setError] = useState('');
  const [photoError, setPhotoError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);

  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoError('');

    if (file.size > MAX_PHOTO_BYTES) {
      setPhotoError('That photo is too large — please use one under 1.5 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      setPhoto(reader.result);
      setAvatar(user.id, reader.result);
    };
    reader.readAsDataURL(file);
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    removeAvatar(user.id);
  };

  const handleThemeChange = (next) => {
    setThemeState(next);
    setTheme(next);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSaving(true);
    try {
      const updated = await api.patch('/users/me', { fullName, phoneNumber });
      updateUser(updated);
      setSuccess('Profile updated.');
    } catch {
      // The backend doesn't support self-service profile edits yet
      // (tracked in TODO.md) — say so plainly instead of surfacing a
      // raw "route not found" error.
      setError("We can't save name or phone number changes yet — that part of the server isn't built. Theme and photo are saved on this device already.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-xl flex flex-col gap-10">
      <div>
        <h1 className="font-serif text-xl text-ink mb-1">Your profile</h1>
        <p className="text-sm text-ink/60">Update your details and how the ledger looks for you.</p>
      </div>

      <section className="flex items-center gap-5 border-b border-rule pb-8">
        <Avatar src={photo} name={fullName} size={72} />
        <div className="flex flex-col gap-2">
          <div className="flex gap-3">
            <Button type="button" variant="ghost" onClick={() => fileInputRef.current?.click()}>
              {photo ? 'Change photo' : 'Add a photo'}
            </Button>
            {photo && (
              <button type="button" onClick={handleRemovePhoto} className="text-sm text-ink/50 hover:text-rust">
                Remove
              </button>
            )}
          </div>
          <input ref={fileInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
          {photoError && <p className="text-sm text-rust">{photoError}</p>}
        </div>
      </section>

      <form onSubmit={handleSave} className="flex flex-col gap-5 border-b border-rule pb-8">
        <h2 className="text-sm text-ink/80">Details</h2>

        <Field label="Full name">
          <input required value={fullName} onChange={(e) => setFullName(e.target.value)} className={inputClass(false)} />
        </Field>

        <Field label="Mobile number">
          <input required value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} className={inputClass(false)} />
        </Field>

        <Field label="Email">
          <input value={user.email} disabled className={`${inputClass(false)} opacity-60 cursor-not-allowed`} />
        </Field>

        {error && (
          <p role="alert" className="text-sm text-rust border-l-2 border-rust pl-3">
            {error}
          </p>
        )}
        {success && <p className="text-sm text-navy border-l-2 border-gold pl-3">{success}</p>}

        <Button type="submit" disabled={saving} className="self-start">
          {saving ? 'Saving…' : 'Save details'}
        </Button>
      </form>

      <section className="flex flex-col gap-3">
        <h2 className="text-sm text-ink/80">Appearance</h2>
        <div className="inline-flex border border-rule self-start">
          {['light', 'dark'].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => handleThemeChange(option)}
              aria-pressed={theme === option}
              className={`px-4 py-2 text-sm capitalize ${
                theme === option ? 'bg-navy text-paper-raised' : 'text-ink/70 hover:text-ink'
              }`}
            >
              {option}
            </button>
          ))}
        </div>
        <p className="text-sm text-ink/60">Saved on this device only.</p>
      </section>
    </div>
  );
}
