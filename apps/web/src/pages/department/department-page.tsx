import { Layout, Spin, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useMutation, useQuery } from '@apollo/client';
import {
  Background,
  Controls,
  ReactFlow,
  applyNodeChanges,
  type Node,
  type NodeChange,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Navigate, useNavigate, useParams } from 'react-router-dom';
import { IconButton } from '@sbrb/ui';
import { Sidebar } from '../../components/layout/sidebar';
import { AddDepartmentModal, type IParentOption } from '../../components/department/add-department-modal';
import { AddMemberModal } from '../../components/department/add-member-modal';
import { ChangeManagerModal } from '../../components/department/change-manager-modal';
import { DepartmentModal } from '../../components/department/department-modal';
import { DepartmentNodeCard } from '../../components/department/department-node-card';
import {
  MY_BUSINESS_ROLE_QUERY,
  UPDATE_DEPARTMENT_POSITIONS_MUTATION,
} from '../../graphql/department.operations';
import { MY_BUSINESSES_QUERY } from '../../graphql/auth.operations';
import { useDepartmentTree, type IDepartmentNode } from '../../hooks/use-department-tree';
import { useAuthStore } from '../../store/auth.store';
import { computeLayout, DEPT_NODE_H, DEPT_NODE_W, type IOrgChartNodeData } from './org-chart-layout';

const { Title } = Typography;

const nodeTypes = { dept: DepartmentNodeCard };

interface IFlatDept {
  node: IDepartmentNode;
  hasChildren: boolean;
  depth: number;
}

function flattenTree(tree: IDepartmentNode[]): IFlatDept[] {
  const out: IFlatDept[] = [];
  function walk(n: IDepartmentNode, depth: number) {
    out.push({ node: n, hasChildren: !!n.children?.length, depth });
    n.children?.forEach((c) => walk(c, depth + 1));
  }
  tree.forEach((root) => walk(root, 0));
  return out;
}

const REACT_FLOW_PRO_OPTIONS = { hideAttribution: true };

