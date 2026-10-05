import express from 'express';
import { prisma } from './lib/prisma.js';

const app = express();
const port = process.env.PORT || 3000;

app.get('/', (req, res) => {
  res.send('File Uploader is running');
});

app.get('/test-db', async (req, res) => {
  try {
    const users = await prisma.user.findMany();
    res.json({ ok: true, users });
  } catch (err) {
    console.error(err);
    res.status(500).json({ ok: false, error: err.message });
  }
});

app.listen(port, () => {
  console.log(`Server listening on http://localhost:${port}`);
});
