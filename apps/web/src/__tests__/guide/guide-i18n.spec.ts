import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { GUIDE_AREAS } from '../../pages/guide/guide-catalog';

// Anchor to this file → repo root (5 levels up) → read the i18n SOURCE of truth.
const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '../../../../../');
const load = (lng: string): Record<string, string> =>
  JSON.parse(readFileSync(resolve(repoRoot, `libs/i18n/src/locales/${lng}/guide.json`), 'utf8'));

const en = load('en');
const vi = load('vi');

describe('guide i18n', () => {
  it('en and vi have identical key sets', () => {
    expect(Object.keys(vi).sort()).toEqual(Object.keys(en).sort());
  });

  it('every catalog area + feature has title/desc keys in en', () => {
    const keys = new Set(Object.keys(en));
    for (const area of GUIDE_AREAS) {
      expect(keys.has(`area_${area.key}`), `area_${area.key}`).toBe(true);
      for (const f of area.features) {
        expect(keys.has(`feat_${f.key}_title`), `feat_${f.key}_title`).toBe(true);
        expect(keys.has(`feat_${f.key}_desc`), `feat_${f.key}_desc`).toBe(true);
      }
    }
  });
});
