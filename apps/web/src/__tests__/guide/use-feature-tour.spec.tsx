import React from 'react';
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { useFeatureTour } from '../../hooks/use-feature-tour';
import { useTourStore } from '../../store/tour.store';

function Probe({ id }: { id: string }) {
  const tour = useFeatureTour(id);
  return (
    <div>
      <span data-testid="open">{String(tour.open)}</span>
      <button onClick={tour.close}>close</button>
    </div>
  );
}

const renderAt = (entry: string, id: string) =>
  render(
    <MemoryRouter initialEntries={[entry]}>
      <Probe id={id} />
    </MemoryRouter>,
  );

describe('useFeatureTour', () => {
  beforeEach(() => act(() => useTourStore.getState().endTour()));

  it('opens when ?tour= matches the tourId', () => {
    renderAt('/x?tour=dashboard', 'dashboard');
    expect(screen.getByTestId('open').textContent).toBe('true');
  });

  it('does NOT open for a different tourId', () => {
    renderAt('/x?tour=other', 'dashboard');
    expect(screen.getByTestId('open').textContent).toBe('false');
  });

  it('opens when the tour store matches', () => {
    renderAt('/x', 'dashboard');
    expect(screen.getByTestId('open').textContent).toBe('false');
    act(() => useTourStore.getState().startTour('dashboard'));
    expect(screen.getByTestId('open').textContent).toBe('true');
  });

  it('close() closes the tour and clears the store', () => {
    renderAt('/x?tour=dashboard', 'dashboard');
    fireEvent.click(screen.getByText('close'));
    expect(screen.getByTestId('open').textContent).toBe('false');
    expect(useTourStore.getState().activeTour).toBeNull();
  });
});
