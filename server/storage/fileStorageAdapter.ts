import fs from 'fs';
import path from 'path';
import { ConnectorKey, ConnectorCall, ConnectorMessage, ConnectorSettings, StorageData } from './types.js';
import { StorageAdapter } from './storageAdapter.js';
import { hashSecret } from '../security/crypto.js';

const DEFAULT_STORE_PATH = process.env.DATA_STORE_PATH || path.resolve(process.cwd(), '.data/mcp_store.json');

import { INITIAL_DEMO_SECRET } from './demoSecret.js';
export { INITIAL_DEMO_SECRET };

function getInitialData(): StorageData {
  const initialKey: ConnectorKey = {
    id: 'key_initial_demo_001',
    scope: 'code',
    label: 'Primary CoWork & Claude Code Link',
    key_hash: hashSecret(INITIAL_DEMO_SECRET),
    prefix: 'sec_demo_cl...',
    created_by: 'system_bootstrap',
    created_at: new Date(Date.now() - 3600000).toISOString(),
    last_used_at: new Date(Date.now() - 600000).toISOString(),
    uses: 12,
    revoked_at: null,
  };

  const initialMessages: ConnectorMessage[] = [
    {
      id: 'msg_001',
      side: 'chat',
      connector_key_id: initialKey.id,
      author: 'Claude / CoWork',
      text: 'Hello Claude Code! I have reviewed the repository architecture. Can you run the verification suite and report back?',
      created_at: new Date(Date.now() - 1800000).toISOString(),
      seen_by_box_at: new Date(Date.now() - 1200000).toISOString(),
      fetched_by_chat_at: new Date(Date.now() - 1800000).toISOString(),
    },
    {
      id: 'msg_002',
      side: 'box',
      connector_key_id: initialKey.id,
      author: 'Claude Code (Terminal)',
      text: 'Acknowledged. Reading sample repository files now. Verification tests passed with 0 errors.',
      created_at: new Date(Date.now() - 1100000).toISOString(),
      seen_by_box_at: new Date(Date.now() - 1100000).toISOString(),
      fetched_by_chat_at: new Date(Date.now() - 900000).toISOString(),
    },
    {
      id: 'msg_003',
      side: 'chat',
      connector_key_id: initialKey.id,
      author: 'Claude / CoWork',
      text: 'Great work! Ready for next task sequence.',
      created_at: new Date(Date.now() - 600000).toISOString(),
      seen_by_box_at: null,
      fetched_by_chat_at: new Date(Date.now() - 600000).toISOString(),
    },
  ];

  const initialCalls: ConnectorCall[] = [
    {
      id: 'call_001',
      connector_key_id: initialKey.id,
      connector_label: initialKey.label,
      tool: 'get_overview',
      safe_arguments: {},
      ok: true,
      created_at: new Date(Date.now() - 1200000).toISOString(),
    },
    {
      id: 'call_002',
      connector_key_id: initialKey.id,
      connector_label: initialKey.label,
      tool: 'read_messages',
      safe_arguments: { limit: 20 },
      ok: true,
      created_at: new Date(Date.now() - 1150000).toISOString(),
    },
    {
      id: 'call_003',
      connector_key_id: initialKey.id,
      connector_label: initialKey.label,
      tool: 'send_message',
      safe_arguments: { side: 'box', author: 'Claude Code (Terminal)', text: 'Acknowledged. Reading sample repository...' },
      ok: true,
      created_at: new Date(Date.now() - 1100000).toISOString(),
    },
  ];

  const initialSettings: ConnectorSettings = {
    connector_enabled: true,
    rate_limit_per_window: parseInt(process.env.MCP_RATE_LIMIT_PER_WINDOW || '120', 10),
    rate_window_minutes: parseInt(process.env.MCP_RATE_WINDOW_MINUTES || '10', 10),
  };

  return {
    keys: [initialKey],
    calls: initialCalls,
    messages: initialMessages,
    settings: initialSettings,
  };
}

export class FileStorageAdapter implements StorageAdapter {
  private filePath: string;
  private data: StorageData | null = null;
  private writeQueue: Promise<void> = Promise.resolve();

  constructor(filePath: string = DEFAULT_STORE_PATH) {
    this.filePath = filePath;
  }

  private async load(): Promise<StorageData> {
    if (this.data) return this.data;

    try {
      if (fs.existsSync(this.filePath)) {
        const raw = await fs.promises.readFile(this.filePath, 'utf-8');
        this.data = JSON.parse(raw);
        if (!this.data || !Array.isArray(this.data.keys)) {
          this.data = getInitialData();
          await this.save();
        }
      } else {
        this.data = getInitialData();
        await this.save();
      }
    } catch {
      this.data = getInitialData();
      await this.save();
    }

    return this.data!;
  }

