import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { Badge } from '@/components/ui/badge';
import { Zap, Clock, Loader2 } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

function CountdownTimer({ endsAt }: { endsAt: string }) {
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date().getTime();
      const end = new Date(endsAt).getTime();
      const diff = end - now;

      if (diff <= 0) {
        setTimeLeft('Ended');
        return;
      }

      const days = Math.floor(diff / (1000 * 60 * 60 * 24));
      const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diff % (1000 * 60)) / 1000);

      if (days > 0) {
        setTimeLeft(`${days}d ${hours}h ${minutes}m`);
      } else {
        setTimeLeft(`${hours}h ${minutes}m ${seconds}s`);
      }
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [endsAt]);

  return (
    <Badge variant="destructive" className="gap-1">
      <Clock className="h-3 w-3" />
      {timeLeft}
    </Badge>
  );
}

export default function FlashDeals() {
  const { formatPrice } = useCurrency();

  const { data: flashProducts, isLoading } = useQuery({
    queryKey: ['flash-deals'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          product_images (image_url, order_index),
          product_variants (id, size, color, price_override, stock, is_active),
          categories (name)
        `)
        .eq('is_flash_deal', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    },
  });

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 rounded-full bg-destructive/10">
            <Zap className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h1 className="text-3xl font-bold font-serif text-foreground">Flash Deals</h1>
            <p className="text-muted-foreground">Limited time offers — grab them before they're gone!</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : !flashProducts?.length ? (
          <div className="text-center py-16">
            <Zap className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">No flash deals right now. Check back soon!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {flashProducts.map((product: any) => {
              const images = (product.product_images || [])
                .sort((a: any, b: any) => (a.order_index || 0) - (b.order_index || 0))
                .map((img: any) => img.image_url);
              const variants = (product.product_variants || []).filter((v: any) => v.is_active);
              const minPrice = variants.length > 0
                ? Math.min(...variants.map((v: any) => v.price_override || product.base_price))
                : product.base_price;

              return (
                <div key={product.id} className="relative">
                  {product.flash_deal_ends_at && (
                    <div className="absolute top-2 right-2 z-10">
                      <CountdownTimer endsAt={product.flash_deal_ends_at} />
                    </div>
                  )}
                  <ProductCard
                    id={product.id}
                    name={product.name}
                    price={minPrice}
                    image={images[0] || '/placeholder.svg'}
                    category={product.categories?.name || 'Uncategorized'}
                    isFlashDeal={true}
                    rating={product.rating || 0}
                    reviewCount={product.review_count || 0}
                  />
                </div>
              );
            })}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
