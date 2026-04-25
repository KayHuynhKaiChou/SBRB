import React, { useState } from 'react';
import { Input, Radio, Typography, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { IDataSheetDto } from '../../hooks/use-datasheet';

const { Text } = Typography;

interface ISheetListProps {
  sheets: IDataSheetDto[];
  value?: string | null;
  onChange?: (id: string) => void;
  /** Max scrollable height of the list area (excludes search input). Defaults to 240px. */
  maxHeight?: number;
}

export function SheetList({ sheets, value, onChange, maxHeight = 240 }: ISheetListProps) {
  const [search, setSearch] = useState('');

  const filtered = sheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col">
      <Input
        prefix={<SearchOutlined />}
        placeholder="Tìm bộ dữ liệu..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="!mb-2"
        size="small"
      />
      {filtered.length === 0 ? (
        <Empty description="Không có dữ liệu" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <div className="overflow-y-auto" style={{ maxHeight }}>
          <Radio.Group
            value={value}
            onChange={(e) => onChange?.(e.target.value as string)}
            className="!w-full"
          >
            {filtered.map((sheet) => (
              <div
                key={sheet.id}
                className="px-1 py-2 border-b border-gray-100 cursor-pointer"
                onClick={() => onChange?.(sheet.id)}
              >
                <Radio value={sheet.id}>
                  <Text strong className="!text-[13px]">
                    {sheet.name}
                  </Text>
                </Radio>
              </div>
            ))}
          </Radio.Group>
        </div>
      )}
    </div>
  );
}
