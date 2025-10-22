// Brazilian currency formatting utilities

export const formatBrazilianCurrency = (amount: number): string => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
};

export const parseBrazilianCurrency = (value: string): number => {
  // Remove R$ and spaces, replace comma with dot, remove dots (thousands separators)
  const cleanValue = value
    .replace(/R\$\s?/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim();
  
  return parseFloat(cleanValue) || 0;
};

export const formatBrazilianCurrencyInput = (value: string): string => {
  if (!value) return '';

  // Normalize: remove all characters except digits and comma
  // Users may paste or type dots as thousand separators; strip them before processing
  const hasComma = value.indexOf(',') >= 0;
  // Remove everything except digits and comma
  const cleaned = value.replace(/[^\d,]/g, '');

  if (cleaned === '') return '';

  if (hasComma) {
    // Split into integer and decimal parts at the first comma
    const parts = cleaned.split(',');
    const integerPart = parts[0].replace(/^0+(?=\d)/, ''); // remove leading zeros
    const decimalPart = parts.slice(1).join('').replace(/\D/g, '');

    const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, '.');

    // If user typed comma but no decimals yet, keep trailing comma
    if (cleaned.endsWith(',')) {
      return (formattedInteger || '0') + ',';
    }

    // Limit to 2 decimal digits for display
    const dec = decimalPart.slice(0, 2);
    return (formattedInteger || '0') + (dec ? ',' + dec : '');
  }

  // No comma: treat as integer input, strip leading zeros and format thousands
  const integerOnly = cleaned.replace(/^0+(?=\d)/, '');
  const formattedInteger = integerOnly.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return formattedInteger || '0';
};

