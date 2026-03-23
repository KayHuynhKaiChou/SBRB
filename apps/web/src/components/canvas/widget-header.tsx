import React from 'react';
import { Space, Typography, Button, Dropdown } from 'antd';
import { MoreOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { MenuProps } from 'antd';
import type { IWidgetDto } from '@sbrb/shared-types';

const { Text } = Typography;

interface IWidgetHeaderProps {
  widget: IWidgetDto;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

export function WidgetHeader({ widget, onEdit, onDelete }: IWidgetHeaderProps) {
  const menuItems: MenuProps['items'] = [
    {
      key: 'edit',
      icon: <EditOutlined />,
      label: 'Chỉnh sửa',
      onClick: () => onEdit(widget.id),
    },
    { type: 'divider' },
    {
      key: 'delete',
      icon: <DeleteOutlined />,
      label: 'Xóa widget',
      danger: true,
      onClick: () => onDelete(widget.id),
    },
  ];

  return (
    <div
      style={{
        padding: '8px 12px',
        borderBottom: '1px solid #f0f0f0',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: '#fafafa',
        cursor: 'move',
        userSelect: 'none',
      }}
      className="widget-drag-handle"
    >
      <Space size={8}>
        <Text strong style={{ fontSize: 13 }}>
          {widget.name}
        </Text>
        {widget.unit && (
          <Text type="secondary" style={{ fontSize: 11 }}>
            ({widget.unit})
          </Text>
        )}
      </Space>
      <Dropdown menu={{ items: menuItems }} trigger={['click']} placement="bottomRight">
        <Button
          type="text"
          size="small"
          icon={<MoreOutlined />}
          onClick={(e) => e.stopPropagation()}
        />
      </Dropdown>
    </div>
  );
}
