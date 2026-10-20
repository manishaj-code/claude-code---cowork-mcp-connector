import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage/fileStorageAdapter.js';
import {
  generateConnectorSecret,
  hashSecret,
  getSecretPrefix,
  generateId,
} from '../security/crypto.js';
import { ConnectorKey, ConnectorMessage } from '../storage/types.js';
import { redactSensitiveText } from '../security/redact.js';

export const adminRouter = Router();

const DEFAULT_ADMIN_KEY = process.env.ADMIN_KEY || 'demo-admin-key-secure';

// Admin authentication middleware
export function adminAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers['authorization'];
  const customKey = req.headers['x-admin-key'];

  let providedKey = '';
  if (customKey && typeof customKey === 'string') {
    providedKey = customKey.trim();
  } else if (authHeader && authHeader.startsWith('Bearer ')) {
    providedKey = authHeader.slice(7).trim();
  }

  // Check key
  if (!providedKey || providedKey !== DEFAULT_ADMIN_KEY) {
    res.status(401).json({
      error: 'Unauthorized: Invalid or missing admin credentials. Supply x-admin-key header.',
    });
    return;
  }

  next();
}

// 1. Overview metrics
adminRouter.get('/overview', adminAuthMiddleware, async (req: Request, res: Response) => {
  const overview = await storage.getOverview();
  const recentCalls = await storage.getCalls(5);
  const recentMessages = await storage.getMessages(undefined, 5);

  res.json({
    ...overview,
    recentCalls,
    recentMessages,
  });
});

// 2. Connector Keys list (Never returns raw secret or key_hash)
adminRouter.get('/keys', adminAuthMiddleware, async (req: Request, res: Response) => {
  const keys = await storage.getKeys();
  // Safe mapping - omit key_hash entirely from admin list
  const safeKeys = keys.map(({ key_hash: _omit, ...rest }) => rest);
  res.json(safeKeys);
});

// 3. Create Connector Key (returns secret and full URL ONLY ONCE)
adminRouter.post('/keys', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { label, scope } = req.body;
  const cleanLabel = typeof label === 'string' && label.trim() ? label.trim().slice(0, 80) : 'Custom Connector Link';
  const cleanScope = typeof scope === 'string' && scope.trim() ? scope.trim().toLowerCase() : 'code';

  const rawSecret = generateConnectorSecret();
  const hashed = hashSecret(rawSecret);
  const prefix = getSecretPrefix(rawSecret);

  const newKey: ConnectorKey = {
    id: `key_${generateId().slice(0, 10)}`,
    scope: cleanScope,
    label: cleanLabel,
    key_hash: hashed,
    prefix,
    created_by: 'admin_dashboard',
    created_at: new Date().toISOString(),
    last_used_at: null,
    uses: 0,
    revoked_at: null,
  };

  await storage.createKey(newKey);

  // Derive host URL for connector URL creation
  const host = process.env.APP_URL || `${req.protocol}://${req.get('host')}`;
  const fullConnectorUrl = `${host}/connect/${cleanScope}/${rawSecret}/mcp`;

  res.status(201).json({
    key: {
      id: newKey.id,
      scope: newKey.scope,
      label: newKey.label,
      prefix: newKey.prefix,
      created_by: newKey.created_by,
      created_at: newKey.created_at,
      uses: newKey.uses,
      revoked_at: newKey.revoked_at,
    },
    // Raw secret and full URL returned ONCE only at creation
    raw_secret: rawSecret,
    connector_url: fullConnectorUrl,
    warning: 'Save this connector URL now. The complete secret cannot be retrieved again.',
  });
});

// 4. Revoke Connector Key
adminRouter.post('/keys/:id/revoke', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { id } = req.params;
  const revoked = await storage.revokeKey(id);
  if (!revoked) {
    res.status(404).json({ error: `Connector key '${id}' not found` });
    return;
  }

  const { key_hash: _omit, ...safeKey } = revoked;
  res.json({ success: true, key: safeKey });
});

