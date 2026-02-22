import { describe, it, expect } from 'vitest';
import { cn } from '../cn';

describe('cn', () => {
  it('merges class names', () => {
    expect(cn('foo', 'bar')).toBe('foo bar');
  });
  it('handles conditional classes', () => {
    expect(cn('base', false && 'hidden', 'visible')).toBe('base visible');
  });
  it('resolves tailwind conflicts', () => {
    expect(cn('px-4', 'px-6')).toBe('px-6');
  });
  it('handles undefined values', () => {
    expect(cn('base', undefined, null)).toBe('base');
  });
});
