import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { CartProvider } from "@/contexts/CartContext";
import { AuthProvider } from "@/contexts/AuthContext";
import { CompareProvider } from "@/contexts/CompareContext";
import { CompareBar } from "@/components/compare/CompareBar";
import { MobileNavBar } from "@/components/layout/MobileNavBar";
import { LiveChatWidget } from "@/components/support/LiveChatWidget";
import { ThemeProvider } from "next-themes";
import Index from "./pages/Index";
import Products from "./pages/Products";
import ProductDetail from "./pages/ProductDetail";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import OrderConfirmation from "./pages/OrderConfirmation";
import MyOrders from "./pages/MyOrders";
import GroupBuys from "./pages/GroupBuys";
import Categories from "./pages/Categories";
import Auth from "./pages/Auth";
import Admin from "./pages/Admin";
import TrackOrder from "./pages/TrackOrder";
import Profile from "./pages/Profile";
import Wishlist from "./pages/Wishlist";
import Compare from "./pages/Compare";
import Help from "./pages/Help";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProvider>
          <CartProvider>
            <CompareProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/product/:id" element={<ProductDetail />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/checkout" element={<Checkout />} />
                  <Route path="/order-confirmation/:orderId" element={<OrderConfirmation />} />
                  <Route path="/my-orders" element={<MyOrders />} />
                  <Route path="/group-buys" element={<GroupBuys />} />
                  <Route path="/categories" element={<Categories />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/admin/*" element={<Admin />} />
                  <Route path="/track-order" element={<TrackOrder />} />
                  <Route path="/track-order/:orderId" element={<TrackOrder />} />
                  <Route path="/profile" element={<Profile />} />
                  <Route path="/wishlist" element={<Wishlist />} />
                  <Route path="/compare" element={<Compare />} />
                  <Route path="/help" element={<Help />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
                <CompareBar />
                <MobileNavBar />
                <LiveChatWidget />
              </BrowserRouter>
            </CompareProvider>
          </CartProvider>
        </AuthProvider>
      </TooltipProvider>
    </QueryClientProvider>
  </ThemeProvider>
);

export default App;
