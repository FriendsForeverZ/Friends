/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { CommunityCluster } from '../types/graph';
import { Zap, Filter, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface FilterToolbarProps {
  clusters: CommunityCluster[];
  allInterests: string[];
  activeClusterId: string | null;
  activeInterest: string | null;
  bridgesOnly: boolean;
  minStrength: number;
  onSelectCluster: (clusterId: string | null) => void;
  onSelectInterest: (interest: string | null) => void;
  onToggleBridgesOnly: () => void;
  onChangeMinStrength: (strength: number) => void;
  onResetFilters: () => void;
}

export const FilterToolbar: React.FC<FilterToolbarProps> = ({
  clusters,
  allInterests,
  activeClusterId,
  activeInterest,
  bridgesOnly,
  minStrength,
  onSelectCluster,
  onSelectInterest,
  onToggleBridgesOnly,
  onChangeMinStrength,
  onResetFilters,
}) => {
  const isAnyFilterActive = Boolean(
    activeClusterId || activeInterest || bridgesOnly || minStrength > 1
  );

  return (
    <div className="relative z-30 px-4 md:px-6 py-2.5 bg-[#0A0D15]/80 backdrop-blur-md border-b border-slate-800/60 overflow-x-auto no-scrollbar">
      <div className="flex items-center gap-3 min-w-max text-xs">
        {/* Cluster / Community Selector */}
        <div className="flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800/80 rounded-xl">
          <button
            onClick={() => onSelectCluster(null)}
            className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
              activeClusterId === null
                ? 'bg-slate-800 text-white shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Все круги
          </button>

          {clusters.map(cluster => {
            const isActive = activeClusterId === cluster.id;
            return (
              <button
                key={cluster.id}
                onClick={() => onSelectCluster(isActive ? null : cluster.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-medium transition-all ${
                  isActive
                    ? 'bg-slate-800 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: cluster.color }}
                />
                <span>{cluster.name}</span>
                <span className="text-[10px] text-slate-500 font-mono">({cluster.nodeCount})</span>
              </button>
            );
          })}
        </div>

        {/* Bridges Only Toggle */}
        <button
          onClick={onToggleBridgesOnly}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl font-medium border transition-all ${
            bridgesOnly
              ? 'bg-pink-950/50 border-pink-500/60 text-pink-300 shadow-lg shadow-pink-500/10'
              : 'bg-slate-900/90 border-slate-800/80 text-slate-400 hover:text-slate-200 hover:border-slate-700'
          }`}
          title="Показать только друзей, объединяющих разные группы"
        >
          <Zap className={`w-3.5 h-3.5 ${bridgesOnly ? 'text-pink-400 fill-pink-400' : 'text-slate-500'}`} />
          <span>Связующие звенья</span>
        </button>

        {/* Min Connection Strength */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-slate-900/90 border border-slate-800/80 rounded-xl text-slate-400">
          <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
          <span className="text-slate-400">Связь от:</span>
          <div className="flex items-center gap-1">
            {[1, 3, 4].map(val => (
              <button
                key={val}
                onClick={() => onChangeMinStrength(minStrength === val ? 1 : val)}
                className={`px-1.5 py-0.5 rounded text-[11px] font-mono transition-colors ${
                  minStrength === val
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                    : 'hover:text-white text-slate-400'
                }`}
              >
                {val === 1 ? 'Все' : `${val}★+`}
              </button>
            ))}
          </div>
        </div>

        {/* Top Interests / Tags */}
        <div className="flex items-center gap-1 overflow-x-auto">
          {allInterests.slice(0, 7).map(tag => {
            const isActive = activeInterest === tag;
            return (
              <button
                key={tag}
                onClick={() => onSelectInterest(isActive ? null : tag)}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition-colors ${
                  isActive
                    ? 'bg-cyan-950/60 border border-cyan-500/50 text-cyan-300'
                    : 'bg-slate-900/60 border border-slate-800/60 text-slate-400 hover:text-slate-200'
                }`}
              >
                #{tag}
              </button>
            );
          })}
        </div>

        {/* Reset button if any filter active */}
        {isAnyFilterActive && (
          <button
            onClick={onResetFilters}
            className="flex items-center gap-1 px-2.5 py-1 text-slate-400 hover:text-rose-400 transition-colors ml-auto"
            title="Сбросить все фильтры"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Сброс</span>
          </button>
        )}
      </div>
    </div>
  );
};
