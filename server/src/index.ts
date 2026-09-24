import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

// .env aus dem Projektordner AP1/ (und optional server/) laden – unabhängig vom Arbeitsverzeichnis
const here = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: [path.resolve(here, '../../.env'), path.resolve(here, '../.env')], quiet: true });

import express from 'express';
import cookieParser from 'cookie-parser';
import { authRouter } from './auth.js';
import { attemptsRouter } from './routes/attempts.js';
import { BLUEPRINT } from './exam/blueprint.js';
import { catalog } from './catalog/index.js';
import { activeProvider } from './ai/grader.js';
import { QUESTION_TYPE_LABELS, SECTION_TITLES } from '../../shared/types.js';

const app = express();
app.use(express.json({ limit: '2mb' }));
app.use(cookieParser());

app.use('/api/auth', authRouter);
app.use('/api/attempts', attemptsRouter);

/** Prüfungsordnung + Katalogstatistik (öffentlich) */
app.get('/api/blueprint', (_req, res) => {
  const stats: Record<string, Record<string, number>> = {};
  for (const q of catalog) {
    stats[q.section] ??= {};
    stats[q.section][q.type] = (stats[q.section][q.type] ?? 0) + 1;
  }
  res.json({
    blueprint: BLUEPRINT,
    sectionTitles: SECTION_TITLES,
    typeLabels: QUESTION_TYPE_LABELS,
    catalogSize: catalog.length,
    stats,
    aiProvider: activeProvider(),
  });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// Produktion: gebautes Frontend ausliefern
const dist = path.resolve(here, '../../client/dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get(/^(?!\/api).*/, (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error(err);
  res.status(500).json({ error: 'Interner Serverfehler' });
});

const port = Number(process.env.PORT ?? 3001);
app.listen(port, () => {
  console.log(`AP1-Server läuft auf http://localhost:${port}  (Fragen im Katalog: ${catalog.length}, KI: ${activeProvider()})`);
});
