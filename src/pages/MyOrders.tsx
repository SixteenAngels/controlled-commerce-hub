import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Package, Truck, MapPin, Clock, CheckCircle, XCircle, Loader, ChevronDown, ChevronUp, Phone, CreditCard, ShoppingBag, PackageCheck, Plane, MapPinned } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/hooks/useCurrency';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { Separator } from '@/components/ui/separator';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { format } from 'date-fns';

interface OrderItem {
  id: string;
  product_name: string;
  variant_details: string;
  quantity: number;
  unit_price: number;
  total_price: number;
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

const CUSTOMER_STATUS_TABS = [
  { value: 'all', label: 'All Orders', icon: Package },
  { value: 'pending', label: 'Pending', icon: Clock, statuses: ['pending'] },
  { value: 'payment_received', label: 'Payment Received', icon: CreditCard, statuses: ['payment_received'] },
  { value: 'order_placed', label: 'Order Placed', icon: ShoppingBag, statuses: ['order_placed', 'confirmed', 'processing'] },
  { value: 'packed_for_delivery', label: 'Packed', icon: PackageCheck, statuses: ['packed_for_delivery', 'shipped'] },
  { value: 'in_transit', label: 'In Transit', icon: Truck, statuses: ['in_transit'] },
  { value: 'in_ghana', label: 'In Ghana', icon: Plane, statuses: ['in_ghana'] },
  { value: 'ready_for_delivery', label: 'Ready', icon: MapPinned, statuses: ['ready_for_delivery', 'out_for_delivery'] },
  { value: 'delivered', label: 'Delivered', icon: CheckCircle, statuses: ['delivered'] },
  { value: 'cancelled', label: 'Cancelled', icon: XCircle, statuses: ['cancelled', 'refunded'] },
];

const statusConfig: Record<string, { label: string; color: string; icon: any }> = {
  pending: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800', icon: Clock },
  payment_received: { label: 'Payment Received', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  order_placed: { label: 'Order Placed', color: 'bg-blue-100 text-blue-800', icon: Package },
  confirmed: { label: 'Confirmed', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  processing: { label: 'Processing', color: 'bg-purple-100 text-purple-800', icon: Loader },
  packed_for_delivery: { label: 'Packed for Delivery', color: 'bg-purple-100 text-purple-800', icon: Package },
  shipped: { label: 'Shipped', color: 'bg-indigo-100 text-indigo-800', icon: Truck },
  in_transit: { label: 'In Transit', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  in_ghana: { label: 'In Ghana', color: 'bg-orange-100 text-orange-800', icon: MapPin },
  ready_for_delivery: { label: 'Ready for Delivery', color: 'bg-teal-100 text-teal-800', icon: Package },
  out_for_delivery: { label: 'Out for Delivery', color: 'bg-cyan-100 text-cyan-800', icon: Truck },
  delivered: { label: 'Delivered', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  cancelled: { label: 'Cancelled', color: 'bg-red-100 text-red-800', icon: XCircle },
  refunded: { label: 'Refunded', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export default function MyOrders() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all');
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);

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
        <h1 className="text-3xl font-bold font-serif text-foreground mb-8">
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
                    className="flex items-center gap-1.5 px-3 py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                  >
                    <Icon className="h-4 w-4" />
                    <span className="hidden sm:inline">{tab.label}</span>
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
                {filteredOrders.map((order) => (
                  <Collapsible
                    key={order.id}
                    open={expandedOrderId === order.id}
                    onOpenChange={() => toggleOrderExpansion(order.id)}
                  >
                    <Card className="overflow-hidden">
                      <CardContent className="p-0">
                        {/* Order Header */}
                        <div className="p-4 bg-muted/50 border-b border-border">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <div className="flex items-center gap-4">
                              <div>
                                <p className="text-sm text-muted-foreground">Order Number</p>
                                <p className="font-semibold text-foreground">{order.order_number}</p>
                              </div>
                              <div className="hidden sm:block text-muted-foreground">•</div>
                              <div>
                                <p className="text-sm text-muted-foreground">Placed on</p>
                                <p className="font-medium text-foreground">
                                  {new Date(order.created_at).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric',
                                    year: 'numeric',
                                  })}
                                </p>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              {getStatusBadge(order.status)}
                            </div>
                          </div>
                        </div>

                        {/* Order Items Preview */}
                        <div className="p-4">
                          <div className="space-y-3 mb-4">
                            {order.order_items.map((item) => (
                              <div key={item.id} className="p-3 bg-muted/50 rounded-lg border border-border">
                                <div className="flex items-start gap-3">
                                  <div className="w-12 h-12 bg-background rounded-lg flex items-center justify-center border border-border">
                                    <Package className="h-6 w-6 text-muted-foreground" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-foreground">{item.product_name}</p>
                                    {item.variant_details && (
                                      <p className="text-sm text-primary font-medium mt-1">
                                        {item.variant_details}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-4 mt-2 text-sm">
                                      <span className="text-muted-foreground">
                                        Qty: <strong className="text-foreground">{item.quantity}</strong>
                                      </span>
                                      <span className="text-muted-foreground">
                                        Unit: <strong className="text-foreground">{formatPrice(item.unit_price)}</strong>
                                      </span>
                                    </div>
                                  </div>
                                  <p className="font-bold text-primary">
                                    {formatPrice(item.total_price)}
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Delivery Info & Actions */}
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-4 border-t border-border">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Truck className="h-4 w-4" />
                              <span>
                                Est. delivery:{' '}
                                {new Date(order.estimated_delivery_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                {' - '}
                                {new Date(order.estimated_delivery_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <CollapsibleTrigger asChild>
                                <Button variant="outline" size="sm">
                                  {expandedOrderId === order.id ? (
                                    <>
                                      <ChevronUp className="h-4 w-4 mr-1" />
                                      Hide Details
                                    </>
                                  ) : (
                                    <>
                                      <ChevronDown className="h-4 w-4 mr-1" />
                                      View Details
                                    </>
                                  )}
                                </Button>
                              </CollapsibleTrigger>
                              <Link to={`/track-order/${order.id}`}>
                                <Button variant="outline" size="sm">
                                  <MapPin className="h-4 w-4 mr-1" />
                                  Track
                                </Button>
                              </Link>
                              <p className="font-semibold text-primary">
                                {formatPrice(order.total_amount)}
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* Expandable Details Section */}
                        <CollapsibleContent>
                          <div className="px-4 pb-4 space-y-4">
                            <Separator />
                            
                            <div className="grid md:grid-cols-2 gap-6">
                              {/* Shipping Address */}
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <MapPin className="h-4 w-4 text-primary" />
                                  Shipping Address
                                </h4>
                                {order.shipping_address ? (
                                  <div className="text-sm space-y-1">
                                    <p className="font-medium text-foreground">{order.shipping_address.full_name}</p>
                                    <p className="text-muted-foreground">{order.shipping_address.address_line1}</p>
                                    {order.shipping_address.address_line2 && (
                                      <p className="text-muted-foreground">{order.shipping_address.address_line2}</p>
                                    )}
                                    <p className="text-muted-foreground">
                                      {order.shipping_address.city}
                                      {order.shipping_address.state && `, ${order.shipping_address.state}`}
                                      {order.shipping_address.postal_code && ` ${order.shipping_address.postal_code}`}
                                    </p>
                                    <p className="text-muted-foreground">{order.shipping_address.country}</p>
                                    {order.shipping_address.phone && (
                                      <p className="text-muted-foreground flex items-center gap-1 mt-2">
                                        <Phone className="h-3 w-3" />
                                        {order.shipping_address.phone}
                                      </p>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No address provided</p>
                                )}
                              </div>

                              {/* Tracking Timeline */}
                              <div className="p-4 bg-muted/30 rounded-lg">
                                <h4 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                                  <Truck className="h-4 w-4 text-primary" />
                                  Tracking Timeline
                                </h4>
                                {order.order_tracking.length > 0 ? (
                                  <div className="space-y-3">
                                    {order.order_tracking.slice(0, 5).map((track, index) => (
                                      <div key={track.id} className="flex gap-3">
                                        <div className="flex flex-col items-center">
                                          <div className={`w-3 h-3 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted-foreground/30'}`} />
                                          {index < Math.min(order.order_tracking.length - 1, 4) && (
                                            <div className="w-0.5 flex-1 bg-muted-foreground/20 mt-1" />
                                          )}
                                        </div>
                                        <div className="flex-1 pb-2">
                                          <p className={`text-sm font-medium ${index === 0 ? 'text-foreground' : 'text-muted-foreground'}`}>
                                            {track.status}
                                          </p>
                                          <p className="text-xs text-muted-foreground">{track.location_name}</p>
                                          {track.notes && (
                                            <p className="text-xs text-muted-foreground mt-1">{track.notes}</p>
                                          )}
                                          <p className="text-xs text-muted-foreground mt-1">
                                            {format(new Date(track.created_at), 'MMM d, yyyy • h:mm a')}
                                          </p>
                                        </div>
                                      </div>
                                    ))}
                                    {order.order_tracking.length > 5 && (
                                      <Link to={`/track-order/${order.id}`} className="text-sm text-primary hover:underline">
                                        View all {order.order_tracking.length} updates →
                                      </Link>
                                    )}
                                  </div>
                                ) : (
                                  <p className="text-sm text-muted-foreground">No tracking updates yet</p>
                                )}
                              </div>
                            </div>

                            {/* Order Summary */}
                            <div className="p-4 bg-muted/30 rounded-lg">
                              <h4 className="font-semibold text-foreground mb-3">Order Summary</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Subtotal</span>
                                  <span>{formatPrice(order.subtotal)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-muted-foreground">Shipping</span>
                                  <span>{formatPrice(order.shipping_price || 0)}</span>
                                </div>
                                <Separator className="my-2" />
                                <div className="flex justify-between font-semibold text-base">
                                  <span>Total</span>
                                  <span className="text-primary">{formatPrice(order.total_amount)}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CollapsibleContent>
                      </CardContent>
                    </Card>
                  </Collapsible>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
      <Footer />
    </div>
  );
}
