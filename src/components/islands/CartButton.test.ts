import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const source = readFileSync(resolve(process.cwd(), 'src/components/islands/CartButton.tsx'), 'utf8');

describe('CartButton', () => {
  it('uses the landing green token for the cart icon', () => {
    expect(source).toContain('text-grape motion-safe:transition hover:text-grape-dark');
  });
});
