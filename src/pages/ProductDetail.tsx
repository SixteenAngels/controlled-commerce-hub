import { useState, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, Users, Zap, Ship, Plane, Package, ShoppingCart, ArrowLeft, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useProduct, ProductWithDetails } from '@/hooks/useProducts';
import { useCart } from '@/contexts/CartContext';
import { ProductVariant, Product } from '@/types';
import { ProductReviews } from '@/components/products/ProductReviews';
import { RelatedProducts } from '@/components/products/RelatedProducts';
import { VariantSelector } from '@/components/products/VariantSelector';
import { ProductImageGallery } from '@/components/products/ProductImageGallery';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { useCurrency } from '@/hooks/useCurrency';

// Convert DB product to legacy Product type for cart
function toCartProduct(product: ProductWithDetails): Product {
  return {
    id: product.id,
    name: product.name,
    description: product.description || '',
    category: product.category_name || 'Uncategorized',
    basePrice: product.base_price,
    images: product.images.length > 0 ? product.images : ['https://via.placeholder.com/400'],
    variants: product.variants.map((v) => ({
      id: v.id,
      size: v.size || undefined,
      color: v.color || undefined,
      price: v.price,
      stock: v.stock || 0,
    })),
    shippingOptions: product.shipping_rules
      .filter((r) => r.is_allowed && r.shipping_class)
      .map((r) => ({
        id: r.id,
        type: (r.shipping_class?.shipping_type?.name?.toLowerCase().includes('sea')
          ? 'sea'
          : r.shipping_class?.shipping_type?.name?.toLowerCase().includes('express')
          ? 'air_express'
          : 'air_normal') as 'sea' | 'air_normal' | 'air_express',
        name: r.shipping_class?.name || '',
        price: r.price,
        estimatedDays: r.shipping_class
          ? `${r.shipping_class.estimated_days_min}-${r.shipping_class.estimated_days_max} days`
          : '',
        available: true,
      })),
    isGroupBuyEligible: product.is_group_buy_eligible || false,
    isFlashDeal: product.is_flash_deal || false,
    isFreeShippingEligible: product.is_free_shipping || false,
    rating: product.rating || 0,
    reviewCount: product.review_count || 0,
  };
}

interface SelectedVariant {
  id: string;
  size: string | null;
  color: string | null;
  price: number;
  stock: number | null;
  quantity: number;
}

