import { Avatar } from 'antd';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { BRAND_COLOR } from '@sbrb/shared-constants';
import type { IOrgChartNodeData } from '../../pages/department/org-chart-layout';

function DepartmentNodeCardInner({ data }: NodeProps) {
  const { t } = useTranslation(['department']);
  const node = data as unknown as IOrgChartNodeData;

  return (
    <div
      onClick={node.onClick}
      className="rounded-lg bg-white shadow-sm p-3 cursor-pointer hover:shadow-md transition-shadow"
      style={{
        width: 240,
        height: 110,
        borderStyle: 'solid',
        borderColor: node.isRoot ? BRAND_COLOR : '#e5e7eb',
        borderWidth: node.isRoot ? 2 : 1,
      }}
    >
      {(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => (
        <Handle
          key={`t-${side}`}
          id={`t-${side.toLowerCase()}`}
          type="target"
          position={Position[side]}
          style={{ opacity: 0 }}
        />
      ))}
      <div className="font-semibold text-sm truncate" title={node.name}>
        {node.name}
      </div>
      <div className="flex items-center gap-2 mt-2 text-xs text-gray-700">
        {node.manager ? (
          <>
            <Avatar size={20} src={node.manager.user.avatarUrl ?? undefined}>
              {node.manager.user.fullName?.[0] ?? '?'}
            </Avatar>
            <span className="truncate" title={node.manager.user.fullName}>
              {node.manager.user.fullName}
            </span>
          </>
        ) : (
          <span className="text-gray-400 italic">{t('department:no_manager')}</span>
        )}
      </div>
      <div className="text-xs text-gray-500 mt-2">
        {t('department:member_count', { count: node.directReportCount })}
      </div>
      {(['Top', 'Right', 'Bottom', 'Left'] as const).map((side) => (
        <Handle
          key={`s-${side}`}
          id={`s-${side.toLowerCase()}`}
          type="source"
          position={Position[side]}
          style={{ opacity: 0 }}
        />
      ))}
    </div>
  );
}

export const DepartmentNodeCard = memo(DepartmentNodeCardInner);
