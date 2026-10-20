import React, { useState } from 'react';
import {
  Server,
  FileText,
  Database,
  BarChart3,
  Users,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import {
  SAMPLE_REPO_FILES,
  getMockDataModel,
  getSampleServicesList,
  getSampleServiceStatus,
  getSampleReportsList,
  searchMockPeople,
} from '../../server/sampleRepo/mockData';

export const EnvironmentView: React.FC = () => {
  const [subTab, setSubTab] = useState<'services' | 'files' | 'model' | 'reports' | 'people'>('services');
  const [selectedFile, setSelectedFile] = useState<string>('README.md');
  const [searchQuery, setSearchQuery] = useState('');

  const services = getSampleServicesList();
  const servicesStatus = getSampleServiceStatus() as { services: Array<{ service_id: string; status: string; latency_ms: number; uptime_pct: number }> };
  const dataModel = getMockDataModel();
  const reports = getSampleReportsList();
  const people = searchMockPeople(searchQuery);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Banner */}
      <div className="p-6 bg-white rounded-xl border border-slate-200 shadow-xs flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-500 mb-1">
            <span>Sample Context Environment</span>
            <span aria-hidden="true">·</span>
            <span>Simulated Prototype</span>
          </div>
          <h2 className="text-base font-semibold text-slate-900">
            Nexus Fleet Sandbox & Sample Repository
          </h2>
          <p className="text-xs text-slate-500 mt-1 max-w-2xl">
            This demo environment provides safe, non-sensitive sample context for Claude Code and CoWork. All records, credentials, service states, and files are simulated.
          </p>
        </div>

        <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center gap-2.5 text-xs text-amber-800">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
          <span>Fictional Sample Data Only. No real database access.</span>
        </div>
      </div>

      {/* Subtab Segmented Control */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg text-xs w-fit">
        <button
          onClick={() => setSubTab('services')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
            subTab === 'services'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Server className="w-3.5 h-3.5 text-indigo-600" />
          <span>Mock Services</span>
        </button>
        <button
          onClick={() => setSubTab('files')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
            subTab === 'files'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="w-3.5 h-3.5 text-indigo-600" />
          <span>Allowlisted Files</span>
        </button>
        <button
          onClick={() => setSubTab('model')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
            subTab === 'model'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Database className="w-3.5 h-3.5 text-indigo-600" />
          <span>Data Model Schema</span>
        </button>
        <button
          onClick={() => setSubTab('reports')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
            subTab === 'reports'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
          <span>Sample Reports</span>
        </button>
        <button
          onClick={() => setSubTab('people')}
          className={`flex items-center gap-1.5 px-3 py-1.5 font-medium rounded-md transition-colors ${
            subTab === 'people'
              ? 'bg-white text-slate-900 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Users className="w-3.5 h-3.5 text-indigo-600" />
          <span>Fictional Team</span>
        </button>
      </div>

      {/* Subtab Contents */}
      {subTab === 'services' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {services.map((svc) => {
            const statusObj = servicesStatus.services.find((s) => s.service_id === svc.service_id);
            return (
              <div key={svc.service_id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-900 text-sm">{svc.name}</span>
                    <span className="text-[11px] font-mono text-slate-400">· {svc.tier}</span>
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-emerald-700">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Healthy (Demo)</span>
                  </div>
                </div>

                <p className="text-xs text-slate-600">{svc.purpose}</p>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span>ID: {svc.service_id}</span>
                  <span>Latency: {statusObj?.latency_ms || 8}ms</span>
                  <span>Uptime: {statusObj?.uptime_pct || 99.9}%</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {subTab === 'files' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
          <div className="lg:col-span-4 border-r border-slate-200 pr-6 space-y-2">
            <span className="text-xs font-semibold text-slate-900 block mb-3">
              Allowlisted Repository Files
            </span>
            {Object.keys(SAMPLE_REPO_FILES).map((filePath) => (
              <button
                key={filePath}
                onClick={() => setSelectedFile(filePath)}
                className={`w-full text-left px-3 py-2 rounded-lg text-xs font-mono transition-colors ${
                  selectedFile === filePath
                    ? 'bg-indigo-50 text-indigo-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50'
                }`}
              >
                {filePath}
              </button>
            ))}
          </div>

          <div className="lg:col-span-8 space-y-2">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <span className="text-xs font-mono font-semibold text-slate-800">
                {selectedFile}
              </span>
              <span className="text-[11px] text-slate-400 font-mono">
                Read-Only Sample Context
              </span>
            </div>
            <pre className="p-4 bg-slate-950 text-slate-100 rounded-lg font-mono text-xs overflow-x-auto max-h-[400px]">
              {SAMPLE_REPO_FILES[selectedFile]}
            </pre>
          </div>
        </div>
      )}

      {subTab === 'model' && (
        <div className="space-y-4">
          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600">
            {dataModel.notice}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {dataModel.tables.map((tbl) => (
              <div key={tbl.name} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold text-slate-900 text-sm font-mono">{tbl.name}</h3>
                    <p className="text-xs text-slate-500">{tbl.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 font-mono">
                    {tbl.columns.length} columns
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 text-slate-500 font-medium">
                        <th className="py-2">Column</th>
                        <th className="py-2">Type</th>
                        <th className="py-2">Nullable</th>
                        <th className="py-2">Key</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
                      {tbl.columns.map((col) => (
                        <tr key={col.name}>
                          <td className="py-2 text-slate-800 font-medium">{col.name}</td>
                          <td className="py-2 text-slate-500">{col.type}</td>
                          <td className="py-2 text-slate-500">{col.nullable ? 'YES' : 'NO'}</td>
                          <td className="py-2 text-indigo-600">{col.isPrimary ? 'PRIMARY' : '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {subTab === 'reports' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {reports.map((rep) => (
            <div key={rep.id} className="p-5 bg-white rounded-xl border border-slate-200 shadow-xs space-y-3">
              <span className="text-xs font-mono text-indigo-600 font-medium">{rep.id}</span>
              <h3 className="font-semibold text-slate-900 text-sm">{rep.name}</h3>
              <p className="text-xs text-slate-600 leading-relaxed">{rep.description}</p>
              <div className="pt-2 border-t border-slate-100 flex justify-between text-xs text-slate-500">
                <span>Cadence</span>
                <span className="font-medium text-slate-800">{rep.cadence}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {subTab === 'people' && (
        <div className="space-y-4">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search fictional team members..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 bg-white"
            />
          </div>

          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-xs">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-500 font-medium">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-4">Fictional Email</th>
                  <th className="py-3 px-4">Guild / Owner</th>
                  <th className="py-3 px-4">Stage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {people.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="py-3 px-4 font-semibold text-slate-900">{p.name}</td>
                    <td className="py-3 px-4 text-slate-600">{p.role}</td>
                    <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{p.email}</td>
                    <td className="py-3 px-4 text-slate-600">{p.owner}</td>
                    <td className="py-3 px-4 text-emerald-700 font-medium">{p.stage}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
