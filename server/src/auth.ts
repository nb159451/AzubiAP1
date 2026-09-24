import { Router, type Request, type Response, type NextFunction } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';
import { db, jwtSecret, type UserRow } from './db.js';

const COOKIE = 'ap1_token';
const SECRET = jwtSecret();

export interface AuthedRequest extends Request {
  user?: { id: number; email: string; name: string };
}

function issue(res: Response, user: { id: number; email: string; name: string }) {
  const token = jwt.sign({ sub: user.id, email: user.email, name: user.name }, SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: 7 * 24 * 3600 * 1000,
  });
}

export function requireAuth(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = req.cookies?.[COOKIE];
  if (!token) return res.status(401).json({ error: 'Nicht angemeldet' });
  try {
    const payload = jwt.verify(token, SECRET) as unknown as { sub: number; email: string; name: string };
    req.user = { id: Number(payload.sub), email: payload.email, name: payload.name };
    next();
  } catch {
    res.clearCookie(COOKIE);
    return res.status(401).json({ error: 'Sitzung abgelaufen' });
  }
}

export const authRouter = Router();

const registerSchema = z.object({
  email: z.string().email('Ungültige E-Mail-Adresse').max(200),
  name: z.string().trim().min(2, 'Name zu kurz').max(80),
  password: z.string().min(8, 'Passwort muss mindestens 8 Zeichen haben').max(200),
});

authRouter.post('/register', (req, res) => {
  const parsed = registerSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: parsed.error.issues[0]?.message ?? 'Ungültige Eingabe' });
  const { email, name, password } = parsed.data;
  const exists = db.prepare('SELECT id FROM users WHERE email = ?').get(email.toLowerCase());
  if (exists) return res.status(409).json({ error: 'Diese E-Mail-Adresse ist bereits registriert' });
  const hash = bcrypt.hashSync(password, 10);
  const info = db
    .prepare('INSERT INTO users(email, name, password_hash, created_at) VALUES (?, ?, ?, ?)')
    .run(email.toLowerCase(), name, hash, new Date().toISOString());
  const user = { id: Number(info.lastInsertRowid), email: email.toLowerCase(), name };
  issue(res, user);
  res.status(201).json({ user });
});

authRouter.post('/login', (req, res) => {
  const parsed = z.object({ email: z.string(), password: z.string() }).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({ error: 'Ungültige Eingabe' });
  const row = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email.toLowerCase()) as UserRow | undefined;
  if (!row || !bcrypt.compareSync(parsed.data.password, row.password_hash)) {
    return res.status(401).json({ error: 'E-Mail-Adresse oder Passwort falsch' });
  }
  const user = { id: row.id, email: row.email, name: row.name };
  issue(res, user);
  res.json({ user });
});

authRouter.post('/logout', (_req, res) => {
  res.clearCookie(COOKIE);
  res.json({ ok: true });
});

authRouter.get('/me', requireAuth, (req: AuthedRequest, res) => {
  res.json({ user: req.user });
});
