import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, MapPin, Package } from 'lucide-react';
import { format } from 'date-fns';

const ORDER_STATUSES = [
  'pending',
  'confirmed',
  'processing',
  'shipped',
  'in_transit',
  'out_for_delivery',
  'delivered',
  'cancelled',
  'refunded',
] as const;

type OrderStatus = typeof ORDER_STATUSES[number];

export function AdminOrders() {
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [trackingLocation, setTrackingLocation] = useState({ lat: '', lng: '', location: '', notes: '' });

  const { data: orders, isLoading } = useQuery({
    queryKey: ['admin-orders'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items(
            id,
            product_name,
            variant_details,
            quantity,
            unit_price,
            total_price
          ),
          order_tracking(
            id,
            status,
            location_name,
            latitude,
            longitude,
            notes,
            created_at
          ),
          profiles!orders_user_id_fkey(name, email)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, status }: { orderId: string; status: OrderStatus }) => {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Order status updated');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const addTrackingMutation = useMutation({
    mutationFn: async ({ orderId, ...tracking }: { orderId: string; status: string; location_name: string; latitude?: number; longitude?: number; notes?: string }) => {
      const { error } = await supabase
        .from('order_tracking')
        .insert({
          order_id: orderId,
          status: tracking.status,
          location_name: tracking.location_name,
          latitude: tracking.latitude,
          longitude: tracking.longitude,
          notes: tracking.notes,
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-orders'] });
      toast.success('Tracking updated');
      setTrackingLocation({ lat: '', lng: '', location: '', notes: '' });
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-muted text-muted-foreground';
      case 'confirmed': return 'bg-primary/20 text-primary';
      case 'processing': return 'bg-accent text-accent-foreground';
      case 'shipped': return 'bg-primary/30 text-primary';
      case 'in_transit': return 'bg-primary/40 text-primary';
      case 'out_for_delivery': return 'bg-primary/50 text-primary-foreground';
      case 'delivered': return 'bg-primary text-primary-foreground';
      case 'cancelled': return 'bg-destructive/20 text-destructive';
      case 'refunded': return 'bg-destructive/30 text-destructive';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-3xl font-bold font-serif text-foreground mb-8">Orders Management</h1>

      <div className="space-y-4">
        {orders?.map((order) => (
          <Card key={order.id}>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg font-medium">
                  Order #{order.order_number}
                </CardTitle>
                <Badge className={getStatusColor(order.status || 'pending')}>
                  {order.status?.replace('_', ' ')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground">Customer</p>
                  <p className="font-medium text-foreground">
                    {(order.profiles as any)?.name || 'Unknown'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {(order.profiles as any)?.email}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Order Date</p>
                  <p className="font-medium text-foreground">
                    {format(new Date(order.created_at), 'PPp')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Total</p>
                  <p className="font-bold text-primary text-xl">
                    ${Number(order.total_amount).toFixed(2)}
                  </p>
                </div>
              </div>

              {/* Order Items */}
              <div className="mb-4 p-3 bg-muted rounded-lg">
                <p className="text-sm font-medium text-foreground mb-2">Items:</p>
                {order.order_items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                      {item.product_name} {item.variant_details && `(${item.variant_details})`} x{item.quantity}
                    </span>
                    <span className="font-medium text-foreground">${Number(item.total_price).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              {/* Actions */}
              <div className="flex flex-wrap gap-2">
                <Select
                  value={order.status || 'pending'}
                  onValueChange={(value) => updateStatusMutation.mutate({ orderId: order.id, status: value as OrderStatus })}
                >
                  <SelectTrigger className="w-48">
                    <SelectValue placeholder="Update status" />
                  </SelectTrigger>
                  <SelectContent>
                    {ORDER_STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.replace('_', ' ')}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" onClick={() => setSelectedOrder(order)}>
                      <Eye className="h-4 w-4 mr-1" />
                      View Details
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>Order #{order.order_number}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <h4 className="font-semibold mb-2">Shipping Address</h4>
                        <p className="text-sm text-muted-foreground">
                          {order.shipping_address ? JSON.stringify(order.shipping_address, null, 2) : 'No address'}
                        </p>
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Tracking History</h4>
                        <div className="space-y-2">
                          {order.order_tracking?.map((track: any) => (
                            <div key={track.id} className="p-2 bg-muted rounded text-sm">
                              <p className="font-medium">{track.status}</p>
                              <p className="text-muted-foreground">{track.location_name}</p>
                              {track.notes && <p className="text-muted-foreground">{track.notes}</p>}
                              <p className="text-xs text-muted-foreground">
                                {format(new Date(track.created_at), 'PPp')}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm">
                      <MapPin className="h-4 w-4 mr-1" />
                      Add Tracking
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Add Tracking Update</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>Location Name</Label>
                        <Input
                          value={trackingLocation.location}
                          onChange={(e) => setTrackingLocation(prev => ({ ...prev, location: e.target.value }))}
                          placeholder="e.g., Arrived at warehouse"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="space-y-2">
                          <Label>Latitude (optional)</Label>
                          <Input
                            type="number"
                            value={trackingLocation.lat}
                            onChange={(e) => setTrackingLocation(prev => ({ ...prev, lat: e.target.value }))}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>Longitude (optional)</Label>
                          <Input
                            type="number"
                            value={trackingLocation.lng}
                            onChange={(e) => setTrackingLocation(prev => ({ ...prev, lng: e.target.value }))}
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Notes (optional)</Label>
                        <Input
                          value={trackingLocation.notes}
                          onChange={(e) => setTrackingLocation(prev => ({ ...prev, notes: e.target.value }))}
                        />
                      </div>
                      <Button
                        onClick={() => addTrackingMutation.mutate({
                          orderId: order.id,
                          status: order.status || 'pending',
                          location_name: trackingLocation.location,
                          latitude: trackingLocation.lat ? parseFloat(trackingLocation.lat) : undefined,
                          longitude: trackingLocation.lng ? parseFloat(trackingLocation.lng) : undefined,
                          notes: trackingLocation.notes || undefined,
                        })}
                        disabled={!trackingLocation.location}
                      >
                        Add Tracking
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>
        ))}

        {orders?.length === 0 && (
          <Card>
            <CardContent className="py-8 text-center">
              <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No orders yet</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
