import type { Edge, Node } from '@xyflow/react';
import type { IDepartmentNode } from '../../hooks/use-department-tree';

import { DEPT_NODE_W, DEPT_NODE_H } from '@sbrb/shared-constants';

const NODE_W = DEPT_NODE_W;
const NODE_H = DEPT_NODE_H;
const RING_GAP = 280;
const SUBTREE_GAP = 200;

export interface IOrgChartNodeData extends Record<string, unknown> {
  id: string;
  name: string;
  isRoot: boolean;
  memberCount: number;
  manager: IDepartmentNode['manager'];
  onClick: () => void;
}

interface ILayoutOpts {
  onClick: (deptId: string) => void;
}

interface IPos {
  x: number;
  y: number;
}

function countLeaves(dept: IDepartmentNode): number {
  if (!dept.children?.length) return 1;
  return dept.children.reduce((sum, c) => sum + countLeaves(c), 0);
}

function pickHandles(parent: IPos, child: IPos): {
  sourceHandle: string;
  targetHandle: string;
} {
  const dx = child.x - parent.x;
  const dy = child.y - parent.y;
  if (Math.abs(dx) > Math.abs(dy)) {
    return dx > 0
      ? { sourceHandle: 's-right', targetHandle: 't-left' }
      : { sourceHandle: 's-left', targetHandle: 't-right' };
  }
  return dy > 0
    ? { sourceHandle: 's-bottom', targetHandle: 't-top' }
    : { sourceHandle: 's-top', targetHandle: 't-bottom' };
}

/** Walks the tree and assigns radial positions; collects parent→child relations. */
function walkRadial(
  dept: IDepartmentNode,
  cx: number,
  cy: number,
  dirX: number,
  dirY: number,
  positions: Map<string, IPos>,
  parents: Map<string, string>,
) {
  positions.set(dept.id, { x: cx, y: cy });
  if (!dept.children?.length) return;

  const widths = dept.children.map(countLeaves);
  const totalWidth = widths.reduce((a, b) => a + b, 0) * SUBTREE_GAP;
  const perpX = -dirY;
  const perpY = dirX;
  const childCenterX = cx + dirX * RING_GAP;
  const childCenterY = cy + dirY * RING_GAP;

  let cursor = -totalWidth / 2;
  dept.children.forEach((child, i) => {
    const slot = widths[i] * SUBTREE_GAP;
    const offset = cursor + slot / 2;
    cursor += slot;
    const x = childCenterX + perpX * offset;
    const y = childCenterY + perpY * offset;
    parents.set(child.id, dept.id);
    walkRadial(child, x, y, dirX, dirY, positions, parents);
  });
}

export function computeLayout(
  tree: IDepartmentNode[],
  opts: ILayoutOpts,
): { nodes: Node<IOrgChartNodeData>[]; edges: Edge[] } {
  const nodes: Node<IOrgChartNodeData>[] = [];
  const edges: Edge[] = [];

  const root = tree[0];
  if (!root) return { nodes, edges };

  // 1. Compute initial radial positions and parent map.
  const radialPos = new Map<string, IPos>();
  const parents = new Map<string, string>();

  radialPos.set(root.id, { x: 0, y: 0 });
  const directChildren = root.children ?? [];
  if (directChildren.length > 0) {
    const startAngle = -Math.PI / 2;
    directChildren.forEach((child, i) => {
      const angle = startAngle + (2 * Math.PI * i) / directChildren.length;
      const dirX = Math.cos(angle);
      const dirY = Math.sin(angle);
      parents.set(child.id, root.id);
      walkRadial(child, dirX * RING_GAP, dirY * RING_GAP, dirX, dirY, radialPos, parents);
    });
  }
  for (let i = 1; i < tree.length; i++) {
    const extraRoot = tree[i];
    walkRadial(extraRoot, 0, RING_GAP * 3 * i, 0, 1, radialPos, parents);
  }

  // 2. Build dept index + apply saved positions to get FINAL positions.
  const dataById = new Map<string, IDepartmentNode>();
  function index(d: IDepartmentNode) {
    dataById.set(d.id, d);
    d.children?.forEach(index);
  }
  tree.forEach(index);

  const finalPos = new Map<string, IPos>();
  radialPos.forEach((p, id) => {
    const dept = dataById.get(id);
    finalPos.set(id, {
      x: dept?.positionX != null ? dept.positionX : p.x,
      y: dept?.positionY != null ? dept.positionY : p.y,
    });
  });

  // 3. Build edges using final positions to pick handles.
  parents.forEach((parentId, childId) => {
    const pp = finalPos.get(parentId);
    const cp = finalPos.get(childId);
    if (!pp || !cp) return;
    edges.push({
      id: `${parentId}-${childId}`,
      source: parentId,
      target: childId,
      type: 'smoothstep',
      ...pickHandles(pp, cp),
    });
  });

  // 4. Build React Flow nodes (top-left corner from center position).
  finalPos.forEach((p, id) => {
    const dept = dataById.get(id);
    if (!dept) return;
    nodes.push({
      id: dept.id,
      type: 'dept',
      position: { x: p.x - NODE_W / 2, y: p.y - NODE_H / 2 },
      data: {
        id: dept.id,
        name: dept.name,
        isRoot: dept.isRoot,
        memberCount: dept.memberCount ?? 0,
        manager: dept.manager,
        onClick: () => opts.onClick(dept.id),
      },
    });
  });

  return { nodes, edges };
}

export { DEPT_NODE_W, DEPT_NODE_H } from '@sbrb/shared-constants';
