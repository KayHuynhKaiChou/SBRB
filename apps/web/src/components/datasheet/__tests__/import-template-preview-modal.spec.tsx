import '@testing-library/jest-dom/vitest';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';

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

vi.mock('react-i18next', () => ({ useTranslation: () => ({ t: (k: string) => k }) }));

import { ImportTemplatePreviewModal } from '../import-template-preview-modal';

describe('ImportTemplatePreviewModal', () => {
  it('renders nothing visible when templateType is null', () => {
    render(<ImportTemplatePreviewModal templateType={null} onClose={() => {}} />);
    expect(screen.queryByText('Doanh thu')).toBeNull();
  });

  it('shows the simple sample rows', () => {
    render(<ImportTemplatePreviewModal templateType="simple" onClose={() => {}} />);
    expect(screen.getByText('Doanh thu')).toBeInTheDocument();
    expect(screen.getByText('Lợi nhuận')).toBeInTheDocument();
  });

  it('shows department group rows', () => {
    render(<ImportTemplatePreviewModal templateType="department" onClose={() => {}} />);
    expect(screen.getByText('Phòng ban A')).toBeInTheDocument();
    expect(screen.getByText('Phòng ban B')).toBeInTheDocument();
  });

  it('shows P&L parent + indented child rows', () => {
    render(<ImportTemplatePreviewModal templateType="pnl" onClose={() => {}} />);
    expect(screen.getByText('Tổng doanh thu')).toBeInTheDocument();
    // Child rows render with an indent marker, e.g. "↳ Bán lẻ".
    expect(screen.getByText(/Bán lẻ/)).toBeInTheDocument();
  });
});
