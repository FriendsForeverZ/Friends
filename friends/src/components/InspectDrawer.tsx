/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FriendEdge, FriendNode } from '../types/graph';
import { getSourceId, getTargetId } from '../utils/communityDetection';
import { X, Zap, Heart, MessageSquare, ArrowUpRight, Flame, UserCheck, Trash2 } from 'lucide-react';

interface InspectDrawerProps {
  node: FriendNode | null;
  allNodes: FriendNode[];
  allEdges: FriendEdge[];
  onClose: () => void;
  onSelectNode: (node: FriendNode) => void;
  onOpenAdminToEdit?: (nodeId: string) => void;
  onDeleteNode?: (nodeId: string) => void;
}

export const InspectDrawer: React.FC<InspectDrawerProps> = ({
  node,
  allNodes,
  allEdges,
  onClose,
  onSelectNode,
  onOpenAdminToEdit,
  onDeleteNode,
}) => {
  if (!node) return null;

  // Find all direct connections
  const connectedFriends: {
    friend: FriendNode;
    edge: FriendEdge;
    strength: number;
    relationText?: string;
  }[] = [];

  allEdges.forEach(edge => {
    const sId = getSourceId(edge);
    const tId = getTargetId(edge);
    if (sId === node.id) {
      const targetFriend = allNodes.find(n => n.id === tId);
      if (targetFriend) {
        connectedFriends.push({
          friend: targetFriend,
          edge,
          strength: edge.strength,
          relationText: edge.relationshipType,
        });
      }
    } else if (tId === node.id) {
      const sourceFriend = allNodes.find(n => n.id === sId);
      if (sourceFriend) {
        connectedFriends.push({
          friend: sourceFriend,
          edge,
          strength: edge.strength,
          relationText: edge.relationshipType,
        });
      }
    }
  });

  // Sort by friendship strength descending
  connectedFriends.sort((a, b) => b.strength - a.strength);

  return (
    <aside className="fixed top-18 right-4 bottom-4 w-96 max-w-[calc(100vw-2rem)] bg-[#0D111A]/95 backdrop-blur-xl border border-slate-800/80 rounded-2xl shadow-2xl flex flex-col z-30 overflow-hidden transition-all duration-300">
      {/* Header with Close */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div className="flex items-center gap-2">
          <span
            className="w-2.5 h-2.5 rounded-full"
            style={{ backgroundColor: node.clusterColor || '#00F0FF' }}
          />
          <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
            {node.clusterName || 'Круг общения'}
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
          title="Закрыть"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Scrollable Body */}
      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        {/* Profile Card */}
        <div className="flex items-start gap-4">
          <div className="relative shrink-0">
            {node.avatarUrl ? (
              <img
                src={node.avatarUrl}
                alt={node.name}
                referrerPolicy="no-referrer"
                className="w-18 h-18 rounded-2xl object-cover border-2 shadow-lg"
                style={{ borderColor: node.clusterColor || '#00F0FF' }}
              />
            ) : (
              <div
                className="w-18 h-18 rounded-2xl flex items-center justify-center text-white text-xl font-bold border-2 shadow-lg"
                style={{
                  backgroundColor: '#1E293B',
                  borderColor: node.clusterColor || '#00F0FF',
                }}
              >
                {node.name.slice(0, 2).toUpperCase()}
              </div>
            )}
            {node.isBridge && (
              <div
                className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 bg-[#FF007A] text-white text-[10px] font-bold rounded-md shadow-md flex items-center gap-0.5"
                title="Связующее звено между группами"
              >
                <Zap className="w-2.5 h-2.5" />
                <span>МОСТ</span>
              </div>
            )}
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-lg font-bold text-white truncate font-display">{node.name}</h3>
            <p className="text-xs font-medium text-cyan-400 truncate">{node.handle}</p>
            {node.bio && (
              <p className="text-xs text-slate-400 mt-1.5 line-clamp-2 leading-relaxed">{node.bio}</p>
            )}
          </div>
        </div>

        {/* BRIDGE CONNECTOR HIGHLIGHT */}
        {node.isBridge && node.bridgeClusters && node.bridgeClusters.length >= 2 && (
          <div className="p-3.5 bg-gradient-to-br from-pink-950/40 via-purple-950/30 to-cyan-950/40 border border-pink-500/30 rounded-xl space-y-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-pink-300">
              <Zap className="w-4 h-4 text-pink-400" />
              <span>Связующее звено (Bridge)</span>
            </div>
            <p className="text-[11px] text-slate-300 leading-normal">
              Этот человек активно объединяет несколько отдельных компаний друзей!
            </p>

            {/* Distribution Bar */}
            <div className="space-y-1 pt-1">
              <div className="h-2 w-full bg-slate-900 rounded-full overflow-hidden flex">
                {node.bridgeClusters.map((bc, idx) => (
                  <div
                    key={idx}
                    style={{
                      width: `${bc.percentage}%`,
                      backgroundColor: bc.color,
                    }}
                    title={`${bc.clusterName}: ${bc.percentage}%`}
                  />
                ))}
              </div>
              <div className="flex flex-wrap items-center justify-between gap-1 text-[10px] text-slate-400">
                {node.bridgeClusters.map((bc, idx) => (
                  <span key={idx} className="flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bc.color }} />
                    <span className="truncate max-w-[110px]">{bc.clusterName}</span>
                    <span className="font-mono text-slate-200">({bc.percentage}%)</span>
                  </span>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Strip */}
        <div className="grid grid-cols-2 gap-2.5">
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400">Связей с друзьями</div>
            <div className="text-xl font-bold text-white font-mono mt-0.5 tabular-nums">
              {node.degree || 0}
            </div>
          </div>
          <div className="p-3 bg-slate-900/60 border border-slate-800/80 rounded-xl">
            <div className="text-[11px] text-slate-400">Индекс близости</div>
            <div className="text-xl font-bold text-cyan-400 font-mono mt-0.5 tabular-nums">
              {node.weightedDegree || 0}★
            </div>
          </div>
        </div>

        {/* Interests / Tags */}
        {node.interests && node.interests.length > 0 && (
          <div>
            <div className="text-xs font-semibold text-slate-400 mb-2">Интересы и темы</div>
            <div className="flex flex-wrap gap-1.5">
              {node.interests.map((tag, idx) => (
                <span
                  key={idx}
                  className="px-2.5 py-1 text-xs bg-slate-800/70 border border-slate-700/50 text-slate-200 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Connections List */}
        <div>
          <div className="flex items-center justify-between text-xs font-semibold text-slate-400 mb-2.5">
            <span>Круг общения ({connectedFriends.length})</span>
            <span className="text-[10px] text-slate-500 font-mono">по силе связи</span>
          </div>

          <div className="space-y-2">
            {connectedFriends.map(({ friend, strength, relationText }) => (
              <div
                key={friend.id}
                onClick={() => onSelectNode(friend)}
                className="group flex items-center justify-between p-2.5 bg-slate-900/50 hover:bg-slate-800/60 border border-slate-800/60 hover:border-slate-700/80 rounded-xl cursor-pointer transition-colors"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {friend.avatarUrl ? (
                    <img
                      src={friend.avatarUrl}
                      alt={friend.name}
                      referrerPolicy="no-referrer"
                      className="w-9 h-9 rounded-xl object-cover shrink-0 border border-slate-700"
                    />
                  ) : (
                    <div className="w-9 h-9 rounded-xl bg-slate-800 flex items-center justify-center text-xs font-bold text-white shrink-0 border border-slate-700">
                      {friend.name.slice(0, 2).toUpperCase()}
                    </div>
                  )}

                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-white truncate">{friend.name}</span>
                      {friend.isBridge && (
                        <span className="text-[9px] px-1 py-0.2 bg-pink-500/20 text-pink-400 rounded font-semibold shrink-0">
                          Мост
                        </span>
                      )}
                    </div>
                    {relationText ? (
                      <p className="text-[11px] text-slate-400 truncate">{relationText}</p>
                    ) : (
                      <p className="text-[11px] text-cyan-400/80 truncate">{friend.handle}</p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-xs font-mono font-medium text-amber-400 flex items-center gap-0.5">
                    {strength}★
                  </span>
                  <ArrowUpRight className="w-3.5 h-3.5 text-slate-500 group-hover:text-white transition-colors" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Footer action */}
      {(onOpenAdminToEdit || onDeleteNode) && (
        <div className="p-4 border-t border-slate-800/60 bg-[#0A0E17] flex items-center gap-2">
          {onOpenAdminToEdit && (
            <button
              onClick={() => onOpenAdminToEdit(node.id)}
              className="flex-1 py-2 px-3 text-xs font-medium text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <UserCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>Редактировать</span>
            </button>
          )}
          {onDeleteNode && (
            <button
              onClick={() => {
                if (confirm(`Удалить друга ${node.name} и все его связи из графа?`)) {
                  onDeleteNode(node.id);
                  onClose();
                }
              }}
              className="py-2 px-3 text-xs font-medium text-rose-400 hover:text-rose-300 bg-rose-950/30 hover:bg-rose-900/40 border border-rose-800/40 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              title="Удалить друга"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Удалить</span>
            </button>
          )}
        </div>
      )}
    </aside>
  );
};
