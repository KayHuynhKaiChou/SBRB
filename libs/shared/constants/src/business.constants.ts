/** Business domain constants — onboarding form options, unit presets. */

export const INDUSTRIES = [
  'Bán lẻ',
  'Nhà hàng / F&B',
  'Dịch vụ',
  'Sản xuất',
  'Công nghệ',
  'Giáo dục',
  'Y tế',
  'Khác',
] as const;
export type TIndustry = (typeof INDUSTRIES)[number];

export const CURRENCIES = [
  { value: 'VND', label: 'VND — Đồng Việt Nam' },
  { value: 'USD', label: 'USD — Đô la Mỹ' },
  { value: 'EUR', label: 'EUR — Euro' },
] as const;

/** Preset unit options for the widget unit selector. */
export const UNIT_PRESETS = ['VND', 'USD', 'EUR', '%', 'Người', 'Điểm'] as const;
export type TUnitPreset = (typeof UNIT_PRESETS)[number];
