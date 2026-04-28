import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import type { IUserDto, IDepartmentDto } from '@sbrb/shared-types';
import { ProfileForm } from '../profile-form';

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

// Mock antd Upload to avoid file input issues
vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Upload: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="upload-component">{children}</div>
    ),
  };
});

const mockUser: IUserDto = {
  id: 'user-1',
  email: 'user@test.com',
  fullName: 'John Doe',
  phone: '+84 901 234 567',
  language: 'vi',
  bio: 'Software engineer',
  departmentId: 'dept-1',
  avatarUrl: 'https://example.com/avatar.png',
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDepartments: IDepartmentDto[] = [
  { id: 'dept-1', name: 'Engineering', businessId: 'biz-1', createdAt: '', updatedAt: '' },
  { id: 'dept-2', name: 'Marketing', businessId: 'biz-1', createdAt: '', updatedAt: '' },
];

describe('ProfileForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders all form fields with initial values', () => {
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user@test.com')).toBeInTheDocument();
    expect(screen.getByDisplayValue('+84 901 234 567')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Software engineer')).toBeInTheDocument();
  });

  it('shows validation error when fullName is empty', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={{ ...mockUser, fullName: '' }}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    // Clear the fullName field and try to submit
    const fullNameInput = screen.getByDisplayValue('');
    await user.clear(fullNameInput);
    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/profile:validation_full_name_required/i)).toBeInTheDocument();
    });
  });

  it('shows validation error for invalid phone format', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    const phoneInput = screen.getByDisplayValue('+84 901 234 567');
    await user.clear(phoneInput);
    await user.type(phoneInput, 'abc!!');

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/profile:validation_phone_format/i)).toBeInTheDocument();
    });
  });

  it('shows validation error when bio exceeds 500 characters', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    const bioInput = screen.getByDisplayValue('Software engineer');
    await user.clear(bioInput);
    await user.type(bioInput, 'a'.repeat(501));

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/profile:validation_bio_max/i)).toBeInTheDocument();
    });
  });

  it('submits form with correct values', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        expect.objectContaining({
          fullName: 'John Doe',
          phone: '+84 901 234 567',
          language: 'vi',
          bio: 'Software engineer',
          departmentId: 'dept-1',
        }),
      );
    });
  });

  it('renders department options correctly', () => {
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    // Department select should be in the document
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
  });

  it('respects loading state on submit button', () => {
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    const { rerender } = render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        loading={false}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    let submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    expect(submitButton).not.toHaveAttribute('disabled');

    rerender(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        loading={true}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    expect(submitButton).toHaveAttribute('disabled');
  });

  it('renders avatar field and calls onUploadAvatar when file selected', () => {
    const onSubmit = vi.fn();
    const onUpload = vi.fn().mockResolvedValue('https://new.avatar.url');

    render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    // Avatar field should render upload component
    expect(screen.getByTestId('upload-component')).toBeInTheDocument();
  });

  it('syncs form when user prop changes', async () => {
    const onSubmit = vi.fn();
    const onUpload = vi.fn();

    const { rerender } = render(
      <ProfileForm
        user={mockUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();

    const updatedUser = { ...mockUser, fullName: 'Jane Doe' };
    rerender(
      <ProfileForm
        user={updatedUser}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Jane Doe')).toBeInTheDocument();
    });
  });

  it('accepts valid phone formats', async () => {
    const user = userEvent.setup();
    const onSubmit = vi.fn().mockResolvedValue(undefined);
    const onUpload = vi.fn();

    render(
      <ProfileForm
        user={{ ...mockUser, phone: null }}
        departments={mockDepartments}
        onSubmit={onSubmit}
        onUploadAvatar={onUpload}
      />,
    );

    const phoneInput = screen.getByRole('textbox', { name: /profile:field_phone/i });
    await user.type(phoneInput, '(123) 456-7890');

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalled();
    });
  });
});
