import { Link } from 'react-router-dom';
import { categories } from '@/data/mockData';
import { Card, CardContent } from '@/components/ui/card';

export function CategorySection() {
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
          {categories.map((category) => (
            <Link key={category.id} to={`/products?category=${category.name}`}>
              <Card className="group hover:shadow-md transition-all duration-300 hover:border-primary cursor-pointer bg-card">
                <CardContent className="p-6 text-center">
                  <span className="text-4xl mb-3 block">{category.icon}</span>
                  <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                    {category.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    ({category.productCount})
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
