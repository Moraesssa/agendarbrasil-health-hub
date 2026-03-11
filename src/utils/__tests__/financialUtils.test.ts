import { describe, expect, it } from 'vitest';
import { formatCurrency, getStatusColor, getStatusText } from '@/utils/financialUtils';

describe('formatCurrency', () => {
  it('formats value as BRL', () => {
    const result = formatCurrency(1234.56);
    // Vitest/Node uses ICU so locale may vary; check it contains the number
    expect(result).toContain('1.234,56');
  });

  it('formats zero', () => {
    const result = formatCurrency(0);
    expect(result).toContain('0,00');
  });

  it('formats negative values', () => {
    const result = formatCurrency(-50);
    expect(result).toContain('50,00');
  });
});

describe('getStatusColor', () => {
  it('returns green for succeeded', () => {
    expect(getStatusColor('succeeded')).toContain('green');
  });

  it('returns yellow for pending', () => {
    expect(getStatusColor('pending')).toContain('yellow');
  });

  it('returns red for failed', () => {
    expect(getStatusColor('failed')).toContain('red');
  });

  it('returns gray for unknown status', () => {
    expect(getStatusColor('unknown')).toContain('gray');
  });
});

describe('getStatusText', () => {
  it('translates succeeded to Pago', () => {
    expect(getStatusText('succeeded')).toBe('Pago');
  });

  it('translates pending to Pendente', () => {
    expect(getStatusText('pending')).toBe('Pendente');
  });

  it('translates failed to Falhou', () => {
    expect(getStatusText('failed')).toBe('Falhou');
  });

  it('returns raw status for unknown', () => {
    expect(getStatusText('refunded')).toBe('refunded');
  });
});
