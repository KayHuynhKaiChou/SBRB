import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

vi.mock('antd', () => ({
  Segmented: ({ options, value, onChange, disabled, 'data-testid': testId }: any) => (
    <div data-testid={testId}>
      {options.map((opt: any) => (
        <button
          key={opt.value}
          data-testid={`${testId}-${opt.value}`}
          data-selected={value === opt.value}
          disabled={disabled}
          onClick={() => !disabled && onChange?.(opt.value)}
        >
          {typeof opt.label === 'string' ? opt.label : opt.icon ?? opt.value}
        </button>
      ))}
    </div>
  ),
}));

vi.mock('@ant-design/icons', () => ({
  BarChartOutlined: () => <span>bar-icon</span>,
  LineChartOutlined: () => <span>line-icon</span>,
}));

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

import { SeriesTypeAxisToggle } from '../../components/widget/settings-panel/series-type-axis-toggle';

describe('SeriesTypeAxisToggle', () => {
  const defaultProps = {
    chartType: 'bar' as const,
    yAxis: 'left' as const,
    onTypeChange: vi.fn(),
    onAxisChange: vi.fn(),
  };

  it('renders both segmented controls', () => {
    render(<SeriesTypeAxisToggle {...defaultProps} />);
    // Segmented mock renders data-testid=undefined for both since component
    // doesn't pass data-testid — verify by presence of buttons
    const buttons = screen.getAllByRole('button');
    // 2 type options (bar, line) + 2 axis options (left, right) = 4 buttons
    expect(buttons).toHaveLength(4);
  });

  it('fires onTypeChange when type button clicked', () => {
    const onTypeChange = vi.fn();
    render(<SeriesTypeAxisToggle {...defaultProps} onTypeChange={onTypeChange} />);
    const buttons = screen.getAllByRole('button');
    // buttons[1] is "line" in the type segmented
    fireEvent.click(buttons[1]);
    expect(onTypeChange).toHaveBeenCalledWith('line');
  });

  it('fires onAxisChange when axis button clicked', () => {
    const onAxisChange = vi.fn();
    render(<SeriesTypeAxisToggle {...defaultProps} onAxisChange={onAxisChange} />);
    const buttons = screen.getAllByRole('button');
    // buttons[3] is "right" in the axis segmented
    fireEvent.click(buttons[3]);
    expect(onAxisChange).toHaveBeenCalledWith('right');
  });

  it('disables all buttons when disabled=true', () => {
    render(<SeriesTypeAxisToggle {...defaultProps} disabled />);
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => {
      expect((btn as HTMLButtonElement).disabled).toBe(true);
    });
  });

  it('does not fire callbacks when disabled', () => {
    const onTypeChange = vi.fn();
    const onAxisChange = vi.fn();
    render(
      <SeriesTypeAxisToggle
        {...defaultProps}
        disabled
        onTypeChange={onTypeChange}
        onAxisChange={onAxisChange}
      />,
    );
    const buttons = screen.getAllByRole('button');
    buttons.forEach((btn) => fireEvent.click(btn));
    expect(onTypeChange).not.toHaveBeenCalled();
    expect(onAxisChange).not.toHaveBeenCalled();
  });
});
