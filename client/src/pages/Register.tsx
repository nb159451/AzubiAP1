import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export function RegisterPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (password !== password2) return setError('Die Passwörter stimmen nicht überein');
    setBusy(true);
    setError('');
    try {
      const r = await api.register(email, name, password);
      setUser(r.user);
      navigate('/');
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="page page-narrow">
      <div className="card">
        <h1>Registrieren</h1>
        <p className="muted">Erstellen Sie ein Konto, um Ihre Prüfungsversuche zu speichern und auszuwerten.</p>
        <form className="form" onSubmit={submit}>
          <label>Name</label>
          <input type="text" value={name} onChange={(e) => setName(e.target.value)} required minLength={2} autoFocus />
          <label>E-Mail-Adresse</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
          <label>Passwort (mind. 8 Zeichen)</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={8} />
          <label>Passwort wiederholen</label>
          <input type="password" value={password2} onChange={(e) => setPassword2(e.target.value)} required minLength={8} />
          {error && <div className="error">{error}</div>}
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" disabled={busy}>
              Konto erstellen
            </button>
          </div>
        </form>
        <p className="small muted" style={{ marginTop: '1rem' }}>
          Bereits registriert? <Link to="/login">Anmelden</Link>
        </p>
      </div>
    </div>
  );
}
