import { describe, it, expect, vi, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Form } from 'antd';
import { BusinessKybFields } from '../business-kyb-fields';

// antd's responsive grid/select reads window.matchMedia — polyfill it for jsdom.
beforeAll(() => {
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
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

// Stub the asset upload (pulls an Apollo hook we don't want in this unit test).
vi.mock('../business-asset-upload', () => ({
  BusinessAssetUpload: ({ disabled }: { disabled?: boolean }) => (
    <div data-testid="asset-upload" data-disabled={String(!!disabled)} />
  ),
}));

const renderInForm = (props = {}) =>
  render(
    <Form>
      <BusinessKybFields {...props} />
    </Form>,
  );

// jest-dom isn't wired up in this repo — assert with plain DOM properties.
const input = (ph: string) => screen.getByPlaceholderText(ph) as HTMLInputElement;

describe('BusinessKybFields', () => {
  it('renders the core KYB inputs', () => {
    renderInForm();
    // getByPlaceholderText throws if absent, so reaching here proves presence.
    expect(input('field_name_ph')).toBeTruthy();
    expect(input('field_tax_code_ph')).toBeTruthy();
  });

  it('inputs are editable by default', () => {
    renderInForm();
    expect(input('field_name_ph').disabled).toBe(false);
  });

  it('disables every input + upload when readOnly', () => {
    renderInForm({ readOnly: true });
    expect(input('field_name_ph').disabled).toBe(true);
    expect(input('field_legal_name_ph').disabled).toBe(true);
    const uploads = screen.getAllByTestId('asset-upload');
    expect(uploads.length).toBeGreaterThan(0);
    uploads.forEach((el) => expect(el.getAttribute('data-disabled')).toBe('true'));
  });

  it('hides the upload block when hideAssets is set', () => {
    renderInForm({ hideAssets: true });
    expect(screen.queryByTestId('asset-upload')).toBeNull();
  });
});
