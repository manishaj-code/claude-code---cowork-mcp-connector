import {
  OverviewMetrics,
  ConnectorKeySummary,
  CreatedKeyResult,
  ConnectorCallRecord,
  BoardMessage,
  ConnectorSettings,
  SystemHealth,
} from './types';

const ADMIN_KEY_STORAGE = 'mcp_admin_key';
export const DEFAULT_ADMIN_KEY = 'demo-admin-key-secure';

export function getAdminKey(): string {
  return localStorage.getItem(ADMIN_KEY_STORAGE) || DEFAULT_ADMIN_KEY;
}

export function setAdminKey(key: string): void {
  localStorage.setItem(ADMIN_KEY_STORAGE, key.trim());
}

function getHeaders(): HeadersInit {
  return {
    'Content-Type': 'application/json',
    'x-admin-key': getAdminKey(),
  };
}

export async function fetchOverview(): Promise<OverviewMetrics> {
  const res = await fetch('/api/admin/overview', { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch overview: ${res.statusText}`);
  return res.json();
}

export async function fetchKeys(): Promise<ConnectorKeySummary[]> {
  const res = await fetch('/api/admin/keys', { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch keys: ${res.statusText}`);
  return res.json();
}

export async function createKey(label: string, scope: string = 'code'): Promise<CreatedKeyResult> {
  const res = await fetch('/api/admin/keys', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ label, scope }),
  });
  if (!res.ok) throw new Error(`Failed to create key: ${res.statusText}`);
  return res.json();
}

export async function revokeKey(id: string): Promise<void> {
  const res = await fetch(`/api/admin/keys/${encodeURIComponent(id)}/revoke`, {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to revoke key: ${res.statusText}`);
}

export async function fetchCalls(limit: number = 50, offset: number = 0): Promise<ConnectorCallRecord[]> {
  const res = await fetch(`/api/admin/calls?limit=${limit}&offset=${offset}`, {
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to fetch audit calls: ${res.statusText}`);
  return res.json();
}

export async function fetchMessages(limit: number = 50, afterId?: string): Promise<BoardMessage[]> {
  const url = afterId
    ? `/api/admin/messages?limit=${limit}&after_id=${encodeURIComponent(afterId)}`
    : `/api/admin/messages?limit=${limit}`;
  const res = await fetch(url, { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch messages: ${res.statusText}`);
  return res.json();
}

export async function postBoardMessage(
  text: string,
  side: 'chat' | 'box',
  author?: string
): Promise<BoardMessage> {
  const res = await fetch('/api/admin/messages', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text, side, author }),
  });
  if (!res.ok) throw new Error(`Failed to post message: ${res.statusText}`);
  return res.json();
}

export async function fetchSettings(): Promise<{ settings: ConnectorSettings; health: SystemHealth }> {
  const res = await fetch('/api/admin/settings', { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch settings: ${res.statusText}`);
  return res.json();
}

export async function updateSettings(
  settings: Partial<ConnectorSettings>
): Promise<ConnectorSettings> {
  const res = await fetch('/api/admin/settings', {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error(`Failed to update settings: ${res.statusText}`);
  return res.json();
}

export async function resetDemoStore(): Promise<void> {
  const res = await fetch('/api/admin/reset', {
    method: 'POST',
    headers: getHeaders(),
  });
  if (!res.ok) throw new Error(`Failed to reset demo: ${res.statusText}`);
}

export async function fetchEnvironment(): Promise<Record<string, unknown>> {
  const res = await fetch('/api/admin/environment', { headers: getHeaders() });
  if (!res.ok) throw new Error(`Failed to fetch environment info: ${res.statusText}`);
  return res.json();
}

// Live MCP direct invoker
export async function invokeMcpEndpoint(
  connectorUrl: string,
  method: string,
  params: Record<string, unknown> = {}
): Promise<{ status: number; durationMs: number; data: unknown }> {
  const start = performance.now();
  const res = await fetch(connectorUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: Date.now(),
      method,
      params,
    }),
  });
  const durationMs = Math.round(performance.now() - start);
  const data = await res.json().catch(() => ({ raw: 'Unable to parse JSON' }));
  return { status: res.status, durationMs, data };
}
