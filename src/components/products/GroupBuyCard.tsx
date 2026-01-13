import { Link } from 'react-router-dom';
import { Users, Clock } from 'lucide-react';
import { GroupBuyWithProduct } from '@/hooks/useGroupBuys';
import { useCurrency } from '@/hooks/useCurrency';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';

interface GroupBuyCardProps {
  groupBuy: GroupBuyWithProduct;
}

export function GroupBuyCard({ groupBuy }: GroupBuyCardProps) {
  const { formatPrice } = useCurrency();
  
  if (!groupBuy.product) return null;

  const progress = ((groupBuy.current_participants || 0) / groupBuy.min_participants) * 100;
  const daysLeft = Math.ceil(
    (new Date(groupBuy.expires_at).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  );
  const discountedPrice =
    groupBuy.product.base_price * (1 - (groupBuy.discount_percentage || 0) / 100);

  return (
    <Card className="overflow-hidden hover:shadow-lg transition-all duration-300 border-border bg-card">
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={groupBuy.product.images[0] || '/placeholder.svg'}
          alt={groupBuy.product.name}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/60 to-transparent" />
        <Badge className="absolute top-3 left-3 bg-accent text-accent-foreground text-lg px-3 py-1">
          {groupBuy.discount_percentage || 0}% OFF
        </Badge>
        <div className="absolute bottom-3 left-3 right-3">
          <h3 className="text-lg font-bold text-primary-foreground line-clamp-1">
            {groupBuy.product.name}
          </h3>
        </div>
      </div>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-muted-foreground line-through">
              {formatPrice(groupBuy.product.base_price)}
            </p>
            <p className="text-xl font-bold text-primary">
              {formatPrice(discountedPrice)}
            </p>
          </div>
          <div className="flex items-center gap-1 text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{daysLeft > 0 ? `${daysLeft} days left` : 'Ending soon'}</span>
          </div>
        </div>

        <div className="space-y-2 mb-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center gap-1 text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>
                {groupBuy.current_participants || 0}/{groupBuy.min_participants} joined
              </span>
            </div>
            <span className="text-primary font-medium">
              {Math.round(progress)}%
            </span>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        <Link to={`/product/${groupBuy.product.id}?groupBuy=${groupBuy.id}`}>
          <Button className="w-full">Join Group Buy</Button>
        </Link>
      </CardContent>
    </Card>
  );
}
