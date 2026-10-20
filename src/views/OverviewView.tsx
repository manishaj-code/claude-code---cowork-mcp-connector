import React from 'react';
import {
  KeyRound,
  FileCode2,
  MessageSquare,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Terminal,
} from 'lucide-react';
import { OverviewMetrics, ActiveTab } from '../types';

interface OverviewViewProps {
  metrics: OverviewMetrics | null;
  onNavigate: (tab: ActiveTab) => void;
  onOpenCreateKey: () => void;
}

export const OverviewView: React.FC<OverviewViewProps> = ({
  metrics,
  onNavigate,
  onOpenCreateKey,
}) => {
  const isOnline = metrics?.status.toLowerCase().includes('active') || metrics?.status.toLowerCase().includes('online');

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Hero Strip / Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Model Context Protocol (MCP)</span>
            <span aria-hidden="true">·</span>
            <span>Streamable HTTP</span>
            <span aria-hidden="true">·</span>
            <span>JSON-RPC 2.0</span>
          </div>
          <h2 className="text-xl font-semibold text-slate-900 tracking-tight">
            Claude Code & CoWork MCP Bridge
          </h2>
          <p className="mt-1 text-sm text-slate-600 max-w-2xl">
            A standalone demonstration gateway providing URL-authenticated context tools and an append-only shared message board between Claude/CoWork and terminal-based Claude Code.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => onNavigate('board')}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 hover:bg-slate-100 rounded-lg transition-colors whitespace-nowrap shrink-0"
          >
            <MessageSquare className="w-4 h-4 text-slate-500" />
            <span>Open Board</span>
          </button>
          <button
            onClick={onOpenCreateKey}
            className="flex items-center gap-2 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
          >
            <KeyRound className="w-4 h-4" />
            <span>New Connector Link</span>
          </button>
        </div>
      </div>

      {/* Metric Cards (Tabular Figures) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Active Links */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Active Connector Links</span>
            <KeyRound className="w-4 h-4 text-indigo-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {metrics ? metrics.activeKeys : '—'}
            </span>
            <span className="text-xs text-slate-500">keys provisioned</span>
          </div>
          <button
            onClick={() => onNavigate('links')}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <span>Manage links</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 2: Total Tool Calls */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Total MCP Invocations</span>
            <FileCode2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {metrics ? metrics.totalCalls : '—'}
            </span>
            <span className="text-xs text-slate-500">audited calls</span>
          </div>
          <button
            onClick={() => onNavigate('audit')}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <span>View audit logs</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 3: Board Messages */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Shared Board Messages</span>
            <MessageSquare className="w-4 h-4 text-sky-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono tabular-nums">
              {metrics ? metrics.messageCount : '—'}
            </span>
            <span className="text-xs text-slate-500">chronological entries</span>
          </div>
          <button
            onClick={() => onNavigate('board')}
            className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
          >
            <span>Inspect thread</span>
            <ArrowUpRight className="w-3 h-3" />
          </button>
        </div>

        {/* Card 4: Gateway Status */}
        <div className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-500">Gateway Status</span>
            <Activity className="w-4 h-4 text-slate-600" />
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-slate-900 font-mono">
              {isOnline ? 'Nominal' : 'Disabled'}
            </span>
          </div>
          <div className="mt-3 flex items-center gap-1.5 text-xs text-slate-500">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span>{metrics?.status || 'Active'}</span>
          </div>
        </div>
      </div>

      {/* Two Column Section: Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Board Messages */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Recent Board Activity</h3>
            </div>
            <button
              onClick={() => onNavigate('board')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all
            </button>
          </div>

          <div className="p-6 divide-y divide-slate-100 flex-1">
            {metrics?.recentMessages && metrics.recentMessages.length > 0 ? (
              metrics.recentMessages.map((msg) => (
                <div key={msg.id} className="py-3 first:pt-0 last:pb-0">
                  <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
                    <span className="font-medium text-slate-800">{msg.author}</span>
                    <div className="flex items-center gap-2 font-mono">
                      <span>{msg.side === 'chat' ? 'CoWork' : 'Claude Code'}</span>
                      <span aria-hidden="true">·</span>
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                    </div>
                  </div>
                  <p className="text-xs text-slate-700 line-clamp-2">{msg.text}</p>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No board messages logged yet.
              </div>
            )}
          </div>
        </div>

        {/* Recent Tool Call Audit */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col">
          <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-500" />
              <h3 className="text-sm font-semibold text-slate-900">Recent Tool Call Audits</h3>
            </div>
            <button
              onClick={() => onNavigate('audit')}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium"
            >
              View all
            </button>
          </div>

          <div className="p-6 divide-y divide-slate-100 flex-1">
            {metrics?.recentCalls && metrics.recentCalls.length > 0 ? (
              metrics.recentCalls.map((call) => (
                <div key={call.id} className="py-3 first:pt-0 last:pb-0 flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-xs font-semibold text-slate-900">
                        {call.tool}
                      </span>
                      {call.ok ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      ) : (
                        <XCircle className="w-3.5 h-3.5 text-rose-600 shrink-0" />
                      )}
                    </div>
                    <span className="text-[11px] text-slate-500 block truncate">
                      {call.connector_label || 'Connector Link'}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400 shrink-0">
                    {new Date(call.created_at).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <div className="py-8 text-center text-xs text-slate-400">
                No tool calls recorded yet.
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Terminal CLI Quick Reference */}
      <div className="p-6 bg-slate-900 text-slate-100 rounded-xl border border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-indigo-400" />
            <h3 className="text-sm font-semibold text-white">Claude Code Terminal Integration</h3>
          </div>
          <span className="text-xs text-slate-400 font-mono">bin/connector_board.ts</span>
        </div>

        <p className="text-xs text-slate-300">
          Developers running Claude Code can read board messages and post updates using the CLI without directly accessing databases:
        </p>

        <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 font-mono text-xs text-emerald-400 space-y-1 overflow-x-auto">
          <div><span className="text-slate-500"># 1. Set environment variable</span></div>
          <div>export MCP_CONNECTOR_URL="http://localhost:3000/connect/code/YOUR_SECRET/mcp"</div>
          <div className="pt-2"><span className="text-slate-500"># 2. Read messages</span></div>
          <div>npx tsx bin/connector_board.ts</div>
          <div className="pt-2"><span className="text-slate-500"># 3. Post reply to CoWork</span></div>
          <div>npx tsx bin/connector_board.ts --reply "Feature verified in local sandbox"</div>
        </div>
      </div>
    </div>
  );
};
