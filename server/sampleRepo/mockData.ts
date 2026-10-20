/**
 * Predefined, allowlisted sample repository files.
 * Strictly in-memory or allowlisted. Path traversal and sensitive files are blocked.
 */
export const SAMPLE_REPO_FILES: Record<string, string> = {
  'README.md': `# Nexus Fleet Manager (Sample Prototype)

This is a demonstration repository context used by Claude Code and CoWork via the Model Context Protocol (MCP).

## Architecture
- Frontend: React + TypeScript
- Backend: Modular API Gateway
- Data Store: Relational Schemas

*Note: All data in this repository is mock demo data.*
`,
  'src/index.ts': `/**
 * Application Entry Point (Sample Context)
 */
import { initializeServices } from './services/manager.js';
import { logger } from './utils/logger.js';

export async function bootstrap() {
  logger.info('Starting Nexus demo services...');
  const services = await initializeServices();
  return { status: 'ready', activeCount: services.length };
}
`,
  'src/services/manager.ts': `/**
 * Service Manager Module
 */
export interface ServiceInfo {
  name: string;
  version: string;
  port: number;
}

export async function initializeServices(): Promise<ServiceInfo[]> {
  return [
    { name: 'AuthGateway', version: '2.1.0', port: 4001 },
    { name: 'TaskWorkerPool', version: '1.4.2', port: 4002 },
    { name: 'ReportScheduler', version: '3.0.1', port: 4003 },
  ];
}
`,
  'src/utils/math.ts': `/**
   * Safe Metric Calculation Utilities
   */
export function calculateThroughput(events: number, windowSeconds: number): number {
  if (windowSeconds <= 0) return 0;
  return Number((events / windowSeconds).toFixed(2));
}

export function computePercentile(values: number[], p: number): number {
  if (!values.length) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, index)];
}
`,
  'package.json': `{
  "name": "nexus-fleet-sample",
  "version": "1.4.0",
  "private": true,
  "description": "Mock microservices framework for demo context",
  "dependencies": {
    "typescript": "^5.0.0"
  }
}
`,
  'docs/architecture.md': `# Demo System Architecture

\`\`\`
[ CoWork / Claude ] <---> [ MCP HTTP Connector ] <---> [ Shared Message Board ]
                                                              ^
                                                              |
                                                      [ Claude Code CLI ]
\`\`\`

The connector provides:
1. URL-based secret authentication
2. Stateless JSON-RPC 2.0 tool execution
3. Rate-limited, auditable tool invocation
4. Append-only shared message board
`,
};

// Forbidden file patterns
const FORBIDDEN_FILE_PATTERNS = [
  /^\.env/i,
  /\.env/i,
  /\.git/i,
  /id_rsa/i,
  /\.pem$/i,
  /\.key$/i,
  /credentials/i,
  /secret/i,
  /\.db$/i,
  /\.sqlite/i,
  /\.dump$/i,
  /password/i,
  /dump\.sql/i,
];

/**
 * Validates and reads an allowlisted file from the sample repository.
 * Denies path traversal and restricted sensitive files.
 */
