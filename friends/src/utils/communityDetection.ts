/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { FriendEdge, FriendNode, CommunityCluster, BridgeClusterInfo } from '../types/graph';

export const CLUSTER_PALETTES = [
  { id: 'c1', defaultName: 'Discord & Streamers', color: '#00F0FF', glow: 'rgba(0, 240, 255, 0.45)' },
  { id: 'c2', defaultName: 'CS2 & Cyber Squad', color: '#FF007A', glow: 'rgba(255, 0, 122, 0.45)' },
  { id: 'c3', defaultName: 'IRL Night Owls', color: '#10E775', glow: 'rgba(16, 231, 117, 0.45)' },
  { id: 'c4', defaultName: 'Tech & Code Gang', color: '#FFB800', glow: 'rgba(255, 184, 0, 0.45)' },
  { id: 'c5', defaultName: 'Music & Creative', color: '#9D4EDD', glow: 'rgba(157, 78, 221, 0.45)' },
  { id: 'c6', defaultName: 'Chill & Anime Pals', color: '#FF5400', glow: 'rgba(255, 84, 0, 0.45)' },
];

export function getSourceId(edge: FriendEdge): string {
  if (typeof edge.source === 'object' && edge.source !== null) {
    return (edge.source as FriendNode).id;
  }
  return String(edge.source);
}

export function getTargetId(edge: FriendEdge): string {
  if (typeof edge.target === 'object' && edge.target !== null) {
    return (edge.target as FriendNode).id;
  }
  return String(edge.target);
}

/**
 * Computes network metrics: degrees, dynamic clusters, bridge node status, and visual radii.
 */
