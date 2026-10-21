/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  getDocs,
  writeBatch,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from './config';
import { FriendEdge, FriendNode, GraphDataset, AdminCredentials } from '../types/graph';
import { INITIAL_NODES, INITIAL_EDGES, INITIAL_DATASET } from '../data/initialGraph';
import { getSourceId, getTargetId } from '../utils/communityDetection';

// Helper to sanitize node before writing to Firestore (strip d3 runtime properties)
function sanitizeNodeForFirestore(node: FriendNode): Record<string, any> {
  const clean: Record<string, any> = {
    id: node.id,
    name: node.name,
    handle: node.handle,
    interests: node.interests || [],
  };
  if (node.avatarUrl) clean.avatarUrl = node.avatarUrl;
  if (node.bio) clean.bio = node.bio;
  if (node.customClusterId) clean.customClusterId = node.customClusterId;
  return clean;
}

// Helper to sanitize edge before writing to Firestore
function sanitizeEdgeForFirestore(edge: FriendEdge): Record<string, any> {
  const clean: Record<string, any> = {
    id: edge.id,
    source: getSourceId(edge),
    target: getTargetId(edge),
    strength: Number(edge.strength || 3),
  };
  if (edge.relationshipType) clean.relationshipType = edge.relationshipType;
  if (edge.mutualChatsPerWeek !== undefined) clean.mutualChatsPerWeek = Number(edge.mutualChatsPerWeek);
  return clean;
}

/**
 * Initializes Firestore with the default friend dataset if collections are empty.
 */
export async function seedFirestoreIfEmpty(): Promise<void> {
  const friendsRef = collection(db, 'friends');
  try {
    const snapshot = await getDocs(friendsRef);
    if (snapshot.empty) {
      console.log('Seeding initial friend graph into Firestore...');
      const batch = writeBatch(db);

      // Seed Nodes
      INITIAL_NODES.forEach(node => {
        const ref = doc(db, 'friends', node.id);
        batch.set(ref, sanitizeNodeForFirestore(node));
      });

      // Seed Edges
      INITIAL_EDGES.forEach(edge => {
        const ref = doc(db, 'connections', edge.id);
        batch.set(ref, sanitizeEdgeForFirestore(edge));
      });

      // Seed Settings
      const settingsRef = doc(db, 'settings', 'global');
      batch.set(settingsRef, {
        customClusterNames: INITIAL_DATASET.customClusterNames || {},
        adminCredentials: INITIAL_DATASET.adminCredentials || {
          secretUsername: 'admin',
          secretPasscode: 'secretfriends',
        },
        updatedAt: new Date().toISOString(),
      });

      await batch.commit();
      console.log('Seeding completed successfully!');
    }
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, 'friends');
  }
}

/**
 * Real-time listener for friends, connections, and graph settings.
 */
export function subscribeToGraphData(
  onUpdate: (data: {
    nodes: FriendNode[];
    edges: FriendEdge[];
    customClusterNames: Record<string, string>;
    adminCredentials?: AdminCredentials;
  }) => void
): () => void {
  let currentNodes: FriendNode[] = [];
  let currentEdges: FriendEdge[] = [];
  let currentClusterNames: Record<string, string> = {};
  let currentCredentials: AdminCredentials | undefined = undefined;

  let nodesLoaded = false;
  let edgesLoaded = false;
  let settingsLoaded = false;

  const emitIfReady = () => {
    if (nodesLoaded && edgesLoaded && settingsLoaded) {
      onUpdate({
        nodes: currentNodes,
        edges: currentEdges,
        customClusterNames: currentClusterNames,
        adminCredentials: currentCredentials,
      });
    }
  };

  // 1. Listen to friends
  const unsubFriends = onSnapshot(
    collection(db, 'friends'),
    snapshot => {
      currentNodes = snapshot.docs.map(d => d.data() as FriendNode);
      nodesLoaded = true;
      emitIfReady();
    },
    err => {
      handleFirestoreError(err, OperationType.GET, 'friends');
    }
  );

  // 2. Listen to connections
  const unsubConnections = onSnapshot(
    collection(db, 'connections'),
    snapshot => {
      currentEdges = snapshot.docs.map(d => d.data() as FriendEdge);
      edgesLoaded = true;
      emitIfReady();
    },
    err => {
      handleFirestoreError(err, OperationType.GET, 'connections');
    }
  );

  // 3. Listen to settings
  const unsubSettings = onSnapshot(
    collection(db, 'settings'),
    snapshot => {
      const globalDoc = snapshot.docs.find(d => d.id === 'global');
      if (globalDoc) {
        const data = globalDoc.data();
        if (data.customClusterNames) currentClusterNames = data.customClusterNames;
        if (data.adminCredentials) currentCredentials = data.adminCredentials;
      }
      settingsLoaded = true;
      emitIfReady();
    },
    err => {
      handleFirestoreError(err, OperationType.GET, 'settings');
    }
  );

  return () => {
    unsubFriends();
    unsubConnections();
    unsubSettings();
  };
}

/**
 * Add or update friend in Firestore
 */
