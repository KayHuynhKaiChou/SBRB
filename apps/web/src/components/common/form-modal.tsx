import React from 'react';
import { Modal, Form } from 'antd';
import { CloseOutlined, CheckOutlined } from '@ant-design/icons';
import { ModalActions } from './modal-actions';

interface IFormModalProps<T> {
  title: string;
  open: boolean;
  onClose: () => void;
  onSubmit: (values: T) => Promise<void>;
  children: React.ReactNode;
  okText?: string;
  cancelText?: string;
  width?: number;
  form?: ReturnType<typeof Form.useForm>[0];
  initialValues?: Record<string, unknown>;
}

/**
 * Generic form modal wrapping Ant Modal + Form.
 * Handles validateFields, resetFields, and close on submit.
 */
export function FormModal<T>({
  title,
  open,
  onClose,
  onSubmit,
  children,
  okText = 'Lưu',
  cancelText = 'Hủy',
  width = 480,
  form: externalForm,
  initialValues,
}: IFormModalProps<T>) {
  const [internalForm] = Form.useForm();
  const form = externalForm ?? internalForm;

  const handleOk = async () => {
    try {
      const values = await form.validateFields() as T;
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
      footer={
        <ModalActions
          actions={[
            { icon: <CheckOutlined />, tooltip: okText, onClick: handleOk },
            { icon: <CloseOutlined />, tooltip: cancelText, onClick: handleCancel },
          ]}
        />
      }
    >
      <Form form={form} layout="vertical" initialValues={initialValues}>
        {children}
      </Form>
    </Modal>
  );
}
