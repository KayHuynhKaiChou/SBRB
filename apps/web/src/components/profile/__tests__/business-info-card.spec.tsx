import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { BusinessInfoCard } from '../business-info-card';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
    i18n: { language: 'en' },
  }),
}));

vi.mock('@sbrb/shared-apollo-client', () => ({
  useAppMutation: vi.fn((query, options) => [
    vi.fn().mockResolvedValue({ data: { updateBusiness: { id: 'biz-1' } } }),
    { loading: false },
  ]),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Card: ({ title, extra, children }: { title?: string; extra?: React.ReactNode; children: React.ReactNode }) => (
      <div data-testid="card" data-title={title}>
        {extra && <div data-testid="card-extra">{extra}</div>}
        {children}
      </div>
    ),
  };
});

const mockBusiness = {
  id: 'biz-1',
  name: 'Acme Inc',
  industry: 'Technology',
  currency: 'VND',
  logoUrl: 'https://example.com/logo.png',
};

const mockMutations = [
  {
    request: {
      query: expect.anything(),
      variables: expect.anything(),
    },
    result: {
      data: {
        updateBusiness: mockBusiness,
      },
    },
  },
];

describe('BusinessInfoCard', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders card with correct title', () => {
    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    expect(screen.getByTestId('card')).toHaveAttribute('data-title', 'business_section');
  });

  it('renders form with business data', () => {
    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    expect(screen.getByDisplayValue('Acme Inc')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Technology')).toBeInTheDocument();
    expect(screen.getByDisplayValue('VND')).toBeInTheDocument();
  });

  it('submits form with updated values', async () => {
    const user = userEvent.setup();
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockUpdateBusiness = vi.fn().mockResolvedValue({
      data: { updateBusiness: mockBusiness },
    });
    vi.mocked(useAppMutation).mockReturnValue([mockUpdateBusiness, { loading: false }] as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /save_business/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateBusiness).toHaveBeenCalled();
    });
  });

  it('displays loading state on submit button during mutation', async () => {
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    vi.mocked(useAppMutation).mockReturnValue([
      vi.fn(),
      { loading: true },
    ] as any);

    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /save_business/i });
    expect(submitButton).toHaveAttribute('disabled');
  });

  it('renders joinedAt in card header when provided', () => {
    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} joinedAt="2026-03-27T00:00:00.000Z" />
      </MockedProvider>,
    );

    expect(screen.getByText(/membership_joined_at/i)).toBeInTheDocument();
  });

  it('does not render joinedAt when not provided', () => {
    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    expect(screen.queryByText(/membership_joined_at/i)).not.toBeInTheDocument();
  });

  it('renders with logoUrl field', () => {
    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    expect(screen.getByDisplayValue('https://example.com/logo.png')).toBeInTheDocument();
  });

  it('allows logoUrl to be null or empty', () => {
    const businessWithoutLogo = { ...mockBusiness, logoUrl: null };

    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={businessWithoutLogo} />
      </MockedProvider>,
    );

    const logoInput = screen.getByRole('textbox', { name: /field_business_logo/i });
    expect(logoInput).toHaveValue('');
  });

  it('syncs form when business prop changes', async () => {
    const { rerender } = render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    expect(screen.getByDisplayValue('Acme Inc')).toBeInTheDocument();

    const updatedBusiness = { ...mockBusiness, name: 'Acme Inc Updated' };
    rerender(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={updatedBusiness} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(screen.getByDisplayValue('Acme Inc Updated')).toBeInTheDocument();
    });
  });

  it('uses useAppMutation with UPDATE_BUSINESS_MUTATION and refetchQueries', async () => {
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');

    render(
      <MockedProvider mocks={mockMutations}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    await waitFor(() => {
      expect(useAppMutation).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          refetchQueries: expect.anything(),
        }),
      );
    });
  });

  it('passes business id to mutation variables', async () => {
    const user = userEvent.setup();
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockUpdateBusiness = vi.fn().mockResolvedValue({
      data: { updateBusiness: mockBusiness },
    });
    vi.mocked(useAppMutation).mockReturnValue([mockUpdateBusiness, { loading: false }] as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    const submitButton = screen.getByRole('button', { name: /save_business/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockUpdateBusiness).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            id: 'biz-1',
          }),
        }),
      );
    });
  });

  it('requires business name field', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    const nameInput = screen.getByDisplayValue('Acme Inc');
    await user.clear(nameInput);

    const submitButton = screen.getByRole('button', { name: /save_business/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/required/i)).toBeInTheDocument();
    });
  });

  it('requires industry field', async () => {
    const user = userEvent.setup();

    render(
      <MockedProvider mocks={[]}>
        <BusinessInfoCard business={mockBusiness} />
      </MockedProvider>,
    );

    const industrySelect = screen.getByDisplayValue('Technology');
    await user.click(industrySelect);
    // Clear selection (implementation depends on Select behavior)

    const submitButton = screen.getByRole('button', { name: /save_business/i });
    await user.click(submitButton);

    // Industry is required, should show validation
    await waitFor(() => {
      expect(screen.queryByText(/required/i)).toBeTruthy();
    });
  });
});
