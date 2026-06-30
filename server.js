import express from 'express';
import compression from 'compression';
import path from 'path';
import cluster from 'cluster';
import os from 'os';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const port = Number(process.env.PORT || 4173);
const workerCount = Number(process.env.WORKERS || Math.max(1, Math.min(os.cpus().length, 8)));

if (cluster.isPrimary) {
  for (let index = 0; index < workerCount; index += 1) {
    cluster.fork();
  }

  cluster.on('exit', (worker) => {
    console.warn(`Worker ${worker.process.pid} died. Restarting...`);
    cluster.fork();
  });
} else {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(compression({ level: 6, threshold: 1024 }));
  app.use(express.static(path.join(__dirname, 'dist'), {
    maxAge: '1h',
    etag: true,
    lastModified: true,
    setHeaders: (res, filePath) => {
      if (filePath.endsWith('.html')) {
        res.setHeader('Cache-Control', 'no-cache');
      } else if (filePath.match(/\.(js|css|png|jpg|jpeg|svg|webp|ico)$/)) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
    }
  }));

  app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok', uptime: process.uptime() });
  });

  app.get('*', (_req, res) => {
    res.sendFile(path.join(__dirname, 'dist', 'index.html'));
  });

  const server = app.listen(port, '0.0.0.0', () => {
    console.log(`Production worker ${process.pid} listening on port ${port}`);
  });

  server.keepAliveTimeout = 65000;
  server.headersTimeout = 70000;
}
