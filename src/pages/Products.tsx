import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal, Loader2 } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { useProducts, ProductWithDetails } from '@/hooks/useProducts';
import { useCategories } from '@/hooks/useCategories';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Checkbox } from '@/components/ui/checkbox';

// Adapter to convert DB product to the format expected by ProductCard
function toProductCardFormat(product: ProductWithDetails) {
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

export default function Products() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || '';
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [sortBy, setSortBy] = useState('newest');
  const [filters, setFilters] = useState({
    groupBuyOnly: false,
    flashDealsOnly: false,
    freeShippingOnly: false,
  });

  const { data: products, isLoading: productsLoading } = useProducts();
  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const filteredProducts = useMemo(() => {
    if (!products) return [];

    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category_name === selectedCategory);
    }

    if (filters.groupBuyOnly) {
      filtered = filtered.filter((p) => p.is_group_buy_eligible);
    }

    if (filters.flashDealsOnly) {
      filtered = filtered.filter((p) => p.is_flash_deal);
    }

    if (filters.freeShippingOnly) {
      filtered = filtered.filter((p) => p.is_free_shipping);
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'rating':
        filtered.sort((a, b) => (b.rating || 0) - (a.rating || 0));
        break;
      default:
        break;
    }

    return filtered;
  }, [products, selectedCategory, sortBy, filters]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    if (category === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

  const isLoading = productsLoading || categoriesLoading;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Page Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold font-serif text-foreground mb-2">
            All Products
          </h1>
          <p className="text-muted-foreground">
            Discover {filteredProducts.length} products from around the world
          </p>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-2 mb-6">
          <Badge
            variant={selectedCategory === '' ? 'default' : 'outline'}
            className="cursor-pointer px-4 py-2"
            onClick={() => handleCategoryChange('')}
          >
            All
          </Badge>
          {categories?.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.name ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleCategoryChange(cat.name)}
            >
              {cat.icon || '📦'} {cat.name} ({cat.product_count || 0})
            </Badge>
          ))}
        </div>

        {/* Filters and Sort */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="outline" size="sm">
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </SheetTrigger>
            <SheetContent side="left">
              <SheetHeader>
                <SheetTitle>Filter Products</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-foreground">Product Type</h4>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.groupBuyOnly}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, groupBuyOnly: !!checked }))
                      }
                    />
                    <span className="text-sm text-foreground">Group Buy Eligible</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.flashDealsOnly}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, flashDealsOnly: !!checked }))
                      }
                    />
                    <span className="text-sm text-foreground">Flash Deals Only</span>
                  </label>
                  <label className="flex items-center gap-3 cursor-pointer">
                    <Checkbox
                      checked={filters.freeShippingOnly}
                      onCheckedChange={(checked) =>
                        setFilters((f) => ({ ...f, freeShippingOnly: !!checked }))
                      }
                    />
                    <span className="text-sm text-foreground">Free Shipping</span>
                  </label>
                </div>
              </div>
            </SheetContent>
          </Sheet>

          <div className="flex items-center gap-2">
            <SlidersHorizontal className="h-4 w-4 text-muted-foreground" />
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="rating">Best Rating</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {/* Product Grid */}
        {!isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard key={product.id} product={toProductCardFormat(product)} />
            ))}
          </div>
        )}

        {!isLoading && filteredProducts.length === 0 && (
          <div className="text-center py-16">
            <p className="text-lg text-muted-foreground">No products found</p>
            <Button
              variant="link"
              onClick={() => {
                setSelectedCategory('');
                setFilters({
                  groupBuyOnly: false,
                  flashDealsOnly: false,
                  freeShippingOnly: false,
                });
              }}
            >
              Clear all filters
            </Button>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
