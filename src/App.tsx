import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  useLocation,
  Navigate,
} from "react-router-dom";
import { useEffect } from "react";
import Dashboard from "./components/Dashboard";
import ProductList from "./components/ProductList";
import OverallCalculator from "./components/OverallCalculator";
import Customers from "./components/Customers";
import CustomerDetail from "./components/CustomerDetail";
import SalesOverview from "./components/SalesOverview";
import Login from "./components/Login";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import AccessDenied from "./components/auth/AccessDenied";
import NotFound from "./components/NotFound";
import { CartProvider, useCart } from "./context/CartContext";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import { useSupabaseAuth } from "./context/SupabaseAuthContext";
import {
  ShoppingCart,
  Users,
  Package,
  Moon,
  Sun,
  LogOut,
  LayoutDashboard,
  TrendingUp,
} from "lucide-react";
import { logger } from "./utils/logger";

function Navigation() {
  const location = useLocation();
  const { cartItems } = useCart();
  const { isDarkMode, toggleDarkMode } = useTheme();
  const { user, signOut, isAdmin } = useSupabaseAuth();

  // Log route changes
  useEffect(() => {
    logger.navigation(location.pathname, location.pathname, {
      userId: user?.id,
      search: location.search,
    });
  }, [location, user]);

  const isActive = (path: string) => {
    if (path === "/customers") {
      return (
        location.pathname === path ||
        location.pathname.startsWith("/customers/")
      );
    }
    if (path === "/sales-overview") {
      return location.pathname === path;
    }

    if (path === "/products") {
      return location.pathname === path;
    }
    return location.pathname === path;
  };

  return (
    <nav className="fixed top-0 left-0 right-0 bg-white dark:bg-gray-900 shadow-md z-50 transition-colors">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex items-center justify-between h-14 sm:h-16">
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 overflow-x-auto scrollbar-hide flex-1">
            <Link
              to="/"
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                isActive("/")
                  ? "bg-slate-800 dark:bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800"
              }`}
            >
              <LayoutDashboard className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Dashboard</span>
            </Link>
            <Link
              to="/products"
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                isActive("/products")
                  ? "bg-slate-800 dark:bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800"
              }`}
            >
              <Package className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Produkter</span>
            </Link>
            <Link
              to="/customers"
              className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                isActive("/customers")
                  ? "bg-slate-800 dark:bg-slate-700 text-white"
                  : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800"
              }`}
            >
              <Users className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
              <span className="hidden sm:inline">Kunder</span>
            </Link>
            {isAdmin && (
              <>
                <Link
                  to="/sales-overview"
                  className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap text-sm sm:text-base ${
                    isActive("/sales-overview")
                      ? "bg-slate-800 dark:bg-slate-700 text-white"
                      : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800"
                  }`}
                >
                  <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 flex-shrink-0" />
                  <span className="hidden md:inline">Salg</span>
                </Link>
              </>
            )}
          </div>
          <div className="flex items-center gap-1 sm:gap-2 md:gap-4 flex-shrink-0 ml-2">
            <button
              onClick={toggleDarkMode}
              className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
              aria-label="Toggle dark mode"
            >
              {isDarkMode ? (
                <Sun className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Moon className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </button>

            {cartItems.length > 0 && (
              <Link
                to="/calculator"
                className={`flex items-center gap-1 sm:gap-2 px-2 sm:px-3 md:px-4 py-2 rounded-lg font-medium transition-all relative whitespace-nowrap text-sm sm:text-base ${
                  isActive("/calculator")
                    ? "bg-slate-800 dark:bg-slate-700 text-white"
                    : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800"
                }`}
              >
                <ShoppingCart className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">Beregner</span>
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center">
                  {cartItems.length}
                </span>
              </Link>
            )}

            {user && (
              <div className="flex items-center gap-1 sm:gap-2">
                <span className="text-xs px-2 py-1 rounded-full border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-slate-200 hidden lg:inline">
                  {isAdmin ? "Admin" : "User"}
                </span>
                <span className="text-sm text-slate-600 dark:text-slate-300 hidden lg:inline">
                  {user.user_metadata?.preferred_username ||
                    user.user_metadata?.full_name}
                </span>
                <button
                  onClick={() => signOut()}
                  className="p-2 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-gray-800 transition-all"
                  aria-label="Log ud"
                  title="Log ud"
                >
                  <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

function AppContent() {
  return (
    <div className="relative">
      <Navigation />
      <div className="pt-14 sm:pt-16">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<ProductList />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/customers/:customerId" element={<CustomerDetail />} />
          <Route
            path="/sales-overview"
            element={
              <ProtectedRoute requireAdmin fallbackPath="/access-denied">
                <SalesOverview />
              </ProtectedRoute>
            }
          />
          <Route path="/access-denied" element={<AccessDenied />} />
          <Route path="*" element={<NotFound />} />
          <Route
            path="/calculator"
            element={
              <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800 py-12 px-4">
                <div className="max-w-6xl mx-auto">
                  <OverallCalculator />
                </div>
              </div>
            }
          />
        </Routes>
      </div>
    </div>
  );
}

function App() {
  const { loading, user } = useSupabaseAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white text-lg">Indlæser...</p>
        </div>
      </div>
    );
  }

  return (
    <BrowserRouter>
      <ThemeProvider>
        <CartProvider>
          <Routes>
            <Route
              path="/login"
              element={user ? <Navigate to="/" replace /> : <Login />}
            />
            <Route
              path="/*"
              element={
                <ProtectedRoute fallbackPath="/login">
                  <AppContent />
                </ProtectedRoute>
              }
            />
          </Routes>
        </CartProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}

export default App;
