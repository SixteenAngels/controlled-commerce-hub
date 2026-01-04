import { useCompare } from '@/contexts/CompareContext';
import { useProducts, ProductWithDetails } from '@/hooks/useProducts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { X, Star, Truck, Zap, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Header } from '@/components/layout/Header';
import { Footer } from '@/components/layout/Footer';

export default function Compare() {
  const { compareItems, removeFromCompare, clearCompare } = useCompare();
  const { data: allProducts } = useProducts();

  const products = allProducts?.filter(p => compareItems.includes(p.id)) || [];

  if (compareItems.length === 0) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold">No Products to Compare</h1>
            <p className="text-muted-foreground mb-6">Add products to compare them side by side</p>
            <Link to="/products">
              <Button>Browse Products</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Compare Products ({products.length})</h1>
          <Button variant="outline" onClick={clearCompare}>Clear All</Button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left p-4 border-b bg-muted/50 min-w-[150px]">Feature</th>
                {products.map(product => (
                  <th key={product.id} className="p-4 border-b bg-muted/50 min-w-[250px]">
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="absolute -top-2 -right-2"
                        onClick={() => removeFromCompare(product.id)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                      <img
                        src={product.images?.[0] || '/placeholder.svg'}
                        alt={product.name}
                        className="w-32 h-32 object-cover mx-auto rounded-lg mb-2"
                      />
                      <Link to={`/product/${product.id}`} className="font-medium hover:text-primary">
                        {product.name}
                      </Link>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="p-4 border-b font-medium">Price</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 border-b text-center">
                    <span className="text-xl font-bold text-primary">
                      ₦{product.base_price.toLocaleString()}
                    </span>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-b font-medium">Rating</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 border-b text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                      <span>{product.rating || 0}</span>
                      <span className="text-muted-foreground">({product.review_count || 0})</span>
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-b font-medium">Category</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 border-b text-center">
                    {product.category_id || 'N/A'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-b font-medium">Stock</td>
                {products.map(product => {
                  const totalStock = product.variants?.reduce((sum, v) => sum + (v.stock || 0), 0) || 0;
                  return (
                    <td key={product.id} className="p-4 border-b text-center">
                      <Badge variant={totalStock > 10 ? 'default' : totalStock > 0 ? 'secondary' : 'destructive'}>
                        {totalStock > 0 ? `${totalStock} in stock` : 'Out of stock'}
                      </Badge>
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-4 border-b font-medium">Variants</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 border-b text-center">
                    <div className="flex flex-wrap gap-1 justify-center">
                      {product.variants?.slice(0, 3).map(v => (
                        <Badge key={v.id} variant="outline">
                          {v.size || v.color || 'Default'}
                        </Badge>
                      ))}
                      {(product.variants?.length || 0) > 3 && (
                        <Badge variant="outline">+{(product.variants?.length || 0) - 3}</Badge>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-b font-medium">Features</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 border-b text-center">
                    <div className="flex flex-wrap gap-2 justify-center">
                      {product.is_free_shipping && (
                        <Badge variant="secondary" className="gap-1">
                          <Truck className="h-3 w-3" /> Free Shipping
                        </Badge>
                      )}
                      {product.is_flash_deal && (
                        <Badge variant="secondary" className="gap-1 bg-orange-500 text-white">
                          <Zap className="h-3 w-3" /> Flash Deal
                        </Badge>
                      )}
                      {product.is_group_buy_eligible && (
                        <Badge variant="secondary" className="gap-1">
                          <Users className="h-3 w-3" /> Group Buy
                        </Badge>
                      )}
                    </div>
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 border-b font-medium">Description</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 border-b text-center text-sm text-muted-foreground">
                    {product.description?.substring(0, 150) || 'No description'}...
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-4 font-medium">Action</td>
                {products.map(product => (
                  <td key={product.id} className="p-4 text-center">
                    <Link to={`/product/${product.id}`}>
                      <Button>View Details</Button>
                    </Link>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </main>
      <Footer />
    </div>
  );
}