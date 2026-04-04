import React, { useState } from 'react';
import { Button, Typography, Layout } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { Navigate } from 'react-router-dom';
import { Sidebar } from '../../components/layout/sidebar';
import { useAuthStore } from '../../store/auth.store';
import { useDepartments, type IDepartmentDto } from '../../hooks/use-departments';
import { DepartmentList } from '../../components/department/department-list';
import { CreateDepartmentModal } from '../../components/department/create-department-modal';
import { EditDepartmentModal } from '../../components/department/edit-department-modal';

const { Title } = Typography;

export default function DepartmentPage() {
  const { currentBusinessId } = useAuthStore();
  const { t } = useTranslation(['department', 'common']);
  const [createOpen, setCreateOpen] = useState(false);
  const [editTarget, setEditTarget] = useState<IDepartmentDto | null>(null);

  if (!currentBusinessId) return <Navigate to="/onboarding" replace />;

  const { departments, loading, create, update, remove } =
    useDepartments(currentBusinessId);

  const handleCreate = async (values: { name: string; parentId?: string | null }) => {
    await create({ name: values.name, parentId: values.parentId ?? null });
  };

  const handleEdit = async (values: { name: string; parentId?: string | null }) => {
    if (!editTarget) return;
    await update(editTarget.id, {
      name: values.name,
      parentId: values.parentId ?? null,
    });
    setEditTarget(null);
  };

  return (
    <Layout className="!min-h-screen">
      <Sidebar />
      <Layout className="!ml-[60px]">
        <div className="p-6 h-full overflow-y-auto">
          <div className="flex justify-between items-center mb-4">
            <Title level={4} className="!m-0">
              {t('department:page_title')}
            </Title>
            <Button
              type="primary"
              icon={<PlusOutlined />}
              onClick={() => setCreateOpen(true)}
            >
              {t('department:add_department')}
            </Button>
          </div>

          <DepartmentList
            departments={departments}
            loading={loading}
            onEdit={setEditTarget}
            onDelete={remove}
          />

          <CreateDepartmentModal
            open={createOpen}
            onClose={() => setCreateOpen(false)}
            onSubmit={handleCreate}
            departments={departments}
          />

          <EditDepartmentModal
            open={!!editTarget}
            onClose={() => setEditTarget(null)}
            onSubmit={handleEdit}
            department={editTarget}
            departments={departments}
          />
        </div>
      </Layout>
    </Layout>
  );
}
