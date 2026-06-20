import { useState, type CSSProperties } from 'react';
import { Button, Alert, Tag } from 'antd';
import {
  DownloadOutlined,
  FileExcelOutlined,
  ApartmentOutlined,
  AlignLeftOutlined,
  CheckCircleFilled,
  EyeOutlined,
} from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../lib/api-client';
import { useNotify } from '@sbrb/shared-apollo-client';
import { API_ROUTES } from '@sbrb/shared-constants';
import { ImportTemplatePreviewModal } from './import-template-preview-modal';

type TemplateType = 'simple' | 'department' | 'pnl';

/** Selected-card look per template colour (inline because dynamic Tailwind classes don't JIT). */
const SELECTED_CARD_STYLE: Record<string, CSSProperties> = {
  blue: { borderColor: '#3b82f6', backgroundColor: '#eff6ff', boxShadow: '0 0 0 1px #3b82f6' },
  purple: { borderColor: '#8b5cf6', backgroundColor: '#f5f3ff', boxShadow: '0 0 0 1px #8b5cf6' },
  green: { borderColor: '#10b981', backgroundColor: '#ecfdf5', boxShadow: '0 0 0 1px #10b981' },
};

interface IImportTemplateSelectorProps {
  templateType: TemplateType;
  onChange: (type: TemplateType) => void;
  disabled?: boolean;
}

export function ImportTemplateSelector({
  templateType,
  onChange,
  disabled,
}: IImportTemplateSelectorProps) {
  const { t } = useTranslation('datasheet');
  const notify = useNotify();
  const [previewType, setPreviewType] = useState<TemplateType | null>(null);

  const templates = [
    {
      id: 'simple' as TemplateType,
      icon: <FileExcelOutlined className="text-xl" />,
      tagColor: 'blue',
      title: 'A. Thống kê chung (Simple)',
      desc: 'Dùng cho các file báo cáo tổng hợp không chia phòng ban (Ví dụ: Doanh số toàn công ty).',
    },
    {
      id: 'department' as TemplateType,
      icon: <ApartmentOutlined className="text-xl" />,
      tagColor: 'purple',
      title: 'B. Phân rã Phòng ban (Departmental)',
      desc: 'Dùng để nhập dữ liệu của nhiều phòng ban cùng lúc trong 1 file Excel (Nhóm theo phòng).',
    },
    {
      id: 'pnl' as TemplateType,
      icon: <AlignLeftOutlined className="text-xl" />,
      tagColor: 'green',
      title: 'C. Cấu trúc P&L (Profit & Loss)',
      desc: 'Dùng cho báo cáo tài chính Thụt lề thụt dòng. Quan hệ Cha con được tự động nhận dạng bằng Dấu cách (Khỏang trắng lùi lề).',
    },
  ];

  const handleDownloadSample = async () => {
    try {
      const blob = await apiClient.getBlob(
        `${API_ROUTES.DATA_SHEET.SAMPLE_TEMPLATE}?templateType=${templateType}`,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `template-${templateType}.xlsx`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      notify.error(t('import_failed'));
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3">
      <div className="mb-1 text-sm font-semibold text-gray-700">1. Chọn mẫu cấu trúc Excel (Mẫu sẽ quy định cách hệ thống đọc file của bạn)</div>

      {/* px-0.5 keeps the left/right card borders off the modal body's overflow-x clip edge. */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 px-0.5">
        {templates.map(tpl => {
          const isSelected = templateType === tpl.id;
          // Dynamic Tailwind colour classes (border-${color}-500) can't be JIT-generated,
          // so the selected look is driven entirely by inline style here.
          return (
            <div
              key={tpl.id}
              onClick={() => !disabled && onChange(tpl.id)}
              className={`
                relative cursor-pointer transition-all duration-200 border rounded-xl p-3 flex flex-col gap-2 hover:shadow-md
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected ? '' : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
              style={isSelected ? SELECTED_CARD_STYLE[tpl.tagColor] : {}}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 flex">
                  <CheckCircleFilled style={{ color: tpl.tagColor === 'purple' ? '#8b5cf6' : tpl.tagColor === 'green' ? '#10b981' : '#3b82f6' }} className="text-lg" />
                </div>
              )}
              <div className="flex items-center gap-2">
                <Tag color={tpl.tagColor} className="!m-0 flex items-center justify-center p-1 rounded-lg">
                  {tpl.icon}
                </Tag>
                <div className="font-semibold text-13 text-slate-800">{tpl.title}</div>
              </div>
              <div className="text-[12px] text-gray-500 leading-relaxed flex-1">
                {tpl.desc}
              </div>
              <Button
                size="small"
                type="link"
                icon={<EyeOutlined />}
                className="!px-0 self-start"
                onClick={(e) => {
                  e.stopPropagation();
                  setPreviewType(tpl.id);
                }}
              >
                {t('preview_button')}
              </Button>
            </div>
          );
        })}
      </div>

      <Alert
        type="info"
        showIcon
        message={<span className="font-medium">Chưa rõ? Bạn hãy tải tệp Mẫu trắng về máy</span>}
        description={
          <div className="flex flex-col sm:flex-row gap-2 mt-2 items-start sm:items-center justify-between">
            <span className="text-12 text-slate-600">Tệp Excel bao gồm Hướng dẫn ở Sheet 2 + Data chuẩn bị sẵn ở Sheet 1. Điền vào Sheet 1 và xoá Sheet 2 trước khi up.</span>
            <Button size="middle" type="primary" className="shadow-sm" icon={<DownloadOutlined />} onClick={handleDownloadSample} disabled={disabled}>
              Tải File Excel: {templates.find(t => t.id === templateType)?.title.split(' ')[0]}
            </Button>
          </div>
        }
        className="mt-2 bg-slate-50 border-slate-200"
      />

      <ImportTemplatePreviewModal
        templateType={previewType}
        onClose={() => setPreviewType(null)}
      />
    </div>
  );
}
