import { calculateVatInclusiveAmount, calculateVatAmount } from '../../utility/quotationCalculations';

describe('quotation VAT calculations', () => {
  test('calculates a 15% VAT-inclusive total of 11.50 as 13.23', () => {
    expect(calculateVatInclusiveAmount(11.5, 15)).toBe(13.23);
  });

  test('rounds the VAT component to 1.73 for 11.50 at 15%', () => {
    expect(calculateVatAmount(11.5, 15)).toBe(1.73);
  });
});
