import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { Check, Package, MapPin, Truck } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';

interface ShippingAddress {
  full_name: string;
  address_line1: string;
  city: string;
  state?: string;
  country: string;
}

interface Order {
  id: string;
  order_number: string;
  total_amount: number;
  status: string;
  estimated_delivery_start: string;
  estimated_delivery_end: string;
  shipping_address: ShippingAddress | null;
}

export default function OrderConfirmation() {
  const { orderId } = useParams();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrder();
    }
  }, [orderId]);

  const fetchOrder = async () => {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (data) {
      setOrder({
        ...data,
        shipping_address: data.shipping_address as unknown as ShippingAddress | null,
      });
    }
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">Loading...</div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16">
          <div className="text-center">Order not found</div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-16">
        <div className="max-w-2xl mx-auto text-center">
          {/* Success Icon */}
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
            <Check className="h-10 w-10 text-green-600" />
          </div>

          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
            Order Confirmed!
          </h1>
          <p className="text-muted-foreground mb-8">
            Thank you for your order. We've received your payment and will process your order shortly.
          </p>

          {/* Order Details Card */}
          <Card className="text-left mb-8">
            <CardContent className="p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Order Number</p>
                  <p className="font-semibold text-foreground">{order.order_number}</p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-muted-foreground">Total Amount</p>
                  <p className="font-semibold text-primary text-lg">₦{order.total_amount.toLocaleString()}</p>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Delivery Address</p>
                    <p className="font-medium text-foreground">{order.shipping_address?.full_name}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address?.address_line1}, {order.shipping_address?.city}
                      {order.shipping_address?.state && `, ${order.shipping_address.state}`}
                    </p>
                    <p className="text-sm text-muted-foreground">{order.shipping_address?.country}</p>
                  </div>
                </div>
              </div>

              <div className="border-t border-border pt-4">
                <div className="flex items-start gap-3">
                  <Truck className="h-5 w-5 text-muted-foreground mt-0.5" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Estimated Delivery</p>
                    <p className="font-medium text-foreground">
                      {new Date(order.estimated_delivery_start).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      {' - '}
                      {new Date(order.estimated_delivery_end).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={`/track-order/${order.id}`}>
              <Button size="lg">
                <Package className="h-4 w-4 mr-2" />
                Track Order
              </Button>
            </Link>
            <Link to="/my-orders">
              <Button variant="outline" size="lg">
                View All Orders
              </Button>
            </Link>
            <Link to="/products">
              <Button variant="ghost" size="lg">
                Continue Shopping
              </Button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
