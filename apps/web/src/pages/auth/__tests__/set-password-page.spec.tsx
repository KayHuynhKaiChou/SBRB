import '@testing-library/jest-dom';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SetPasswordPage from '../set-password-page';

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

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

let searchString = '?token=tok&email=staff%40x.com';
vi.mock('react-router-dom', () => ({
  useSearchParams: () => [new URLSearchParams(searchString)],
  useNavigate: () => vi.fn(),
}));

const setAccountPassword = vi.fn().mockResolvedValue(undefined);
vi.mock('../../../hooks/use-auth', () => ({
  useAuth: () => ({ setAccountPassword, setPasswordLoading: false }),
}));

describe('SetPasswordPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    searchString = '?token=tok&email=staff%40x.com';
  });

  it('shows an error when token/email are missing', () => {
    searchString = '';
    render(<SetPasswordPage />);
    expect(screen.getByText('set_password_invalid_token')).toBeInTheDocument();
  });

  it('renders the form with the read-only email from the query', () => {
    render(<SetPasswordPage />);
    expect(screen.getByDisplayValue('staff@x.com')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'set_password_btn' })).toBeInTheDocument();
  });

  it('submits the new password then shows the success screen', async () => {
    const user = userEvent.setup({ delay: null });
    render(<SetPasswordPage />);

    await user.type(screen.getByPlaceholderText('pw_new_ph'), 'ValidPass1');
    await user.type(screen.getByPlaceholderText('pw_confirm_ph'), 'ValidPass1');
    await user.click(screen.getByRole('button', { name: 'set_password_btn' }));

    await vi.waitFor(
      () => {
        expect(setAccountPassword).toHaveBeenCalledWith({
          token: 'tok',
          email: 'staff@x.com',
          password: 'ValidPass1',
        });
        expect(screen.getAllByText('set_password_success_title').length).toBeGreaterThan(0);
      },
      { timeout: 8000 },
    );
  }, 15000);
});
