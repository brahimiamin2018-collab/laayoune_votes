import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import {
  initDb,
  getPartis,
  addParti,
  updateParti,
  deleteParti,
  getBureauxVote,
  addBureauVote,
  updateBureauVote,
  deleteBureauVote,
  getPvResult,
  savePvResult,
  clearPvResult,
  getVotesAggregation,
  loginUser,
  getUsers,
  addUser,
  updateUser,
  deleteUser,
  generateAccountsForBureaux,
  exportCloudData,
  importCloudData
} from './database.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4000;

app.use(cors());
app.use(express.json());

// Block non-local / Vercel cloud requests with fake Vercel 404
app.use((req, res, next) => {
  const host = req.headers.host || '';
  const isVercel = !!process.env.VERCEL;
  const isLocal = host.includes('localhost') || host.includes('127.0.0.1') || host.startsWith('192.168.') || host.startsWith('10.');

  if (isVercel || !isLocal) {
    return res.status(404).send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>404: NOT_FOUND</title>
  <link rel="shortcut icon" href="data:image/x-icon;," type="image/x-icon">
  <style>
    body {
      background-color: #ffffff;
      color: #000000;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      margin: 0;
      padding: 0;
      height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
    }
    .container {
      max-width: 600px;
      padding: 24px;
    }
    h1 {
      font-size: 24px;
      font-weight: 600;
      margin: 0 0 8px 0;
      color: #000000;
    }
    p {
      font-size: 14px;
      color: #666666;
      margin: 0 0 24px 0;
      line-height: 1.5;
    }
    .footer {
      border-top: 1px solid #eaeaea;
      padding-top: 24px;
      font-size: 12px;
      color: #888888;
      font-family: monospace;
      text-align: center;
    }
    .code {
      font-weight: bold;
      color: #444444;
      margin-bottom: 4px;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>This page doesn’t exist</h1>
    <p>It may have been moved, removed, or never existed.</p>
    <div class="footer">
      <div class="code">404 DEPLOYMENT_NOT_FOUND</div>
      <div>cdg1::6cl2r-1790963931287-0d797d55c6dc</div>
    </div>
  </div>
</body>
</html>`);
  }
  next();
});

// Init SQLite DB
initDb().catch(console.error);

// ----------------------------------------------------
// API REST ENDPOINTS
// ----------------------------------------------------

// Partis Politiques
app.get('/api/depouillement/partis', async (req, res) => {
  try {
    const partis = await getPartis();
    res.json(partis);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/depouillement/partis', async (req, res) => {
  try {
    const result = await addParti(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/depouillement/partis/:id', async (req, res) => {
  try {
    const result = await updateParti(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/depouillement/partis/:id', async (req, res) => {
  try {
    const result = await deleteParti(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Bureaux de Vote
app.get('/api/depouillement/bureaux', async (req, res) => {
  try {
    const { commune } = req.query;
    const bureaux = await getBureauxVote({ commune });
    res.json(bureaux);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/depouillement/bureaux', async (req, res) => {
  try {
    const result = await addBureauVote(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/depouillement/bureaux/:id', async (req, res) => {
  try {
    const result = await updateBureauVote(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/depouillement/bureaux/:id', async (req, res) => {
  try {
    const result = await deleteBureauVote(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PV Details
app.get('/api/depouillement/pv/:bureau_id', async (req, res) => {
  try {
    const data = await getPvResult(req.params.bureau_id);
    if (!data) return res.status(404).json({ error: 'Bureau non trouvé' });
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Save PV
app.post('/api/depouillement/pv', async (req, res) => {
  try {
    const result = await savePvResult(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear/Delete PV (Admin Only)
app.delete('/api/depouillement/pv/:bureau_id', async (req, res) => {
  try {
    const result = await clearPvResult(req.params.bureau_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Totals Aggregation
app.get('/api/depouillement/totaux', async (req, res) => {
  try {
    const { commune } = req.query;
    const aggregation = await getVotesAggregation({ commune });
    res.json(aggregation);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Authentication Route
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body || {};
    if (!username || !password) {
      return res.status(400).json({ error: 'Identifiant et mot de passe requis.' });
    }
    const session = await loginUser(username, password);
    if (!session) {
      return res.status(401).json({ error: 'Identifiant ou mot de passe incorrect.' });
    }
    return res.json({ success: true, session });
  } catch (err) {
    console.error('Erreur API /api/login:', err);
    return res.status(500).json({ error: 'Erreur serveur lors de la connexion.' });
  }
});

// User Management Routes
app.get('/api/users', async (req, res) => {
  try {
    const users = await getUsers();
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users', async (req, res) => {
  try {
    const result = await addUser(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/users/:id', async (req, res) => {
  try {
    const result = await updateUser(req.params.id, req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/users/:id', async (req, res) => {
  try {
    const result = await deleteUser(req.params.id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/users/generate-all', async (req, res) => {
  try {
    const result = await generateAccountsForBureaux();
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Cloud Data Sync Routes
app.get('/api/depouillement/export-cloud', async (req, res) => {
  try {
    const data = await exportCloudData();
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', 'attachment; filename="laayoune_votes_cloud_backup.json"');
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/depouillement/import-cloud', async (req, res) => {
  try {
    const result = await importCloudData(req.body);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// SERVIR LE FRONTEND (BUILD VITE DIST)
// ----------------------------------------------------
const distPath = path.join(process.cwd(), 'dist');
if (fs.existsSync(distPath)) {
  app.use(express.static(distPath, {
    setHeaders: (res) => {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    }
  }));
  app.get('*', (req, res) => {
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    res.sendFile(path.join(distPath, 'index.html'));
  });
}

if (!process.env.VERCEL) {
  app.listen(PORT, () => {
    console.log(`🚀 Application Autonome d'Assemblage des Votes Laâyoune lancée sur http://localhost:${PORT}`);
  });
}

export default app;
