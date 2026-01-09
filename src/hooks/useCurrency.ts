import { useStoreSettings } from './useStoreSettings';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

const DEFAULT_CURRENCY: Currency = {
  code: 'GHS',
  symbol: '₵',
  name: 'Ghana Cedis',
};

export function useCurrency() {
  const { data: settings, isLoading } = useStoreSettings();

  const currency = settings?.currency || DEFAULT_CURRENCY;

  const formatPrice = (amount: number): string => {
    return `${currency.symbol}${amount.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  };

  return {
    currency,
    formatPrice,
    isLoading,
  };
}