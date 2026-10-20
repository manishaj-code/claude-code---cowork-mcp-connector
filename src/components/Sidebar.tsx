import React from 'react';
import {
  LayoutDashboard,
  MessageSquare,
  KeyRound,
  FileText,
  Terminal,
  Server,
  Settings,
  ShieldCheck,
} from 'lucide-react';
import { ActiveTab } from '../types';

interface SidebarProps {
  activeTab: ActiveTab;
  onSelectTab: (tab: ActiveTab) => void;
  connectorStatus: string;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  connectorStatus,
}) => {
  const navItems: Array<{ id: ActiveTab; label: string; icon: React.ComponentType<{ className?: string }> }> = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'board', label: 'Shared Board', icon: MessageSquare },
    { id: 'links', label: 'Connector Links', icon: KeyRound },
    { id: 'audit', label: 'Tool Audit Log', icon: FileText },
    { id: 'inspector', label: 'MCP Inspector', icon: Terminal },
    { id: 'environment', label: 'Demo Environment', icon: Server },
    { id: 'settings', label: 'Settings & Health', icon: Settings },
  ];

  const isOnline = connectorStatus.toLowerCase().includes('active') || connectorStatus.toLowerCase().includes('online');

  return (
    <aside className="w-64 border-r border-slate-200 bg-white flex flex-col shrink-0 select-none">
      {/* Brand Header */}
      <div className="h-16 px-6 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-semibold text-sm shadow-xs">
            M
          </div>
          <div className="flex flex-col">
            <span className="font-semibold text-slate-900 text-sm tracking-tight leading-tight">
              MCP Gateway
            </span>
            <span className="text-[11px] text-slate-500 font-normal">
              Claude Code & CoWork
            </span>
          </div>
        </div>
      </div>

      {/* Nav List */}
      <div className="p-3 flex-1 overflow-y-auto space-y-1">
        <div className="px-3 py-2 text-[11px] font-medium text-slate-400 uppercase tracking-wider">
          Management
        </div>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors text-left ${
                isActive
                  ? 'bg-indigo-50 text-indigo-700 shadow-xs'
                  : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 ${
                  isActive ? 'text-indigo-600' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </div>

      {/* Status Bar */}
      <div className="p-4 border-t border-slate-200 bg-slate-50/50">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <span
              className={`w-2 h-2 rounded-full ${
                isOnline ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            <span className="font-medium text-slate-700">Connector Gateway</span>
          </div>
          <span className="text-slate-500 text-[11px] font-mono">
            {isOnline ? 'Online' : 'Disabled'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 flex items-center gap-1">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
          <span>Streamable HTTP · JSON-RPC 2.0</span>
        </div>
      </div>
    </aside>
  );
};
