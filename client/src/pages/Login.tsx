import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { api } from '../api';
import { useAuth } from '../App';

export function LoginPage() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);
  if (user) return <Navigate to="/" replace />;

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const r = await api.login(email, password);
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
        <h1>Anmelden</h1>
        <p className="muted">Melden Sie sich an, um eine AP1-Prüfungssimulation zu starten.</p>
        <form className="form" onSubmit={submit}>
          <label>E-Mail-Adresse</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoFocus />
          <label>Passwort</label>
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
          {error && <div className="error">{error}</div>}
          <div style={{ marginTop: '1rem' }}>
            <button className="btn btn-primary" disabled={busy}>
              Anmelden
            </button>
          </div>
        </form>
        <p className="small muted" style={{ marginTop: '1rem' }}>
          Noch kein Konto? <Link to="/register">Jetzt registrieren</Link>
        </p>
      </div>
    </div>
  );
}
