import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Package, FolderTree, Users, ShoppingCart } from 'lucide-react';

export function AdminDashboard() {
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

  const { data: orderCount } = useQuery({
    queryKey: ['admin-order-count'],
    queryFn: async () => {
      const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });
      return count || 0;
    },
  });

  const stats = [
    { name: 'Total Products', value: productCount ?? 0, icon: Package, color: 'text-primary' },
    { name: 'Categories', value: categoryCount ?? 0, icon: FolderTree, color: 'text-accent-foreground' },
    { name: 'Active Group Buys', value: groupBuyCount ?? 0, icon: Users, color: 'text-primary' },
    { name: 'Total Orders', value: orderCount ?? 0, icon: ShoppingCart, color: 'text-accent-foreground' },
  ];

  return (
    <div>
      <h1 className="text-3xl font-bold font-serif text-foreground mb-8">Dashboard</h1>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
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

      <div className="mt-8">
        <Card>
          <CardHeader>
            <CardTitle>Welcome to the Admin Dashboard</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">
              Use the sidebar navigation to manage your products, categories, and group buys.
              This dashboard gives you full control over your Ihsan store.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
