/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Search, Lock, Unlock, Shield, Network, Zap, Users } from 'lucide-react';
import { FriendNode } from '../types/graph';

interface TopNavProps {
  totalFriends: number;
  totalConnections: number;
  bridgeCount: number;
  isAdminUnlocked: boolean;
  isCloudConnected?: boolean;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onSelectFriendFromSearch: (friend: FriendNode) => void;
  onOpenAdmin: () => void;
  filteredFriendsList: FriendNode[];
}

export const TopNav: React.FC<TopNavProps> = ({
  totalFriends,
  totalConnections,
  bridgeCount,
  isAdminUnlocked,
  isCloudConnected,
  searchQuery,
  onSearchChange,
  onSelectFriendFromSearch,
  onOpenAdmin,
  filteredFriendsList,
}) => {
  const [showSearchDropdown, setShowSearchDropdown] = React.useState(false);

  return (
    <header className="relative z-40 flex items-center justify-between gap-4 md:gap-8 px-4 md:px-6 py-3 bg-[#08090E]/90 backdrop-blur-md border-b border-slate-800/80">
      {/* Zone 1: Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-cyan-500 via-pink-500 to-amber-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
          <Network className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-extrabold tracking-tight text-white whitespace-nowrap font-display">
          FriendAtlas
        </span>
        <span className="hidden lg:inline text-xs text-slate-500 border-l border-slate-800 pl-3">
          Карта связей и кругов общения
        </span>
      </div>

      {/* Zone 2: Search & Quick Metas */}
      <div className="flex-1 max-w-md relative">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => {
              onSearchChange(e.target.value);
              setShowSearchDropdown(true);
            }}
            onFocus={() => setShowSearchDropdown(true)}
            onBlur={() => setTimeout(() => setShowSearchDropdown(false), 200)}
            placeholder="Найти друга по имени, нику или тегу..."
            className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-900/80 text-white placeholder-slate-500 border border-slate-800 rounded-xl focus:outline-none focus:border-cyan-500 transition-colors"
          />
        </div>

        {/* Search Results Dropdown */}
        {showSearchDropdown && searchQuery.trim() && (
          <div className="absolute top-full left-0 right-0 mt-1.5 bg-[#0F1420] border border-slate-800 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-50 p-1.5 space-y-1">
            {filteredFriendsList.length > 0 ? (
              filteredFriendsList.map(friend => (
                <div
                  key={friend.id}
                  onClick={() => {
                    onSelectFriendFromSearch(friend);
                    setShowSearchDropdown(false);
                  }}
                  className="flex items-center justify-between p-2 hover:bg-slate-800/70 rounded-lg cursor-pointer transition-colors"
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    {friend.avatarUrl ? (
                      <img
                        src={friend.avatarUrl}
                        alt={friend.name}
                        referrerPolicy="no-referrer"
                        className="w-7 h-7 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-7 h-7 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white">
                        {friend.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-white truncate">{friend.name}</div>
                      <div className="text-[11px] text-cyan-400 truncate">{friend.handle}</div>
                    </div>
                  </div>

                  {friend.isBridge && (
                    <span className="text-[10px] px-1.5 py-0.5 bg-pink-500/20 text-pink-400 rounded-md font-semibold shrink-0">
                      Мост
                    </span>
                  )}
                </div>
              ))
            ) : (
              <div className="p-3 text-center text-xs text-slate-500">
                Друг не найден
              </div>
            )}
          </div>
        )}
      </div>

      {/* Zone 3: Stats & Secret Admin Trigger */}
      <div className="flex items-center gap-3 shrink-0">
        {/* Quick telemetry stats */}
        <div className="hidden sm:flex items-center gap-3 text-xs text-slate-400 border-r border-slate-800/80 pr-4">
          <div className="flex items-center gap-1.5" title="Всего друзей в графе">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span className="font-mono text-white font-medium">{totalFriends}</span>
          </div>
          <div className="flex items-center gap-1.5" title="Связующие звенья (мосты между группами)">
            <Zap className="w-3.5 h-3.5 text-pink-400" />
            <span className="font-mono text-pink-300 font-medium">{bridgeCount}</span>
            <span className="text-[10px] text-slate-500">мостов</span>
          </div>
          {isCloudConnected && (
            <div className="flex items-center gap-1 text-[11px] text-cyan-400" title="База данных Firestore подключена в реальном времени">
              <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-sm shadow-cyan-400/80 animate-pulse" />
              <span>Облако</span>
            </div>
          )}
        </div>

        {/* Editor Button (formerly secret access) */}
        <button
          onClick={onOpenAdmin}
          className={`flex items-center gap-2 px-3 py-1.5 text-xs font-medium rounded-xl border transition-all cursor-pointer ${
            isAdminUnlocked
              ? 'bg-cyan-950/50 border-cyan-500/50 text-cyan-300 hover:bg-cyan-900/60 shadow-sm shadow-cyan-500/10'
              : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:border-slate-700'
          }`}
          title="Редактор графа (Ctrl+Shift+A)"
        >
          {isAdminUnlocked ? (
            <>
              <Unlock className="w-3.5 h-3.5 text-cyan-400" />
              <span>Редактор</span>
            </>
          ) : (
            <>
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              <span>Редактор</span>
            </>
          )}
        </button>
      </div>
    </header>
  );
};
