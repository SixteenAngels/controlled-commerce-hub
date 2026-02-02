import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
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
import { Users, Loader2, Calendar } from 'lucide-react';
import { useCurrency } from '@/hooks/useCurrency';

interface StartGroupBuyDialogProps {
  product: {
    id: string;
    name: string;
    base_price: number;
  };
}

export function StartGroupBuyDialog({ product }: StartGroupBuyDialogProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { formatPrice } = useCurrency();
  const [isOpen, setIsOpen] = useState(false);
  const [minParticipants, setMinParticipants] = useState('5');
  const [discountPercentage, setDiscountPercentage] = useState('15');
  const [expiresAt, setExpiresAt] = useState('');

  const discountedPrice = product.base_price * (1 - Number(discountPercentage) / 100);

  const createGroupBuyMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('Please sign in to start a group buy');

      const { data, error } = await supabase
        .from('group_buys')
        .insert({
          product_id: product.id,
          min_participants: parseInt(minParticipants),
          discount_percentage: parseFloat(discountPercentage),
          expires_at: new Date(expiresAt).toISOString(),
          created_by: user.id,
          status: 'open',
          current_participants: 1, // Creator is first participant
        })
        .select()
        .single();

      if (error) throw error;

      // Auto-join creator as first participant
      const client = supabase as any;
      await client.from('group_buy_participants').insert({
        group_buy_id: data.id,
        user_id: user.id,
        quantity: 1,
      });

      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['group-buys'] });
      toast.success('Group buy started! Share it with friends to get the discount.');
      setIsOpen(false);
      resetForm();
    },
    onError: (error: Error) => {
      toast.error(error.message || 'Failed to start group buy');
    },
  });

  const resetForm = () => {
    setMinParticipants('5');
    setDiscountPercentage('15');
    setExpiresAt('');
  };

  // Set default expiry to 7 days from now
  const getDefaultExpiry = () => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date.toISOString().slice(0, 16);
  };

  const handleOpen = (open: boolean) => {
    setIsOpen(open);
    if (open && !expiresAt) {
      setExpiresAt(getDefaultExpiry());
    }
  };

  if (!user) {
    return (
      <Button variant="secondary" onClick={() => toast.info('Please sign in to start a group buy')}>
        <Users className="h-4 w-4 mr-2" />
        Start Group Buy
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary">
          <Users className="h-4 w-4 mr-2" />
          Start Group Buy
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Start a Group Buy</DialogTitle>
          <DialogDescription>
            Create a group buy for "{product.name}" and invite others to join for group discounts.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Price Preview */}
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <div className="flex justify-between items-center mb-2">
              <span className="text-muted-foreground">Original Price:</span>
              <span className="line-through text-muted-foreground">{formatPrice(product.base_price)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="font-medium">Group Buy Price:</span>
              <span className="text-xl font-bold text-primary">{formatPrice(discountedPrice)}</span>
            </div>
            <p className="text-sm text-muted-foreground mt-2">
              {discountPercentage}% off when {minParticipants} people join
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="minParticipants">Min. Participants</Label>
              <Input
                id="minParticipants"
                type="number"
                min="2"
                max="100"
                value={minParticipants}
                onChange={(e) => setMinParticipants(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Including you
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="discountPercentage">Discount %</Label>
              <Input
                id="discountPercentage"
                type="number"
                min="5"
                max="50"
                value={discountPercentage}
                onChange={(e) => setDiscountPercentage(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                5% - 50% off
              </p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="expiresAt" className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Deadline
            </Label>
            <Input
              id="expiresAt"
              type="datetime-local"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
            <p className="text-xs text-muted-foreground">
              Group must fill before this date
            </p>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => setIsOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => createGroupBuyMutation.mutate()}
              disabled={
                !expiresAt ||
                parseInt(minParticipants) < 2 ||
                createGroupBuyMutation.isPending
              }
            >
              {createGroupBuyMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Start Group Buy
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
