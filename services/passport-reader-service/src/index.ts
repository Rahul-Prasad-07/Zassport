import express from 'express';
import cors from 'cors';

const PORT = process.env.PORT ? Number(process.env.PORT) : 3010;

const app = express();
app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'passport-reader-service', port: PORT });
});

// POST /read - Initiate a read session given MRZ data (line1, line2)
// NOTE: This is a scaffold endpoint. Implement BAC + ISO-DEP APDUs with PC/SC in follow-up.
app.post('/read', async (req, res) => {
  const { mrzLine1, mrzLine2 } = req.body || {};
  if (!mrzLine1 || !mrzLine2) {
    return res.status(400).json({ error: 'mrzLine1 and mrzLine2 required' });
  }

  // Placeholder response until PC/SC + BAC is implemented
  return res.status(501).json({
    error: 'Not Implemented',
    message: 'BAC + chip read requires PC/SC driver and APDU implementation',
  });
});

app.listen(PORT, () => {
  console.log(`📗 passport-reader-service listening on http://localhost:${PORT}`);
});
