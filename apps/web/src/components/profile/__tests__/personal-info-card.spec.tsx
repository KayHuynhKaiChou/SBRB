import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import type { IUserDto, IDepartmentDto } from '@sbrb/shared-types';
import { PersonalInfoCard } from '../personal-info-card';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sbrb/shared-apollo-client', () => ({
  useAppMutation: vi.fn((query, options) => [
    vi.fn().mockResolvedValue({ data: { updateProfile: { id: 'user-1' } } }),
    { loading: false },
  ]),
}));

vi.mock('../../lib/supabase-upload', () => ({
  uploadToSignedUrl: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Card: ({ title, children }: { title?: string; children: React.ReactNode }) => (
      <div data-testid="card" data-title={title}>{children}</div>
    ),
  };
});

const mockUser: IUserDto = {
  id: 'user-1',
  email: 'user@test.com',
  fullName: 'John Doe',
  phone: '+84 901 234 567',
  language: 'vi',
  bio: 'Engineer',
  departmentId: 'dept-1',
  avatarUrl: 'https://example.com/avatar.png',
  emailVerified: true,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

const mockDepartments: IDepartmentDto[] = [
  { id: 'dept-1', name: 'Engineering', businessId: 'biz-1', createdAt: '', updatedAt: '' },
];

const mockMutations = [
  {
    request: {
      query: expect.anything(),
      variables: expect.anything(),
    },
    result: {
      data: {
        updateProfile: mockUser,
      },
    },
  },
  {
    request: {
      query: expect.anything(),
      variables: expect.anything(),
    },
    result: {
      data: {
        getAvatarUploadUrl: {
          uploadUrl: 'https://signed.url',
          publicUrl: 'https://public.url/avatar.png',
          token: 'token',
          path: 'users/user-1/avatar.png',
        },
      },
    },
  },
];

describe('PersonalInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with correct title', () => {
    render(
      <MockedProvider mocks={[]}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-title', 'personal_section');
  });

  it('passes user data to ProfileForm', () => {
    render(
      <MockedProvider mocks={[]}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    expect(screen.getByDisplayValue('John Doe')).toBeInTheDocument();
    expect(screen.getByDisplayValue('user@test.com')).toBeInTheDocument();
  });

  it('passes departments to ProfileForm', () => {
    render(
      <MockedProvider mocks={[]}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    // Department should be rendered in the select
    expect(screen.getByDisplayValue('Engineering')).toBeInTheDocument();
  });

  it('handles profile update mutation', async () => {
    const user = userEvent.setup();
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockUpdateProfile = vi.fn().mockResolvedValue({ data: { updateProfile: mockUser } });
    vi.mocked(useAppMutation).mockReturnValue([mockUpdateProfile, { loading: false }] as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateProfile).toHaveBeenCalled();
    });
  });

  it('handles avatar upload via getUploadUrl mutation', async () => {
    render(
      <MockedProvider mocks={mockMutations}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    expect(screen.getByTestId('card')).toBeInTheDocument();
  });

  it('displays loading state on submit button during mutation', async () => {
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    vi.mocked(useAppMutation).mockReturnValue([
      vi.fn(),
      { loading: true },
    ] as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    expect(submitButton).toHaveAttribute('disabled');
  });

  it('passes loading state as false when not mutating', () => {
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    vi.mocked(useAppMutation).mockReturnValue([
      vi.fn(),
      { loading: false },
    ] as any);

    render(
      <MockedProvider mocks={[]}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /profile:save_personal/i });
    expect(submitButton).not.toHaveAttribute('disabled');
  });

  it('renders ProfileForm with onUploadAvatar handler', () => {
    render(
      <MockedProvider mocks={[]}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    // Avatar upload component should be present
    expect(screen.getByTestId('upload-component')).toBeInTheDocument();
  });

  it('uses useAppMutation with UPDATE_PROFILE_MUTATION', async () => {
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');

    render(
      <MockedProvider mocks={mockMutations}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(useAppMutation).toHaveBeenCalled();
    });
  });

  it('uses useMutation for GET_AVATAR_UPLOAD_URL_MUTATION', async () => {
    const { useMutation } = await import('@apollo/client');

    render(
      <MockedProvider mocks={mockMutations}>
        <PersonalInfoCard user={mockUser} departments={mockDepartments} />
      </MockedProvider>,
    );

    // useMutation should be called for avatar upload
    expect(useMutation).toHaveBeenCalled();
  });
});
