import React, { useState } from 'react';
import { Input, Radio, Typography, Empty } from 'antd';
import { SearchOutlined } from '@ant-design/icons';
import type { IDataSheetDto } from '../../hooks/use-datasheet';

const { Text } = Typography;

interface ISheetListProps {
  sheets: IDataSheetDto[];
  value?: string | null;
  onChange?: (id: string) => void;
}

export function SheetList({ sheets, value, onChange }: ISheetListProps) {
  const [search, setSearch] = useState('');

  const filtered = sheets.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="flex flex-col h-full">
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
        <div className="overflow-y-auto flex-1">
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
                  <div>
                    <Text strong className="!text-[13px]">
                      {sheet.name}
                    </Text>
                    <br />
                    <Text type="secondary" className="!text-[11px]">
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
