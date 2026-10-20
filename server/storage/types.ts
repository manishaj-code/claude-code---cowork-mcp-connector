export type MessageSide = 'chat' | 'box';

export interface ConnectorKey {
  id: string;
  scope: string; // e.g. 'code'
  label: string;
  key_hash: string; // SHA-256 of the raw secret
  prefix: string; // e.g. 'mcp_sec_a1b2...'
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  uses: number;
  revoked_at: string | null;
}

export interface ConnectorCall {
  id: string;
  connector_key_id: string;
  connector_label?: string;
  tool: string;
  safe_arguments: Record<string, unknown>;
  ok: boolean;
  error_message?: string;
  created_at: string;
}

export interface ConnectorMessage {
  id: string;
  side: MessageSide; // 'chat' = CoWork / Claude, 'box' = Claude Code
  connector_key_id: string | null;
  author: string;
  text: string;
  created_at: string;
  seen_by_box_at: string | null;
  fetched_by_chat_at: string | null;
}

export interface ConnectorSettings {
  connector_enabled: boolean;
  rate_limit_per_window: number; // default 120
  rate_window_minutes: number; // default 10
}

export interface StorageData {
  keys: ConnectorKey[];
  calls: ConnectorCall[];
  messages: ConnectorMessage[];
  settings: ConnectorSettings;
}
