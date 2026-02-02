import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { toast } from 'sonner';
import { Users, Loader2, Check, UserMinus } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface JoinGroupBuyDialogProps {
  groupBuy: {
    id: string;
    product_id: string;
    min_participants: number;
    current_participants: number | null;
    discount_percentage: number | null;
    expires_at: string;
    product: {
      name: string;
      base_price: number;
    } | null;
  };
}

export function JoinGroupBuyDialog({ groupBuy }: JoinGroupBuyDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [quantity, setQuantity] = useState('1');

  // Check if user already joined
  const { data: existingParticipation } = useQuery({
    queryKey: ['group-buy-participation', groupBuy.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const client = supabase as any;
      const { data } = await client
        .from('group_buy_participants')
        .select('*')
        .eq('group_buy_id', groupBuy.id)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user,
  });

  const joinMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in to join this group buy');

      const client = supabase as any;
      const { error } = await client
        .from('group_buy_participants')
        .insert({
          group_buy_id: groupBuy.id,
          user_id: user.id,
          quantity: parseInt(quantity),
        });

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-buys'] });
      queryClient.invalidateQueries({ queryKey: ['group-buy-participation'] });
      toast.success('Successfully joined the group buy!');
      setIsOpen(false);
    },
    onError: (error: Error) => {
      if (error.message.includes('duplicate')) {
        toast.error('You have already joined this group buy');
      } else {
        toast.error(error.message || 'Failed to join group buy');
      }
    },
  });

  const leaveMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in');

      const client = supabase as any;
      const { error } = await client
        .from('group_buy_participants')
        .delete()
        .eq('group_buy_id', groupBuy.id)
        .eq('user_id', user.id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-buys'] });
      queryClient.invalidateQueries({ queryKey: ['group-buy-participation'] });
      toast.success('Left the group buy');
      setIsOpen(false);
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to leave group buy');
    },
  });

  const discountedPrice = groupBuy.product
    ? groupBuy.product.base_price * (1 - (groupBuy.discount_percentage || 0) / 100)
    : 0;

  const participantsNeeded = Math.max(
    0,
    groupBuy.min_participants - (groupBuy.current_participants || 0)
  );

  const hasJoined = !!existingParticipation;

  if (!user) {
    return (
      <Button onClick={() => toast.info('Please sign in to join this group buy')}>
        <Users className="h-4 w-4 mr-2" />
        Join Group Buy
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {hasJoined ? (
          <Button variant="outline" className="gap-2">
            <Check className="h-4 w-4" />
            Joined
          </Button>
        ) : (
          <Button className="gap-2">
            <Users className="h-4 w-4" />
            Join Group Buy
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            {hasJoined ? 'Your Group Buy Participation' : 'Join Group Buy'}
          </DialogTitle>
          <DialogDescription>
            {groupBuy.product?.name}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Info */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Original Price:</span>
              <span className="line-through text-muted-foreground">
                {formatPrice(groupBuy.product?.base_price || 0)}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Group Price:</span>
              <span className="text-xl font-bold text-primary">
                {formatPrice(discountedPrice)}
              </span>
            </div>
            <p className="text-sm text-accent-foreground mt-2">
              Save {groupBuy.discount_percentage}% with this group buy!
            </p>
          </div>

          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Participants</span>
              <span className="font-medium">
                {groupBuy.current_participants || 0} / {groupBuy.min_participants}
              </span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min(100, ((groupBuy.current_participants || 0) / groupBuy.min_participants) * 100)}%`,
                }}
              />
            </div>
            {participantsNeeded > 0 ? (
              <p className="text-xs text-muted-foreground">
                {participantsNeeded} more needed to unlock the deal
              </p>
            ) : (
              <p className="text-xs text-primary font-medium">
                🎉 Group goal reached! Deal is active!
              </p>
            )}
          </div>

          {/* Deadline */}
          <div className="text-sm">
            <span className="text-muted-foreground">Deadline: </span>
            <span className="font-medium">
              {new Date(groupBuy.expires_at).toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>

          {hasJoined ? (
            <div className="space-y-4 pt-4 border-t">
              <div className="p-4 rounded-lg bg-primary/10">
                <p className="font-medium text-primary flex items-center gap-2">
                  <Check className="h-4 w-4" />
                  You've joined this group buy
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Quantity: {existingParticipation.quantity}
                </p>
              </div>
              <Button
                variant="destructive"
                className="w-full"
                onClick={() => leaveMutation.mutate()}
                disabled={leaveMutation.isPending}
              >
                {leaveMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <UserMinus className="h-4 w-4 mr-2" />
                )}
                Leave Group Buy
              </Button>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label htmlFor="quantity">Quantity</Label>
                <Input
                  id="quantity"
                  type="number"
                  min="1"
                  max="10"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => setIsOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={() => joinMutation.mutate()}
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Join for {formatPrice(discountedPrice * parseInt(quantity || '1'))}
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
