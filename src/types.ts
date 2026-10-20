export type ActiveTab =
  | 'overview'
  | 'board'
  | 'links'
  | 'audit'
  | 'inspector'
  | 'environment'
  | 'settings';

export interface ConnectorKeySummary {
  id: string;
  scope: string;
  label: string;
  prefix: string;
  created_by: string;
  created_at: string;
  last_used_at: string | null;
  uses: number;
  revoked_at: string | null;
}

export interface ConnectorCallRecord {
  id: string;
  connector_key_id: string;
  connector_label?: string;
  tool: string;
  safe_arguments: Record<string, unknown>;
  ok: boolean;
  error_message?: string;
  created_at: string;
}

export interface BoardMessage {
  id: string;
  side: 'chat' | 'box';
  connector_key_id: string | null;
  author: string;
  text: string;
  created_at: string;
  seen_by_box_at: string | null;
  fetched_by_chat_at: string | null;
}

export interface ConnectorSettings {
  connector_enabled: boolean;
  rate_limit_per_window: number;
  rate_window_minutes: number;
}

export interface SystemHealth {
  uptimeSeconds: number;
  nodeVersion: string;
  memoryUsageMb: number;
  storageAdapter: string;
  status: string;
}

export interface OverviewMetrics {
  activeKeys: number;
  totalCalls: number;
  messageCount: number;
  status: string;
  recentCalls: ConnectorCallRecord[];
  recentMessages: BoardMessage[];
}

export interface CreatedKeyResult {
  key: ConnectorKeySummary;
  raw_secret: string;
  connector_url: string;
  warning: string;
}
