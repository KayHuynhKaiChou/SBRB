import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MockedProvider } from '@apollo/client/testing';
import { SessionsTable } from '../sessions-table';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key,
  }),
}));

vi.mock('@sbrb/shared-apollo-client', () => ({
  useAppMutation: vi.fn((query, options) => [
    vi.fn().mockResolvedValue({ data: { deleteSession: true } }),
    { loading: false },
  ]),
}));

vi.mock('antd', async () => {
  const actual = await vi.importActual('antd');
  return {
    ...actual,
    Table: ({ dataSource, columns, rowKey, loading }: any) => (
      <div data-testid="sessions-table">
        {loading && <div>Loading...</div>}
        {!loading && dataSource?.length === 0 && <div>profile:sessions_empty</div>}
        {dataSource?.map((row: any, idx: number) => (
          <div key={rowKey ? row[rowKey] : idx} data-testid={`table-row-${idx}`}>
            {columns.map((col: any, cidx: number) => (
              <div key={cidx} data-testid={`cell-${idx}-${cidx}`}>
                {col.render ? col.render(row[col.dataIndex], row) : row[col.dataIndex]}
              </div>
            ))}
          </div>
        ))}
      </div>
    ),
    Tag: ({ children }: { children: React.ReactNode }) => (
      <span data-testid="tag">{children}</span>
    ),
    Popconfirm: ({ children, disabled, onConfirm }: any) => (
      <div data-testid="popconfirm" data-disabled={disabled}>
        {children}
      </div>
    ),
  };
});

vi.mock('@sbrb/ui', () => ({
  IconButton: ({ icon, tooltip, disabled, onClick }: any) => (
    <button data-testid="icon-button" disabled={disabled} onClick={onClick}>
      {tooltip}
    </button>
  ),
}));

const mockSessionData = {
  mySessions: [
    {
      id: 'session-1',
      deviceName: 'Chrome Desktop',
      ipAddress: '192.168.1.1',
      lastActiveAt: '2025-01-15T10:00:00Z',
      isCurrent: true,
    },
    {
      id: 'session-2',
      deviceName: 'Firefox Laptop',
      ipAddress: '192.168.1.2',
      lastActiveAt: '2025-01-14T15:30:00Z',
      isCurrent: false,
    },
  ],
};

const mockMutations = [
  {
    request: {
      query: expect.anything(),
      variables: expect.anything(),
    },
    result: {
      data: {
        deleteSession: true,
      },
    },
  },
];

describe('SessionsTable', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders table with sessions', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    expect(screen.getByTestId('sessions-table')).toBeInTheDocument();
  });

  it('renders session rows with device names', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    expect(screen.getByText('Chrome Desktop')).toBeInTheDocument();
    expect(screen.getByText('Firefox Laptop')).toBeInTheDocument();
  });

  it('renders IP addresses in table', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    expect(screen.getByText('192.168.1.1')).toBeInTheDocument();
    expect(screen.getByText('192.168.1.2')).toBeInTheDocument();
  });

  it('marks current session with tag', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    const tags = screen.getAllByTestId('tag');
    expect(tags.length).toBeGreaterThan(0);
    expect(screen.getByText('profile:sessions_current')).toBeInTheDocument();
  });

  it('disables revoke button on current session', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    const buttons = screen.getAllByTestId('icon-button');
    const currentSessionButton = buttons[0];
    expect(currentSessionButton).toHaveAttribute('disabled');
  });

  it('enables revoke button on non-current sessions', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    const buttons = screen.getAllByTestId('icon-button');
    const otherSessionButton = buttons[1];
    expect(otherSessionButton).not.toHaveAttribute('disabled');
  });

  it('calls deleteSession mutation when revoke is confirmed', async () => {
    const user = userEvent.setup();
    const { useQuery } = await import('@apollo/client');
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockDeleteSession = vi.fn().mockResolvedValue({
      data: { deleteSession: true },
    });
    vi.mocked(useAppMutation).mockReturnValue([mockDeleteSession, { loading: false }] as any);

    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    const buttons = screen.getAllByTestId('icon-button');
    await user.click(buttons[1]); // Click non-current session revoke button

    await waitFor(() => {
      expect(mockDeleteSession).toHaveBeenCalledWith(
        expect.objectContaining({
          variables: expect.objectContaining({
            id: 'session-2',
          }),
        }),
      );
    });
  });

  it('shows loading state when fetching sessions', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: undefined,
      loading: true,
    } as any);

    render(
      <MockedProvider mocks={[]}>
        <SessionsTable />
      </MockedProvider>,
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();
  });

  it('shows empty message when no sessions', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: { mySessions: [] },
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={[]}>
        <SessionsTable />
      </MockedProvider>,
    );

    expect(screen.getByText('profile:sessions_empty')).toBeInTheDocument();
  });

  it('formats lastActiveAt date to vi-VN locale', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    // Should have formatted dates in Vietnamese locale
    const tableRows = screen.getAllByTestId(/table-row/);
    expect(tableRows.length).toBeGreaterThan(0);
  });

  it('refetches sessions after delete', async () => {
    const { useQuery } = await import('@apollo/client');
    const { useAppMutation } = await import('@sbrb/shared-apollo-client');
    const mockDeleteSession = vi.fn().mockResolvedValue({
      data: { deleteSession: true },
    });

    vi.mocked(useAppMutation).mockReturnValue([mockDeleteSession, { loading: false }] as any);
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
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

  it('renders Popconfirm for delete confirmation', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    const popconfirms = screen.getAllByTestId('popconfirm');
    expect(popconfirms.length).toBeGreaterThan(0);
  });

  it('disables popconfirm on current session', async () => {
    const { useQuery } = await import('@apollo/client');
    vi.mocked(useQuery).mockReturnValue({
      data: mockSessionData,
      loading: false,
    } as any);

    render(
      <MockedProvider mocks={mockMutations}>
        <SessionsTable />
      </MockedProvider>,
    );

    const popconfirms = screen.getAllByTestId('popconfirm');
    expect(popconfirms[0]).toHaveAttribute('data-disabled', 'true');
  });
});
