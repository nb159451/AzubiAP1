import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { api, type User } from './api';
import { LoginPage } from './pages/Login';
import { RegisterPage } from './pages/Register';
import { DashboardPage } from './pages/Dashboard';
import { ExamPage } from './pages/Exam';
import { ResultPage } from './pages/Result';
import { PruefungsordnungPage } from './pages/Pruefungsordnung';

interface AuthCtx {
  user: User | null;
  loading: boolean;
  setUser: (u: User | null) => void;
}
const Ctx = createContext<AuthCtx>({ user: null, loading: true, setUser: () => {} });
export const useAuth = () => useContext(Ctx);

function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    api
      .me()
      .then((r) => setUser(r.user))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);
  return <Ctx.Provider value={{ user, loading, setUser }}>{children}</Ctx.Provider>;
}

function Header() {
  const { user, setUser } = useAuth();
  const navigate = useNavigate();
  const loc = useLocation();
  const inExam = loc.pathname.startsWith('/exam/');
  return (
    <header className="topbar">
      <Link to="/" className="brand">
        <span className="brand-badge">AP1</span>
        <span className="brand-text">Digitale Abschlussprüfung Teil 1 · FIAE</span>
      </Link>
      <nav>
        {!inExam && <Link to="/pruefungsordnung">Prüfungsordnung</Link>}
        {user ? (
          <>
            {!inExam && <span className="muted">{user.name}</span>}
            {!inExam && (
              <button
                className="btn btn-ghost"
                onClick={async () => {
                  await api.logout();
                  setUser(null);
                  navigate('/login');
                }}
              >
                Abmelden
              </button>
            )}
          </>
        ) : (
          <>
            <Link to="/login">Anmelden</Link>
            <Link to="/register" className="btn btn-primary btn-sm">
              Registrieren
            </Link>
          </>
        )}
      </nav>
    </header>
  );
}

function Protected({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="page center muted">Lade …</div>;
  if (!user) return <Navigate to="/login" replace />;
  return <>{children}</>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Header />
        <main>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route path="/pruefungsordnung" element={<PruefungsordnungPage />} />
            <Route
              path="/"
              element={
                <Protected>
                  <DashboardPage />
                </Protected>
              }
            />
            <Route
              path="/exam/:id"
              element={
                <Protected>
                  <ExamPage />
                </Protected>
              }
            />
            <Route
              path="/result/:id"
              element={
                <Protected>
                  <ResultPage />
                </Protected>
              }
            />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
      </BrowserRouter>
    </AuthProvider>
  );
}
