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
          borderLeft: isActive ? '3px solid #1677ff' : '3px solid transparent',
          background: isActive ? '#e6f4ff' : 'transparent',
        }}
        className="px-3 py-[10px] cursor-pointer rounded-[0_4px_4px_0] mb-0.5 flex items-center gap-2"
      >
        <span
          style={{ background: tab.iconColor || '#1677ff' }}
          className="w-2 h-2 rounded-full shrink-0"
        />
        <Text
          ellipsis
          style={{
            color: isActive ? '#1677ff' : '#262626',
            fontWeight: isActive ? 600 : 400,
          }}
          className="!text-[13px] !flex-1"
        >
          {tab.name}
        </Text>
        {tab.isPinned && <PushpinFilled className="!text-[10px] !text-[#8c8c8c]" />}
      </div>
    </Dropdown>
  );
}
