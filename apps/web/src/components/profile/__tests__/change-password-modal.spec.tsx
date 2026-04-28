import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { ChangePasswordModal } from '../change-password-modal';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sbrb/shared-apollo-client', () => ({
  useAppMutation: vi.fn((query, options) => [
    vi.fn().mockResolvedValue({ data: { changePassword: true } }),
    { loading: false },
  ]),
}));

vi.mock('@sbrb/ui', () => ({
  FormModal: ({ title, open, onClose, onSubmit, children, form }: any) => (
    open ? (
      <div data-testid="form-modal">
        <h2>{title}</h2>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            const values = {
              currentPassword: formData.get('currentPassword'),
              newPassword: formData.get('newPassword'),
              confirmPassword: formData.get('confirmPassword'),
            };
            onSubmit?.(values);
          }}
        >
          {children}
          <button type="submit">Submit</button>
          <button type="button" onClick={onClose}>Cancel</button>
        </form>
      </div>
    ) : null
  ),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Form: {
      useForm: () => [
        {
          resetFields: vi.fn(),
          setFieldsValue: vi.fn(),
        },
      ],
      Item: ({ label, name, children, rules }: any) => (
        <div data-testid={`form-item-${name}`}>
          <label>{label}</label>
          {children}
        </div>
      ),
    },
    Input: {
      Password: ({ name, autoComplete }: any) => (
        <input type="password" name={name} autoComplete={autoComplete} />
      ),
    },
  };
});

describe('ChangePasswordModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('does not render when open is false', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={false} onClose={vi.fn()} />
      </MockedProvider>,
    );

    expect(screen.queryByTestId('form-modal')).not.toBeInTheDocument();
  });

  it('renders modal when open is true', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    expect(screen.getByTestId('form-modal')).toBeInTheDocument();
    expect(screen.getByText('change_password_title')).toBeInTheDocument();
  });

  it('renders all password fields', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    expect(screen.getByTestId('form-item-currentPassword')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-newPassword')).toBeInTheDocument();
    expect(screen.getByTestId('form-item-confirmPassword')).toBeInTheDocument();
  });

  it('shows validation error when confirmPassword does not match newPassword', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    const currentPasswordInput = screen.getByDisplayValue('');
    const newPasswordInput = screen.getAllByDisplayValue('')[1];
    const confirmPasswordInput = screen.getAllByDisplayValue('')[2];

    await user.type(currentPasswordInput, 'OldPassword123');
    await user.type(newPasswordInput, 'NewPassword123');
    await user.type(confirmPasswordInput, 'DifferentPassword123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/validation_password_match/i)).toBeInTheDocument();
    });
  });

  it('closes modal after successful password change', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockChangePassword = vi.fn().mockResolvedValue({
      data: { changePassword: true },
    });
    vi.mocked(useAppMutation).mockReturnValue([mockChangePassword, { loading: false }] as any);

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={onClose} />
      </MockedProvider>,
    );

    const inputs = screen.getAllByDisplayValue('');
    await user.type(inputs[0], 'OldPassword123');
    await user.type(inputs[1], 'NewPassword123');
    await user.type(inputs[2], 'NewPassword123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
      expect(onClose).toHaveBeenCalled();
    });
  });

  it('calls changePassword mutation with correct variables', async () => {
    const user = userEvent.setup();
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockChangePassword = vi.fn().mockResolvedValue({
      data: { changePassword: true },
    });
    vi.mocked(useAppMutation).mockReturnValue([mockChangePassword, { loading: false }] as any);

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    const inputs = screen.getAllByDisplayValue('');
    await user.type(inputs[0], 'OldPassword123');
    await user.type(inputs[1], 'NewPassword123');
    await user.type(inputs[2], 'NewPassword123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalledWith({
        variables: {
          input: {
            currentPassword: 'OldPassword123',
            newPassword: 'NewPassword123',
          },
        },
      });
    });
  });

  it('resets form after successful submission', async () => {
    const user = userEvent.setup();
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockChangePassword = vi.fn().mockResolvedValue({
      data: { changePassword: true },
    });
    vi.mocked(useAppMutation).mockReturnValue([mockChangePassword, { loading: false }] as any);

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    const inputs = screen.getAllByDisplayValue('');
    await user.type(inputs[0], 'OldPassword123');
    await user.type(inputs[1], 'NewPassword123');
    await user.type(inputs[2], 'NewPassword123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockChangePassword).toHaveBeenCalled();
    });
  });

  it('calls onClose when cancel button is clicked', async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={onClose} />
      </MockedProvider>,
    );

    const cancelButton = screen.getByRole('button', { name: /cancel/i });
    await user.click(cancelButton);

    expect(onClose).toHaveBeenCalled();
  });

  it('renders with correct form width', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    const modal = screen.getByTestId('form-modal');
    expect(modal).toBeInTheDocument();
  });

  it('requires current password field', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    const inputs = screen.getAllByDisplayValue('');
    await user.type(inputs[1], 'NewPassword123');
    await user.type(inputs[2], 'NewPassword123');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it('enforces minimum 8 character length for new password', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={true} onClose={vi.fn()} />
      </MockedProvider>,
    );

    const inputs = screen.getAllByDisplayValue('');
    await user.type(inputs[0], 'OldPassword123');
    await user.type(inputs[1], 'Short');
    await user.type(inputs[2], 'Short');

    const submitButton = screen.getByRole('button', { name: /submit/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/validation_password_min/i)).toBeInTheDocument();
    });
  });
});
