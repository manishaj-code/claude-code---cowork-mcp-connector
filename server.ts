import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { mcpRouter } from './server/mcp/mcpRouter.js';
import { adminRouter } from './server/routes/adminRouter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = parseInt(process.env.PORT || '3000', 10);
const isProd = process.env.NODE_ENV === 'production';

// Basic JSON parser
app.use(express.json({ limit: '2mb' }));

// CORS headers for prototype development
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE, PUT');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, x-admin-key');
  if (req.method === 'OPTIONS') {
    res.sendStatus(204);
    return;
  }
  next();
});

// Health check endpoint
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'mcp-connector',
    timestamp: new Date().toISOString(),
  });
});

// Mount MCP HTTP router
app.use(mcpRouter);

// Mount Admin API router
app.use('/api/admin', adminRouter);

// Vite middleware or production static serving
async function setupViteOrStatic() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, port },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`[MCP Server] Running at http://localhost:${port}`);
    console.log(`[MCP Server] MCP endpoint pattern: http://localhost:${port}/connect/:scope/:secret/mcp`);
  });
}

setupViteOrStatic().catch((err) => {
  console.error('[MCP Server] Initialization error:', err);
  process.exit(1);
});

export default app;
