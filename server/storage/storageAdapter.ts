import { ConnectorKey, ConnectorCall, ConnectorMessage, ConnectorSettings } from './types.js';

export interface StorageAdapter {
  getKeys(): Promise<ConnectorKey[]>;
  getKeyById(id: string): Promise<ConnectorKey | null>;
  getKeyByHash(hash: string): Promise<ConnectorKey | null>;
  createKey(key: ConnectorKey): Promise<ConnectorKey>;
  revokeKey(id: string): Promise<ConnectorKey | null>;
  incrementKeyUsage(id: string): Promise<void>;

  recordCall(call: ConnectorCall): Promise<ConnectorCall>;
  getCalls(limit?: number, offset?: number): Promise<ConnectorCall[]>;

  getMessages(
    after_id?: string,
    limit?: number,
    unread_only?: boolean,
    callingSide?: 'chat' | 'box'
  ): Promise<ConnectorMessage[]>;
  createMessage(msg: ConnectorMessage): Promise<ConnectorMessage>;
  markMessagesSeen(ids: string[], side: 'chat' | 'box'): Promise<void>;

  getSettings(): Promise<ConnectorSettings>;
  updateSettings(settings: Partial<ConnectorSettings>): Promise<ConnectorSettings>;

  getOverview(): Promise<{
    activeKeys: number;
    totalCalls: number;
    messageCount: number;
    status: string;
  }>;

  resetDemoData?(): Promise<void>;
}
