import React from 'react';
import { Plus, RefreshCw, Key } from 'lucide-react';
import { ActiveTab } from '../types';

interface HeaderProps {
  activeTab: ActiveTab;
  onRefresh: () => void;
  isRefreshing: boolean;
  onOpenCreateKey: () => void;
  onOpenAdminAuth: () => void;
}

const TAB_TITLES: Record<ActiveTab, { section: string; title: string }> = {
  overview: { section: 'Dashboard', title: 'System Overview' },
  board: { section: 'Messaging', title: 'Shared Communication Board' },
  links: { section: 'Security', title: 'Connector Links' },
  audit: { section: 'Compliance', title: 'Tool Call Audit Log' },
  inspector: { section: 'Developer', title: 'MCP Protocol Inspector' },
  environment: { section: 'Sandbox', title: 'Demo Environment' },
  settings: { section: 'Configuration', title: 'Settings & Health' },
};

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onRefresh,
  isRefreshing,
  onOpenCreateKey,
  onOpenAdminAuth,
}) => {
  const current = TAB_TITLES[activeTab] || { section: 'Gateway', title: 'Dashboard' };

  return (
    <header className="h-16 px-8 border-b border-slate-200 bg-white flex items-center justify-between gap-8 shrink-0">
      {/* Zone 1: Breadcrumb Trail */}
      <div className="flex items-center gap-2 text-sm">
        <span className="text-slate-400 font-normal">Nexus Fleet</span>
        <span className="text-slate-300 font-mono">/</span>
        <span className="text-slate-500 font-medium">{current.section}</span>
        <span className="text-slate-300 font-mono">/</span>
        <h1 className="text-slate-900 font-semibold">{current.title}</h1>
      </div>

      {/* Zone 3: Primary Action & Controls */}
      <div className="flex items-center gap-3 shrink-0">
        <button
          onClick={onRefresh}
          disabled={isRefreshing}
          title="Refresh current view"
          className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors border border-slate-200"
        >
          <RefreshCw
            className={`w-4 h-4 ${isRefreshing ? 'animate-spin text-indigo-600' : ''}`}
          />
        </button>

        <button
          onClick={onOpenAdminAuth}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors whitespace-nowrap shrink-0"
        >
          <Key className="w-3.5 h-3.5 text-slate-500" />
          <span>Admin Auth</span>
        </button>

        <button
          onClick={onOpenCreateKey}
          className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs whitespace-nowrap shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Create Link</span>
        </button>
      </div>
    </header>
  );
};
