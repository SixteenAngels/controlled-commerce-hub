import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { toast } from 'sonner';
import { Plus, Trash2, Loader2 } from 'lucide-react';
import { useProducts } from '@/hooks/useProducts';
import { groupBuySchema, validateForm } from '@/lib/validations/admin';

interface GroupBuyForm {
  product_id: string;
  min_participants: string;
  discount_percentage: string;
  expires_at: string;
}

const defaultForm: GroupBuyForm = {
  product_id: '',
  min_participants: '10',
  discount_percentage: '20',
  expires_at: '',
};

export function AdminGroupBuys() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [form, setForm] = useState<GroupBuyForm>(defaultForm);

  const { data: products } = useProducts();

  const { data: groupBuys, isLoading } = useQuery({
    queryKey: ['admin-group-buys'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('group_buys')
        .select('*, products(name)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: GroupBuyForm) => {
      const { error } = await supabase.from('group_buys').insert({
        product_id: data.product_id,
        min_participants: parseInt(data.min_participants),
        discount_percentage: parseFloat(data.discount_percentage),
        expires_at: data.expires_at,
        created_by: user?.id,
        status: 'open',
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-group-buys'] });
      queryClient.invalidateQueries({ queryKey: ['group-buys'] });
      toast.success('Group buy created successfully');
      setIsOpen(false);
      setForm(defaultForm);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('group_buys').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-group-buys'] });
      queryClient.invalidateQueries({ queryKey: ['group-buys'] });
      toast.success('Group buy deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(groupBuySchema, form);
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0];
      toast.error(firstError || 'Please fix the form errors');
      return;
    }
    
    createMutation.mutate(form);
  };

  const handleClose = () => {
    setIsOpen(false);
    setForm(defaultForm);
  };

  const getStatusColor = (status: string | null) => {
    switch (status) {
      case 'open':
        return 'bg-primary/10 text-primary';
      case 'successful':
        return 'bg-green-500/10 text-green-600';
      case 'failed':
        return 'bg-destructive/10 text-destructive';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-serif text-foreground">Group Buys</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => setForm(defaultForm)}>
              <Plus className="h-4 w-4 mr-2" />
              Create Group Buy
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Group Buy</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="product">Product *</Label>
                <Select
                  value={form.product_id}
                  onValueChange={(value) => setForm({ ...form, product_id: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select product" />
                  </SelectTrigger>
                  <SelectContent>
                    {products
                      ?.filter((p) => p.is_group_buy_eligible)
                      .map((product) => (
                        <SelectItem key={product.id} value={product.id}>
                          {product.name}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="min_participants">Min Participants *</Label>
                  <Input
                    id="min_participants"
                    type="number"
                    min="2"
                    value={form.min_participants}
                    onChange={(e) =>
                      setForm({ ...form, min_participants: e.target.value })
                    }
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discount_percentage">Discount % *</Label>
                  <Input
                    id="discount_percentage"
                    type="number"
                    min="1"
                    max="99"
                    value={form.discount_percentage}
                    onChange={(e) =>
                      setForm({ ...form, discount_percentage: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="expires_at">Expires At *</Label>
                <Input
                  id="expires_at"
                  type="datetime-local"
                  value={form.expires_at}
                  onChange={(e) => setForm({ ...form, expires_at: e.target.value })}
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createMutation.isPending}>
                  {createMutation.isPending && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  Create
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Product</TableHead>
                  <TableHead>Participants</TableHead>
                  <TableHead>Discount</TableHead>
                  <TableHead>Expires</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {groupBuys?.map((groupBuy) => (
                  <TableRow key={groupBuy.id}>
                    <TableCell className="font-medium">
                      {(groupBuy.products as { name: string } | null)?.name || '-'}
                    </TableCell>
                    <TableCell>
                      {groupBuy.current_participants || 0}/{groupBuy.min_participants}
                    </TableCell>
                    <TableCell>{groupBuy.discount_percentage}%</TableCell>
                    <TableCell>
                      {new Date(groupBuy.expires_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <span
                        className={`inline-flex px-2 py-1 text-xs rounded-full capitalize ${getStatusColor(
                          groupBuy.status
                        )}`}
                      >
                        {groupBuy.status || 'unknown'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(groupBuy.id)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {groupBuys?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No group buys yet. Create your first group buy to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
