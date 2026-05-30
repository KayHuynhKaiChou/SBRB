import React from 'react';
import { Modal, Form, Typography } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { IconButton } from './icon-button';
import { MODAL_BODY_SCROLL } from '../modal.constants';

const { Text } = Typography;

interface IFormModalProps<T> {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: T) => Promise<void>;
  children: React.ReactNode;
  okText?: string;
  cancelText?: string;
  width?: number | string;
  form?: ReturnType<typeof Form.useForm>[0];
  initialValues?: Record<string, unknown>;
  modalStyle?: React.CSSProperties;
  destroyOnClose?: boolean;
  centered?: boolean;
}

/**
 * Generic form modal wrapping Ant Modal + Form.
 * Header row: title + IconButton save (check) + IconButton close.
 * No default antd X — uses project-standard IconButton pattern.
 */
export function FormModal<T>({
  title,
  open,
  onClose,
  onSubmit,
  children,
  okText = 'Save',
  cancelText = 'Close',
  width = 480,
  form: externalForm,
  initialValues,
  modalStyle,
  destroyOnClose,
  centered = true,
}: IFormModalProps<T>) {
  const [internalForm] = Form.useForm();
  const form = externalForm ?? internalForm;

  const handleOk = async () => {
    try {
      const values = (await form.validateFields()) as T;
      await onSubmit(values);
      form.resetFields();
      onClose();
    } catch {
      // validation errors shown inline by Ant Design Form
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onClose();
  };

  return (
    <Modal
      open={open}
      onCancel={handleCancel}
      width={width}
      closable={false}
      style={modalStyle}
      destroyOnHidden={destroyOnClose}
      centered={centered}
      footer={null}
      styles={{ body: { padding: 0 } }}
      classNames={{ body: MODAL_BODY_SCROLL }}
    >
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-3">
        <Text strong className="!text-[15px] !flex-1">
          {title}
        </Text>
        <div className="flex gap-2">
          <IconButton
            icon={<CheckOutlined />}
            tooltip={okText}
            size="small"
            onClick={handleOk}
          />
          <IconButton
            icon={<CloseOutlined />}
            tooltip={cancelText}
            size="small"
            onClick={handleCancel}
          />
        </div>
      </div>
      <Form form={form} layout="vertical" initialValues={initialValues} className="px-5 py-4">
        {children}
      </Form>
    </Modal>
  );
}
