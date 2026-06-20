import { Modal, Table, Alert } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useTranslation } from 'react-i18next';

export type TemplateType = 'simple' | 'department' | 'pnl';

interface IPreviewRow {
  key: string;
  label: string;
  /** Three monthly values; null renders blank (e.g. group / parent header rows). */
  values: (number | null)[];
  /** Indent level for the label column (P&L children, department metrics). */
  indent?: number;
  /** Bold the label (group / parent rows). */
  bold?: boolean;
}

/**
 * Illustrative-only sample data per template type. NOT real — it just shows the user
 * how each Excel structure looks (flat / grouped by department / indented P&L tree).
 */
const SAMPLE_ROWS: Record<TemplateType, IPreviewRow[]> = {
  simple: [
    { key: 's1', label: 'Doanh thu', values: [5000, 6000, 5500] },
    { key: 's2', label: 'Lợi nhuận', values: [1000, 1500, 1200] },
    { key: 's3', label: 'Chi phí', values: [4000, 4500, 4300] },
  ],
  department: [
    { key: 'd1', label: 'Phòng ban A', values: [null, null, null], bold: true },
    { key: 'd2', label: 'Doanh thu', values: [500, 600, 700], indent: 1 },
    { key: 'd3', label: 'Chi phí', values: [200, 250, 300], indent: 1 },
    { key: 'd4', label: 'Phòng ban B', values: [null, null, null], bold: true },
    { key: 'd5', label: 'Doanh thu', values: [800, 900, 1000], indent: 1 },
    { key: 'd6', label: 'Chi phí', values: [350, 400, 420], indent: 1 },
  ],
  pnl: [
    { key: 'p1', label: 'Tổng doanh thu', values: [null, null, null], bold: true },
    { key: 'p2', label: 'Bán lẻ', values: [800, 900, 1000], indent: 1 },
    { key: 'p3', label: 'Bán sỉ', values: [1200, 1300, 1400], indent: 1 },
    { key: 'p4', label: 'Tổng chi phí', values: [null, null, null], bold: true },
    { key: 'p5', label: 'Lương', values: [500, 550, 600], indent: 1 },
    { key: 'p6', label: 'Thuê mặt bằng', values: [300, 300, 300], indent: 1 },
  ],
};

interface IImportTemplatePreviewModalProps {
  /** When null the modal is closed; otherwise previews this template type. */
  templateType: TemplateType | null;
  onClose: () => void;
}

export function ImportTemplatePreviewModal({
  templateType,
  onClose,
}: IImportTemplatePreviewModalProps) {
  const { t } = useTranslation('datasheet');

  const rows = templateType ? SAMPLE_ROWS[templateType] : [];

  const columns: ColumnsType<IPreviewRow> = [
    {
      title: t('preview_col_item'),
      dataIndex: 'label',
      key: 'label',
      render: (label: string, row) => (
        <span
          className={row.bold ? 'font-semibold' : ''}
          style={{ paddingLeft: (row.indent ?? 0) * 20 }}
        >
          {row.indent ? '↳ ' : ''}
          {label}
        </span>
      ),
    },
    ...[0, 1, 2].map((i) => ({
      title: t('preview_month', { n: i + 1 }),
      dataIndex: ['values', i],
      key: `m${i}`,
      align: 'right' as const,
      render: (_: unknown, row: IPreviewRow) =>
        row.values[i] == null ? '' : row.values[i]?.toLocaleString(),
    })),
  ];

  const hintKey =
    templateType === 'department'
      ? 'preview_department_hint'
      : templateType === 'pnl'
        ? 'preview_pnl_hint'
        : 'preview_simple_hint';

  return (
    <Modal
      open={templateType !== null}
      onCancel={onClose}
      footer={null}
      title={t('preview_modal_title')}
      width={640}
    >
      {templateType && (
        <div className="flex flex-col gap-3">
          <Alert type="info" showIcon message={t(hintKey)} />
          <Table
            size="small"
            columns={columns}
            dataSource={rows}
            pagination={false}
            bordered
          />
          <span className="text-12 text-gray-400 italic">{t('preview_disclaimer')}</span>
        </div>
      )}
    </Modal>
  );
}
