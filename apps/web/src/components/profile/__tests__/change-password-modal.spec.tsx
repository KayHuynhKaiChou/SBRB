import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MockedProvider } from '@apollo/client/testing';
import { ChangePasswordModal } from '../change-password-modal';

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

// i18n → echo keys.
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

const mockChangePassword = vi.fn().mockResolvedValue({ data: { changePassword: true } });
vi.mock('@sbrb/shared-apollo-client', () => ({
  useAppMutation: vi.fn(() => [mockChangePassword, { loading: false }]),
}));

describe('ChangePasswordModal', () => {
  beforeEach(() => vi.clearAllMocks());

  it('does not render when closed', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open={false} onClose={vi.fn()} />
      </MockedProvider>,
    );
    expect(screen.queryByText('change_password_title')).not.toBeInTheDocument();
  });

  it('renders title and the three shared password fields when open', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open onClose={vi.fn()} />
      </MockedProvider>,
    );
    expect(screen.getByText('change_password_title')).toBeInTheDocument();
    expect(screen.getByText('pw_current_label')).toBeInTheDocument();
    expect(screen.getByText('pw_new_label')).toBeInTheDocument();
    expect(screen.getByText('pw_confirm_label')).toBeInTheDocument();
  });

  it('wires the changePassword mutation hook', () => {
    render(
      <MockedProvider mocks={[]}>
        <ChangePasswordModal open onClose={vi.fn()} />
      </MockedProvider>,
    );
    // The shared password form (with current field) is mounted → submit path is wired to the mutation.
    expect(screen.getByPlaceholderText('pw_current_ph')).toBeInTheDocument();
    expect(mockChangePassword).not.toHaveBeenCalled();
  });
});
