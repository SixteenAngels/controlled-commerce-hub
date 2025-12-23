import { Link } from 'react-router-dom';
import { Star, Users, Zap, Truck } from 'lucide-react';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border bg-card">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isFlashDeal && (
              <Badge className="bg-destructive text-destructive-foreground">
                <Zap className="h-3 w-3 mr-1" />
                Flash Deal
              </Badge>
            )}
            {product.isGroupBuyEligible && (
              <Badge variant="secondary" className="bg-accent text-accent-foreground">
                <Users className="h-3 w-3 mr-1" />
                Group Buy
              </Badge>
            )}
          </div>
          {product.isFreeShippingEligible && (
            <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
              <Truck className="h-3 w-3 mr-1" />
              Free Ship
            </Badge>
          )}
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">
              ${product.basePrice.toFixed(2)}
            </p>
            <div className="flex items-center gap-1">
              <Star className="h-4 w-4 fill-accent-foreground text-accent-foreground" />
              <span className="text-sm text-muted-foreground">
                {product.rating} ({product.reviewCount})
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}
