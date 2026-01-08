import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Currency {
  code: string;
  symbol: string;
  name: string;
}

interface StoreSettings {
  currency: Currency;
  supportedCurrencies: Currency[];
}

async function fetchStoreSettings(): Promise<StoreSettings> {
  const { data, error } = await supabase
    .from('store_settings')
    .select('key, value');

  if (error) throw error;

  const settings: StoreSettings = {
    currency: { code: 'GHS', symbol: '₵', name: 'Ghana Cedis' },
    supportedCurrencies: [],
  };

  data?.forEach((row) => {
    if (row.key === 'currency') {
      settings.currency = row.value as unknown as Currency;
    } else if (row.key === 'supported_currencies') {
      const value = row.value as { currencies?: Currency[] };
      settings.supportedCurrencies = value.currencies || [];
    }
  });

  return settings;
}

export function useStoreSettings() {
  return useQuery({
    queryKey: ['store-settings'],
    queryFn: fetchStoreSettings,
  });
}

export function useUpdateCurrency() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (currency: Currency) => {
      const { error } = await supabase
        .from('store_settings')
        .update({ value: JSON.parse(JSON.stringify(currency)) })
        .eq('key', 'currency');

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['store-settings'] });
    },
  });
}

export function formatPrice(amount: number, currency: Currency): string {
  return `${currency.symbol}${amount.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}