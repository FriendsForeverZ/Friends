/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import confetti from 'canvas-confetti';
import {
  AdminCredentials,
  CommunityCluster,
  FriendEdge,
  FriendNode,
  GraphDataset,
} from '../types/graph';
import { getSourceId, getTargetId } from '../utils/communityDetection';
import {
  X,
  Lock,
  Unlock,
  UserPlus,
  Link2,
  Cpu,
  Download,
  Upload,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  KeyRound,
  RefreshCw,
  AlertCircle,
  HelpCircle,
} from 'lucide-react';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  isAdminUnlocked: boolean;
  onUnlockAdmin: (success: boolean) => void;
  credentials: AdminCredentials;
  onUpdateCredentials: (newCreds: AdminCredentials) => void;
  nodes: FriendNode[];
  edges: FriendEdge[];
  clusters: CommunityCluster[];
  customClusterNames: Record<string, string>;
  onAddNode: (newNode: FriendNode) => void;
  onUpdateNode: (updatedNode: FriendNode) => void;
  onDeleteNode: (nodeId: string) => void;
  onAddEdge: (newEdge: FriendEdge) => void;
  onDeleteEdge: (edgeId: string) => void;
  onClearAllConnections?: () => void;
  onClearAllFriends?: () => void;
  onUpdateClusterName: (clusterId: string, name: string) => void;
  onRunAutoClustering: () => void;
  onExportDataset: () => void;
  onImportDataset: (dataset: GraphDataset) => void;
  onResetToDefault: () => void;
  initialEditNodeId?: string | null;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  isAdminUnlocked,
  onUnlockAdmin,
  credentials,
  onUpdateCredentials,
  nodes,
  edges,
  clusters,
  customClusterNames,
  onAddNode,
  onUpdateNode,
  onDeleteNode,
  onAddEdge,
  onDeleteEdge,
  onClearAllConnections,
  onClearAllFriends,
  onUpdateClusterName,
  onRunAutoClustering,
  onExportDataset,
  onImportDataset,
  onResetToDefault,
  initialEditNodeId,
}) => {
  const [activeTab, setActiveTab] = useState<'friends' | 'connections' | 'clustering' | 'backup'>(
    'friends'
  );

  // Login form state
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [showHint, setShowHint] = useState(false);

  // New Friend Form State
  const [editingNodeId, setEditingNodeId] = useState<string | null>(initialEditNodeId || null);
  const [nodeName, setNodeName] = useState('');
  const [nodeHandle, setNodeHandle] = useState('');
  const [nodeAvatarUrl, setNodeAvatarUrl] = useState('');
  const [nodeBio, setNodeBio] = useState('');
  const [nodeInterests, setNodeInterests] = useState('');
  const [nodeCustomCluster, setNodeCustomCluster] = useState('');

  // New Edge Form State
  const [edgeSourceId, setEdgeSourceId] = useState('');
  const [edgeTargetId, setEdgeTargetId] = useState('');
  const [edgeStrength, setEdgeStrength] = useState(4);
  const [edgeRelationText, setEdgeRelationText] = useState('Общаются и играют вместе');

  // Change password state
  const [newUsername, setNewUsername] = useState(credentials.secretUsername);
  const [newPassword, setNewPassword] = useState(credentials.secretPasscode);
  const [credsSaved, setCredsSaved] = useState(false);

  // JSON Import ref
  const fileInputRef = React.useRef<HTMLInputElement | null>(null);

  // Sync initialEditNodeId if passed
  React.useEffect(() => {
    if (initialEditNodeId) {
      const nodeToEdit = nodes.find(n => n.id === initialEditNodeId);
      if (nodeToEdit) {
        setEditingNodeId(nodeToEdit.id);
        setNodeName(nodeToEdit.name);
        setNodeHandle(nodeToEdit.handle);
        setNodeAvatarUrl(nodeToEdit.avatarUrl || '');
        setNodeBio(nodeToEdit.bio || '');
        setNodeInterests(nodeToEdit.interests?.join(', ') || '');
        setNodeCustomCluster(nodeToEdit.customClusterId || '');
        setActiveTab('friends');
      }
    }
  }, [initialEditNodeId, nodes]);

  if (!isOpen) return null;

  // Handle Login
  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      loginUsername.trim().toLowerCase() === credentials.secretUsername.toLowerCase() &&
      loginPassword.trim() === credentials.secretPasscode
    ) {
      onUnlockAdmin(true);
      setLoginError(false);
      confetti({ particleCount: 50, spread: 60, origin: { y: 0.6 } });
    } else {
      setLoginError(true);
    }
  };

  // Reset node form
  const resetNodeForm = () => {
    setEditingNodeId(null);
    setNodeName('');
    setNodeHandle('');
    setNodeAvatarUrl('');
    setNodeBio('');
    setNodeInterests('');
    setNodeCustomCluster('');
  };

  // Save Node (Create or Update)
  const handleSaveNode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nodeName.trim()) return;

    const parsedInterests = nodeInterests
      .split(',')
      .map(t => t.trim())
      .filter(Boolean);

    const generatedId = editingNodeId || `friend_${Date.now()}`;
    const handleValue = nodeHandle.trim().startsWith('@')
      ? nodeHandle.trim()
      : `@${nodeHandle.trim() || generatedId}`;

    const friendData: FriendNode = {
      id: generatedId,
      name: nodeName.trim(),
      handle: handleValue,
      avatarUrl: nodeAvatarUrl.trim() || undefined,
      bio: nodeBio.trim() || undefined,
      interests: parsedInterests,
      customClusterId: nodeCustomCluster || undefined,
    };

    if (editingNodeId) {
      onUpdateNode(friendData);
    } else {
      onAddNode(friendData);
      confetti({ particleCount: 40, spread: 50 });
    }

    resetNodeForm();
  };

  // Populate form to edit node
  const startEditNode = (node: FriendNode) => {
    setEditingNodeId(node.id);
    setNodeName(node.name);
    setNodeHandle(node.handle);
    setNodeAvatarUrl(node.avatarUrl || '');
    setNodeBio(node.bio || '');
    setNodeInterests(node.interests?.join(', ') || '');
    setNodeCustomCluster(node.customClusterId || '');
  };

  // Save Edge
  const handleSaveEdge = (e: React.FormEvent) => {
    e.preventDefault();
    if (!edgeSourceId || !edgeTargetId || edgeSourceId === edgeTargetId) return;

    const newEdge: FriendEdge = {
      id: `e_${edgeSourceId}_${edgeTargetId}_${Date.now()}`,
      source: edgeSourceId,
      target: edgeTargetId,
      strength: edgeStrength,
      relationshipType: edgeRelationText.trim() || 'Общение в одной компании',
      mutualChatsPerWeek: edgeStrength * 3,
    };

    onAddEdge(newEdge);
    confetti({ particleCount: 30, spread: 45 });
    setEdgeSourceId('');
    setEdgeTargetId('');
    setEdgeRelationText('Общаются и играют вместе');
  };

  // Save new credentials
  const handleSaveCreds = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUsername.trim() || !newPassword.trim()) return;
    onUpdateCredentials({
      secretUsername: newUsername.trim(),
      secretPasscode: newPassword.trim(),
    });
    setCredsSaved(true);
    setTimeout(() => setCredsSaved(false), 2500);
  };

  // Handle JSON file upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = evt => {
      try {
        const parsed = JSON.parse(evt.target?.result as string);
        if (parsed.nodes && Array.isArray(parsed.nodes)) {
          onImportDataset(parsed);
          confetti({ particleCount: 60, spread: 70 });
        } else {
          alert('Ошибка: файл не содержит валидную структуру графа friends.');
        }
      } catch (err) {
        alert('Ошибка при чтении JSON файла.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="w-full max-w-3xl bg-[#0D111A] border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800/80 bg-[#090C14]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              {isAdminUnlocked ? <Unlock className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
            </div>
            <div>
              <h2 className="text-base font-bold text-white font-display">
                Редактор Графа
              </h2>
              <p className="text-xs text-slate-400">
                {isAdminUnlocked
                  ? 'Управление друзьями, связями, удаление и авто-кластеризация'
                  : 'Введите пароль для открытия редактора'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* LOCKED STATE: LOGIN PROMPT */}
        {!isAdminUnlocked ? (
          <div className="p-8 max-w-md mx-auto w-full my-auto text-center">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mx-auto mb-4 text-cyan-400 shadow-inner">
              <KeyRound className="w-8 h-8" />
            </div>

            <h3 className="text-lg font-bold text-white mb-1">Вход в Редактор</h3>
            <p className="text-xs text-slate-400 mb-6">
              Введите логин и пароль для добавления, редактирования и удаления друзей
            </p>

            <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Логин редактора
                </label>
                <input
                  type="text"
                  value={loginUsername}
                  onChange={e => setLoginUsername(e.target.value)}
                  placeholder="admin"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Пароль редактора
                </label>
                <input
                  type="password"
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  placeholder="••••••••••••"
                  required
                  className="w-full px-3.5 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              {loginError && (
                <div className="flex items-center gap-2 p-2.5 bg-rose-950/40 border border-rose-500/40 rounded-xl text-xs text-rose-300">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Неверный логин или пароль!</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-white text-xs font-semibold rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
              >
                Открыть редактор
              </button>

              <div className="pt-2 text-center">
                <button
                  type="button"
                  onClick={() => setShowHint(!showHint)}
                  className="text-[11px] text-slate-500 hover:text-slate-400 transition-colors inline-flex items-center gap-1"
                >
                  <HelpCircle className="w-3 h-3" />
                  <span>Подсказка по умолчанию</span>
                </button>
                {showHint && (
                  <p className="mt-2 text-[11px] text-cyan-400/90 bg-cyan-950/30 p-2 rounded-lg border border-cyan-800/40">
                    Логин по умолчанию: <strong className="text-white">admin</strong> / Пароль:{' '}
                    <strong className="text-white">secretfriends</strong>
                  </p>
                )}
              </div>
            </form>
          </div>
        ) : (
          /* UNLOCKED STATE: ADMIN WORKSPACE */
          <>
            {/* Tabs Bar */}
            <div className="flex items-center border-b border-slate-800/80 bg-[#090C14] px-6 gap-2 overflow-x-auto">
              <button
                onClick={() => setActiveTab('friends')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'friends'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Друзья ({nodes.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('connections')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'connections'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>Связи ({edges.length})</span>
              </button>

              <button
                onClick={() => setActiveTab('clustering')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'clustering'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Cpu className="w-3.5 h-3.5" />
                <span>Авто-Кластеры</span>
              </button>

              <button
                onClick={() => setActiveTab('backup')}
                className={`flex items-center gap-2 py-3 px-3 text-xs font-semibold border-b-2 transition-colors ${
                  activeTab === 'backup'
                    ? 'border-cyan-400 text-cyan-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Download className="w-3.5 h-3.5" />
                <span>Экспорт / Пароль</span>
              </button>
            </div>

            {/* Tab Contents */}
            <div className="flex-1 overflow-y-auto p-6">
              {/* TAB 1: FRIENDS CRUD */}
              {activeTab === 'friends' && (
                <div className="space-y-6">
                  {/* Friend Form */}
                  <form
                    onSubmit={handleSaveNode}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                        <UserPlus className="w-4 h-4 text-cyan-400" />
                        <span>{editingNodeId ? 'Редактировать друга' : 'Добавить друга в граф'}</span>
                      </h4>
                      {editingNodeId && (
                        <button
                          type="button"
                          onClick={resetNodeForm}
                          className="text-xs text-slate-400 hover:text-white"
                        >
                          Отмена редактирования
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Имя друга *
                        </label>
                        <input
                          type="text"
                          value={nodeName}
                          onChange={e => setNodeName(e.target.value)}
                          placeholder="Илья Мэддисон"
                          required
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Никнейм / Handle (@...)
                        </label>
                        <input
                          type="text"
                          value={nodeHandle}
                          onChange={e => setNodeHandle(e.target.value)}
                          placeholder="@maddyson"
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Ссылка на аватарку (Web Image URL)
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="url"
                          value={nodeAvatarUrl}
                          onChange={e => setNodeAvatarUrl(e.target.value)}
                          placeholder="https://images.unsplash.com/... или ссылка на фото"
                          className="flex-1 px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                        {/* Live Avatar Preview */}
                        <div className="w-8 h-8 rounded-lg bg-slate-800 border border-slate-700 overflow-hidden shrink-0 flex items-center justify-center">
                          {nodeAvatarUrl ? (
                            <img
                              src={nodeAvatarUrl}
                              alt="Превью"
                              referrerPolicy="no-referrer"
                              className="w-full h-full object-cover"
                              onError={e => {
                                (e.target as HTMLElement).style.display = 'none';
                              }}
                            />
                          ) : (
                            <span className="text-[10px] text-slate-500">нет</span>
                          )}
                        </div>
                      </div>
                      <p className="text-[10px] text-slate-500 mt-1">
                        Картинки не занимают место на сервере — загружаются напрямую по веб-ссылке.
                      </p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Интересы и теги (необязательно)
                        </label>
                        <input
                          type="text"
                          value={nodeInterests}
                          onChange={e => setNodeInterests(e.target.value)}
                          placeholder="CS2, Мемы, Музыка, Качалка"
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Закрепить за группой (необязательно)
                        </label>
                        <select
                          value={nodeCustomCluster}
                          onChange={e => setNodeCustomCluster(e.target.value)}
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Автоматически определять алгоритмом</option>
                          {clusters.map(c => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                        Короткая заметка / био
                      </label>
                      <input
                        type="text"
                        value={nodeBio}
                        onChange={e => setNodeBio(e.target.value)}
                        placeholder="Всегда готов залететь на ночной стрим"
                        className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                      />
                    </div>

                    <button
                      type="submit"
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      {editingNodeId ? 'Сохранить изменения' : 'Добавить друга в граф'}
                    </button>
                  </form>

                  {/* List of current friends */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Список друзей ({nodes.length})
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
                      {nodes.map(node => (
                        <div
                          key={node.id}
                          className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            {node.avatarUrl ? (
                              <img
                                src={node.avatarUrl}
                                alt={node.name}
                                referrerPolicy="no-referrer"
                                className="w-8 h-8 rounded-lg object-cover border border-slate-700"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-lg bg-slate-800 flex items-center justify-center text-xs font-bold text-white border border-slate-700">
                                {node.name.slice(0, 2).toUpperCase()}
                              </div>
                            )}
                            <div className="min-w-0">
                              <div className="text-xs font-semibold text-white truncate flex items-center gap-1">
                                <span>{node.name}</span>
                                {node.isBridge && (
                                  <span className="text-[9px] px-1 bg-pink-500/20 text-pink-400 rounded">
                                    мост
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-cyan-400 truncate">{node.handle}</div>
                            </div>
                          </div>

                          <div className="flex items-center gap-1 shrink-0">
                            <button
                              onClick={() => startEditNode(node)}
                              className="p-1.5 text-slate-400 hover:text-cyan-400 rounded transition-colors"
                              title="Редактировать"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`Удалить друга ${node.name}? Все связи тоже удалятся.`)) {
                                  onDeleteNode(node.id);
                                }
                              }}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Удалить"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: CONNECTIONS CRUD */}
              {activeTab === 'connections' && (
                <div className="space-y-6">
                  {/* Add Connection Form */}
                  <form
                    onSubmit={handleSaveEdge}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
                  >
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                      <Link2 className="w-4 h-4 text-cyan-400" />
                      <span>Создать связь между друзьями</span>
                    </h4>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Первый друг *
                        </label>
                        <select
                          value={edgeSourceId}
                          onChange={e => setEdgeSourceId(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Выберите друга...</option>
                          {nodes.map(n => (
                            <option key={n.id} value={n.id}>
                              {n.name} ({n.handle})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Второй друг *
                        </label>
                        <select
                          value={edgeTargetId}
                          onChange={e => setEdgeTargetId(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                        >
                          <option value="">Выберите друга...</option>
                          {nodes
                            .filter(n => n.id !== edgeSourceId)
                            .map(n => (
                              <option key={n.id} value={n.id}>
                                {n.name} ({n.handle})
                              </option>
                            ))}
                        </select>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Сила общения: <span className="text-cyan-400 font-mono">{edgeStrength}★</span>
                        </label>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="1"
                          value={edgeStrength}
                          onChange={e => setEdgeStrength(Number(e.target.value))}
                          className="w-full accent-cyan-400"
                        />
                        <div className="flex justify-between text-[10px] text-slate-500 mt-1">
                          <span>1 (Знакомые)</span>
                          <span>3 (Регулярно)</span>
                          <span>5 (Лучшие кенты)</span>
                        </div>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Контекст связи (что делают вместе)
                        </label>
                        <input
                          type="text"
                          value={edgeRelationText}
                          onChange={e => setEdgeRelationText(e.target.value)}
                          placeholder="Катают в CS2, учились в одном универе"
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={!edgeSourceId || !edgeTargetId}
                      className="py-2 px-4 bg-cyan-500 hover:bg-cyan-400 disabled:opacity-40 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                    >
                      Соединить друзей
                    </button>
                  </form>

                  {/* List of Edges */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Существующие связи ({edges.length})
                    </h4>
                    <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                      {edges.map(edge => {
                        const sId = getSourceId(edge);
                        const tId = getTargetId(edge);
                        const sNode = nodes.find(n => n.id === sId);
                        const tNode = nodes.find(n => n.id === tId);

                        return (
                          <div
                            key={edge.id}
                            className="flex items-center justify-between p-2.5 bg-slate-900/60 border border-slate-800 rounded-xl"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-xs font-semibold text-white">
                                {sNode?.name || sId}
                              </span>
                              <span className="text-slate-500">↔</span>
                              <span className="text-xs font-semibold text-white">
                                {tNode?.name || tId}
                              </span>
                              <span className="text-xs font-mono text-cyan-400 ml-1">
                                {edge.strength}★
                              </span>
                              {edge.relationshipType && (
                                <span className="text-[11px] text-slate-400 ml-2 hidden sm:inline truncate max-w-xs">
                                  ({edge.relationshipType})
                                </span>
                              )}
                            </div>

                            <button
                              onClick={() => onDeleteEdge(edge.id)}
                              className="p-1.5 text-slate-400 hover:text-rose-400 rounded transition-colors"
                              title="Удалить связь"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 3: AUTO-CLUSTERING & BRIDGES */}
              {activeTab === 'clustering' && (
                <div className="space-y-6">
                  <div className="p-4 bg-gradient-to-r from-purple-950/30 via-slate-900 to-cyan-950/30 border border-purple-500/30 rounded-xl space-y-3">
                    <div className="flex items-center gap-2 text-white font-bold text-sm">
                      <Sparkles className="w-4 h-4 text-cyan-400" />
                      <span>Умный алгоритм кластеризации сообществ</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed">
                      Алгоритм Label Propagation анализирует плотность взаимного общения и общих
                      друзей. Те, кто общается теснее всего, автоматически объединяются в круги. А те,
                      кто имеет сильные связи сразу с несколькими кругами, выделяются как{' '}
                      <strong className="text-pink-400">Связующие звенья (Мосты)</strong> с
                      анимированным переливающимся свечением!
                    </p>
                    <button
                      onClick={() => {
                        onRunAutoClustering();
                        confetti({ particleCount: 50, spread: 60 });
                      }}
                      className="py-2.5 px-4 bg-gradient-to-r from-purple-500 to-cyan-500 hover:from-purple-400 hover:to-cyan-400 text-white font-bold text-xs rounded-xl shadow-lg transition-all cursor-pointer flex items-center gap-2"
                    >
                      <RefreshCw className="w-4 h-4" />
                      <span>Пересчитать кластеры и мосты сейчас</span>
                    </button>
                  </div>

                  {/* Clusters List & Name Customization */}
                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
                      Названия кругов общения ({clusters.length})
                    </h4>
                    <div className="space-y-3">
                      {clusters.map(cluster => (
                        <div
                          key={cluster.id}
                          className="flex items-center gap-3 p-3 bg-slate-900/60 border border-slate-800 rounded-xl"
                        >
                          <span
                            className="w-4 h-4 rounded-full shrink-0 shadow-sm"
                            style={{ backgroundColor: cluster.color }}
                          />
                          <div className="flex-1">
                            <input
                              type="text"
                              value={customClusterNames[cluster.id] ?? cluster.name}
                              onChange={e => onUpdateClusterName(cluster.id, e.target.value)}
                              placeholder={`Название группы ${cluster.id}`}
                              className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-cyan-500"
                            />
                          </div>
                          <div className="text-xs text-slate-400 font-mono shrink-0">
                            {cluster.nodeCount} чел.
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: BACKUP, EXPORT & PASSWORD */}
              {activeTab === 'backup' && (
                <div className="space-y-6">
                  {/* Export & Import */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Download className="w-4 h-4 text-cyan-400" />
                        <span>Экспорт графа</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Скачать резервную копию со всеми друзьями, связями и настройками в файл JSON.
                      </p>
                      <button
                        onClick={onExportDataset}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span>Скачать friends_graph.json</span>
                      </button>
                    </div>

                    <div className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-2">
                      <div className="flex items-center gap-2 text-white font-bold text-xs">
                        <Upload className="w-4 h-4 text-emerald-400" />
                        <span>Импорт графа</span>
                      </div>
                      <p className="text-[11px] text-slate-400">
                        Загрузить граф из файла JSON, сохраненного ранее.
                      </p>
                      <input
                        type="file"
                        ref={fileInputRef}
                        accept=".json"
                        onChange={handleFileUpload}
                        className="hidden"
                      />
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-white text-xs font-medium rounded-lg transition-colors cursor-pointer flex items-center justify-center gap-2"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        <span>Выбрать JSON файл</span>
                      </button>
                    </div>
                  </div>

                  {/* Change Admin Password */}
                  <form
                    onSubmit={handleSaveCreds}
                    className="p-4 bg-slate-900/60 border border-slate-800 rounded-xl space-y-4"
                  >
                    <div className="flex items-center gap-2 text-white font-bold text-xs">
                      <KeyRound className="w-4 h-4 text-amber-400" />
                      <span>Изменить секретный логин и пароль</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Новый секретный никнейм
                        </label>
                        <input
                          type="text"
                          value={newUsername}
                          onChange={e => setNewUsername(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-slate-300 mb-1">
                          Новый секретный пароль
                        </label>
                        <input
                          type="text"
                          value={newPassword}
                          onChange={e => setNewPassword(e.target.value)}
                          required
                          className="w-full px-3 py-1.5 text-xs bg-slate-900 border border-slate-800 rounded-lg text-white focus:outline-none focus:border-amber-400"
                        />
                      </div>
                    </div>

                    <div className="flex items-center gap-3">
                      <button
                        type="submit"
                        className="py-2 px-4 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-lg transition-colors cursor-pointer"
                      >
                        Сохранить новые реквизиты
                      </button>
                      {credsSaved && (
                        <span className="text-xs text-emerald-400 flex items-center gap-1">
                          <Check className="w-3.5 h-3.5" />
                          <span>Пароль успешно обновлен!</span>
                        </span>
                      )}
                    </div>
                  </form>

                  {/* Danger Zone: Clean & Reset */}
                  <div className="pt-3 border-t border-slate-800 space-y-2">
                    <h5 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                      Управление данными и удаление
                    </h5>
                    <div className="flex flex-wrap items-center gap-3">
                      <button
                        onClick={() => {
                          if (confirm('Удалить ВСЕ связи между друзьями? Друзья останутся на графе.')) {
                            if (onClearAllConnections) {
                              onClearAllConnections();
                            } else {
                              edges.forEach(e => onDeleteEdge(e.id));
                            }
                          }
                        }}
                        className="py-1.5 px-3 bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-white text-xs rounded-lg transition-colors cursor-pointer border border-slate-700/60"
                      >
                        Очистить все связи ({edges.length})
                      </button>
                      <button
                        onClick={() => {
                          if (confirm('ВНИМАНИЕ: Удалить всех друзей и связи? Граф станет полностью пустым.')) {
                            if (onClearAllFriends) {
                              onClearAllFriends();
                            } else {
                              nodes.forEach(n => onDeleteNode(n.id));
                            }
                          }
                        }}
                        className="py-1.5 px-3 bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 hover:text-rose-200 text-xs rounded-lg transition-colors cursor-pointer border border-rose-800/40"
                      >
                        Удалить всех друзей ({nodes.length})
                      </button>
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              'Вы уверены, что хотите сбросить граф к начальному набору друзей? Все ваши изменения будут перезаписаны.'
                            )
                          ) {
                            onResetToDefault();
                            confetti({ particleCount: 40 });
                          }
                        }}
                        className="py-1.5 px-3 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-slate-200 text-xs rounded-lg transition-colors cursor-pointer border border-slate-800"
                      >
                        Восстановить демо-набор
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between px-6 py-3 border-t border-slate-800/80 bg-[#090C14] text-xs">
              <span className="text-slate-500">
                Все изменения сохраняются автоматически в браузере
              </span>
              <button
                onClick={() => onUnlockAdmin(false)}
                className="text-slate-400 hover:text-rose-400 transition-colors"
              >
                Выйти из админки
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
