import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, Loader2, Package } from 'lucide-react';
import { useCategories } from '@/hooks/useCategories';
import { ProductImageUpload, uploadProductImages } from './ProductImageUpload';
import { ProductVariantsManager, VariantData } from './ProductVariantsManager';
import { productSchema, validateForm } from '@/lib/validations/admin';

interface ProductForm {
  name: string;
  description: string;
  item_code: string;
  base_price: string;
  category_id: string;
  is_group_buy_eligible: boolean;
  is_flash_deal: boolean;
  is_free_shipping: boolean;
  is_active: boolean;
}

const defaultForm: ProductForm = {
  name: '',
  description: '',
  item_code: '',
  base_price: '',
  category_id: '',
  is_group_buy_eligible: false,
  is_flash_deal: false,
  is_free_shipping: false,
  is_active: true,
};

export function AdminProducts() {
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(defaultForm);
  const [pendingImages, setPendingImages] = useState<File[]>([]);
  const [existingImages, setExistingImages] = useState<{ id: string; image_url: string; order_index: number }[]>([]);
  const [variants, setVariants] = useState<VariantData[]>([]);

  const { data: categories, isLoading: categoriesLoading } = useCategories();

  const { data: products, isLoading } = useQuery({
    queryKey: ['admin-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*, categories(name), product_images(id, image_url, order_index)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const createMutation = useMutation({
    mutationFn: async (data: ProductForm) => {
      const { data: product, error } = await supabase.from('products').insert({
        name: data.name,
        description: data.description,
        item_code: data.item_code,
        base_price: parseFloat(data.base_price),
        category_id: data.category_id || null,
        is_group_buy_eligible: data.is_group_buy_eligible,
        is_flash_deal: data.is_flash_deal,
        is_free_shipping: data.is_free_shipping,
        is_active: data.is_active,
      }).select().single();
      if (error) throw error;

      // Upload images if any
      if (pendingImages.length > 0 && product) {
        const imageUrls = await uploadProductImages(product.id, pendingImages);
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: product.id,
          image_url: url,
          order_index: index,
        }));
        await supabase.from('product_images').insert(imageRecords);
      }

      // Create variants if any
      if (variants.length > 0 && product) {
        const variantRecords = variants.map((v) => ({
          product_id: product.id,
          size: v.size || null,
          color: v.color || null,
          price_override: v.price_override ? parseFloat(v.price_override) : null,
          stock: parseInt(v.stock) || 0,
          sku: v.sku || null,
        }));
        await supabase.from('product_variants').insert(variantRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product created successfully');
      setIsOpen(false);
      setForm(defaultForm);
      setPendingImages([]);
      setVariants([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: ProductForm }) => {
      const { error } = await supabase
        .from('products')
        .update({
          name: data.name,
          description: data.description,
          item_code: data.item_code,
          base_price: parseFloat(data.base_price),
          category_id: data.category_id || null,
          is_group_buy_eligible: data.is_group_buy_eligible,
          is_flash_deal: data.is_flash_deal,
          is_free_shipping: data.is_free_shipping,
          is_active: data.is_active,
        })
        .eq('id', id);
      if (error) throw error;

      // Upload new images if any
      if (pendingImages.length > 0) {
        const currentMaxIndex = existingImages.length > 0 
          ? Math.max(...existingImages.map(i => i.order_index)) + 1 
          : 0;
        const imageUrls = await uploadProductImages(id, pendingImages);
        const imageRecords = imageUrls.map((url, index) => ({
          product_id: id,
          image_url: url,
          order_index: currentMaxIndex + index,
        }));
        await supabase.from('product_images').insert(imageRecords);
      }

      // Handle variants: delete existing and insert new
      await supabase.from('product_variants').delete().eq('product_id', id);
      if (variants.length > 0) {
        const variantRecords = variants.map((v) => ({
          product_id: id,
          size: v.size || null,
          color: v.color || null,
          price_override: v.price_override ? parseFloat(v.price_override) : null,
          stock: parseInt(v.stock) || 0,
          sku: v.sku || null,
        }));
        await supabase.from('product_variants').insert(variantRecords);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product updated successfully');
      setIsOpen(false);
      setEditingId(null);
      setForm(defaultForm);
      setPendingImages([]);
      setExistingImages([]);
      setVariants([]);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast.success('Product deleted successfully');
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const handleEdit = async (product: typeof products extends (infer T)[] ? T : never) => {
    setEditingId(product.id);
    setForm({
      name: product.name,
      description: product.description || '',
      item_code: product.item_code,
      base_price: String(product.base_price),
      category_id: product.category_id || '',
      is_group_buy_eligible: product.is_group_buy_eligible || false,
      is_flash_deal: product.is_flash_deal || false,
      is_free_shipping: product.is_free_shipping || false,
      is_active: product.is_active ?? true,
    });
    setExistingImages((product as any).product_images || []);
    setPendingImages([]);
    
    // Load existing variants
    const { data: existingVariants } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', product.id);
    
    if (existingVariants) {
      setVariants(existingVariants.map(v => ({
        id: v.id,
        size: v.size || '',
        color: v.color || '',
        price_override: v.price_override ? String(v.price_override) : '',
        stock: String(v.stock || 0),
        sku: v.sku || '',
      })));
    }
    setIsOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const validation = validateForm(productSchema, form);
    if (!validation.success) {
      const firstError = Object.values(validation.errors || {})[0];
      toast.error(firstError || 'Please fix the form errors');
      return;
    }
    
    if (editingId) {
      updateMutation.mutate({ id: editingId, data: form });
    } else {
      createMutation.mutate(form);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    setEditingId(null);
    setForm(defaultForm);
    setPendingImages([]);
    setExistingImages([]);
    setVariants([]);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-3xl font-bold font-serif text-foreground">Products</h1>
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
          <DialogTrigger asChild>
            <Button onClick={() => { setEditingId(null); setForm(defaultForm); }}>
              <Plus className="h-4 w-4 mr-2" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingId ? 'Edit Product' : 'Add New Product'}
              </DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name *</Label>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="item_code">Item Code *</Label>
                  <Input
                    id="item_code"
                    value={form.item_code}
                    onChange={(e) => setForm({ ...form, item_code: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="base_price">Base Price *</Label>
                  <Input
                    id="base_price"
                    type="number"
                    step="0.01"
                    value={form.base_price}
                    onChange={(e) => setForm({ ...form, base_price: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Select
                    value={form.category_id}
                    onValueChange={(value) => setForm({ ...form, category_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent className="z-50 bg-popover">
                      {categoriesLoading ? (
                        <SelectItem value="" disabled>Loading...</SelectItem>
                      ) : categories && categories.length > 0 ? (
                        categories.map((cat) => (
                          <SelectItem key={cat.id} value={cat.id}>
                            {cat.name}
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="" disabled>No categories available</SelectItem>
                      )}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="is_group_buy_eligible">Group Buy Eligible</Label>
                  <Switch
                    id="is_group_buy_eligible"
                    checked={form.is_group_buy_eligible}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, is_group_buy_eligible: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="is_flash_deal">Flash Deal</Label>
                  <Switch
                    id="is_flash_deal"
                    checked={form.is_flash_deal}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, is_flash_deal: checked })
                    }
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="is_free_shipping">Free Shipping</Label>
                  <Switch
                    id="is_free_shipping"
                    checked={form.is_free_shipping}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, is_free_shipping: checked })
                    }
                  />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border p-3">
                  <Label htmlFor="is_active">Active</Label>
                  <Switch
                    id="is_active"
                    checked={form.is_active}
                    onCheckedChange={(checked) =>
                      setForm({ ...form, is_active: checked })
                    }
                  />
                </div>
              </div>

              {/* Image Upload Section */}
              <div className="border-t border-border pt-4">
                <ProductImageUpload
                  productId={editingId || undefined}
                  existingImages={existingImages}
                  pendingImages={pendingImages}
                  onImagesChange={setPendingImages}
                />
              </div>

              {/* Variants Section */}
              <div className="border-t border-border pt-4">
                <ProductVariantsManager
                  variants={variants}
                  onVariantsChange={setVariants}
                  basePrice={form.base_price}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={handleClose}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createMutation.isPending || updateMutation.isPending}
                >
                  {(createMutation.isPending || updateMutation.isPending) && (
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  )}
                  {editingId ? 'Update' : 'Create'}
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
                  <TableHead className="w-16">Image</TableHead>
                  <TableHead>Name</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products?.map((product) => {
                  const images = (product as any).product_images as { image_url: string }[] | undefined;
                  const firstImage = images?.[0]?.image_url;
                  
                  return (
                    <TableRow key={product.id}>
                      <TableCell>
                        {firstImage ? (
                          <img
                            src={firstImage}
                            alt={product.name}
                            className="w-12 h-12 object-cover rounded-md border border-border"
                          />
                        ) : (
                          <div className="w-12 h-12 bg-muted rounded-md flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {(product.categories as { name: string } | null)?.name || '-'}
                      </TableCell>
                      <TableCell>${Number(product.base_price).toFixed(2)}</TableCell>
                      <TableCell>
                        <span
                          className={`inline-flex px-2 py-1 text-xs rounded-full ${
                            product.is_active
                              ? 'bg-primary/10 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {product.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteMutation.mutate(product.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
                {products?.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                      No products yet. Add your first product to get started.
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
