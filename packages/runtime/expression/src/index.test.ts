import { describe, expect, it } from 'vitest';

import { evaluateBooleanExpression, evaluatePlatformExpression } from './index';

describe('runtime expression', () => {
  it('evaluates arithmetic and comparison expressions safely', () => {
    expect(
      evaluateBooleanExpression('amount + tax >= 120', {
        amount: 100,
        tax: 20,
      }),
    ).toBe(true);
  });

  it('resolves nested identifiers without using eval', () => {
    expect(
      evaluatePlatformExpression('customer.name', {
        customer: {
          name: 'Demo Corp',
        },
      }),
    ).toBe('Demo Corp');
  });

  it('supports boolean composition', () => {
    expect(
      evaluateBooleanExpression('amount > 1000 && approved == false', {
        amount: 2000,
        approved: false,
      }),
    ).toBe(true);
  });
});
