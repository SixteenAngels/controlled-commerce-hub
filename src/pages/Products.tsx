import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Filter, SlidersHorizontal } from 'lucide-react';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { ProductCard } from '@/components/products/ProductCard';
import { products, categories } from '@/data/mockData';
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

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    if (selectedCategory) {
      filtered = filtered.filter((p) => p.category === selectedCategory);
    }

    if (filters.groupBuyOnly) {
      filtered = filtered.filter((p) => p.isGroupBuyEligible);
    }

    if (filters.flashDealsOnly) {
      filtered = filtered.filter((p) => p.isFlashDeal);
    }

    if (filters.freeShippingOnly) {
      filtered = filtered.filter((p) => p.isFreeShippingEligible);
    }

    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.basePrice - b.basePrice);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.basePrice - a.basePrice);
        break;
      case 'rating':
        filtered.sort((a, b) => b.rating - a.rating);
        break;
      default:
        break;
    }

    return filtered;
  }, [selectedCategory, sortBy, filters]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category === selectedCategory ? '' : category);
    if (category === selectedCategory) {
      searchParams.delete('category');
    } else {
      searchParams.set('category', category);
    }
    setSearchParams(searchParams);
  };

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
          {categories.map((cat) => (
            <Badge
              key={cat.id}
              variant={selectedCategory === cat.name ? 'default' : 'outline'}
              className="cursor-pointer px-4 py-2"
              onClick={() => handleCategoryChange(cat.name)}
            >
              {cat.icon} {cat.name} ({cat.productCount})
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

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filteredProducts.length === 0 && (
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
