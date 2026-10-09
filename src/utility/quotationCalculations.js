export const roundToCurrency = (value) => {
  const safeValue = Number(value) || 0;
  return Math.round((safeValue + Number.EPSILON) * 100) / 100;
};

export const calculateVatAmount = (amount, vatPercent) => {
  const value = Number(amount) || 0;
  const vat = Number(vatPercent) || 0;
  return roundToCurrency((value * vat) / 100);
};

export const calculateVatInclusiveAmount = (amount, vatPercent) => {
  const value = Number(amount) || 0;
  const vatAmount = calculateVatAmount(value, vatPercent);
  return roundToCurrency(value + vatAmount);
};

export const calculateRowNetAmount = (taxableAmount, vatPercent) => {
  const taxable = Number(taxableAmount) || 0;
  const vat = calculateVatAmount(taxable, vatPercent);
  return roundToCurrency(taxable + vat);
};
