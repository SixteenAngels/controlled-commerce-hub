import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Loader2, Plus, Trash2, Tag, Zap, Percent, DollarSign } from 'lucide-react';
import { format } from 'date-fns';

export function AdminPromotions() {
  const queryClient = useQueryClient();
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCoupon, setNewCoupon] = useState({
    code: '',
    type: 'percentage' as 'percentage' | 'fixed_amount',
    value: '',
    min_order_amount: '',
    max_uses: '',
    expires_at: '',
  });

  const { data: coupons, isLoading: couponsLoading } = useQuery({
    queryKey: ['admin-coupons'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('coupons')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const { data: flashDealProducts, isLoading: flashDealsLoading } = useQuery({
    queryKey: ['admin-flash-deals-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, base_price, is_flash_deal, is_active')
        .eq('is_active', true)
        .order('name');
      if (error) throw error;
      return data;
    },
  });

  const addCouponMutation = useMutation({
    mutationFn: async (couponData: any) => {
      const { error } = await supabase.from('coupons').insert({
        code: couponData.code.toUpperCase(),
        type: couponData.type,
        value: parseFloat(couponData.value),
        min_order_amount: couponData.min_order_amount ? parseFloat(couponData.min_order_amount) : null,
        max_uses: couponData.max_uses ? parseInt(couponData.max_uses) : null,
        expires_at: couponData.expires_at || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon created');
      setIsAddingCoupon(false);
      setNewCoupon({ code: '', type: 'percentage', value: '', min_order_amount: '', max_uses: '', expires_at: '' });
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleCouponActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('coupons')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const deleteCouponMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('coupons').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-coupons'] });
      toast.success('Coupon deleted');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  const toggleFlashDeal = useMutation({
    mutationFn: async ({ id, is_flash_deal }: { id: string; is_flash_deal: boolean }) => {
      const { error } = await supabase
        .from('products')
        .update({ is_flash_deal })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-flash-deals-products'] });
      queryClient.invalidateQueries({ queryKey: ['admin-flash-deals'] });
      toast.success('Flash deal updated');
    },
    onError: (error: Error) => toast.error(error.message),
  });

  if (couponsLoading || flashDealsLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-serif text-foreground mb-8">Promotions</h1>

      {/* Coupons */}
      <Card className="mb-8">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Coupons
          </CardTitle>
          <Dialog open={isAddingCoupon} onOpenChange={setIsAddingCoupon}>
            <DialogTrigger asChild>
              <Button size="sm">
                <Plus className="h-4 w-4 mr-1" />
                Add Coupon
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create Coupon</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Coupon Code</Label>
                  <Input
                    value={newCoupon.code}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, code: e.target.value }))}
                    placeholder="e.g., SAVE20"
                    className="uppercase"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Type</Label>
                    <Select
                      value={newCoupon.type}
                      onValueChange={(value: 'percentage' | 'fixed_amount') => setNewCoupon(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="percentage">Percentage (%)</SelectItem>
                        <SelectItem value="fixed_amount">Fixed Amount ($)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Value</Label>
                    <Input
                      type="number"
                      value={newCoupon.value}
                      onChange={(e) => setNewCoupon(prev => ({ ...prev, value: e.target.value }))}
                      placeholder={newCoupon.type === 'percentage' ? '20' : '10'}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order Amount (optional)</Label>
                  <Input
                    type="number"
                    value={newCoupon.min_order_amount}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, min_order_amount: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Max Uses (optional)</Label>
                  <Input
                    type="number"
                    value={newCoupon.max_uses}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, max_uses: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Expires At (optional)</Label>
                  <Input
                    type="datetime-local"
                    value={newCoupon.expires_at}
                    onChange={(e) => setNewCoupon(prev => ({ ...prev, expires_at: e.target.value }))}
                  />
                </div>
                <Button
                  onClick={() => addCouponMutation.mutate(newCoupon)}
                  disabled={!newCoupon.code || !newCoupon.value}
                >
                  Create Coupon
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {coupons?.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-4 bg-muted rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 rounded-lg bg-primary/10 text-primary">
                    {coupon.type === 'percentage' ? <Percent className="h-5 w-5" /> : <DollarSign className="h-5 w-5" />}
                  </div>
                  <div>
                    <p className="font-bold text-foreground">{coupon.code}</p>
                    <p className="text-sm text-muted-foreground">
                      {coupon.type === 'percentage' ? `${coupon.value}% off` : `$${coupon.value} off`}
                      {coupon.min_order_amount && ` (min $${coupon.min_order_amount})`}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Uses: {coupon.current_uses || 0}{coupon.max_uses ? `/${coupon.max_uses}` : ''}
                      {coupon.expires_at && ` • Expires: ${format(new Date(coupon.expires_at), 'PP')}`}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant={coupon.is_active ? 'default' : 'secondary'}>
                    {coupon.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                  <Switch
                    checked={coupon.is_active ?? true}
                    onCheckedChange={(checked) => toggleCouponActive.mutate({ id: coupon.id, is_active: checked })}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteCouponMutation.mutate(coupon.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            ))}
            {coupons?.length === 0 && (
              <p className="text-center text-muted-foreground py-4">No coupons yet</p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Flash Deals */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-destructive" />
            Flash Deals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Toggle flash deal status for products. Flash deal products are highlighted on the storefront.
          </p>
          <div className="space-y-2">
            {flashDealProducts?.map((product) => (
              <div key={product.id} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <div>
                  <p className="font-medium text-foreground">{product.name}</p>
                  <p className="text-sm text-muted-foreground">${Number(product.base_price).toFixed(2)}</p>
                </div>
                <div className="flex items-center gap-3">
                  {product.is_flash_deal && (
                    <Badge className="bg-destructive text-destructive-foreground">
                      <Zap className="h-3 w-3 mr-1" />
                      Flash Deal
                    </Badge>
                  )}
                  <Switch
                    checked={product.is_flash_deal ?? false}
                    onCheckedChange={(checked) => toggleFlashDeal.mutate({ id: product.id, is_flash_deal: checked })}
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
