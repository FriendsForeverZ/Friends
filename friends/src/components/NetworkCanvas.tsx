/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useRef, useEffect, useState, useCallback } from 'react';
import {
  forceSimulation,
  forceLink,
  forceManyBody,
  forceCenter,
  forceCollide,
  forceX,
  forceY,
  Simulation,
} from 'd3-force';
import { FriendEdge, FriendNode } from '../types/graph';
import { getSourceId, getTargetId } from '../utils/communityDetection';
import { ZoomIn, ZoomOut, RotateCcw, Flame, Sparkles } from 'lucide-react';

interface NetworkCanvasProps {
  nodes: FriendNode[];
  edges: FriendEdge[];
  selectedNodeId: string | null;
  hoveredNodeId: string | null;
  activeClusterFilter: string | null;
  activeInterestFilter: string | null;
  bridgesOnlyFilter: boolean;
  minStrengthFilter: number;
  onSelectNode: (node: FriendNode | null) => void;
  onHoverNode: (node: FriendNode | null) => void;
}

// Background cosmic dust particles
interface StarParticle {
  x: number;
  y: number;
  radius: number;
  baseAlpha: number;
  speedX: number;
  speedY: number;
}

export const NetworkCanvas: React.FC<NetworkCanvasProps> = ({
  nodes,
  edges,
  selectedNodeId,
  hoveredNodeId,
  activeClusterFilter,
  activeInterestFilter,
  bridgesOnlyFilter,
  minStrengthFilter,
  onSelectNode,
  onHoverNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  
  // Transform state: pan & zoom
  const [transform, setTransform] = useState({ x: 0, y: 0, k: 1 });
  const transformRef = useRef(transform);
  transformRef.current = transform;

  // Cached avatar images to avoid reloading during canvas redraws
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Simulation reference
  const simulationRef = useRef<Simulation<FriendNode, any> | null>(null);
  const internalNodesRef = useRef<FriendNode[]>([]);
  const internalEdgesRef = useRef<FriendEdge[]>([]);

  // Dragging state
  const isDraggingRef = useRef(false);
  const dragTargetNodeRef = useRef<FriendNode | null>(null);
  const dragStartPosRef = useRef({ x: 0, y: 0 });
  const mouseMovedWhileDownRef = useRef(false);

  // Background stars
  const starsRef = useRef<StarParticle[]>([]);

  // Animation frame id
  const animFrameIdRef = useRef<number | null>(null);

  // Initialize stars once
  useEffect(() => {
    const starList: StarParticle[] = [];
    for (let i = 0; i < 90; i++) {
      starList.push({
        x: (Math.random() - 0.5) * 3000,
        y: (Math.random() - 0.5) * 3000,
        radius: Math.random() * 1.5 + 0.5,
        baseAlpha: Math.random() * 0.4 + 0.15,
        speedX: (Math.random() - 0.5) * 0.1,
        speedY: (Math.random() - 0.5) * 0.1,
      });
    }
    starsRef.current = starList;
  }, []);

  // Preload avatars into cache
  useEffect(() => {
    nodes.forEach(node => {
      if (node.avatarUrl && !imageCacheRef.current.has(node.avatarUrl)) {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.referrerPolicy = 'no-referrer';
        img.src = node.avatarUrl;
        img.onload = () => {
          imageCacheRef.current.set(node.avatarUrl!, img);
        };
      }
    });
  }, [nodes]);

  // Setup / re-heat d3-force physics simulation
  useEffect(() => {
    if (!containerRef.current) return;
    const width = containerRef.current.clientWidth || 1000;
    const height = containerRef.current.clientHeight || 700;

    // Deep clone nodes to allow d3 mutation
    const simNodes: FriendNode[] = nodes.map(n => {
      const existing = internalNodesRef.current.find(en => en.id === n.id);
      return {
        ...n,
        x: existing?.x ?? (Math.random() - 0.5) * width * 0.6,
        y: existing?.y ?? (Math.random() - 0.5) * height * 0.6,
        vx: existing?.vx ?? 0,
        vy: existing?.vy ?? 0,
      };
    });

    const simEdges: FriendEdge[] = edges.map(e => ({
      ...e,
      source: getSourceId(e),
      target: getTargetId(e),
    }));

    internalNodesRef.current = simNodes;
    internalEdgesRef.current = simEdges;

    // Cluster coordinates for spatial separation of groups
    const clusterCentroids: Record<string, { x: number; y: number }> = {
      c1: { x: -280, y: -160 },
      c2: { x: 280, y: -160 },
      c3: { x: -260, y: 220 },
      c4: { x: 260, y: 220 },
      c5: { x: 0, y: -320 },
      c6: { x: 0, y: 320 },
    };

    const sim = forceSimulation<FriendNode>(simNodes)
      .force(
        'link',
        forceLink<FriendNode, any>(simEdges)
          .id(d => d.id)
          .distance(d => {
            const strength = d.strength || 3;
            // Closer friends are bound tighter
            return Math.max(70, 190 - strength * 22);
          })
          .strength(d => 0.15 + (d.strength || 1) * 0.05)
      )
      .force(
        'charge',
        forceManyBody<FriendNode>().strength(d => -(Math.pow(d.radius || 30, 1.45) * 8.5))
      )
      .force('center', forceCenter(0, 0).strength(0.04))
      .force(
        'collide',
        forceCollide<FriendNode>()
          .radius(d => (d.radius || 30) + 18)
          .iterations(2)
      )
      // Group clustering force:
      // Bridge nodes are pulled towards the average of their bridged clusters!
      .force(
        'clusterX',
        forceX<FriendNode>(d => {
          if (d.isBridge && d.bridgeClusters && d.bridgeClusters.length > 0) {
            let sumX = 0;
            d.bridgeClusters.forEach(bc => {
              const c = clusterCentroids[bc.clusterId] || { x: 0, y: 0 };
              sumX += c.x * (bc.percentage / 100);
            });
            return sumX;
          }
          const cId = d.clusterId || 'c1';
          return clusterCentroids[cId]?.x || 0;
        }).strength(d => (d.isBridge ? 0.08 : 0.14))
      )
      .force(
        'clusterY',
        forceY<FriendNode>(d => {
          if (d.isBridge && d.bridgeClusters && d.bridgeClusters.length > 0) {
            let sumY = 0;
            d.bridgeClusters.forEach(bc => {
              const c = clusterCentroids[bc.clusterId] || { x: 0, y: 0 };
              sumY += c.y * (bc.percentage / 100);
            });
            return sumY;
          }
          const cId = d.clusterId || 'c1';
          return clusterCentroids[cId]?.y || 0;
        }).strength(d => (d.isBridge ? 0.08 : 0.14))
      )
      .alpha(0.8)
      .alphaDecay(0.022);

    simulationRef.current = sim;

    return () => {
      sim.stop();
    };
  }, [nodes, edges]);

  // Center camera on selected node if clicked
  useEffect(() => {
    if (!selectedNodeId || !containerRef.current) return;
    const target = internalNodesRef.current.find(n => n.id === selectedNodeId);
    if (target && target.x !== undefined && target.y !== undefined) {
      const containerWidth = containerRef.current.clientWidth;
      const containerHeight = containerRef.current.clientHeight;
      setTransform(prev => ({
        ...prev,
        x: containerWidth / 2 - target.x! * prev.k,
        y: containerHeight / 2 - target.y! * prev.k,
      }));
    }
  }, [selectedNodeId]);

  // Determine active focus node (hovered node or selected node)
  const activeFocusId = hoveredNodeId || selectedNodeId;

  // Active connected neighbors set
  const activeConnections = React.useMemo(() => {
    const neighborMap = new Map<string, { edge: FriendEdge; strength: number }>();
    if (!activeFocusId) return neighborMap;

    edges.forEach(e => {
      const sId = getSourceId(e);
      const tId = getTargetId(e);
      if (sId === activeFocusId) {
        neighborMap.set(tId, { edge: e, strength: e.strength });
      } else if (tId === activeFocusId) {
        neighborMap.set(sId, { edge: e, strength: e.strength });
      }
    });
    return neighborMap;
  }, [activeFocusId, edges]);

  // Filter matching check
  const isNodeMatchingFilters = useCallback(
    (node: FriendNode) => {
      if (activeClusterFilter && node.clusterId !== activeClusterFilter) {
        return false;
      }
      if (activeInterestFilter && (!node.interests || !node.interests.includes(activeInterestFilter))) {
        return false;
      }
      if (bridgesOnlyFilter && !node.isBridge) {
        return false;
      }
      return true;
    },
    [activeClusterFilter, activeInterestFilter, bridgesOnlyFilter]
  );

  // Main 60fps Render Loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let time = 0;

    const render = () => {
      time += 1;
      const width = canvas.width;
      const height = canvas.height;

      ctx.clearRect(0, 0, width, height);

      // Deep galactic background
      ctx.fillStyle = '#08090E';
      ctx.fillRect(0, 0, width, height);

      ctx.save();
      // Apply Pan & Zoom
      ctx.translate(transformRef.current.x, transformRef.current.y);
      ctx.scale(transformRef.current.k, transformRef.current.k);

      // 1. Draw drifting background stars
      ctx.fillStyle = '#ffffff';
      starsRef.current.forEach(star => {
        star.x += star.speedX;
        star.y += star.speedY;
        ctx.globalAlpha = star.baseAlpha + Math.sin(time * 0.03 + star.x) * 0.15;
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.radius, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1.0;

      const simNodes = internalNodesRef.current;
      const simEdges = internalEdgesRef.current;
      const nodePositionMap = new Map<string, { x: number; y: number }>();
      simNodes.forEach(n => {
        if (n.x !== undefined && n.y !== undefined) {
          nodePositionMap.set(n.id, { x: n.x, y: n.y });
        }
      });

      // 2. Draw Edges
      simEdges.forEach(edge => {
        const sId = getSourceId(edge);
        const tId = getTargetId(edge);
        const p1 = nodePositionMap.get(sId);
        const p2 = nodePositionMap.get(tId);
        if (!p1 || !p2) return;

        // Skip edges below minimum strength filter
        if (minStrengthFilter > 1 && edge.strength < minStrengthFilter) return;

        const isConnectedToFocus = activeFocusId && (sId === activeFocusId || tId === activeFocusId);
        const hasActiveFocus = Boolean(activeFocusId);

        ctx.save();

        if (isConnectedToFocus) {
          // ACTIVE ANIMATED BEAM!
          // Glowing dashed line running between friends
          const dashOffset = -(time * 0.55) % 16;
          ctx.setLineDash([7, 5]);
          ctx.lineDashOffset = dashOffset;
          ctx.lineWidth = Math.max(2, (edge.strength || 1) * 0.85);

          // Glowing shadow
          ctx.shadowBlur = 12;
          ctx.shadowColor = '#00F0FF';
          ctx.strokeStyle = '#22D3EE';
          ctx.globalAlpha = 0.95;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();

          // Render connection strength label at midpoint
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;
          ctx.font = '10px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#E2E8F0';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.shadowBlur = 4;
          ctx.shadowColor = '#000000';
          
          if (edge.relationshipType) {
            ctx.fillText(edge.relationshipType, midX, midY - 6);
          }
        } else if (hasActiveFocus) {
          // Dimmed non-relevant edges
          ctx.setLineDash([]);
          ctx.lineWidth = 0.8;
          ctx.strokeStyle = '#334155';
          ctx.globalAlpha = 0.05;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        } else {
          // Default state: fine subtle network links
          ctx.setLineDash([]);
          ctx.lineWidth = Math.max(1, (edge.strength || 1) * 0.45);
          ctx.strokeStyle = '#64748B';
          ctx.globalAlpha = 0.22;

          ctx.beginPath();
          ctx.moveTo(p1.x, p1.y);
          ctx.lineTo(p2.x, p2.y);
          ctx.stroke();
        }

        ctx.restore();
      });

      // 3. Draw Nodes
      simNodes.forEach(node => {
        if (node.x === undefined || node.y === undefined) return;
        const x = node.x;
        const y = node.y;
        const radius = node.radius || 28;

        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isFocus = isSelected || isHovered;
        const isNeighbor = activeConnections.has(node.id);
        const hasFocus = Boolean(activeFocusId);
        const matchesFilter = isNodeMatchingFilters(node);

        // Alpha calculations
        let nodeAlpha = 1.0;
        if (!matchesFilter) {
          nodeAlpha = 0.12;
        } else if (hasFocus && !isFocus && !isNeighbor) {
          nodeAlpha = 0.2;
        }

        ctx.save();
        ctx.globalAlpha = nodeAlpha;

        // A. BRIDGE NODE SPECIAL SHIMMER RING
        if (node.isBridge) {
          ctx.save();
          const bridgePulse = Math.sin(time * 0.05) * 4;
          const shimmerRadius = radius + 8 + bridgePulse;

          // Multi-color gradient ring
          const grad = ctx.createLinearGradient(
            x - shimmerRadius,
            y - shimmerRadius,
            x + shimmerRadius,
            y + shimmerRadius
          );
          if (node.bridgeClusters && node.bridgeClusters.length >= 2) {
            grad.addColorStop(0, node.bridgeClusters[0].color || '#00F0FF');
            grad.addColorStop(0.5, '#FFFFFF');
            grad.addColorStop(1, node.bridgeClusters[1].color || '#FF007A');
          } else {
            grad.addColorStop(0, '#00F0FF');
            grad.addColorStop(0.5, '#FFB800');
            grad.addColorStop(1, '#FF007A');
          }

          ctx.beginPath();
          ctx.arc(x, y, shimmerRadius, 0, Math.PI * 2);
          ctx.strokeStyle = grad;
          ctx.lineWidth = 3.5;
          ctx.shadowBlur = 18;
          ctx.shadowColor = '#00F0FF';
          ctx.stroke();
          ctx.restore();
        }

        // B. FOCUS / NEIGHBOR GLOW HALO
        if (isFocus || isNeighbor) {
          ctx.save();
          const haloColor = isFocus ? '#FDE047' : (node.clusterColor || '#00F0FF');
          ctx.beginPath();
          ctx.arc(x, y, radius + 6, 0, Math.PI * 2);
          ctx.strokeStyle = haloColor;
          ctx.lineWidth = isFocus ? 3.5 : 2;
          ctx.shadowBlur = isFocus ? 22 : 12;
          ctx.shadowColor = haloColor;
          ctx.stroke();
          ctx.restore();
        }

        // C. NODE AVATAR OR MONOGRAM FILL
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.clip();

        const cachedImg = node.avatarUrl ? imageCacheRef.current.get(node.avatarUrl) : null;
        if (cachedImg && cachedImg.complete && cachedImg.naturalWidth > 0) {
          ctx.drawImage(cachedImg, x - radius, y - radius, radius * 2, radius * 2);
        } else {
          // Stylish dark radial gradient background + monogram initials
          const bgGrad = ctx.createRadialGradient(x, y, 0, x, y, radius);
          bgGrad.addColorStop(0, '#1E293B');
          bgGrad.addColorStop(1, node.clusterColor || '#0F172A');
          ctx.fillStyle = bgGrad;
          ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);

          // Monogram initials
          const initials = node.name
            .split(' ')
            .map(part => part[0])
            .join('')
            .toUpperCase()
            .slice(0, 2) || node.handle.slice(1, 3).toUpperCase();

          ctx.font = `bold ${Math.round(radius * 0.75)}px 'Outfit', sans-serif`;
          ctx.fillStyle = '#FFFFFF';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(initials, x, y + 1);
        }
        ctx.restore();

        // D. NODE INNER / OUTER RING
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = node.clusterColor || '#38BDF8';
        ctx.lineWidth = isFocus ? 2.8 : 1.8;
        ctx.stroke();

        // E. BRIDGE BADGE ICON
        if (node.isBridge && !isFocus) {
          ctx.save();
          const badgeX = x + radius * 0.7;
          const badgeY = y - radius * 0.7;
          ctx.beginPath();
          ctx.arc(badgeX, badgeY, 9, 0, Math.PI * 2);
          ctx.fillStyle = '#FF007A';
          ctx.shadowBlur = 8;
          ctx.shadowColor = '#FF007A';
          ctx.fill();
          ctx.fillStyle = '#FFFFFF';
          ctx.font = 'bold 9px sans-serif';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText('⚡', badgeX, badgeY);
          ctx.restore();
        }

        // F. TEXT LABEL (Handle or Name)
        ctx.save();
        const labelText = node.handle || node.name;
        const fontSize = Math.max(11, Math.min(14, Math.round(radius * 0.38)));
        ctx.font = `${isFocus ? '600' : '500'} ${fontSize}px 'Plus Jakarta Sans', sans-serif`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // Dark text outline for maximum legibility against cosmic dark canvas
        ctx.strokeStyle = 'rgba(8, 9, 14, 0.95)';
        ctx.lineWidth = 3.5;
        ctx.lineJoin = 'round';
        ctx.strokeText(labelText, x, y + radius + 5);

        ctx.fillStyle = isFocus ? '#FDE047' : isNeighbor ? '#FFFFFF' : '#E2E8F0';
        ctx.fillText(labelText, x, y + radius + 5);

        // If Bridge, add compact Bridge tag below label
        if (node.isBridge && (isFocus || radius > 40)) {
          ctx.font = 'bold 9px "Plus Jakarta Sans", sans-serif';
          ctx.fillStyle = '#FF007A';
          ctx.strokeText('МОСТ / BRIDGE', x, y + radius + 20);
          ctx.fillText('МОСТ / BRIDGE', x, y + radius + 20);
        }
        ctx.restore();

        ctx.restore();
      });

      ctx.restore();
      animFrameIdRef.current = requestAnimationFrame(render);
    };

    animFrameIdRef.current = requestAnimationFrame(render);

    return () => {
      if (animFrameIdRef.current) {
        cancelAnimationFrame(animFrameIdRef.current);
      }
    };
  }, [
    activeFocusId,
    activeConnections,
    minStrengthFilter,
    isNodeMatchingFilters,
    selectedNodeId,
    hoveredNodeId,
  ]);

  // Window resize handler
  useEffect(() => {
    const handleResize = () => {
      if (!canvasRef.current || !containerRef.current) return;
      canvasRef.current.width = containerRef.current.clientWidth;
      canvasRef.current.height = containerRef.current.clientHeight;
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Helper: map canvas mouse coords to graph virtual world coords
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const { x, y, k } = transformRef.current;
    return {
      x: (screenX - x) / k,
      y: (screenY - y) / k,
    };
  }, []);

  // Helper: find node under mouse
  const getNodeAtPosition = useCallback(
    (screenX: number, screenY: number): FriendNode | null => {
      const world = screenToWorld(screenX, screenY);
      const simNodes = internalNodesRef.current;

      // Search in reverse so top-rendered nodes get picked first
      for (let i = simNodes.length - 1; i >= 0; i--) {
        const node = simNodes[i];
        if (node.x === undefined || node.y === undefined) continue;
        const dx = world.x - node.x;
        const dy = world.y - node.y;
        const distSq = dx * dx + dy * dy;
        const hitRadius = (node.radius || 28) + 6;
        if (distSq <= hitRadius * hitRadius) {
          return node;
        }
      }
      return null;
    },
    [screenToWorld]
  );

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    mouseMovedWhileDownRef.current = false;
    dragStartPosRef.current = { x: screenX, y: screenY };

    const clickedNode = getNodeAtPosition(screenX, screenY);
    if (clickedNode) {
      dragTargetNodeRef.current = clickedNode;
      isDraggingRef.current = true;
      // Re-heat simulation smoothly while dragging node
      simulationRef.current?.alphaTarget(0.3).restart();
      clickedNode.fx = clickedNode.x;
      clickedNode.fy = clickedNode.y;
    } else {
      isDraggingRef.current = true;
      dragTargetNodeRef.current = null;
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;
    const screenX = e.clientX - rect.left;
    const screenY = e.clientY - rect.top;

    const dx = screenX - dragStartPosRef.current.x;
    const dy = screenY - dragStartPosRef.current.y;
    if (Math.abs(dx) > 3 || Math.abs(dy) > 3) {
      mouseMovedWhileDownRef.current = true;
    }

    if (isDraggingRef.current) {
      if (dragTargetNodeRef.current) {
        // Dragging a specific node
        const world = screenToWorld(screenX, screenY);
        dragTargetNodeRef.current.fx = world.x;
        dragTargetNodeRef.current.fy = world.y;
      } else {
        // Panning the canvas
        setTransform(prev => ({
          ...prev,
          x: prev.x + dx,
          y: prev.y + dy,
        }));
        dragStartPosRef.current = { x: screenX, y: screenY };
      }
    } else {
      // Hover check
      const hovered = getNodeAtPosition(screenX, screenY);
      onHoverNode(hovered);
    }
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (isDraggingRef.current && dragTargetNodeRef.current) {
      // Release node pin and let physics settle
      dragTargetNodeRef.current.fx = null;
      dragTargetNodeRef.current.fy = null;
      simulationRef.current?.alphaTarget(0);
    }

    // If click didn't involve significant drag, treat as click selection
    if (!mouseMovedWhileDownRef.current) {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (rect) {
        const screenX = e.clientX - rect.left;
        const screenY = e.clientY - rect.top;
        const clickedNode = getNodeAtPosition(screenX, screenY);
        onSelectNode(clickedNode);
      }
    }

    isDraggingRef.current = false;
    dragTargetNodeRef.current = null;
  };

  // Zoom wheel handler
  const handleWheel = (e: React.WheelEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const zoomFactor = e.deltaY < 0 ? 1.12 : 0.89;
    const rect = canvasRef.current?.getBoundingClientRect();
    if (!rect) return;

    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    setTransform(prev => {
      const newK = Math.max(0.25, Math.min(3.5, prev.k * zoomFactor));
      // Zoom centered on mouse pointer
      return {
        k: newK,
        x: mouseX - (mouseX - prev.x) * (newK / prev.k),
        y: mouseY - (mouseY - prev.y) * (newK / prev.k),
      };
    });
  };

  // Toolbar zoom helpers
  const handleZoomIn = () => {
    if (!containerRef.current) return;
    const cx = containerRef.current.clientWidth / 2;
    const cy = containerRef.current.clientHeight / 2;
    setTransform(prev => {
      const newK = Math.min(3.5, prev.k * 1.25);
      return {
        k: newK,
        x: cx - (cx - prev.x) * (newK / prev.k),
        y: cy - (cy - prev.y) * (newK / prev.k),
      };
    });
  };

  const handleZoomOut = () => {
    if (!containerRef.current) return;
    const cx = containerRef.current.clientWidth / 2;
    const cy = containerRef.current.clientHeight / 2;
    setTransform(prev => {
      const newK = Math.max(0.25, prev.k * 0.8);
      return {
        k: newK,
        x: cx - (cx - prev.x) * (newK / prev.k),
        y: cy - (cy - prev.y) * (newK / prev.k),
      };
    });
  };

  const handleResetView = () => {
    if (!containerRef.current) return;
    setTransform({
      x: containerRef.current.clientWidth / 2,
      y: containerRef.current.clientHeight / 2,
      k: 0.95,
    });
    simulationRef.current?.alpha(0.4).restart();
  };

  const handleReheatPhysics = () => {
    simulationRef.current?.alpha(0.85).restart();
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-[#08090E] cursor-grab active:cursor-grabbing select-none"
    >
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onWheel={handleWheel}
        className="w-full h-full block"
      />

      {/* Floating Canvas Controls */}
      <div className="absolute bottom-5 left-5 flex items-center gap-1.5 p-1.5 bg-[#0F1420]/80 backdrop-blur-md border border-slate-800/80 rounded-xl shadow-xl z-20">
        <button
          onClick={handleZoomIn}
          title="Приблизить"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={handleZoomOut}
          title="Отдалить"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className="w-[1px] h-4 bg-slate-700/60 my-auto mx-0.5" />
        <button
          onClick={handleResetView}
          title="Сбросить камеру по центру"
          className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/60 rounded-lg transition-colors"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={handleReheatPhysics}
          title="Встряхнуть граф (Физика)"
          className="p-2 text-amber-400 hover:text-amber-300 hover:bg-amber-500/10 rounded-lg transition-colors"
        >
          <Flame className="w-4 h-4" />
        </button>
      </div>

      {/* Interactive Helper Hint */}
      <div className="hidden sm:flex absolute bottom-5 right-5 items-center gap-2 px-3 py-1.5 bg-[#0F1420]/70 backdrop-blur-md border border-slate-800/60 rounded-full text-[11px] text-slate-400 pointer-events-none z-10">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
        <span>Кликни на друга, чтобы увидеть сияющие связи</span>
      </div>
    </div>
  );
};
