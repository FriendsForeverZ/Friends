/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface BridgeClusterInfo {
  clusterId: string;
  clusterName: string;
  color: string;
  count: number;
  percentage: number;
}

export interface FriendNode {
  id: string;
  name: string;
  handle: string;
  avatarUrl?: string;
  interests: string[];
  bio?: string;
  customClusterId?: string;
  
  // Computed runtime properties
  clusterId?: string;
  clusterName?: string;
  clusterColor?: string;
  degree?: number;
  weightedDegree?: number;
  radius?: number;
  isBridge?: boolean;
  bridgeClusters?: BridgeClusterInfo[];
  
  // Simulation physics coordinates
  x?: number;
  y?: number;
  vx?: number;
  vy?: number;
  fx?: number | null;
  fy?: number | null;
}

export interface FriendEdge {
  id: string;
  source: string | FriendNode;
  target: string | FriendNode;
  strength: number; // 1 to 5
  relationshipType?: string; // e.g. "Катают вместе в CS2", "Лучшие друзья"
  mutualChatsPerWeek?: number;
}

export interface CommunityCluster {
  id: string;
  name: string;
  color: string;
  glowColor: string;
  nodeCount: number;
  topInterests: string[];
}

export interface AdminCredentials {
  secretUsername: string;
  secretPasscode: string;
}

export interface GraphDataset {
  nodes: FriendNode[];
  edges: FriendEdge[];
  customClusterNames?: Record<string, string>;
  adminCredentials?: AdminCredentials;
}
