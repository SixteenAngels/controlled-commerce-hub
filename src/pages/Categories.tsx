import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';
import { useCategories } from '@/hooks/useCategories';
import { useProducts } from '@/hooks/useProducts';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function Categories() {
  const { data: categories, isLoading: categoriesLoading } = useCategories();
  const { data: products, isLoading: productsLoading } = useProducts();

  const getCategoryProducts = (categoryId: string) => {
    return products?.filter((p) => p.category_id === categoryId).slice(0, 3) || [];
  };

  const isLoading = categoriesLoading || productsLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 flex items-center justify-center min-h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="container py-8">
        {/* Page Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold font-serif text-foreground mb-3">
            Shop by Category
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Browse our curated collection of products from around the world
          </p>
        </div>

        {/* Category Grid */}
        <div className="space-y-12">
          {categories?.filter(c => c.is_active).map((category) => {
            const categoryProducts = getCategoryProducts(category.id);
            return (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{category.icon || '📦'}</span>
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        {category.name}
                      </h2>
                      <p className="text-sm text-muted-foreground">
                        {category.product_count || 0} products
                      </p>
                    </div>
                  </div>
                  <Link
                    to={`/products?category=${category.id}`}
                    className="text-primary hover:underline flex items-center gap-1"
                  >
                    View All
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {categoryProducts.length > 0 ? (
                    categoryProducts.map((product) => (
                      <Link key={product.id} to={`/product/${product.id}`}>
                        <Card className="group overflow-hidden hover:shadow-md transition-all">
                          <div className="aspect-video overflow-hidden">
                            <img
                              src={product.images[0] || '/placeholder.svg'}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                            />
                          </div>
                          <CardContent className="p-4">
                            <h3 className="font-semibold text-foreground line-clamp-1 group-hover:text-primary transition-colors">
                              {product.name}
                            </h3>
                            <p className="text-primary font-bold">
                              ₦{product.base_price.toLocaleString()}
                            </p>
                          </CardContent>
                        </Card>
                      </Link>
                    ))
                  ) : (
                    <Card className="col-span-full p-8 text-center">
                      <p className="text-muted-foreground">
                        Products coming soon
                      </p>
                    </Card>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </main>
      <Footer />
    </div>
  );
}
