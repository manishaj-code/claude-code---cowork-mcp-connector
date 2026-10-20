import React, { useState } from 'react';
import {
  Terminal,
  Play,
  CheckCircle2,
  AlertCircle,
  Clock,
  Sparkles,
  ShieldCheck,
  RotateCw,
} from 'lucide-react';
import { ConnectorKeySummary } from '../types';
import { invokeMcpEndpoint } from '../api';
import { INITIAL_DEMO_SECRET } from '../../server/storage/demoSecret';

interface McpInspectorViewProps {
  keys: ConnectorKeySummary[];
  onRefreshCalls: () => void;
}

const SAMPLE_TEMPLATES: Record<string, { method: string; params: Record<string, unknown> }> = {
  'initialize': {
    method: 'initialize',
    params: {
      protocolVersion: '2024-11-05',
      capabilities: {},
      clientInfo: { name: 'claude-cowork-tester', version: '1.0.0' },
    },
  },
  'ping': {
    method: 'ping',
    params: {},
  },
  'tools/list': {
    method: 'tools/list',
    params: {},
  },
  'tool: get_overview': {
    method: 'tools/call',
    params: { name: 'get_overview', arguments: {} },
  },
  'tool: list_files': {
    method: 'tools/call',
    params: { name: 'list_files', arguments: {} },
  },
  'tool: read_file (README.md)': {
    method: 'tools/call',
    params: { name: 'read_file', arguments: { path: 'README.md' } },
  },
  'tool: read_file (Blocked .env)': {
    method: 'tools/call',
    params: { name: 'read_file', arguments: { path: '.env' } },
  },
  'tool: search_code': {
    method: 'tools/call',
    params: { name: 'search_code', arguments: { query: 'Nexus' } },
  },
  'tool: recent_changes': {
    method: 'tools/call',
    params: { name: 'recent_changes', arguments: {} },
  },
  'tool: describe_data_model': {
    method: 'tools/call',
    params: { name: 'describe_data_model', arguments: {} },
  },
  'tool: list_services': {
    method: 'tools/call',
    params: { name: 'list_services', arguments: {} },
  },
  'tool: service_status': {
    method: 'tools/call',
    params: { name: 'service_status', arguments: {} },
  },
  'tool: find_people': {
    method: 'tools/call',
    params: { name: 'find_people', arguments: { query: 'Alex' } },
  },
  'tool: send_message': {
    method: 'tools/call',
    params: {
      name: 'send_message',
      arguments: {
        text: 'CoWork verification message from MCP Inspector',
        side: 'chat',
        author: 'Claude / CoWork Inspector',
      },
    },
  },
  'tool: read_messages': {
    method: 'tools/call',
    params: {
      name: 'read_messages',
      arguments: { limit: 5, side: 'chat' },
    },
  },
};