export function analyzeNetworkGraph(
  rawNodes: FriendNode[],
  rawEdges: FriendEdge[],
  customClusterNames: Record<string, string> = {}
): {
  processedNodes: FriendNode[];
  clusters: CommunityCluster[];
  bridgeCount: number;
} {
  const nodeMap = new Map<string, FriendNode>();
  const adjacency = new Map<string, Map<string, number>>();

  // Initialize adjacency map
  rawNodes.forEach(node => {
    nodeMap.set(node.id, { ...node });
    adjacency.set(node.id, new Map<string, number>());
  });

  // Populate adjacency with weights
  rawEdges.forEach(edge => {
    const sId = getSourceId(edge);
    const tId = getTargetId(edge);
    const weight = Math.max(1, edge.strength || 1);

    if (adjacency.has(sId) && adjacency.has(tId) && sId !== tId) {
      adjacency.get(sId)!.set(tId, weight);
      adjacency.get(tId)!.set(sId, weight);
    }
  });

  // Calculate degrees and weighted degrees
  rawNodes.forEach(node => {
    const neighbors = adjacency.get(node.id);
    const degree = neighbors ? neighbors.size : 0;
    let weightedDegree = 0;
    if (neighbors) {
      neighbors.forEach(w => {
        weightedDegree += w;
      });
    }

    const targetNode = nodeMap.get(node.id)!;
    targetNode.degree = degree;
    targetNode.weightedDegree = weightedDegree;

    // Radius calculation based on degree and weight: scales dynamically
    targetNode.radius = Math.round(
      Math.min(68, Math.max(22, 22 + Math.sqrt(degree) * 6 + weightedDegree * 0.7))
    );
  });

  // Community detection: Label Propagation Algorithm with weighted influences
  // If customClusterId is set manually on a node, that serves as a strong prior
  const labels = new Map<string, string>();
  rawNodes.forEach((node, idx) => {
    if (node.customClusterId) {
      labels.set(node.id, node.customClusterId);
    } else {
      labels.set(node.id, `c${(idx % CLUSTER_PALETTES.length) + 1}`);
    }
  });

  // Run iterations of weighted label propagation
  const maxIterations = 8;
  const nodeIds = Array.from(nodeMap.keys());

  for (let iter = 0; iter < maxIterations; iter++) {
    let changed = false;
    // Shuffle node processing order for convergence
    const shuffled = [...nodeIds].sort(() => Math.random() - 0.5);

    for (const u of shuffled) {
      const uNode = nodeMap.get(u);
      if (uNode?.customClusterId) continue; // Respect manual overrides

      const neighbors = adjacency.get(u);
      if (!neighbors || neighbors.size === 0) continue;

      const clusterWeights = new Map<string, number>();
      neighbors.forEach((weight, v) => {
        const vCluster = labels.get(v) || 'c1';
        clusterWeights.set(vCluster, (clusterWeights.get(vCluster) || 0) + weight);
      });

      // Find cluster with highest weight
      let bestCluster = labels.get(u) || 'c1';
      let maxW = -1;
      clusterWeights.forEach((w, cId) => {
        if (w > maxW) {
          maxW = w;
          bestCluster = cId;
        }
      });

      if (bestCluster !== labels.get(u)) {
        labels.set(u, bestCluster);
        changed = true;
      }
    }

    if (!changed) break;
  }

  // Group and assign colors to clusters
  const clusterCounts = new Map<string, number>();
  labels.forEach(cId => {
    clusterCounts.set(cId, (clusterCounts.get(cId) || 0) + 1);
  });

  // Map cluster IDs to palettes
  const clusterMap = new Map<string, CommunityCluster>();
  const activeClusterIds = Array.from(clusterCounts.keys());

  activeClusterIds.forEach((cId, idx) => {
    const palette = CLUSTER_PALETTES.find(p => p.id === cId) || CLUSTER_PALETTES[idx % CLUSTER_PALETTES.length];
    const customName = customClusterNames[cId];
    clusterMap.set(cId, {
      id: cId,
      name: customName || palette.defaultName,
      color: palette.color,
      glowColor: palette.glow,
      nodeCount: clusterCounts.get(cId) || 0,
      topInterests: [],
    });
  });

  // Assign cluster attributes to nodes
  rawNodes.forEach(node => {
    const targetNode = nodeMap.get(node.id)!;
    const cId = labels.get(node.id) || 'c1';
    const cluster = clusterMap.get(cId) || {
      id: cId,
      name: `Группа ${cId}`,
      color: '#00F0FF',
      glowColor: 'rgba(0, 240, 255, 0.45)',
      nodeCount: 1,
      topInterests: [],
    };

    targetNode.clusterId = cId;
    targetNode.clusterName = cluster.name;
    targetNode.clusterColor = cluster.color;
  });

  // Calculate top interests per cluster
  clusterMap.forEach((cluster, cId) => {
    const tagCount = new Map<string, number>();
    nodeMap.forEach(node => {
      if (node.clusterId === cId && node.interests) {
        node.interests.forEach(tag => {
          tagCount.set(tag, (tagCount.get(tag) || 0) + 1);
        });
      }
    });
    cluster.topInterests = Array.from(tagCount.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(entry => entry[0]);
  });

  // BRIDGE NODE DETECTION ("Связующее звено")
  // A node is a bridge if its connections span multiple clusters with balanced weight
  let bridgeCount = 0;

  nodeMap.forEach(node => {
    const neighbors = adjacency.get(node.id);
    if (!neighbors || neighbors.size < 2) {
      node.isBridge = false;
      return;
    }

    // Tally neighbor clusters
    const clusterNeighborCounts = new Map<string, number>();
    const clusterNeighborWeights = new Map<string, number>();
    let totalNeighborWeight = 0;

    neighbors.forEach((weight, neighborId) => {
      const neighbor = nodeMap.get(neighborId);
      if (!neighbor) return;
      const nClusterId = neighbor.clusterId || 'c1';

      clusterNeighborCounts.set(nClusterId, (clusterNeighborCounts.get(nClusterId) || 0) + 1);
      clusterNeighborWeights.set(nClusterId, (clusterNeighborWeights.get(nClusterId) || 0) + weight);
      totalNeighborWeight += weight;
    });

    const activeClustersForNode = Array.from(clusterNeighborCounts.entries());

    // If connected to at least 2 distinct clusters, and the secondary cluster has significant presence
    if (activeClustersForNode.length >= 2) {
      // Sort clusters by weight descending
      const sortedByWeight = activeClustersForNode
        .map(([cId, count]) => {
          const w = clusterNeighborWeights.get(cId) || 0;
          const clusterObj = clusterMap.get(cId);
          return {
            clusterId: cId,
            clusterName: clusterObj?.name || `Группа ${cId}`,
            color: clusterObj?.color || '#00F0FF',
            count,
            percentage: Math.round((w / (totalNeighborWeight || 1)) * 100),
          };
        })
        .sort((a, b) => b.percentage - a.percentage);

      const topCluster = sortedByWeight[0];
      const secondCluster = sortedByWeight[1];

      // Bridge criteria:
      // Either top cluster is not overwhelming (< 75%) and second cluster has >= 25% or >= 2 friends
      // Or node connects 3+ distinct clusters
      const isQualifyingBridge =
        (secondCluster && secondCluster.percentage >= 22 && secondCluster.count >= 1) ||
        (activeClustersForNode.length >= 3 && sortedByWeight.length >= 3);

      if (isQualifyingBridge) {
        node.isBridge = true;
        node.bridgeClusters = sortedByWeight;
        bridgeCount++;
      } else {
        node.isBridge = false;
        node.bridgeClusters = undefined;
      }
    } else {
      node.isBridge = false;
      node.bridgeClusters = undefined;
    }
  });

  return {
    processedNodes: Array.from(nodeMap.values()),
    clusters: Array.from(clusterMap.values()),
    bridgeCount,
  };
}
