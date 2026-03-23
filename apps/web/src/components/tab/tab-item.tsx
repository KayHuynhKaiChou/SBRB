import React from 'react';
import { Dropdown, Typography } from 'antd';
import {
  EditOutlined,
  DeleteOutlined,
  PushpinOutlined,
  PushpinFilled,
} from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { ITabDto } from '@sbrb/shared-types';

const { Text } = Typography;

interface ITabItemProps {
  tab: ITabDto;
  isActive: boolean;
  onSelect: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

export function TabItem({ tab, isActive, onSelect, onEdit, onDelete }: ITabItemProps) {
  const contextMenuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Sửa tab',
      onClick: () => onEdit(),
    },
    {
      key: 'pin',
      icon: tab.isPinned ? <PushpinFilled /> : <PushpinOutlined />,
      label: tab.isPinned ? 'Bỏ ghim' : 'Ghim tab',
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa tab',
      danger: true,
      disabled: tab.isProtected,
      onClick: () => onDelete(),
    },
  ];

  return (
    <Dropdown menu={{ items: contextMenuItems }} trigger={['contextMenu']}>
      <div
        onClick={onSelect}
        style={{
          padding: '10px 12px',
          cursor: 'pointer',
          borderLeft: isActive ? '3px solid #1677ff' : '3px solid transparent',
          background: isActive ? '#e6f4ff' : 'transparent',
          borderRadius: '0 4px 4px 0',
          marginBottom: 2,
          display: 'flex',
          alignItems: 'center',
          gap: 8,
        }}
      >
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: '50%',
            background: tab.iconColor || '#1677ff',
            flexShrink: 0,
          }}
        />
        <Text
          ellipsis
          style={{
            color: isActive ? '#1677ff' : '#262626',
            fontWeight: isActive ? 600 : 400,
            fontSize: 13,
            flex: 1,
          }}
        >
          {tab.name}
        </Text>
        {tab.isPinned && <PushpinFilled style={{ fontSize: 10, color: '#8c8c8c' }} />}
      </div>
    </Dropdown>
  );
}
