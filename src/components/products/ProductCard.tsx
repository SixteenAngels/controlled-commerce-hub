import { Link } from 'react-router-dom';
import { Star, Users, Zap, Truck, Heart, GitCompare, Clock, Eye } from 'lucide-react';
import { Product } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { useWishlist } from '@/hooks/useWishlist';
import { useAuth } from '@/contexts/AuthContext';
import { useCompare } from '@/contexts/CompareContext';
import { useCurrency } from '@/hooks/useCurrency';
import { toast } from 'sonner';

interface ExtendedProduct extends Product {
  isReadyNow?: boolean;
}

interface ProductCardProps {
  product: ExtendedProduct;
  onQuickView?: (product: ExtendedProduct) => void;
}

export function ProductCard({ product, onQuickView }: ProductCardProps) {
  const { user } = useAuth();
  const { formatPrice } = useCurrency();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const { isInCompare, addToCompare, removeFromCompare, compareItems, maxItems } = useCompare();
  const inWishlist = isInWishlist(product.id);
  const inCompare = isInCompare(product.id);

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) {
      toast.error('Please sign in to save items');
      return;
    }
    toggleWishlist(product.id);
  };

  const handleCompareClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (inCompare) {
      removeFromCompare(product.id);
      toast.info('Removed from compare');
    } else {
      if (compareItems.length >= maxItems) {
        toast.error(`Max ${maxItems} products can be compared`);
        return;
      }
      addToCompare(product.id);
      toast.success('Added to compare');
    }
  };

  const handleQuickView = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onQuickView?.(product);
  };

  return (
    <Link to={`/product/${product.id}`}>
      <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 border-border bg-card">
        <div className="relative aspect-square overflow-hidden">
          <img
            src={product.images[0]}
            alt={product.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
          {/* Action Buttons */}
          <div className="absolute top-2 right-2 flex flex-col gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background z-10 h-8 w-8"
              onClick={handleWishlistClick}
            >
              <Heart
                className={`h-4 w-4 ${inWishlist ? 'fill-destructive text-destructive' : 'text-muted-foreground'}`}
              />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="bg-background/80 hover:bg-background z-10 h-8 w-8"
              onClick={handleCompareClick}
            >
              <GitCompare
                className={`h-4 w-4 ${inCompare ? 'text-primary' : 'text-muted-foreground'}`}
              />
            </Button>
            {onQuickView && (
              <Button
                variant="ghost"
                size="icon"
                className="bg-background/80 hover:bg-background z-10 h-8 w-8"
                onClick={handleQuickView}
              >
                <Eye className="h-4 w-4 text-muted-foreground" />
              </Button>
            )}
          </div>
          {/* Badges */}
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {product.isReadyNow && (
              <Badge className="bg-primary text-primary-foreground">
                <Clock className="h-3 w-3 mr-1" />
                Ready Now
              </Badge>
            )}
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
            {product.isFreeShippingEligible && (
              <Badge className="bg-secondary text-secondary-foreground">
                <Truck className="h-3 w-3 mr-1" />
                Free Ship
              </Badge>
            )}
          </div>
        </div>
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground mb-1">{product.category}</p>
          <h3 className="font-semibold text-foreground line-clamp-1 mb-2 group-hover:text-primary transition-colors">
            {product.name}
          </h3>
          <div className="flex items-center justify-between">
            <p className="text-lg font-bold text-primary">
              {formatPrice(product.basePrice)}
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