export const McpInspectorView: React.FC<McpInspectorViewProps> = ({ keys: _keys, onRefreshCalls }) => {
  // Use initial demo secret by default for instant zero-friction testing
  const [secretInput, setSecretInput] = useState(INITIAL_DEMO_SECRET);
  const [scopeInput, setScopeInput] = useState('code');
  const [selectedTemplate, setSelectedTemplate] = useState('tool: get_overview');
  const [methodInput, setMethodInput] = useState('tools/call');
  const [paramsJson, setParamsJson] = useState(
    JSON.stringify(SAMPLE_TEMPLATES['tool: get_overview'].params, null, 2)
  );

  const [isLoading, setIsLoading] = useState(false);
  const [responseResult, setResponseResult] = useState<{
    status: number;
    durationMs: number;
    data: unknown;
  } | null>(null);
  const [jsonError, setJsonError] = useState<string | null>(null);

  const handleSelectTemplate = (key: string) => {
    setSelectedTemplate(key);
    const tmpl = SAMPLE_TEMPLATES[key];
    if (tmpl) {
      setMethodInput(tmpl.method);
      setParamsJson(JSON.stringify(tmpl.params, null, 2));
      setJsonError(null);
    }
  };

  const handleExecute = async () => {
    setJsonError(null);
    let parsedParams = {};
    try {
      if (paramsJson.trim()) {
        parsedParams = JSON.parse(paramsJson);
      }
    } catch {
      setJsonError('Invalid JSON format in parameters.');
      return;
    }

    const host = window.location.origin;
    const url = `${host}/connect/${scopeInput.trim()}/${secretInput.trim()}/mcp`;

    setIsLoading(true);
    try {
      const res = await invokeMcpEndpoint(url, methodInput.trim(), parsedParams);
      setResponseResult(res);
      onRefreshCalls();
    } catch (err: unknown) {
      setResponseResult({
        status: 500,
        durationMs: 0,
        data: { error: err instanceof Error ? err.message : String(err) },
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header bar */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>JSON-RPC 2.0</span>
            <span aria-hidden="true">·</span>
            <span>Live Endpoint Invocation</span>
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            MCP Protocol Inspector & Live Tester
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            Test and inspect standard Model Context Protocol messages directly over HTTP POST. Validates protocol negotiation, tool discovery, context tools, and shared board operations.
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-600 bg-slate-50 border border-slate-200 px-3 py-2 rounded-lg font-mono">
          <Terminal className="w-4 h-4 text-indigo-600" />
          <span>Stateless Streamable HTTP</span>
        </div>
      </div>

      {/* Main Two-Column Inspector Split */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Request Builder (7 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Request Configuration</span>
            </span>
            <span className="text-[11px] text-slate-400 font-mono">POST /connect/:scope/:secret/mcp</span>
          </div>

          {/* Quick Template Picker */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">
              Select Preset Method / Tool
            </label>
            <select
              value={selectedTemplate}
              onChange={(e) => handleSelectTemplate(e.target.value)}
              className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white font-medium text-slate-800"
            >
              {Object.keys(SAMPLE_TEMPLATES).map((key) => (
                <option key={key} value={key}>
                  {key}
                </option>
              ))}
            </select>
          </div>

          {/* Scope and Secret Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-slate-700 mb-1">Scope</label>
              <input
                type="text"
                value={scopeInput}
                onChange={(e) => setScopeInput(e.target.value)}
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
            <div className="col-span-2">
              <label className="block text-[11px] font-medium text-slate-700 mb-1">
                Connector Secret
              </label>
              <input
                type="text"
                value={secretInput}
                onChange={(e) => setSecretInput(e.target.value)}
                placeholder="sec_..."
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
              />
            </div>
          </div>

          {/* JSON-RPC Method */}
          <div>
            <label className="block text-xs font-medium text-slate-700 mb-1">JSON-RPC Method</label>
            <input
              type="text"
              value={methodInput}
              onChange={(e) => setMethodInput(e.target.value)}
              className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:border-indigo-600"
            />
          </div>

          {/* Parameters JSON Editor */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-medium text-slate-700">Params (JSON-RPC Body)</label>
              {jsonError && <span className="text-[11px] text-rose-600">{jsonError}</span>}
            </div>
            <textarea
              rows={8}
              value={paramsJson}
              onChange={(e) => setParamsJson(e.target.value)}
              className="w-full p-3 font-mono text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-slate-950 text-slate-100"
            />
          </div>

          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-400 font-mono">
              Headers: Content-Type: application/json
            </span>
            <button
              onClick={handleExecute}
              disabled={isLoading}
              className="flex items-center gap-2 px-5 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
            >
              {isLoading ? (
                <>
                  <RotateCw className="w-3.5 h-3.5 animate-spin" />
                  <span>Invoking...</span>
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" />
                  <span>Send MCP Request</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Right Column: Live Response & Latency Inspector (6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 shadow-xs p-6 space-y-4 flex flex-col h-full">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <span className="text-xs font-semibold text-slate-900 flex items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5 text-emerald-600" />
              <span>Response Payload</span>
            </span>

            {responseResult && (
              <div className="flex items-center gap-3 text-xs font-mono">
                <span className="flex items-center gap-1 text-slate-500">
                  <Clock className="w-3 h-3" />
                  <span className="tabular-nums">{responseResult.durationMs}ms</span>
                </span>
                <span
                  className={`font-semibold ${
                    responseResult.status === 200
                      ? 'text-emerald-600'
                      : responseResult.status === 404
                      ? 'text-amber-600'
                      : 'text-rose-600'
                  }`}
                >
                  HTTP {responseResult.status}
                </span>
              </div>
            )}
          </div>

          <div className="flex-1 bg-slate-950 rounded-lg p-4 font-mono text-xs text-slate-200 overflow-x-auto min-h-[380px] max-h-[460px]">
            {responseResult ? (
              <pre>{JSON.stringify(responseResult.data, null, 2)}</pre>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-slate-500 space-y-2">
                <Terminal className="w-8 h-8 text-slate-700" />
                <p>Click &quot;Send MCP Request&quot; to inspect real-time JSON-RPC responses.</p>
              </div>
            )}
          </div>

          {/* Quick Protocol Checks Checklist */}
          <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-xs space-y-2">
            <span className="font-semibold text-slate-900 block">
              Protocol Compliance Checklist
            </span>
            <div className="grid grid-cols-2 gap-2 text-[11px] text-slate-600 font-mono">
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>JSON-RPC 2.0 Enforced</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Error Code -32601</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>Notification HTTP 202</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                <span>HTTP 405 for GET/DELETE</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
