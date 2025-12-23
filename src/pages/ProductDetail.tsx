import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Star, Truck, Users, Zap, Ship, Plane, Package, Minus, Plus, ShoppingCart, ArrowLeft } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { products } from '@/data/mockData';
import { useCart } from '@/contexts/CartContext';
import { ProductVariant, ShippingOption } from '@/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const product = products.find((p) => p.id === id);
  const { addToCart } = useCart();

  const [selectedVariants, setSelectedVariants] = useState<ProductVariant[]>([]);
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [selectedShipping, setSelectedShipping] = useState<ShippingOption | null>(null);

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

  const sizes = [...new Set(product.variants.map((v) => v.size).filter(Boolean))];
  const colors = [...new Set(product.variants.map((v) => v.color).filter(Boolean))];

  const toggleVariant = (variant: ProductVariant) => {
    const isSelected = selectedVariants.some((v) => v.id === variant.id);
    if (isSelected) {
      setSelectedVariants((prev) => prev.filter((v) => v.id !== variant.id));
      const newQuantities = { ...quantities };
      delete newQuantities[variant.id];
      setQuantities(newQuantities);
    } else {
      setSelectedVariants((prev) => [...prev, variant]);
      setQuantities((prev) => ({ ...prev, [variant.id]: 1 }));
    }
  };

  const updateQuantity = (variantId: string, delta: number) => {
    setQuantities((prev) => ({
      ...prev,
      [variantId]: Math.max(1, (prev[variantId] || 1) + delta),
    }));
  };

  const totalPrice = selectedVariants.reduce((sum, variant) => {
    return sum + variant.price * (quantities[variant.id] || 1);
  }, 0);

  const handleAddToCart = () => {
    if (selectedVariants.length === 0) {
      toast.error('Please select at least one variant');
      return;
    }

    selectedVariants.forEach((variant) => {
      addToCart(product, variant, quantities[variant.id] || 1);
    });

    toast.success(`Added ${selectedVariants.length} item(s) to cart`);
    setSelectedVariants([]);
    setQuantities({});
  };

  const getShippingIcon = (type: string) => {
    switch (type) {
      case 'sea':
        return <Ship className="h-5 w-5" />;
      case 'air_express':
        return <Package className="h-5 w-5" />;
      default:
        return <Plane className="h-5 w-5" />;
    }
  };

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
          {/* Product Image */}
          <div className="space-y-4">
            <div className="aspect-square overflow-hidden rounded-xl bg-card border border-border">
              <img
                src={product.images[0]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Badges */}
            <div className="flex flex-wrap gap-2">
              {product.isFlashDeal && (
                <Badge className="bg-destructive text-destructive-foreground">
                  <Zap className="h-3 w-3 mr-1" />
                  Flash Deal
                </Badge>
              )}
              {product.isGroupBuyEligible && (
                <Badge variant="secondary" className="bg-accent text-accent-foreground">
                  <Users className="h-3 w-3 mr-1" />
                  Group Buy Eligible
                </Badge>
              )}
              {product.isFreeShippingEligible && (
                <Badge className="bg-primary text-primary-foreground">
                  <Truck className="h-3 w-3 mr-1" />
                  Free Shipping Available
                </Badge>
              )}
            </div>

            {/* Title & Rating */}
            <div>
              <p className="text-sm text-muted-foreground mb-1">{product.category}</p>
              <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
                {product.name}
              </h1>
              <div className="flex items-center gap-2">
                <div className="flex items-center">
                  <Star className="h-5 w-5 fill-accent-foreground text-accent-foreground" />
                  <span className="ml-1 font-medium text-foreground">{product.rating}</span>
                </div>
                <span className="text-muted-foreground">
                  ({product.reviewCount} reviews)
                </span>
              </div>
            </div>

            {/* Price */}
            <div>
              <p className="text-3xl font-bold text-primary">
                ${product.basePrice.toFixed(2)}
              </p>
            </div>

            {/* Description */}
            <p className="text-muted-foreground">{product.description}</p>

            <Separator />

            {/* Variant Selection */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">
                Select Variants (Multi-select enabled)
              </h3>
              <p className="text-sm text-muted-foreground">
                Click on variants to add them to your order
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {product.variants.map((variant) => {
                  const isSelected = selectedVariants.some((v) => v.id === variant.id);
                  return (
                    <Card
                      key={variant.id}
                      className={`cursor-pointer transition-all ${
                        isSelected
                          ? 'border-primary ring-2 ring-primary/20'
                          : 'hover:border-primary/50'
                      }`}
                      onClick={() => toggleVariant(variant)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="font-medium text-foreground">
                              {variant.color}
                              {variant.size && ` - ${variant.size}`}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              ${variant.price.toFixed(2)} • {variant.stock} in stock
                            </p>
                          </div>
                          {isSelected && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(variant.id, -1);
                                }}
                              >
                                <Minus className="h-3 w-3" />
                              </Button>
                              <span className="w-8 text-center font-medium">
                                {quantities[variant.id] || 1}
                              </span>
                              <Button
                                size="icon"
                                variant="outline"
                                className="h-8 w-8"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  updateQuantity(variant.id, 1);
                                }}
                              >
                                <Plus className="h-3 w-3" />
                              </Button>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </div>

            <Separator />

            {/* Shipping Options */}
            <div className="space-y-4">
              <h3 className="font-semibold text-foreground">Shipping Options</h3>
              <div className="space-y-3">
                {product.shippingOptions.map((option) => (
                  <Card
                    key={option.id}
                    className={`transition-all ${
                      option.available
                        ? 'cursor-pointer hover:border-primary/50'
                        : 'opacity-50 cursor-not-allowed'
                    } ${selectedShipping?.id === option.id ? 'border-primary' : ''}`}
                    onClick={() => option.available && setSelectedShipping(option)}
                  >
                    <CardContent className="p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 rounded-lg bg-primary/10 text-primary">
                          {getShippingIcon(option.type)}
                        </div>
                        <div>
                          <p className="font-medium text-foreground">{option.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {option.estimatedDays}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        {option.available ? (
                          <p className="font-semibold text-primary">
                            ${option.price.toFixed(2)}
                          </p>
                        ) : (
                          <Badge variant="secondary">Not Available</Badge>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
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
                    Total: ${totalPrice.toFixed(2)}
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
      </main>
      <Footer />
    </div>
  );
}
