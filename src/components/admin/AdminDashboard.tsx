import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderTree, Users, ShoppingCart, AlertTriangle, Zap, TrendingUp, DollarSign } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/hooks/useCurrency';

export function AdminDashboard() {
  const { formatPrice } = useCurrency();
  const { data: productCount } = useQuery({
    queryKey: ['admin-product-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: categoryCount } = useQuery({
    queryKey: ['admin-category-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('categories')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const { data: groupBuyCount } = useQuery({
    queryKey: ['admin-groupbuy-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('group_buys')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'open');
      return count || 0;
    },
  });

  const { data: orderStats } = useQuery({
    queryKey: ['admin-order-stats'],
    queryFn: async () => {
      const { data: orders } = await supabase
        .from('orders')
        .select('status, total_amount, created_at');

      const total = orders?.length || 0;
      const pending = orders?.filter(o => o.status === 'pending').length || 0;
      const delivered = orders?.filter(o => o.status === 'delivered').length || 0;
      const totalRevenue = orders?.reduce((sum, o) => sum + Number(o.total_amount), 0) || 0;

      return { total, pending, delivered, totalRevenue };
    },
  });

  const { data: lowStockProducts } = useQuery({
    queryKey: ['admin-low-stock'],
    queryFn: async () => {
      const { data } = await supabase
        .from('product_variants')
        .select('id, stock, products(name)')
        .lt('stock', 10)
        .eq('is_active', true);
      return data || [];
    },
  });

  const { data: flashDealCount } = useQuery({
    queryKey: ['admin-flash-deals'],
    queryFn: async () => {
      const { count } = await supabase
        .from('products')
        .select('*', { count: 'exact', head: true })
        .eq('is_flash_deal', true)
        .eq('is_active', true);
      return count || 0;
    },
  });

  const stats = [
    { name: 'Total Products', value: productCount ?? 0, icon: Package, color: 'text-primary' },
    { name: 'Categories', value: categoryCount ?? 0, icon: FolderTree, color: 'text-accent-foreground' },
    { name: 'Active Group Buys', value: groupBuyCount ?? 0, icon: Users, color: 'text-primary' },
    { name: 'Total Orders', value: orderStats?.total ?? 0, icon: ShoppingCart, color: 'text-accent-foreground' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold font-serif text-foreground mb-8">Dashboard</h1>
      
      {/* Main Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {stats.map((stat) => (
          <Card key={stat.name}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.name}
              </CardTitle>
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Revenue and Order Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Revenue
            </CardTitle>
            <DollarSign className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">
              {formatPrice(orderStats?.totalRevenue ?? 0)}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Orders
            </CardTitle>
            <TrendingUp className="h-5 w-5 text-accent-foreground" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{orderStats?.pending ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Delivered Orders
            </CardTitle>
            <ShoppingCart className="h-5 w-5 text-primary" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{orderStats?.delivered ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Flash Deals & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Flash Deals Running
            </CardTitle>
            <Zap className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{flashDealCount ?? 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Low Stock Alerts
            </CardTitle>
            <AlertTriangle className="h-5 w-5 text-destructive" />
          </CardHeader>
          <CardContent>
            <p className="text-3xl font-bold text-foreground">{lowStockProducts?.length ?? 0}</p>
          </CardContent>
        </Card>
      </div>

      {/* Low Stock Items */}
      {lowStockProducts && lowStockProducts.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-destructive" />
              Low Stock Products
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockProducts.slice(0, 5).map((variant: any) => (
                <div key={variant.id} className="flex items-center justify-between p-2 rounded-lg bg-muted">
                  <span className="text-sm text-foreground">
                    {variant.products?.name || 'Unknown Product'}
                  </span>
                  <Badge variant={variant.stock === 0 ? 'destructive' : 'secondary'}>
                    {variant.stock} in stock
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Welcome Card */}
      <Card>
        <CardHeader>
          <CardTitle>Welcome to the Admin Dashboard</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            Use the sidebar navigation to manage your products, categories, orders, shipping, and more.
            This dashboard gives you full control over your Ihsan store.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
