import React from 'react';
import { Modal, Form } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { IconButton } from './icon-button';

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
 * Handles validateFields, resetFields, and close on submit.
 * Footer: save (CheckOutlined) + close (CloseOutlined) IconButtons.
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
  centered,
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
      title={title}
      open={open}
      onCancel={handleCancel}
      width={width}
      closable={false}
      style={modalStyle}
      destroyOnClose={destroyOnClose}
      centered={centered}
      footer={
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
          <IconButton icon={<CheckOutlined />} tooltip={okText} size="small" onClick={handleOk} />
          <IconButton icon={<CloseOutlined />} tooltip={cancelText} size="small" onClick={handleCancel} />
        </div>
      }
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        {children}
      </Form>
    </Modal>
  );
}
