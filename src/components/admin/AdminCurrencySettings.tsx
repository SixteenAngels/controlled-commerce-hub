import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Loader2, DollarSign, Check } from 'lucide-react';
import { toast } from 'sonner';
import { useStoreSettings, useUpdateCurrency } from '@/hooks/useStoreSettings';

export function AdminCurrencySettings() {
  const { data: settings, isLoading } = useStoreSettings();
  const updateCurrency = useUpdateCurrency();

  const handleSelectCurrency = async (currency: { code: string; symbol: string; name: string }) => {
    try {
      await updateCurrency.mutateAsync(currency);
      toast.success(`Currency changed to ${currency.name}`);
    } catch (error) {
      toast.error('Failed to update currency');
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardContent className="py-8 flex items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DollarSign className="h-5 w-5" />
          Currency Settings
        </CardTitle>
        <CardDescription>
          Set the primary currency for your store. All prices will be displayed in this currency.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-2">
          <Label>Current Currency</Label>
          <div className="p-4 rounded-lg border border-primary bg-primary/5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-2xl font-bold text-primary">{settings?.currency.symbol}</span>
                <div>
                  <p className="font-medium">{settings?.currency.name}</p>
                  <p className="text-sm text-muted-foreground">{settings?.currency.code}</p>
                </div>
              </div>
              <Badge variant="default">Active</Badge>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Available Currencies</Label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {settings?.supportedCurrencies.map((currency) => {
              const isActive = settings.currency.code === currency.code;
              return (
                <button
                  key={currency.code}
                  onClick={() => !isActive && handleSelectCurrency(currency)}
                  disabled={isActive || updateCurrency.isPending}
                  className={`p-4 rounded-lg border text-left transition-all ${
                    isActive
                      ? 'border-primary bg-primary/5 cursor-default'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-xl font-bold text-foreground">{currency.symbol}</span>
                      <div>
                        <p className="font-medium text-foreground">{currency.name}</p>
                        <p className="text-sm text-muted-foreground">{currency.code}</p>
                      </div>
                    </div>
                    {isActive && (
                      <Check className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="pt-4 border-t border-border">
          <p className="text-sm text-muted-foreground">
            <strong>Note:</strong> Changing the currency will only affect how prices are displayed.
            You'll need to update your product prices manually if you're switching to a different currency value system.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}