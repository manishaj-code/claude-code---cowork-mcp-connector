import React, { useState } from 'react';
import {
  Send,
  CheckCheck,
  Clock,
  Sparkles,
  Terminal,
  User,
  ShieldAlert,
} from 'lucide-react';
import { BoardMessage } from '../types';
import { postBoardMessage } from '../api';

interface SharedBoardViewProps {
  messages: BoardMessage[];
  onRefresh: () => void;
}

export const SharedBoardView: React.FC<SharedBoardViewProps> = ({
  messages,
  onRefresh,
}) => {
  const [inputText, setInputText] = useState('');
  const [side, setSide] = useState<'chat' | 'box'>('chat');
  const [author, setAuthor] = useState('Claude / CoWork');
  const [isSending, setIsSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isSending) return;

    setIsSending(true);
    setError(null);

    try {
      await postBoardMessage(inputText.trim(), side, author.trim());
      setInputText('');
      onRefresh();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to post message to board');
    } finally {
      setIsSending(false);
    }
  };

  const handleSideChange = (newSide: 'chat' | 'box') => {
    setSide(newSide);
    if (newSide === 'chat') {
      setAuthor('Claude / CoWork');
    } else {
      setAuthor('Claude Code (Terminal)');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto h-[calc(100vh-140px)] flex flex-col">
      {/* Informational Header */}
      <div className="p-4 bg-white rounded-xl border border-slate-200 flex items-center justify-between shadow-xs shrink-0">
        <div>
          <h2 className="text-sm font-semibold text-slate-900">
            Append-Only Communication Channel
          </h2>
          <p className="text-xs text-slate-500">
            Messages exchanged between Claude/CoWork (web) and Claude Code (terminal). Entries are permanent and cannot be modified or deleted.
          </p>
        </div>
        <div className="flex items-center gap-3 text-xs text-slate-500 font-mono">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-indigo-500" />
            <span>CoWork (chat)</span>
          </span>
          <span aria-hidden="true">·</span>
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            <span>Claude Code (box)</span>
          </span>
        </div>
      </div>

      {/* Message Timeline */}
      <div className="flex-1 bg-white rounded-xl border border-slate-200 p-6 overflow-y-auto space-y-4 shadow-xs">
        {messages.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-center p-8">
            <div className="w-12 h-12 rounded-full bg-slate-50 border border-slate-200 flex items-center justify-center text-slate-400 mb-3">
              <Clock className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-medium text-slate-700">No Messages on Board</h3>
            <p className="text-xs text-slate-500 max-w-sm mt-1">
              Post a task request or instruction below to initiate communication between Claude and Claude Code.
            </p>
          </div>
        ) : (
          messages.map((msg) => {
            const isCoWork = msg.side === 'chat';
            return (
              <div
                key={msg.id}
                className={`flex gap-3.5 ${
                  isCoWork ? 'items-start' : 'items-start flex-row-reverse'
                }`}
              >
                {/* Avatar Icon */}
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-semibold shrink-0 shadow-xs ${
                    isCoWork
                      ? 'bg-indigo-50 text-indigo-700 border border-indigo-200'
                      : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {isCoWork ? (
                    <Sparkles className="w-4 h-4 text-indigo-600" />
                  ) : (
                    <Terminal className="w-4 h-4 text-emerald-600" />
                  )}
                </div>

                {/* Bubble Container */}
                <div
                  className={`max-w-xl rounded-xl p-4 border text-sm ${
                    isCoWork
                      ? 'bg-slate-50/80 border-slate-200 text-slate-900 rounded-tl-none'
                      : 'bg-emerald-50/50 border-emerald-200/80 text-slate-900 rounded-tr-none'
                  }`}
                >
                  {/* Message Meta Header */}
                  <div className="flex items-center justify-between gap-4 text-xs text-slate-500 mb-1.5">
                    <span className="font-semibold text-slate-900">
                      {msg.author || (isCoWork ? 'Claude / CoWork' : 'Claude Code')}
                    </span>
                    <div className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      <span>{new Date(msg.created_at).toLocaleTimeString()}</span>
                      <span aria-hidden="true">·</span>
                      <span>ID: {msg.id}</span>
                    </div>
                  </div>

                  {/* Body */}
                  <p className="whitespace-pre-wrap leading-relaxed text-slate-800 text-xs">
                    {msg.text}
                  </p>

                  {/* Read / Fetch Status Indicators */}
                  <div className="mt-3 pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-400 font-mono">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1">
                        <CheckCheck
                          className={`w-3.5 h-3.5 ${
                            msg.seen_by_box_at ? 'text-emerald-600' : 'text-slate-300'
                          }`}
                        />
                        <span>
                          {msg.seen_by_box_at
                            ? `Fetched by Terminal (${new Date(
                                msg.seen_by_box_at
                              ).toLocaleTimeString()})`
                            : 'Unseen by Terminal'}
                        </span>
                      </span>

                      <span aria-hidden="true">·</span>

                      <span className="flex items-center gap-1">
                        <CheckCheck
                          className={`w-3.5 h-3.5 ${
                            msg.fetched_by_chat_at ? 'text-indigo-600' : 'text-slate-300'
                          }`}
                        />
                        <span>
                          {msg.fetched_by_chat_at
                            ? `Fetched by CoWork (${new Date(
                                msg.fetched_by_chat_at
                              ).toLocaleTimeString()})`
                            : 'Unseen by CoWork'}
                        </span>
                      </span>
                    </div>

                    <span className="text-[10px] text-slate-400">Append-Only</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Composer Area */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs shrink-0">
        {error && (
          <div className="mb-3 p-2.5 rounded-lg bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-3">
          {/* Controls bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-500 font-medium">Post as:</span>
              <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                <button
                  type="button"
                  onClick={() => handleSideChange('chat')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    side === 'chat'
                      ? 'bg-white text-indigo-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Claude / CoWork (chat)
                </button>
                <button
                  type="button"
                  onClick={() => handleSideChange('box')}
                  className={`px-3 py-1 rounded-md font-medium transition-colors ${
                    side === 'box'
                      ? 'bg-white text-emerald-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Claude Code (box)
                </button>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Author Label"
                value={author}
                onChange={(e) => setAuthor(e.target.value)}
                className="px-2.5 py-1 text-xs border border-slate-200 rounded-md focus:outline-none focus:border-indigo-600 w-44"
              />
            </div>
          </div>

          {/* Text Area */}
          <div className="relative">
            <textarea
              rows={3}
              required
              maxLength={2000}
              placeholder={
                side === 'chat'
                  ? 'Ask Claude Code to perform a task, inspect files, or report status...'
                  : 'Report task completion, test results, or status back to CoWork...'
              }
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="w-full p-3 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 resize-none"
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-[11px] text-slate-400 font-mono">
                {inputText.length} / 2000 characters · Markdown supported
              </span>
              <button
                type="submit"
                disabled={isSending || !inputText.trim()}
                className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs disabled:opacity-50"
              >
                <Send className="w-3.5 h-3.5" />
                <span>{isSending ? 'Posting...' : 'Post Message'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
