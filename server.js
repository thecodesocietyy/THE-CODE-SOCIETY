import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use((req, res, next) => {
  if (
    req.path === '/server.js' ||
    req.path === '/package.json' ||
    req.path === '/package-lock.json'
  ) {
    return res.status(404).send('Not found');
  }
  next();
});

app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
app.use(express.static(__dirname, { extensions: ['html'], dotfiles: 'ignore' }));

app.get('/', (_req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`The Code Society static server listening on http://0.0.0.0:${PORT}`);
});
