import { Link } from 'react-router-dom';
import { useCategories } from '@/hooks/useCategories';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function CategorySection() {
  const { data: categories, isLoading } = useCategories();

  return (
    <section className="py-16 bg-background">
      <div className="container">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold font-serif text-foreground mb-3">
            Shop by Category
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            Discover products from around the world, organized for easy browsing
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {isLoading
            ? Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="bg-card">
                  <CardContent className="p-6 text-center">
                    <Skeleton className="h-10 w-10 rounded-full mx-auto mb-3" />
                    <Skeleton className="h-5 w-20 mx-auto mb-2" />
                    <Skeleton className="h-4 w-12 mx-auto" />
                  </CardContent>
                </Card>
              ))
            : categories?.map((category) => (
                <Link key={category.id} to={`/products?category=${category.name}`}>
                  <Card className="group hover:shadow-md transition-all duration-300 hover:border-primary cursor-pointer bg-card">
                    <CardContent className="p-6 text-center">
                      <span className="text-4xl mb-3 block">{category.icon || '📦'}</span>
                      <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                        {category.name}
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        ({category.product_count || 0})
                      </p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
        </div>
      </div>
    </section>
  );
}