// 5. Tool Call Audit Log
adminRouter.get('/calls', adminAuthMiddleware, async (req: Request, res: Response) => {
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;
  const offset = typeof req.query.offset === 'string' ? parseInt(req.query.offset, 10) : 0;

  const calls = await storage.getCalls(limit, offset);
  res.json(calls);
});

// 6. Messages on Shared Board
adminRouter.get('/messages', adminAuthMiddleware, async (req: Request, res: Response) => {
  const afterId = typeof req.query.after_id === 'string' ? req.query.after_id : undefined;
  const limit = typeof req.query.limit === 'string' ? parseInt(req.query.limit, 10) : 50;

  const messages = await storage.getMessages(afterId, limit);
  res.json(messages);
});

// 7. Post message to Shared Board from Admin
adminRouter.post('/messages', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { text, side, author } = req.body;
  if (!text || typeof text !== 'string' || !text.trim()) {
    res.status(400).json({ error: 'Message text is required' });
    return;
  }

  const cleanSide = side === 'box' ? 'box' : 'chat';
  const cleanAuthor = typeof author === 'string' && author.trim() ? author.trim().slice(0, 60) : 'Admin Console';

  const newMsg: ConnectorMessage = {
    id: `msg_${generateId().slice(0, 8)}`,
    side: cleanSide,
    connector_key_id: null,
    author: cleanAuthor,
    text: redactSensitiveText(text.trim()),
    created_at: new Date().toISOString(),
    seen_by_box_at: cleanSide === 'box' ? new Date().toISOString() : null,
    fetched_by_chat_at: cleanSide === 'chat' ? new Date().toISOString() : null,
  };

  const created = await storage.createMessage(newMsg);
  res.status(201).json(created);
});

// 8. Settings & Health
adminRouter.get('/settings', adminAuthMiddleware, async (req: Request, res: Response) => {
  const settings = await storage.getSettings();
  const uptimeSeconds = Math.floor(process.uptime());

  res.json({
    settings,
    health: {
      uptimeSeconds,
      nodeVersion: process.version,
      memoryUsageMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      storageAdapter: 'FileStorageAdapter (Atomic Persistence)',
      status: 'operational',
    },
  });
});

// 9. Update Settings
adminRouter.post('/settings', adminAuthMiddleware, async (req: Request, res: Response) => {
  const { connector_enabled, rate_limit_per_window, rate_window_minutes } = req.body;
  const updates: Partial<{ connector_enabled: boolean; rate_limit_per_window: number; rate_window_minutes: number }> = {};

  if (typeof connector_enabled === 'boolean') {
    updates.connector_enabled = connector_enabled;
  }
  if (typeof rate_limit_per_window === 'number' && rate_limit_per_window > 0) {
    updates.rate_limit_per_window = rate_limit_per_window;
  }
  if (typeof rate_window_minutes === 'number' && rate_window_minutes > 0) {
    updates.rate_window_minutes = rate_window_minutes;
  }

  const newSettings = await storage.updateSettings(updates);
  res.json(newSettings);
});

// 10. Reset Demo Data
adminRouter.post('/reset', adminAuthMiddleware, async (req: Request, res: Response) => {
  if (storage.resetDemoData) {
    await storage.resetDemoData();
  }
  res.json({ success: true, message: 'Demo store reset to initial seed state.' });
});

// 11. Environment info
adminRouter.get('/environment', adminAuthMiddleware, async (req: Request, res: Response) => {
  res.json({
    environmentName: 'Nexus Fleet Demo Sandbox',
    region: 'asia-southeast1 (simulated cloud run)',
    clusterName: 'nexus-sandbox-mock-01',
    branch: 'main',
    endpoints: {
      mcpPattern: '/connect/:scope/:secret/mcp',
      adminApiPattern: '/api/admin/*',
    },
    sampleRepo: 'nexus-fleet-sample',
    disclaimer: 'This is a self-contained demonstration prototype with simulated services and sample repository context.',
  });
});
