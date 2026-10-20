import React, { useState, useEffect, useCallback } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { CreateKeyModal } from './components/CreateKeyModal';
import { AdminAuthModal } from './components/AdminAuthModal';
import { OverviewView } from './views/OverviewView';
import { SharedBoardView } from './views/SharedBoardView';
import { ConnectorLinksView } from './views/ConnectorLinksView';
import { AuditLogView } from './views/AuditLogView';
import { McpInspectorView } from './views/McpInspectorView';
import { EnvironmentView } from './views/EnvironmentView';
import { SettingsView } from './views/SettingsView';
import {
  ActiveTab,
  OverviewMetrics,
  ConnectorKeySummary,
  ConnectorCallRecord,
  BoardMessage,
  ConnectorSettings,
  SystemHealth,
} from './types';
import {
  fetchOverview,
  fetchKeys,
  fetchCalls,
  fetchMessages,
  fetchSettings,
} from './api';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('overview');
  const [metrics, setMetrics] = useState<OverviewMetrics | null>(null);
  const [keys, setKeys] = useState<ConnectorKeySummary[]>([]);
  const [calls, setCalls] = useState<ConnectorCallRecord[]>([]);
  const [messages, setMessages] = useState<BoardMessage[]>([]);
  const [settings, setSettings] = useState<ConnectorSettings | null>(null);
  const [health, setHealth] = useState<SystemHealth | null>(null);

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateKeyOpen, setIsCreateKeyOpen] = useState(false);
  const [isAdminAuthOpen, setIsAdminAuthOpen] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const loadAllData = useCallback(async () => {
    setIsRefreshing(true);
    setApiError(null);
    try {
      const [overviewData, keysData, callsData, messagesData, settingsData] = await Promise.all([
        fetchOverview(),
        fetchKeys(),
        fetchCalls(100),
        fetchMessages(100),
        fetchSettings(),
      ]);

      setMetrics(overviewData);
      setKeys(keysData);
      setCalls(callsData);
      setMessages(messagesData);
      setSettings(settingsData.settings);
      setHealth(settingsData.health);
    } catch (err: unknown) {
      console.error('Failed to load dashboard data:', err);
      setApiError(err instanceof Error ? err.message : 'Unable to connect to backend service');
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadAllData();
    // Auto-poll messages and metrics every 15 seconds
    const interval = setInterval(() => {
      loadAllData();
    }, 15000);
    return () => clearInterval(interval);
  }, [loadAllData]);

  return (
    <div className="flex h-screen bg-slate-100 font-sans text-slate-900 overflow-hidden">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        connectorStatus={metrics?.status || 'Active / Online'}
      />

      {/* Main Workspace Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Bar Contract */}
        <Header
          activeTab={activeTab}
          onRefresh={loadAllData}
          isRefreshing={isRefreshing}
          onOpenCreateKey={() => setIsCreateKeyOpen(true)}
          onOpenAdminAuth={() => setIsAdminAuthOpen(true)}
        />

        {/* Global Error Banner if API Fails */}
        {apiError && (
          <div className="px-8 py-2.5 bg-rose-50 border-b border-rose-200 text-xs text-rose-700 flex items-center justify-between">
            <span>
              <strong>Authentication / Connection Notice:</strong> {apiError}
            </span>
            <button
              onClick={() => setIsAdminAuthOpen(true)}
              className="underline font-semibold hover:text-rose-900"
            >
              Configure Admin Key
            </button>
          </div>
        )}

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-8">
          {activeTab === 'overview' && (
            <OverviewView
              metrics={metrics}
              onNavigate={setActiveTab}
              onOpenCreateKey={() => setIsCreateKeyOpen(true)}
            />
          )}

          {activeTab === 'board' && (
            <SharedBoardView
              messages={messages}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'links' && (
            <ConnectorLinksView
              keys={keys}
              onRefresh={loadAllData}
              onOpenCreateKey={() => setIsCreateKeyOpen(true)}
            />
          )}

          {activeTab === 'audit' && (
            <AuditLogView
              calls={calls}
              onRefresh={loadAllData}
            />
          )}

          {activeTab === 'inspector' && (
            <McpInspectorView
              keys={keys}
              onRefreshCalls={loadAllData}
            />
          )}

          {activeTab === 'environment' && <EnvironmentView />}

          {activeTab === 'settings' && (
            <SettingsView
              settings={settings}
              health={health}
              onRefresh={loadAllData}
            />
          )}
        </main>
      </div>

      {/* Modal Dialogs */}
      <CreateKeyModal
        isOpen={isCreateKeyOpen}
        onClose={() => setIsCreateKeyOpen(false)}
        onKeyCreated={loadAllData}
      />

      <AdminAuthModal
        isOpen={isAdminAuthOpen}
        onClose={() => setIsAdminAuthOpen(false)}
        onSuccess={loadAllData}
      />
    </div>
  );
}
