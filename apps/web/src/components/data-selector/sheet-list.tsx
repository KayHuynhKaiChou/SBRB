import React, { useState } from 'react';
import { Input, Radio, Typography, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { IDataSheetDto } from '../../hooks/use-datasheet';

const { Text } = Typography;

interface ISheetListProps {
  sheets: IDataSheetDto[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function SheetList({ sheets, selected, onSelect }: ISheetListProps) {
  const [search, setSearch] = useState('');

  const filtered = sheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm bộ dữ liệu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{ marginBottom: 8 }}
        size="small"
      />
      {filtered.length === 0 ? (
        <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div style={{ overflowY: 'auto', flex: 1 }}>
          <Radio.Group
            value={selected}
            onChange={(e) => onSelect(e.target.value as string)}
            style={{ width: '100%' }}
          >
            {filtered.map((sheet) => (
              <div
                key={sheet.id}
                style={{
                  padding: '8px 4px',
                  borderBottom: '1px solid #f0f0f0',
                  cursor: 'pointer',
                }}
                onClick={() => onSelect(sheet.id)}
              >
                <Radio value={sheet.id}>
                  <div>
                    <Text strong style={{ fontSize: 13 }}>
                      {sheet.name}
                    </Text>
                    <br />
                    <Text type="secondary" style={{ fontSize: 11 }}>
                      {sheet.seriesCount} chuỗi · {sheet.periodCount} kỳ
                    </Text>
                  </div>
                </Radio>
              </div>
            ))}
          </Radio.Group>
        </div>
      )}
    </div>
  );
}