export async function saveFriendDoc(node: FriendNode): Promise<void> {
  const path = `friends/${node.id}`;
  try {
    const ref = doc(db, 'friends', node.id);
    await setDoc(ref, sanitizeNodeForFirestore(node));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete friend and all attached connections from Firestore
 */
export async function deleteFriendDoc(nodeId: string): Promise<void> {
  const path = `friends/${nodeId}`;
  try {
    const batch = writeBatch(db);
    batch.delete(doc(db, 'friends', nodeId));

    // Also remove connected edges
    const edgesSnapshot = await getDocs(collection(db, 'connections'));
    edgesSnapshot.forEach(d => {
      const edgeData = d.data();
      if (edgeData.source === nodeId || edgeData.target === nodeId) {
        batch.delete(d.ref);
      }
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Add or update edge connection in Firestore
 */
export async function saveConnectionDoc(edge: FriendEdge): Promise<void> {
  const path = `connections/${edge.id}`;
  try {
    const ref = doc(db, 'connections', edge.id);
    await setDoc(ref, sanitizeEdgeForFirestore(edge));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete edge connection from Firestore
 */
export async function deleteConnectionDoc(edgeId: string): Promise<void> {
  const path = `connections/${edgeId}`;
  try {
    await deleteDoc(doc(db, 'connections', edgeId));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, path);
  }
}

/**
 * Update custom cluster names in Firestore settings
 */
export async function updateClusterNamesDoc(clusterNames: Record<string, string>): Promise<void> {
  const path = 'settings/global';
  try {
    const ref = doc(db, 'settings', 'global');
    await setDoc(ref, { customClusterNames: clusterNames, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Update editor credentials in Firestore settings
 */
export async function updateCredentialsDoc(credentials: AdminCredentials): Promise<void> {
  const path = 'settings/global';
  try {
    const ref = doc(db, 'settings', 'global');
    await setDoc(ref, { adminCredentials: credentials, updatedAt: new Date().toISOString() }, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, path);
  }
}

/**
 * Delete all connections from Firestore
 */
export async function clearAllConnectionsInFirestore(): Promise<void> {
  try {
    const snapshot = await getDocs(collection(db, 'connections'));
    const batch = writeBatch(db);
    snapshot.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'connections');
  }
}

/**
 * Delete all friends and connections from Firestore
 */
export async function clearAllFriendsInFirestore(): Promise<void> {
  try {
    const batch = writeBatch(db);
    const friendsSnap = await getDocs(collection(db, 'friends'));
    const edgesSnap = await getDocs(collection(db, 'connections'));
    friendsSnap.forEach(d => batch.delete(d.ref));
    edgesSnap.forEach(d => batch.delete(d.ref));
    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, 'friends');
  }
}

/**
 * Reset Firestore to default preset dataset
 */
export async function resetFirestoreToDefault(): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Clear old docs
    const oldFriends = await getDocs(collection(db, 'friends'));
    const oldEdges = await getDocs(collection(db, 'connections'));
    oldFriends.forEach(d => batch.delete(d.ref));
    oldEdges.forEach(d => batch.delete(d.ref));

    // Seed new
    INITIAL_NODES.forEach(node => {
      const ref = doc(db, 'friends', node.id);
      batch.set(ref, sanitizeNodeForFirestore(node));
    });

    INITIAL_EDGES.forEach(edge => {
      const ref = doc(db, 'connections', edge.id);
      batch.set(ref, sanitizeEdgeForFirestore(edge));
    });

    const settingsRef = doc(db, 'settings', 'global');
    batch.set(settingsRef, {
      customClusterNames: INITIAL_DATASET.customClusterNames || {},
      adminCredentials: INITIAL_DATASET.adminCredentials || {
        secretUsername: 'admin',
        secretPasscode: 'secretfriends',
      },
      updatedAt: new Date().toISOString(),
    });

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'reset');
  }
}

/**
 * Bulk import dataset into Firestore
 */
export async function importDatasetToFirestore(dataset: GraphDataset): Promise<void> {
  try {
    const batch = writeBatch(db);

    // Delete existing
    const oldFriends = await getDocs(collection(db, 'friends'));
    const oldEdges = await getDocs(collection(db, 'connections'));
    oldFriends.forEach(d => batch.delete(d.ref));
    oldEdges.forEach(d => batch.delete(d.ref));

    // Write imported nodes
    dataset.nodes.forEach(node => {
      const ref = doc(db, 'friends', node.id);
      batch.set(ref, sanitizeNodeForFirestore(node));
    });

    // Write imported edges
    dataset.edges.forEach(edge => {
      const ref = doc(db, 'connections', edge.id);
      batch.set(ref, sanitizeEdgeForFirestore(edge));
    });

    // Write settings
    if (dataset.customClusterNames || dataset.adminCredentials) {
      const settingsRef = doc(db, 'settings', 'global');
      batch.set(
        settingsRef,
        {
          customClusterNames: dataset.customClusterNames || {},
          adminCredentials: dataset.adminCredentials || {
            secretUsername: 'admin',
            secretPasscode: 'secretfriends',
          },
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      );
    }

    await batch.commit();
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, 'import');
  }
}