export default function DepartmentPage() {
  const { currentBusinessId } = useAuthStore();
  const { t } = useTranslation(['department', 'common']);
  const navigate = useNavigate();
  const { deptId: urlDeptId } = useParams<{ deptId?: string }>();

  const [selectedId, setSelectedId] = useState<string | null>(urlDeptId ?? null);
  const [addOpen, setAddOpen] = useState(false);
  const [addParentId, setAddParentId] = useState<string | null>(null);
  const [addMemberFor, setAddMemberFor] = useState<string | null>(null);
  const [changeManagerFor, setChangeManagerFor] = useState<string | null>(null);

  // Pass empty string when missing — useDepartmentTree skips when falsy.
  const { tree, loading } = useDepartmentTree(currentBusinessId ?? '');

  const flatList = useMemo(() => (tree ? flattenTree(tree) : []), [tree]);

  const selectedFlat = useMemo(
    () => flatList.find((f) => f.node.id === selectedId) ?? null,
    [flatList, selectedId],
  );

  useEffect(() => {
    if (!tree) return;
    if (urlDeptId && urlDeptId !== selectedId) {
      const exists = flatList.some((f) => f.node.id === urlDeptId);
      if (exists) setSelectedId(urlDeptId);
      else navigate('/departments', { replace: true });
    }
  }, [urlDeptId, tree, flatList, selectedId, navigate]);

  const handleOpenDept = useCallback(
    (id: string) => {
      setSelectedId(id);
      navigate(`/departments/${id}`);
    },
    [navigate],
  );

  const handleCloseDept = useCallback(() => {
    setSelectedId(null);
    navigate('/departments');
  }, [navigate]);

  const handleOpenAddRoot = useCallback(() => {
    setAddParentId(null);
    setAddOpen(true);
  }, []);

  const handleAddSubDept = useCallback((parentId: string) => {
    setAddParentId(parentId);
    setAddOpen(true);
  }, []);

  const handleCloseAddDept = useCallback(() => {
    setAddOpen(false);
    setAddParentId(null);
  }, []);

  const handleCloseAddMember = useCallback(() => setAddMemberFor(null), []);
  const handleCloseChangeManager = useCallback(() => setChangeManagerFor(null), []);
  const handleRequestAddMember = useCallback((id: string) => setAddMemberFor(id), []);
  const handleRequestChangeManager = useCallback((id: string) => setChangeManagerFor(id), []);

  const { data: roleData } = useQuery<{ myBusinessRole: string | null }>(
    MY_BUSINESS_ROLE_QUERY,
    {
      variables: { businessId: currentBusinessId ?? '' },
      skip: !currentBusinessId,
      fetchPolicy: 'cache-first',
    },
  );
  const isOwner = roleData?.myBusinessRole === 'owner';

  const { data: bizData } = useQuery<{
    myBusinesses: Array<{ id: string; name: string; status: string }>;
  }>(MY_BUSINESSES_QUERY, { fetchPolicy: 'cache-and-network' });
  const businessName = bizData?.myBusinesses.find((b) => b.id === currentBusinessId)?.name;

  const [updatePositions] = useMutation<{
    updateDepartmentPositions: Array<{ id: string; positionX: number; positionY: number }>;
  }>(UPDATE_DEPARTMENT_POSITIONS_MUTATION);

  const { nodes: layoutNodes, edges } = useMemo(() => {
    if (!tree) return { nodes: [], edges: [] };
    return computeLayout(tree, { onClick: handleOpenDept });
  }, [tree, handleOpenDept]);

  // Local copy so drag updates feel instantaneous; resets when layout recomputes.
  const [nodes, setNodes] = useState<Node<IOrgChartNodeData>[]>(layoutNodes);
  useEffect(() => {
    setNodes(layoutNodes);
  }, [layoutNodes]);

  const handleNodesChange = useCallback((changes: NodeChange[]) => {
    setNodes((prev) => applyNodeChanges(changes, prev) as Node<IOrgChartNodeData>[]);
  }, []);

  const handleNodeDragStop = useCallback(
    (_evt: unknown, _node: Node<IOrgChartNodeData>, draggedNodes: Node<IOrgChartNodeData>[]) => {
      if (!isOwner || !currentBusinessId) return;
      // React Flow positions are top-left of the node; convert back to centre.
      const positions = draggedNodes.map((n) => ({
        id: n.id,
        positionX: n.position.x + DEPT_NODE_W / 2,
        positionY: n.position.y + DEPT_NODE_H / 2,
      }));
      if (!positions.length) return;
      updatePositions({
        variables: { businessId: currentBusinessId, positions },
      }).catch((err: Error) => {
        message.error(err.message || 'Failed to save positions');
      });
    },
    [isOwner, currentBusinessId, updatePositions],
  );

  const parentOptions: IParentOption[] = useMemo(
    () => flatList.map((f) => ({ id: f.node.id, name: f.node.name, depth: f.depth })),
    [flatList],
  );

  if (!currentBusinessId) return <Navigate to="/onboarding" replace />;

  return (
    <Layout className="!min-h-screen">
      <Sidebar />
      <Layout className="!ml-[60px]">
        <div className="flex flex-col h-screen">
          <div className="flex justify-between items-center p-4 border-b bg-white">
            <Title level={4} className="!m-0">
              {businessName
                ? `${businessName} — ${t('department:page_title')}`
                : t('department:page_title')}
            </Title>
            <IconButton
              icon={<PlusOutlined />}
              tooltip={t('department:add_department')}
              variant="primary"
              onClick={handleOpenAddRoot}
            />
          </div>

          <div className="flex-1 relative" style={{ background: '#fafafa' }}>
            {loading && !tree ? (
              <div className="flex items-center justify-center h-full">
                <Spin size="large" />
              </div>
            ) : nodes.length === 0 ? (
              <div className="flex items-center justify-center h-full text-gray-400">
                {t('department:no_departments')}
              </div>
            ) : (
              <ReactFlow
                nodes={nodes}
                edges={edges}
                nodeTypes={nodeTypes}
                nodesDraggable={isOwner}
                nodesConnectable={false}
                elementsSelectable
                fitView
                onNodesChange={handleNodesChange}
                onNodeDragStop={handleNodeDragStop}
                proOptions={REACT_FLOW_PRO_OPTIONS}
              >
                <Background />
                <Controls showInteractive={false} />
              </ReactFlow>
            )}
          </div>
        </div>

        <DepartmentModal
          open={selectedId !== null && selectedFlat !== null}
          department={selectedFlat?.node ?? null}
          hasChildren={selectedFlat?.hasChildren ?? false}
          isOwner={isOwner}
          onClose={handleCloseDept}
          onRequestAddMember={handleRequestAddMember}
          onRequestAddSubDept={handleAddSubDept}
          onRequestChangeManager={handleRequestChangeManager}
        />

        <AddDepartmentModal
          open={addOpen}
          businessId={currentBusinessId}
          parentId={addParentId}
          parentOptions={parentOptions}
          onClose={handleCloseAddDept}
        />

        <AddMemberModal
          open={!!addMemberFor}
          businessId={currentBusinessId}
          departmentId={addMemberFor}
          onClose={handleCloseAddMember}
        />

        <ChangeManagerModal
          open={!!changeManagerFor}
          departmentId={changeManagerFor}
          onClose={handleCloseChangeManager}
        />
      </Layout>
    </Layout>
  );
}