  private async save(): Promise<void> {
    if (!this.data) return;

    this.writeQueue = this.writeQueue.then(async () => {
      const dir = path.dirname(this.filePath);
      if (!fs.existsSync(dir)) {
        await fs.promises.mkdir(dir, { recursive: true });
      }

      const tempPath = `${this.filePath}.tmp.${Date.now()}`;
      await fs.promises.writeFile(tempPath, JSON.stringify(this.data, null, 2), 'utf-8');
      await fs.promises.rename(tempPath, this.filePath);
    });

    return this.writeQueue;
  }

  async getKeys(): Promise<ConnectorKey[]> {
    const data = await this.load();
    return [...data.keys].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }

  async getKeyById(id: string): Promise<ConnectorKey | null> {
    const data = await this.load();
    return data.keys.find((k) => k.id === id) || null;
  }

  async getKeyByHash(hash: string): Promise<ConnectorKey | null> {
    const data = await this.load();
    return data.keys.find((k) => k.key_hash === hash) || null;
  }

  async createKey(key: ConnectorKey): Promise<ConnectorKey> {
    const data = await this.load();
    data.keys.push(key);
    await this.save();
    return key;
  }

  async revokeKey(id: string): Promise<ConnectorKey | null> {
    const data = await this.load();
    const key = data.keys.find((k) => k.id === id);
    if (!key) return null;
    key.revoked_at = new Date().toISOString();
    await this.save();
    return key;
  }

  async incrementKeyUsage(id: string): Promise<void> {
    const data = await this.load();
    const key = data.keys.find((k) => k.id === id);
    if (key) {
      key.uses += 1;
      key.last_used_at = new Date().toISOString();
      await this.save();
    }
  }

  async recordCall(call: ConnectorCall): Promise<ConnectorCall> {
    const data = await this.load();
    data.calls.push(call);
    // Keep last 1000 calls to prevent unbounded growth in demo
    if (data.calls.length > 1000) {
      data.calls = data.calls.slice(-1000);
    }
    await this.save();
    return call;
  }

  async getCalls(limit: number = 50, offset: number = 0): Promise<ConnectorCall[]> {
    const data = await this.load();
    const sorted = [...data.calls].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    );
    return sorted.slice(offset, offset + limit);
  }

  async getMessages(
    after_id?: string,
    limit: number = 20,
    unread_only: boolean = false,
    callingSide?: 'chat' | 'box'
  ): Promise<ConnectorMessage[]> {
    const data = await this.load();
    let msgs = [...data.messages].sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );

    if (after_id) {
      const idx = msgs.findIndex((m) => m.id === after_id);
      if (idx !== -1) {
        msgs = msgs.slice(idx + 1);
      }
    }

    if (unread_only) {
      if (callingSide === 'box') {
        msgs = msgs.filter((m) => !m.seen_by_box_at);
      } else if (callingSide === 'chat') {
        msgs = msgs.filter((m) => !m.fetched_by_chat_at);
      }
    }

    const cappedLimit = Math.min(Math.max(1, limit), 100);
    // Without a cursor, return the latest messages (still chronological); with a cursor or unread filter, page forward
    const result = after_id || unread_only ? msgs.slice(0, cappedLimit) : msgs.slice(-cappedLimit);

    // If callingSide specified, mark those fetched
    if (callingSide && result.length > 0) {
      const ids = result.map((m) => m.id);
      await this.markMessagesSeen(ids, callingSide);
    }

    return result;
  }

  async createMessage(msg: ConnectorMessage): Promise<ConnectorMessage> {
    const data = await this.load();
    data.messages.push(msg);
    await this.save();
    return msg;
  }

  async markMessagesSeen(ids: string[], side: 'chat' | 'box'): Promise<void> {
    const data = await this.load();
    const now = new Date().toISOString();
    let changed = false;

    for (const msg of data.messages) {
      if (ids.includes(msg.id)) {
        if (side === 'box' && !msg.seen_by_box_at) {
          msg.seen_by_box_at = now;
          changed = true;
        } else if (side === 'chat' && !msg.fetched_by_chat_at) {
          msg.fetched_by_chat_at = now;
          changed = true;
        }
      }
    }

    if (changed) {
      await this.save();
    }
  }

  async getSettings(): Promise<ConnectorSettings> {
    const data = await this.load();
    return { ...data.settings };
  }

  async updateSettings(settings: Partial<ConnectorSettings>): Promise<ConnectorSettings> {
    const data = await this.load();
    data.settings = {
      ...data.settings,
      ...settings,
    };
    await this.save();
    return { ...data.settings };
  }

  async getOverview(): Promise<{
    activeKeys: number;
    totalCalls: number;
    messageCount: number;
    status: string;
  }> {
    const data = await this.load();
    const activeKeys = data.keys.filter((k) => !k.revoked_at).length;
    const totalCalls = data.calls.length;
    const messageCount = data.messages.length;
    const status = data.settings.connector_enabled ? 'Active / Online' : 'Disabled';

    return {
      activeKeys,
      totalCalls,
      messageCount,
      status,
    };
  }

  async resetDemoData(): Promise<void> {
    this.data = getInitialData();
    await this.save();
  }
}

// Global default storage instance
export const storage: StorageAdapter = new FileStorageAdapter();
