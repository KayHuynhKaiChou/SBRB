import { Button, Alert, Tag } from 'antd';
import { DownloadOutlined, FileExcelOutlined, ApartmentOutlined, AlignLeftOutlined, CheckCircleFilled } from '@ant-design/icons';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../services/api-client';
import { useNotify } from '@sbrb/shared-apollo-client';

type TemplateType = 'simple' | 'department' | 'pnl';

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

  const templates = [
    {
      id: 'simple' as TemplateType,
      icon: <FileExcelOutlined className="text-xl" />,
      tagColor: 'blue',
      title: 'A. Thống kê chung (Simple)',
      desc: 'Dùng cho các file báo cáo tổng hợp không chia phòng ban (Ví dụ: Doanh số toàn công ty).',
      layoutPreview: (
        <div className="flex flex-col gap-1 text-[11px] font-mono mt-2 bg-white/50 p-2 rounded border border-dashed border-gray-300">
          <div className="flex gap-2"><span className="w-16 font-semibold">Row 1:</span><span className="text-gray-500">(Trống)</span><span>Tháng 1 | Tháng 2...</span></div>
          <div className="flex gap-2"><span className="w-16 font-semibold">Row 2:</span><span className="text-blue-600 font-medium">Lợi nhuận</span><span>1000 | 1500...</span></div>
        </div>
      )
    },
    {
      id: 'department' as TemplateType,
      icon: <ApartmentOutlined className="text-xl" />,
      tagColor: 'purple',
      title: 'B. Phân rã Phòng ban (Departmental)',
      desc: 'Dùng để nhập dữ liệu của nhiều phòng ban cùng lúc trong 1 file Excel (Nhóm theo phòng).',
      layoutPreview: (
        <div className="flex flex-col gap-1 text-[11px] font-mono mt-2 bg-white/50 p-2 rounded border border-dashed border-gray-300">
          <div className="flex gap-2"><span className="w-16 font-semibold">Row 2:</span><span className="text-purple-600 font-bold">Phòng ban A</span><span className="text-gray-400 italic">(Dòng này để trống số liệu)</span></div>
          <div className="flex gap-2"><span className="w-16 font-semibold">Row 3:</span><span className="ml-2 text-gray-700">Doanh thu</span><span>500 | 600...</span></div>
        </div>
      )
    },
    {
      id: 'pnl' as TemplateType,
      icon: <AlignLeftOutlined className="text-xl" />,
      tagColor: 'green',
      title: 'C. Cấu trúc P&L (Profit & Loss)',
      desc: 'Dùng cho báo cáo tài chính Thụt lề thụt dòng. Quan hệ Cha con được tự động nhận dạng bằng Dấu cách (Khỏang trắng lùi lề).',
      layoutPreview: (
        <div className="flex flex-col gap-1 text-[11px] font-mono mt-2 bg-white/50 p-2 rounded border border-dashed border-gray-300">
          <div className="flex gap-2"><span className="w-16 font-semibold">Row 2:</span><span className="text-green-600 font-bold">Tổng doanh thu</span><span className="text-gray-400 italic">(Để trống)</span></div>
          <div className="flex gap-2"><span className="w-16 font-semibold">Row 3:</span><span className="ml-4 text-gray-700">↳ Bán lẻ</span><span>800 | 900</span></div>
        </div>
      )
    },
  ];

  const handleDownloadSample = async () => {
    try {
      const blob = await apiClient.getBlob(
        `/api/v1/data-sheets/sample-template?templateType=${templateType}`,
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
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {templates.map(tpl => {
          const isSelected = templateType === tpl.id;
          return (
            <div
              key={tpl.id}
              onClick={() => !disabled && onChange(tpl.id)}
              className={`
                relative cursor-pointer transition-all duration-200 border rounded-xl p-3 flex flex-col gap-2 hover:shadow-md
                ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
                ${isSelected ? `border-${tpl.tagColor}-500 bg-${tpl.tagColor}-50/30 ring-1 ring-${tpl.tagColor}-500` : 'border-gray-200 bg-white hover:border-gray-300'}
              `}
              style={isSelected && tpl.tagColor === 'purple' ? { borderColor: '#8b5cf6', backgroundColor: '#f5f3ff' } : 
                     isSelected && tpl.tagColor === 'blue' ? { borderColor: '#3b82f6', backgroundColor: '#eff6ff' } : 
                     isSelected && tpl.tagColor === 'green' ? { borderColor: '#10b981', backgroundColor: '#ecfdf5' } : {}}
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
              <div className="text-[12px] text-gray-500 leading-relaxed min-h-[40px]">
                {tpl.desc}
              </div>
              {tpl.layoutPreview}
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
    </div>
  );
}
