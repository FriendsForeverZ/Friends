/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { FriendEdge, FriendNode, GraphDataset, AdminCredentials } from './types/graph';
import { INITIAL_DATASET } from './data/initialGraph';
import { analyzeNetworkGraph } from './utils/communityDetection';
import { NetworkCanvas } from './components/NetworkCanvas';
import { TopNav } from './components/TopNav';
import { FilterToolbar } from './components/FilterToolbar';
import { InspectDrawer } from './components/InspectDrawer';
import { AdminModal } from './components/AdminModal';
import {
  seedFirestoreIfEmpty,
  subscribeToGraphData,
  saveFriendDoc,
  deleteFriendDoc,
  saveConnectionDoc,
  deleteConnectionDoc,
  updateClusterNamesDoc,
  updateCredentialsDoc,
  clearAllConnectionsInFirestore,
  clearAllFriendsInFirestore,
  resetFirestoreToDefault,
  importDatasetToFirestore,
} from './firebase/service';

const STORAGE_KEY = 'friend_atlas_graph_dataset_v2';

export default function App() {
  // Load initial dataset from localStorage or fallback to rich initial dataset
  const [dataset, setDataset] = useState<GraphDataset>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.nodes && parsed.edges) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to parse localStorage dataset:', e);
    }
    return INITIAL_DATASET;
  });

  const [isCloudConnected, setIsCloudConnected] = useState(false);

  // Sync with Firestore: Seed if empty, and subscribe to real-time updates
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const setupFirestore = async () => {
      try {
        await seedFirestoreIfEmpty();
        unsubscribe = subscribeToGraphData(cloudData => {
          if (cloudData.nodes.length > 0 || cloudData.edges.length > 0) {
            setDataset({
              nodes: cloudData.nodes,
              edges: cloudData.edges,
              customClusterNames: cloudData.customClusterNames,
              adminCredentials: cloudData.adminCredentials || INITIAL_DATASET.adminCredentials,
            });
          }
          setIsCloudConnected(true);
        });
      } catch (err) {
        console.warn('Firestore subscription fallback to local cache:', err);
      }
    };

    setupFirestore();

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Save changes to localStorage cache
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(dataset));
    } catch (e) {
      console.warn('Failed to save dataset to localStorage:', e);
    }
  }, [dataset]);

  // UI Interactive States
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Filters
  const [activeClusterId, setActiveClusterId] = useState<string | null>(null);
  const [activeInterest, setActiveInterest] = useState<string | null>(null);
  const [bridgesOnly, setBridgesOnly] = useState(false);
  const [minStrength, setMinStrength] = useState(1);

  // Admin / Editor Modal States
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [isAdminUnlocked, setIsAdminUnlocked] = useState(false);
  const [adminEditNodeId, setAdminEditNodeId] = useState<string | null>(null);

  // Keyboard shortcut listener: Ctrl+Shift+A or Cmd+Shift+A opens Editor modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'A' || e.key === 'a' || e.key === 'Ф' || e.key === 'ф')) {
        e.preventDefault();
        setIsAdminModalOpen(prev => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Run graph analytics & community clustering
  const { processedNodes, clusters, bridgeCount } = useMemo(() => {
    return analyzeNetworkGraph(dataset.nodes, dataset.edges, dataset.customClusterNames);
  }, [dataset.nodes, dataset.edges, dataset.customClusterNames]);

  // Selected Node Object
  const selectedNode = useMemo(() => {
    if (!selectedNodeId) return null;
    return processedNodes.find(n => n.id === selectedNodeId) || null;
  }, [selectedNodeId, processedNodes]);

  // All distinct interests/tags collected from friends
  const allInterests = useMemo(() => {
    const tagSet = new Set<string>();
    dataset.nodes.forEach(n => {
      n.interests?.forEach(t => tagSet.add(t));
    });
    return Array.from(tagSet);
  }, [dataset.nodes]);

  // Friends matching search query
  const filteredFriendsList = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase().trim();
    return processedNodes.filter(
      n =>
        n.name.toLowerCase().includes(q) ||
        n.handle.toLowerCase().includes(q) ||
        n.interests?.some(tag => tag.toLowerCase().includes(q))
    );
  }, [searchQuery, processedNodes]);

  // Node selection handler
  const handleSelectNode = useCallback((node: FriendNode | null) => {
    setSelectedNodeId(node ? node.id : null);
  }, []);

  // Node hover handler
  const handleHoverNode = useCallback((node: FriendNode | null) => {
    setHoveredNodeId(node ? node.id : null);
  }, []);

  // Filter reset handler
  const handleResetFilters = useCallback(() => {
    setActiveClusterId(null);
    setActiveInterest(null);
    setBridgesOnly(false);
    setMinStrength(1);
    setSearchQuery('');
  }, []);

  // Node Operations: Save / Update / Delete
  const handleAddNode = useCallback((newNode: FriendNode) => {
    setDataset(prev => ({
      ...prev,
      nodes: [newNode, ...prev.nodes],
    }));
    saveFriendDoc(newNode).catch(console.error);
  }, []);

  const handleUpdateNode = useCallback((updatedNode: FriendNode) => {
    setDataset(prev => ({
      ...prev,
      nodes: prev.nodes.map(n => (n.id === updatedNode.id ? updatedNode : n)),
    }));
    saveFriendDoc(updatedNode).catch(console.error);
  }, []);

  const handleDeleteNode = useCallback(
    (nodeId: string) => {
      setDataset(prev => ({
        ...prev,
        nodes: prev.nodes.filter(n => n.id !== nodeId),
        edges: prev.edges.filter(
          e =>
            (typeof e.source === 'string' ? e.source : e.source.id) !== nodeId &&
            (typeof e.target === 'string' ? e.target : e.target.id) !== nodeId
        ),
      }));
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      deleteFriendDoc(nodeId).catch(console.error);
    },
    [selectedNodeId]
  );

  // Edge Operations: Save / Delete
  const handleAddEdge = useCallback((newEdge: FriendEdge) => {
    setDataset(prev => ({
      ...prev,
      edges: [...prev.edges, newEdge],
    }));
    saveConnectionDoc(newEdge).catch(console.error);
  }, []);

  const handleDeleteEdge = useCallback((edgeId: string) => {
    setDataset(prev => ({
      ...prev,
      edges: prev.edges.filter(e => e.id !== edgeId),
    }));
    deleteConnectionDoc(edgeId).catch(console.error);
  }, []);

  // Bulk deletion operations
  const handleClearAllConnections = useCallback(() => {
    setDataset(prev => ({
      ...prev,
      edges: [],
    }));
    clearAllConnectionsInFirestore().catch(console.error);
  }, []);

  const handleClearAllFriends = useCallback(() => {
    setDataset(prev => ({
      ...prev,
      nodes: [],
      edges: [],
    }));
    setSelectedNodeId(null);
    clearAllFriendsInFirestore().catch(console.error);
  }, []);

  // Cluster Customization
  const handleUpdateClusterName = useCallback(
    (clusterId: string, name: string) => {
      const updatedNames = {
        ...(dataset.customClusterNames || {}),
        [clusterId]: name,
      };
      setDataset(prev => ({
        ...prev,
        customClusterNames: updatedNames,
      }));
      updateClusterNamesDoc(updatedNames).catch(console.error);
    },
    [dataset.customClusterNames]
  );

  // Force re-clustering
  const handleRunAutoClustering = useCallback(() => {
    setDataset(prev => {
      const updatedNodes = prev.nodes.map(n => ({
        ...n,
        customClusterId: undefined,
      }));
      updatedNodes.forEach(node => {
        saveFriendDoc(node).catch(console.error);
      });
      return {
        ...prev,
        nodes: updatedNodes,
      };
    });
  }, []);

  // Editor Credentials Update
  const handleUpdateCredentials = useCallback((newCreds: AdminCredentials) => {
    setDataset(prev => ({
      ...prev,
      adminCredentials: newCreds,
    }));
    updateCredentialsDoc(newCreds).catch(console.error);
  }, []);

  // Export dataset to JSON file
  const handleExportDataset = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(dataset, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `friends_network_graph_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [dataset]);

  // Import dataset from JSON
  const handleImportDataset = useCallback((imported: GraphDataset) => {
    setDataset(imported);
    setSelectedNodeId(null);
    importDatasetToFirestore(imported).catch(console.error);
  }, []);

  // Reset to initial preset
  const handleResetToDefault = useCallback(() => {
    setDataset(INITIAL_DATASET);
    setSelectedNodeId(null);
    resetFirestoreToDefault().catch(console.error);
  }, []);

  // Open editor to edit specific node
  const handleOpenAdminToEdit = useCallback((nodeId: string) => {
    setAdminEditNodeId(nodeId);
    setIsAdminModalOpen(true);
  }, []);

  return (
    <div className="relative w-screen h-screen flex flex-col bg-[#08090E] text-slate-100 overflow-hidden font-sans">
      {/* Top Navigation */}
      <TopNav
        totalFriends={dataset.nodes.length}
        totalConnections={dataset.edges.length}
        bridgeCount={bridgeCount}
        isAdminUnlocked={isAdminUnlocked}
        isCloudConnected={isCloudConnected}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onSelectFriendFromSearch={friend => {
          setSelectedNodeId(friend.id);
          setSearchQuery('');
        }}
        onOpenAdmin={() => {
          setAdminEditNodeId(null);
          setIsAdminModalOpen(true);
        }}
        filteredFriendsList={filteredFriendsList}
      />

      {/* Filter Toolbar */}
      <FilterToolbar
        clusters={clusters}
        allInterests={allInterests}
        activeClusterId={activeClusterId}
        activeInterest={activeInterest}
        bridgesOnly={bridgesOnly}
        minStrength={minStrength}
        onSelectCluster={setActiveClusterId}
        onSelectInterest={setActiveInterest}
        onToggleBridgesOnly={() => setBridgesOnly(prev => !prev)}
        onChangeMinStrength={setMinStrength}
        onResetFilters={handleResetFilters}
      />

      {/* Interactive Network Graph Canvas */}
      <main className="relative flex-1 w-full h-full overflow-hidden">
        <NetworkCanvas
          nodes={processedNodes}
          edges={dataset.edges}
          selectedNodeId={selectedNodeId}
          hoveredNodeId={hoveredNodeId}
          activeClusterFilter={activeClusterId}
          activeInterestFilter={activeInterest}
          bridgesOnlyFilter={bridgesOnly}
          minStrengthFilter={minStrength}
          onSelectNode={handleSelectNode}
          onHoverNode={handleHoverNode}
        />

        {/* Selected Friend Profile Drawer */}
        <InspectDrawer
          node={selectedNode}
          allNodes={processedNodes}
          allEdges={dataset.edges}
          onClose={() => setSelectedNodeId(null)}
          onSelectNode={friend => setSelectedNodeId(friend.id)}
          onOpenAdminToEdit={isAdminUnlocked ? handleOpenAdminToEdit : undefined}
          onDeleteNode={isAdminUnlocked ? handleDeleteNode : undefined}
        />
      </main>

      {/* Editor Management Modal */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => {
          setIsAdminModalOpen(false);
          setAdminEditNodeId(null);
        }}
        isAdminUnlocked={isAdminUnlocked}
        onUnlockAdmin={setIsAdminUnlocked}
        credentials={dataset.adminCredentials || INITIAL_DATASET.adminCredentials!}
        onUpdateCredentials={handleUpdateCredentials}
        nodes={dataset.nodes}
        edges={dataset.edges}
        clusters={clusters}
        customClusterNames={dataset.customClusterNames || {}}
        onAddNode={handleAddNode}
        onUpdateNode={handleUpdateNode}
        onDeleteNode={handleDeleteNode}
        onAddEdge={handleAddEdge}
        onDeleteEdge={handleDeleteEdge}
        onClearAllConnections={handleClearAllConnections}
        onClearAllFriends={handleClearAllFriends}
        onUpdateClusterName={handleUpdateClusterName}
        onRunAutoClustering={handleRunAutoClustering}
        onExportDataset={handleExportDataset}
        onImportDataset={handleImportDataset}
        onResetToDefault={handleResetToDefault}
        initialEditNodeId={adminEditNodeId}
      />
    </div>
  );
}
