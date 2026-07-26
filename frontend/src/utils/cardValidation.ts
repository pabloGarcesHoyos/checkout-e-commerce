export const isValidExpiration = (expMonth: string, expYear: string): boolean => {
  const month = Number(expMonth);
  const year = Number(expYear);

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    return false;
  }
  if (!Number.isInteger(year) || expYear.length !== 4) {
    return false;
  }

  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  if (year < currentYear) {
    return false;
  }
  if (year === currentYear && month < currentMonth) {
    return false;
  }

  return true;
};

export const isValidCvv = (cvv: string): boolean => /^\d{3,4}$/.test(cvv);