interface ShippingRule {
  id: string;
  shipping_class_id: string;
  price: number;
  is_allowed: boolean | null;
  shipping_class: {
    id: string;
    name: string;
    estimated_days_min: number;
    estimated_days_max: number;
    shipping_type: {
      id: string;
      name: string;
    } | null;
  } | null;
}

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const { data: product, isLoading } = useProduct(id);
  const { addToCart } = useCart();
  const { formatPrice } = useCurrency();

  const [selectedVariants, setSelectedVariants] = useState<SelectedVariant[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<ShippingRule | null>(null);

  const handleVariantToggle = (variant: { id: string; size: string | null; color: string | null; price: number; stock: number | null }) => {
    const isSelected = selectedVariants.some((v) => v.id === variant.id);
    if (isSelected) {
      setSelectedVariants((prev) => prev.filter((v) => v.id !== variant.id));
    } else {
      setSelectedVariants((prev) => [...prev, { ...variant, quantity: 1 }]);
    }
  };

  const handleQuantityChange = (variantId: string, quantity: number) => {
    setSelectedVariants((prev) =>
      prev.map((v) => (v.id === variantId ? { ...v, quantity } : v))
    );
  };

  const totalPrice = useMemo(() => {
    return selectedVariants.reduce((sum, variant) => {
      return sum + variant.price * variant.quantity;
    }, 0);
  }, [selectedVariants]);

  const handleAddToCart = () => {
    if (!product) return;
    
    if (selectedVariants.length === 0) {
      toast.error('Please select at least one variant');
      return;
    }

    const cartProduct = toCartProduct(product);

    selectedVariants.forEach((variant) => {
      const cartVariant: ProductVariant = {
        id: variant.id,
        size: variant.size || undefined,
        color: variant.color || undefined,
        price: variant.price,
        stock: variant.stock || 0,
      };
      addToCart(cartProduct, cartVariant, variant.quantity);
    });

    toast.success(`Added ${selectedVariants.length} item(s) to cart`);
    setSelectedVariants([]);
  };

  const getShippingIcon = (typeName: string | undefined) => {
    if (!typeName) return <Plane className="h-5 w-5" />;
    const name = typeName.toLowerCase();
    if (name.includes('sea')) return <Ship className="h-5 w-5" />;
    if (name.includes('express')) return <Package className="h-5 w-5" />;
    return <Plane className="h-5 w-5" />;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-16 text-center">
          <h1 className="text-2xl font-bold text-foreground mb-4">Product Not Found</h1>
          <Link to="/products">
            <Button>Back to Products</Button>
          </Link>
        </main>
        <Footer />
      </div>
    );
  }

  const availableShipping = product.shipping_rules.filter((r) => r.is_allowed && r.shipping_class);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Breadcrumb */}
        <Link
          to="/products"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-primary mb-6"
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Back to Products
        </Link>

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Product Image Gallery */}
          <ProductImageGallery images={product.images} productName={product.name} />

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.is_flash_deal && (
                <Badge className="bg-destructive text-destructive-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  Flash Deal
                </Badge>
              )}
              {product.is_group_buy_eligible && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  Group Buy Eligible
                </Badge>
              )}
              {product.is_free_shipping && (
                <Badge className="bg-primary text-primary-foreground">
                  <Truck className="h-3 w-3 mr-1" />
                  Free Shipping Available
                </Badge>
              )}
            </div>

            {/* Start Group Buy Button */}
            {product.is_group_buy_eligible && (
              <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-foreground">Start a Group Buy</p>
                    <p className="text-sm text-muted-foreground">Get discounts when others join!</p>
                  </div>
                  <Button variant="secondary" onClick={() => toast.info('Group buy feature coming soon! Contact admin to start a group buy.')}>
                    <Users className="h-4 w-4 mr-2" />
                    Start Group Buy
                  </Button>
                </div>
              </div>
            )}

            {/* Title & Rating */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">{product.category_name || 'Uncategorized'}</p>
              <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-accent-foreground text-accent-foreground" />
                  <span className="ml-1 font-medium text-foreground">{product.rating || 0}</span>
                </div>
                <span className="text-muted-foreground">
                  ({product.review_count || 0} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-3xl font-bold text-primary">
                {formatPrice(product.base_price)}
              </p>
              <p className="text-sm text-muted-foreground mt-1">Starting from</p>
            </div>

            {/* Description */}
            <p className="text-muted-foreground">{product.description}</p>

            <Separator />

            {/* Visual Variant Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">
                Select Options
              </h3>

              {product.variants.length === 0 ? (
                <p className="text-sm text-muted-foreground">No variants available</p>
              ) : (
                <VariantSelector
                  variants={product.variants}
                  selectedVariants={selectedVariants}
                  onVariantToggle={handleVariantToggle}
                  onQuantityChange={handleQuantityChange}
                />
              )}
            </div>

            <Separator />

            {/* Shipping Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Shipping Options</h3>
              {availableShipping.length === 0 ? (
                <p className="text-sm text-muted-foreground">No shipping options available</p>
              ) : (
                <div className="space-y-3">
                  {availableShipping.map((option) => (
                    <Card
                      key={option.id}
                      className={`cursor-pointer transition-all hover:border-primary/50 ${
                        selectedShipping?.id === option.id ? 'border-primary' : ''
                      }`}
                      onClick={() => setSelectedShipping(option)}
                    >
                      <CardContent className="p-4 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-primary/10 text-primary">
                            {getShippingIcon(option.shipping_class?.shipping_type?.name)}
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{option.shipping_class?.name}</p>
                            <p className="text-sm text-muted-foreground">
                              {option.shipping_class?.estimated_days_min}-{option.shipping_class?.estimated_days_max} days
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-primary">
                            {formatPrice(option.price)}
                          </p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>

            <Separator />

            {/* Add to Cart */}
            <div className="space-y-4">
              {selectedVariants.length > 0 && (
                <div className="p-4 rounded-lg bg-card border border-border">
                  <p className="text-sm text-muted-foreground mb-2">
                    {selectedVariants.length} variant(s) selected
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    Total: {formatPrice(totalPrice)}
                  </p>
                </div>
              )}

              <Button
                size="lg"
                className="w-full"
                onClick={handleAddToCart}
                disabled={selectedVariants.length === 0}
              >
                <ShoppingCart className="h-5 w-5 mr-2" />
                Add to Cart
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        <RelatedProducts productId={product.id} categoryId={product.category_id} />

        {/* Reviews Section */}
        <div className="mt-12">
          <ProductReviews productId={product.id} productName={product.name} />
        </div>
      </main>
      <Footer />
    </div>
  );
}