export function readSampleFile(filePath: string): { ok: boolean; content?: string; error?: string } {
  if (!filePath || typeof filePath !== 'string') {
    return { ok: false, error: 'Invalid file path provided' };
  }

  // Deny path traversal
  if (filePath.includes('..') || filePath.startsWith('/') || filePath.includes('\\')) {
    return { ok: false, error: 'Access denied: Path traversal or absolute paths are prohibited.' };
  }

  // Normalize path
  const normalized = filePath.trim().replace(/^\.\//, '');

  // Check forbidden patterns
  for (const pattern of FORBIDDEN_FILE_PATTERNS) {
    if (pattern.test(normalized)) {
      return { ok: false, error: `Access denied: Restricted file pattern '${normalized}' is prohibited.` };
    }
  }

  if (Object.prototype.hasOwnProperty.call(SAMPLE_REPO_FILES, normalized)) {
    return { ok: true, content: SAMPLE_REPO_FILES[normalized] };
  }

  return { ok: false, error: `File not found in sample repository: '${normalized}'` };
}

/**
 * Returns list of allowlisted sample files
 */
export function listSampleFiles(): string[] {
  return Object.keys(SAMPLE_REPO_FILES);
}

/**
 * Search the sample repository for a query string.
 */
export function searchSampleCode(query: string): Array<{ file: string; line: number; snippet: string }> {
  if (!query || typeof query !== 'string') return [];
  const lower = query.toLowerCase();
  const results: Array<{ file: string; line: number; snippet: string }> = [];

  for (const [file, content] of Object.entries(SAMPLE_REPO_FILES)) {
    const lines = content.split('\n');
    lines.forEach((line, idx) => {
      if (line.toLowerCase().includes(lower)) {
        results.push({
          file,
          line: idx + 1,
          snippet: line.trim(),
        });
      }
    });
  }

  return results.slice(0, 20); // Limit result size
}

/**
 * Mock recent git changes
 */
export function getRecentChanges(): Array<{
  hash: string;
  author: string;
  date: string;
  message: string;
  files: string[];
}> {
  return [
    {
      hash: 'b47e2a9',
      author: 'Senior Systems Eng <alex.t@example-demo.internal>',
      date: '2026-10-19T20:15:00Z',
      message: 'feat(mcp): add streamable http connector and tool catalog',
      files: ['src/services/manager.ts', 'docs/architecture.md'],
    },
    {
      hash: '91f3c88',
      author: 'Lead Architect <sam.v@example-demo.internal>',
      date: '2026-10-18T14:40:00Z',
      message: 'refactor(math): tighten throughput calculations and error bounds',
      files: ['src/utils/math.ts'],
    },
    {
      hash: '6a01df4',
      author: 'Platform Ops <morgan.l@example-demo.internal>',
      date: '2026-10-17T09:12:00Z',
      message: 'chore: update sample dependency manifests',
      files: ['package.json', 'README.md'],
    },
  ];
}

/**
 * Mock data model schema (no real database access or credentials)
 */
export function getMockDataModel(): {
  notice: string;
  tables: Array<{
    name: string;
    description: string;
    columns: Array<{ name: string; type: string; nullable: boolean; isPrimary?: boolean }>;
  }>;
} {
  return {
    notice: 'Mock schema representation only. No real database records or database credentials are exposed.',
    tables: [
      {
        name: 'fleet_vehicles',
        description: 'Autonomous delivery and telemetry units',
        columns: [
          { name: 'id', type: 'UUID', nullable: false, isPrimary: true },
          { name: 'vin', type: 'VARCHAR(17)', nullable: false },
          { name: 'model', type: 'VARCHAR(50)', nullable: false },
          { name: 'status', type: 'VARCHAR(20)', nullable: false },
          { name: 'battery_level', type: 'INTEGER', nullable: true },
          { name: 'last_ping_at', type: 'TIMESTAMP', nullable: true },
        ],
      },
      {
        name: 'telemetry_events',
        description: 'Simulated IoT sensor readings and position events',
        columns: [
          { name: 'event_id', type: 'BIGINT', nullable: false, isPrimary: true },
          { name: 'vehicle_id', type: 'UUID', nullable: false },
          { name: 'latitude', type: 'DOUBLE PRECISION', nullable: false },
          { name: 'longitude', type: 'DOUBLE PRECISION', nullable: false },
          { name: 'speed_kmh', type: 'FLOAT', nullable: false },
          { name: 'recorded_at', type: 'TIMESTAMP', nullable: false },
        ],
      },
      {
        name: 'maintenance_tickets',
        description: 'Service logs and inspection history',
        columns: [
          { name: 'ticket_id', type: 'VARCHAR(32)', nullable: false, isPrimary: true },
          { name: 'vehicle_id', type: 'UUID', nullable: false },
          { name: 'severity', type: 'VARCHAR(10)', nullable: false },
          { name: 'summary', type: 'TEXT', nullable: false },
          { name: 'assigned_team', type: 'VARCHAR(50)', nullable: true },
        ],
      },
    ],
  };
}

/**
 * Mock reports list
 */
export function getSampleReportsList(): Array<{ id: string; name: string; description: string; cadence: string }> {
  return [
    {
      id: 'rep_throughput_q3',
      name: 'Q3 Fleet Telemetry Throughput',
      description: 'Aggregate message ingestion rates and packet processing times.',
      cadence: 'Weekly',
    },
    {
      id: 'rep_battery_health',
      name: 'Battery Health & Degradation Index',
      description: 'Cycle statistics and thermal variance across fleet zones.',
      cadence: 'Daily',
    },
    {
      id: 'rep_dispatch_efficiency',
      name: 'Dispatch Routing Efficiency Score',
      description: 'Turnaround duration and route deviation metrics.',
      cadence: 'Monthly',
    },
  ];
}

/**
 * Mock specific report data
 */
export function getSampleReportData(reportId: string): { ok: boolean; report?: unknown; error?: string } {
  if (reportId === 'rep_throughput_q3') {
    return {
      ok: true,
      report: {
        report_id: 'rep_throughput_q3',
        title: 'Q3 Fleet Telemetry Throughput',
        generated_at: '2026-10-18T12:00:00Z',
        summary: 'Nominal message ingestion averaging 14,200 msg/sec with p99 latency of 18ms.',
        metrics: {
          total_messages: 842100000,
          avg_latency_ms: 6.4,
          p99_latency_ms: 18.2,
          packet_drop_rate: 0.0001,
        },
      },
    };
  }
  if (reportId === 'rep_battery_health') {
    return {
      ok: true,
      report: {
        report_id: 'rep_battery_health',
        title: 'Battery Health & Degradation Index',
        generated_at: '2026-10-19T06:00:00Z',
        summary: 'Fleet battery health index steady at 96.4% across 450 units.',
        metrics: {
          units_assessed: 450,
          avg_health_pct: 96.4,
          units_requiring_inspection: 3,
        },
      },
    };
  }
  if (reportId === 'rep_dispatch_efficiency') {
    return {
      ok: true,
      report: {
        report_id: 'rep_dispatch_efficiency',
        title: 'Dispatch Routing Efficiency Score',
        generated_at: '2026-10-15T00:00:00Z',
        summary: 'Average on-time waypoint completion: 98.7%.',
        metrics: {
          routes_evaluated: 1240,
          avg_eta_deviation_mins: 1.2,
        },
      },
    };
  }
  return { ok: false, error: `Report not found with id: '${reportId}'` };
}

/**
 * Mock service list
 */
export function getSampleServicesList(): Array<{
  service_id: string;
  name: string;
  purpose: string;
  tier: string;
}> {
  return [
    {
      service_id: 'svc_auth_gw',
      name: 'Authentication Gateway',
      purpose: 'Validates OAuth tokens, link secrets, and API rate windows.',
      tier: 'Edge Tier',
    },
    {
      service_id: 'svc_msg_broker',
      name: 'Event Message Broker',
      purpose: 'Coordinates asynchronous telemetry queues and message board propagation.',
      tier: 'Core Tier',
    },
    {
      service_id: 'svc_worker_pool',
      name: 'Task Worker Pool',
      purpose: 'Executes simulated batch jobs and periodic integrity scans.',
      tier: 'Worker Tier',
    },
    {
      service_id: 'svc_report_engine',
      name: 'Analytics & Reporting Engine',
      purpose: 'Generates non-sensitive statistical summaries and metric rollups.',
      tier: 'Data Tier',
    },
  ];
}

/**
 * Mock simulated service status
 */
export function getSampleServiceStatus(serviceId?: string): unknown {
  const baseStatus = [
    {
      service_id: 'svc_auth_gw',
      name: 'Authentication Gateway',
      status: 'healthy',
      latency_ms: 4,
      uptime_pct: 99.98,
      last_healthcheck: new Date().toISOString(),
      is_mock_data: true,
    },
    {
      service_id: 'svc_msg_broker',
      name: 'Event Message Broker',
      status: 'healthy',
      latency_ms: 12,
      uptime_pct: 99.95,
      last_healthcheck: new Date().toISOString(),
      is_mock_data: true,
    },
    {
      service_id: 'svc_worker_pool',
      name: 'Task Worker Pool',
      status: 'healthy',
      latency_ms: 8,
      uptime_pct: 99.99,
      last_healthcheck: new Date().toISOString(),
      is_mock_data: true,
    },
    {
      service_id: 'svc_report_engine',
      name: 'Analytics & Reporting Engine',
      status: 'healthy',
      latency_ms: 22,
      uptime_pct: 99.91,
      last_healthcheck: new Date().toISOString(),
      is_mock_data: true,
    },
  ];

  if (serviceId) {
    const found = baseStatus.find((s) => s.service_id === serviceId);
    if (!found) {
      return { error: `Service '${serviceId}' not found in mock catalog` };
    }
    return found;
  }

  return {
    environment: 'demo-sandbox',
    cluster: 'mock-cluster-east-1',
    timestamp: new Date().toISOString(),
    is_mock_data: true,
    services: baseStatus,
  };
}

/**
 * Mock fictional people directory search (NO real personal data)
 */
export function searchMockPeople(query?: string): Array<{
  id: string;
  name: string;
  email: string;
  role: string;
  stage: string;
  owner: string;
}> {
  const people = [
    {
      id: 'usr_001',
      name: 'Alex Rivera',
      email: 'alex.rivera@example-demo.internal',
      role: 'Staff Systems Engineer',
      stage: 'Active',
      owner: 'Platform Eng Team',
    },
    {
      id: 'usr_002',
      name: 'Samira Patel',
      email: 'samira.patel@example-demo.internal',
      role: 'Principal Architect',
      stage: 'Active',
      owner: 'Core Architecture',
    },
    {
      id: 'usr_003',
      name: 'Jordan Chen',
      email: 'jordan.chen@example-demo.internal',
      role: 'DevOps & Observability Lead',
      stage: 'On-Call',
      owner: 'Infrastructure Ops',
    },
    {
      id: 'usr_004',
      name: 'Elena Rostova',
      email: 'elena.rostova@example-demo.internal',
      role: 'Security & Compliance Officer',
      stage: 'Active',
      owner: 'Security Review',
    },
    {
      id: 'usr_005',
      name: 'Marcus Bell',
      email: 'marcus.bell@example-demo.internal',
      role: 'Full-Stack Developer',
      stage: 'Active',
      owner: 'Frontend Guild',
    },
  ];

  if (!query || typeof query !== 'string' || !query.trim()) {
    return people;
  }

  const q = query.toLowerCase().trim();
  return people.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.role.toLowerCase().includes(q) ||
      p.email.toLowerCase().includes(q) ||
      p.owner.toLowerCase().includes(q) ||
      p.stage.toLowerCase().includes(q)
  );
}
