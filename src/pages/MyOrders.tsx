import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Phone, CreditCard, ShoppingBag, PackageCheck, Plane, MapPinned, Ban, Users } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { OrderInvoice } from '@/components/orders/OrderInvoice';

interface OrderItem {
  id: string;
  product_name: string;
  variant_details: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product_variant_id: string;
}

interface ShippingAddress {
  full_name: string;
  phone?: string;
  address_line1: string;
  address_line2?: string;
  city: string;
  state?: string;
  postal_code?: string;
  country: string;
}

interface TrackingPoint {
  id: string;
  status: string;
  location_name: string;
  notes?: string;
  created_at: string;
}

interface Order {
  id: string;
  order_number: string;
  status: string;
  total_amount: number;
  subtotal: number;
  shipping_price: number;
  created_at: string;
  estimated_delivery_start: string;
  estimated_delivery_end: string;
  shipping_address: ShippingAddress | null;
  order_items: OrderItem[];
  order_tracking: TrackingPoint[];
}

// Simplified tabs: All, Active, Ready, Completed, Cancelled
const CUSTOMER_STATUS_TABS = [
  { value: 'all', label: 'All Orders', icon: Package },
  { value: 'active', label: 'Active', icon: Truck, statuses: ['pending', 'payment_received', 'order_placed', 'confirmed', 'processing', 'packed_for_delivery', 'shipped', 'in_transit'] },
  { value: 'ready', label: 'Ready', icon: MapPinned, statuses: ['in_ghana', 'ready_for_delivery', 'out_for_delivery'] },
  { value: 'completed', label: 'Completed', icon: CheckCircle, statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, statuses: ['cancelled', 'refunded'] },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  payment_received: { label: 'Payment Received', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  order_placed: { label: 'Order Placed', color: 'bg-blue-100 text-blue-800', icon: Package },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Loader },
  packed_for_delivery: { label: 'Packed', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  in_transit: { label: 'In Transit', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  in_ghana: { label: 'In Ghana', color: 'bg-orange-100 text-orange-800', icon: MapPin },
  ready_for_delivery: { label: 'Ready for Pickup', color: 'bg-teal-100 text-teal-800', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-red-100 text-red-800', icon: XCircle },
};

// Progress checkpoints for the horizontal bar
const PROGRESS_CHECKPOINTS = [
  { key: 'payment_received', label: 'Payment' },
  { key: 'order_placed', label: 'Ordered' },
  { key: 'packed_for_delivery', label: 'Packed' },
  { key: 'in_transit', label: 'In Transit' },
  { key: 'in_ghana', label: 'In Ghana' },
  { key: 'ready_for_delivery', label: 'Ready' },
  { key: 'delivered', label: 'Delivered' },
];

function getProgressPercentage(status: string): number {
  const statusOrder = [
    'pending', 'payment_received', 'order_placed', 'confirmed', 'processing',
    'packed_for_delivery', 'shipped', 'in_transit', 'in_ghana',
    'ready_for_delivery', 'out_for_delivery', 'delivered',
  ];
  const idx = statusOrder.indexOf(status);
  if (idx < 0) return 0;
  return Math.round(((idx + 1) / statusOrder.length) * 100);
}

function getCheckpointStatus(orderStatus: string, checkpointKey: string): 'done' | 'current' | 'pending' {
  const statusOrder = [
    'pending', 'payment_received', 'order_placed', 'confirmed', 'processing',
    'packed_for_delivery', 'shipped', 'in_transit', 'in_ghana',
    'ready_for_delivery', 'out_for_delivery', 'delivered',
  ];
  const orderIdx = statusOrder.indexOf(orderStatus);
  const checkIdx = statusOrder.indexOf(checkpointKey);
  if (checkIdx < 0 || orderIdx < 0) return 'pending';
  if (orderIdx >= checkIdx) return 'done';
  if (orderIdx === checkIdx - 1) return 'current';
  return 'pending';
}

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [productImages, setProductImages] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!authLoading && !user) {
      toast.error('Please sign in to view your orders');
      navigate('/auth');
    }
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  const fetchOrders = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        order_items (*),
        order_tracking (*)
      `)
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false });

    if (error) {
      toast.error('Failed to load orders');
    } else if (data) {
      const mappedOrders = data.map(order => ({
        ...order,
        shipping_address: order.shipping_address as unknown as ShippingAddress | null,
        order_tracking: (order.order_tracking || []).sort((a: any, b: any) => 
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        ),
      }));
      setOrders(mappedOrders);

      // Fetch product images for order items
      const variantIds = data.flatMap(o => o.order_items?.map((i: any) => i.product_variant_id) || []);
      if (variantIds.length > 0) {
        const uniqueIds = [...new Set(variantIds)];
        const { data: variants } = await supabase
          .from('product_variants')
          .select('id, product_id')
          .in('id', uniqueIds);
        
        if (variants) {
          const productIds = [...new Set(variants.map(v => v.product_id))];
          const { data: images } = await supabase
            .from('product_images')
            .select('product_id, image_url, order_index')
            .in('product_id', productIds)
            .order('order_index', { ascending: true });
          
          if (images) {
            const imgMap: Record<string, string> = {};
            // Map variant_id -> first image of its product
            const productImageMap: Record<string, string> = {};
            for (const img of images) {
              if (!productImageMap[img.product_id]) {
                productImageMap[img.product_id] = img.image_url;
              }
            }
            for (const v of variants) {
              if (productImageMap[v.product_id]) {
                imgMap[v.id] = productImageMap[v.product_id];
              }
            }
            setProductImages(imgMap);
          }
        }
      }
    }
    setLoading(false);
  };

  const filteredOrders = orders.filter(order => {
    if (activeTab === 'all') return true;
    const tabConfig = CUSTOMER_STATUS_TABS.find(t => t.value === activeTab);
    return tabConfig?.statuses?.includes(order.status);
  });

  const getOrderCountForTab = (tabValue: string) => {
    if (tabValue === 'all') return orders.length;
    const tabConfig = CUSTOMER_STATUS_TABS.find(t => t.value === tabValue);
    return orders.filter(o => tabConfig?.statuses?.includes(o.status)).length;
  };

  const getStatusBadge = (status: string) => {
    const config = statusConfig[status] || statusConfig.pending;
    const Icon = config.icon;
    return (
      <Badge className={`${config.color} gap-1`}>
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  const toggleOrderExpansion = (orderId: string) => {
    setExpandedOrderId(expandedOrderId === orderId ? null : orderId);
  };

  const isCancelledStatus = (status: string) => ['cancelled', 'refunded'].includes(status);

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">Loading orders...</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8 pb-24 md:pb-8">
        <h1 className="text-2xl md:text-3xl font-bold font-serif text-foreground mb-6">
          My Orders
        </h1>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <ScrollArea className="w-full whitespace-nowrap mb-6">
            <TabsList className="inline-flex h-auto p-1 gap-1">
              {CUSTOMER_STATUS_TABS.map((tab) => {
                const Icon = tab.icon;
                const count = getOrderCountForTab(tab.value);
                return (
                  <TabsTrigger
                    key={tab.value}
                    value={tab.value}
                    className="flex items-center gap-1.5 px-3 py-2 text-xs sm:text-sm data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    {tab.label}
                    <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
                      {count}
                    </Badge>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            <ScrollBar orientation="horizontal" />
          </ScrollArea>

          <TabsContent value={activeTab}>
            {filteredOrders.length === 0 ? (
              <Card>
                <CardContent className="py-16 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                    <Package className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No orders found</h3>
                  <p className="text-muted-foreground mb-6">
                    {activeTab === 'all' 
                      ? "You haven't placed any orders yet."
                      : `No ${activeTab} orders found.`}
                  </p>
                  <Link to="/products">
                    <Button>Start Shopping</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredOrders.map((order) => {
                  const isExpanded = expandedOrderId === order.id;
                  const isCancelled = isCancelledStatus(order.status);
                  return (
                    <Card key={order.id} className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Order Header - tap to expand */}
                        <button
                          className="w-full text-left p-4 bg-muted/50 border-b border-border"
                          onClick={() => toggleOrderExpansion(order.id)}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                              {/* First item image */}
                              {order.order_items[0] && (
                                <div className="w-12 h-12 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-muted">
                                  {productImages[order.order_items[0].product_variant_id] ? (
                                    <img
                                      src={productImages[order.order_items[0].product_variant_id]}
                                      alt={order.order_items[0].product_name}
                                      className="w-full h-full object-cover"
                                    />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center">
                                      <Package className="h-5 w-5 text-muted-foreground" />
                                    </div>
                                  )}
                                </div>
                              )}
                              <div className="min-w-0">
                                <p className="font-semibold text-foreground text-sm truncate">
                                  {order.order_number}
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  {new Date(order.created_at).toLocaleDateString('en-US', {
                                    month: 'short', day: 'numeric', year: 'numeric',
                                  })}
                                  {' · '}{order.order_items.length} item{order.order_items.length > 1 ? 's' : ''}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              {getStatusBadge(order.status)}
                              {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                            </div>
                          </div>

                          {/* Price row */}
                          <div className="flex items-center justify-between mt-2">
                            <p className="font-bold text-primary text-sm">
                              {formatPrice(order.total_amount)}
                            </p>
                            {(order as any).group_buy_id && (
                              <Badge className="bg-accent/10 text-accent-foreground gap-1 text-xs">
                                <Users className="h-3 w-3" />
                                Group Buy
                              </Badge>
                            )}
                          </div>
                        </button>

                        {/* Expanded content */}
                        {isExpanded && (
                          <div className="p-4 space-y-4">
                            {/* Horizontal Progress Bar */}
                            {!isCancelled && (
                              <div className="space-y-3">
                                <Progress value={getProgressPercentage(order.status)} className="h-2" />
                                <div className="flex justify-between">
                                  {PROGRESS_CHECKPOINTS.map((cp) => {
                                    const cpStatus = getCheckpointStatus(order.status, cp.key);
                                    return (
                                      <div key={cp.key} className="flex flex-col items-center flex-1">
                                        <div className={`w-3 h-3 rounded-full mb-1 ${
                                          cpStatus === 'done' ? 'bg-primary' :
                                          cpStatus === 'current' ? 'bg-primary/50 ring-2 ring-primary/30' :
                                          'bg-muted-foreground/20'
                                        }`} />
                                        <span className={`text-[10px] text-center leading-tight ${
                                          cpStatus === 'done' ? 'text-primary font-medium' :
                                          cpStatus === 'current' ? 'text-foreground' :
                                          'text-muted-foreground'
                                        }`}>
                                          {cp.label}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            )}

                            {/* Vertical Timeline */}
                            {order.order_tracking.length > 0 && (
                              <div className="space-y-0">
                                <h4 className="text-sm font-semibold text-foreground mb-2">Status Updates</h4>
                                {order.order_tracking.slice(0, 5).map((track, index) => (
                                  <div key={track.id} className="flex gap-3 pb-3">
                                    <div className="flex flex-col items-center">
                                      <div className={`w-2.5 h-2.5 rounded-full mt-1.5 ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                      {index < Math.min(order.order_tracking.length - 1, 4) && (
                                        <div className="w-0.5 flex-1 bg-muted-foreground/20 mt-1" />
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className={`text-xs font-medium ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                        {track.status}
                                      </p>
                                      {track.location_name && (
                                        <p className="text-[11px] text-muted-foreground">{track.location_name}</p>
                                      )}
                                      <p className="text-[11px] text-muted-foreground">
                                        {format(new Date(track.created_at), 'MMM d, yyyy · h:mm a')}
                                      </p>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            )}

                            <Separator />

                            {/* Order Items with images */}
                            <div className="space-y-2">
                              {order.order_items.map((item) => (
                                <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                                  <div className="w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 border border-border bg-muted">
                                    {productImages[item.product_variant_id] ? (
                                      <img
                                        src={productImages[item.product_variant_id]}
                                        alt={item.product_name}
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Package className="h-5 w-5 text-muted-foreground" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-foreground truncate">{item.product_name}</p>
                                    {item.variant_details && (
                                      <p className="text-xs text-primary">{item.variant_details}</p>
                                    )}
                                    <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                                  </div>
                                  <p className="font-semibold text-primary text-sm">{formatPrice(item.total_price)}</p>
                                </div>
                              ))}
                            </div>

                            {/* Delivery Info */}
                            <div className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Truck className="h-3.5 w-3.5" />
                              {order.estimated_delivery_start && order.estimated_delivery_end ? (
                                <span>
                                  Est. delivery: {new Date(order.estimated_delivery_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                  {' - '}{new Date(order.estimated_delivery_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                </span>
                              ) : (
                                <span>Delivery date pending</span>
                              )}
                            </div>

                            <Separator />

                            {/* Actions */}
                            <div className="flex flex-wrap gap-2">
                              {order.status === 'pending' && (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('orders')
                                      .update({ status: 'payment_received', updated_at: new Date().toISOString() })
                                      .eq('id', order.id)
                                      .eq('user_id', user!.id);
                                    if (error) toast.error('Failed to confirm payment');
                                    else { toast.success('Payment confirmed!'); fetchOrders(); }
                                  }}
                                >
                                  <CreditCard className="h-3.5 w-3.5 mr-1" />
                                  Confirm Payment
                                </Button>
                              )}
                              {(order.status === 'ready_for_delivery' || order.status === 'out_for_delivery') && (
                                <Button
                                  size="sm"
                                  onClick={async () => {
                                    const { error } = await supabase
                                      .from('orders')
                                      .update({ status: 'delivered', updated_at: new Date().toISOString() })
                                      .eq('id', order.id)
                                      .eq('user_id', user!.id);
                                    if (error) toast.error('Failed to confirm delivery');
                                    else { toast.success('Delivery confirmed!'); fetchOrders(); }
                                  }}
                                >
                                  <CheckCircle className="h-3.5 w-3.5 mr-1" />
                                  Confirm Delivery
                                </Button>
                              )}
                              {['pending', 'payment_received', 'order_placed'].includes(order.status) && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  className="text-destructive border-destructive/50 hover:bg-destructive/10"
                                  onClick={async () => {
                                    if (!confirm('Are you sure you want to cancel this order?')) return;
                                    const { error } = await supabase
                                      .from('orders')
                                      .update({ status: 'cancelled', updated_at: new Date().toISOString() })
                                      .eq('id', order.id)
                                      .eq('user_id', user!.id);
                                    if (error) toast.error('Failed to cancel order');
                                    else { toast.success('Order cancelled'); fetchOrders(); }
                                  }}
                                >
                                  <Ban className="h-3.5 w-3.5 mr-1" />
                                  Cancel
                                </Button>
                              )}
                              <Link to={`/track-order/${order.id}`}>
                                <Button variant="outline" size="sm">
                                  <MapPin className="h-3.5 w-3.5 mr-1" />
                                  Track
                                </Button>
                              </Link>
                              <OrderInvoice order={order} />
                              {order.status === 'delivered' && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    toast.success('Items added to cart! Redirecting...');
                                    navigate('/cart');
                                  }}
                                >
                                  <ShoppingBag className="h-3.5 w-3.5 mr-1" />
                                  Buy Again
                                </Button>
                              )}
                            </div>

                            {/* Order Summary */}
                            <div className="p-3 bg-muted/30 rounded-lg text-sm space-y-1">
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Subtotal</span>
                                <span>{formatPrice(order.subtotal)}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-muted-foreground">Shipping</span>
                                <span>{formatPrice(order.shipping_price || 0)}</span>
                              </div>
                              <Separator className="my-1" />
                              <div className="flex justify-between font-semibold">
                                <span>Total</span>
                                <span className="text-primary">{formatPrice(order.total_amount)}</span>
                              </div>
                            </div>

                            {/* Shipping Address */}
                            {order.shipping_address && (
                              <div className="p-3 bg-muted/30 rounded-lg">
                                <h4 className="text-xs font-semibold text-foreground mb-1 flex items-center gap-1">
                                  <MapPin className="h-3 w-3 text-primary" />
                                  Shipping Address
                                </h4>
                                <div className="text-xs text-muted-foreground space-y-0.5">
                                  <p className="font-medium text-foreground">{order.shipping_address.full_name}</p>
                                  <p>{order.shipping_address.address_line1}</p>
                                  <p>{order.shipping_address.city}{order.shipping_address.state && `, ${order.shipping_address.state}`}</p>
                                  <p>{order.shipping_address.country}</p>
                                  {order.shipping_address.phone && (
                                    <p className="flex items-center gap-1 mt-1">
                                      <Phone className="h-3 w-3" />
                                      {order.shipping_address.phone}
                                    </p>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
