import React, { useState } from 'react';
import { Modal, Button, Alert, Row, Col, Divider } from 'antd';
import { useDataSheets } from '../../hooks/use-datasheet';
import { SheetList } from './sheet-list';
import { SeriesTable } from './series-table';

interface IDataSelectorModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: (dataSheetId: string, selectedSeries: string[], selectedPeriods: string[] | null) => void;
  businessId: string;
}

export function DataSelectorModal({
  open,
  onClose,
  onConfirm,
  businessId,
}: IDataSelectorModalProps) {
  const { dataSheets } = useDataSheets(businessId);
  const [selectedSheetId, setSelectedSheetId] = useState<string | null>(null);
  const [selectedSeries, setSelectedSeries] = useState<string[]>([]);
  const [selectedPeriods, setSelectedPeriods] = useState<string[] | null>(null);
  const [validationError, setValidationError] = useState<string | null>(null);

  const selectedSheet = dataSheets.find((s) => s.id === selectedSheetId);

  const handleSheetSelect = (id: string) => {
    setSelectedSheetId(id);
    setSelectedSeries([]);
    setSelectedPeriods(null);
    setValidationError(null);
  };

  const handleSelectionChange = (series: string[], periods: string[] | null) => {
    setSelectedSeries(series);
    setSelectedPeriods(periods);
    if (series.length > 0) setValidationError(null);
  };

  const handleConfirm = () => {
    if (!selectedSheetId) {
      setValidationError('Vui lòng chọn bộ dữ liệu');
      return;
    }
    if (selectedSeries.length === 0) {
      setValidationError('Vui lòng chọn ít nhất một chuỗi dữ liệu');
      return;
    }
    onConfirm(selectedSheetId, selectedSeries, selectedPeriods);
    handleClose();
  };

  const handleClose = () => {
    setSelectedSheetId(null);
    setSelectedSeries([]);
    setSelectedPeriods(null);
    setValidationError(null);
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleClose}
      width="80vw"
      style={{ top: 40 }}
      title="Chọn dữ liệu"
      footer={[
        <Button key="cancel" onClick={handleClose}>
          Huỷ
        </Button>,
        <Button
          key="confirm"
          type="primary"
          onClick={handleConfirm}
          style={{ background: '#D72A44', borderColor: '#D72A44' }}
        >
          Xác nhận
        </Button>,
      ]}
    >
      {validationError && (
        <Alert
          message={validationError}
          type="error"
          showIcon
          style={{ marginBottom: 12 }}
          closable
          onClose={() => setValidationError(null)}
        />
      )}

      <Row style={{ height: '60vh' }}>
        <Col span={8} style={{ paddingRight: 12, height: '100%', overflowY: 'auto' }}>
          <SheetList
            sheets={dataSheets}
            selected={selectedSheetId}
            onSelect={handleSheetSelect}
          />
        </Col>

        <Col span={1} style={{ display: 'flex', justifyContent: 'center' }}>
          <Divider type="vertical" style={{ height: '100%' }} />
        </Col>

        <Col span={15} style={{ paddingLeft: 12, height: '100%', overflowY: 'auto' }}>
          <SeriesTable
            datasheetId={selectedSheetId}
            selectedSeries={selectedSeries}
            selectedPeriods={selectedPeriods}
            periodHeaders={selectedSheet?.periodHeaders ?? []}
            onSelectionChange={handleSelectionChange}
          />
        </Col>
      </Row>
    </Modal>
  );
}
