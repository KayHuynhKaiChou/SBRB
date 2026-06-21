import '@testing-library/jest-dom';
import { describe, it, expect, vi } from 'vitest';
import { Button, Form } from 'antd';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { PasswordForm } from '../password-form';

// antd reads window.matchMedia — polyfill for jsdom.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
});

// i18n → echo keys so assertions can target them.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

function Harness({ requireCurrent = false }: { requireCurrent?: boolean }) {
  const [form] = Form.useForm();
  return (
    <Form form={form} onFinish={() => undefined}>
      <PasswordForm requireCurrent={requireCurrent} />
      <Button htmlType="submit">submit</Button>
    </Form>
  );
}

describe('PasswordForm', () => {
  it('hides the current-password field by default', () => {
    render(<Harness />);
    expect(screen.queryByText('pw_current_label')).not.toBeInTheDocument();
    expect(screen.getByText('pw_new_label')).toBeInTheDocument();
    expect(screen.getByText('pw_confirm_label')).toBeInTheDocument();
  });

  it('shows the current-password field when requireCurrent', () => {
    render(<Harness requireCurrent />);
    expect(screen.getByText('pw_current_label')).toBeInTheDocument();
  });

  it('rejects a password that violates the policy (no uppercase/digit)', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await user.type(screen.getByPlaceholderText('pw_new_ph'), 'lowercaseonly');
    await user.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(screen.getByText('pw_policy')).toBeInTheDocument(), { timeout: 5000 });
  });

  it('rejects when confirm does not match new password', async () => {
    const user = userEvent.setup({ delay: null });
    render(<Harness />);
    await user.type(screen.getByPlaceholderText('pw_new_ph'), 'ValidPass1');
    await user.type(screen.getByPlaceholderText('pw_confirm_ph'), 'Different1');
    await user.click(screen.getByRole('button', { name: 'submit' }));
    await waitFor(() => expect(screen.getByText('pw_mismatch')).toBeInTheDocument(), { timeout: 5000 });
  });
});
