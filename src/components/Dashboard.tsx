import { Link } from "react-router-dom";
import {
  Package,
  Users,
  ShoppingCart,
  TrendingUp,
  Sparkles,
  Calculator,
  ArrowRight,
  Calendar,
  DollarSign,
} from "lucide-react";
import { useCart } from "../context/CartContext";
// import { useProducts } from "../hooks/useProducts"; // Disabled - causes too many API calls
import { useCustomers } from "../hooks/useCustomers";
import { formatCurrency } from "../utils/currency";
import { useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

export default function Dashboard() {
  const { cartItems } = useCart();
  // Don't fetch products on dashboard - too many API calls
  // const { data: productsData, isLoading: productsLoading } = useProducts(1);
  const { data: customersData, isLoading: customersLoading } = useCustomers();

  // Use a static count or "Many" for products to avoid overwhelming the API
  const totalProducts = "250+"; // Static display since fetching is too heavy
  const totalCustomers = customersData?.metadata?.totalRecords || 0;
  const cartTotal = cartItems.reduce((sum, item) => {
    const finalPrice =
      item.productResult.price.sale * (1 - item.discount / 100);
    return sum + finalPrice * item.quantity;
  }, 0);

  useEffect(() => {
    document.title = "Dashboard - Cloud Factory Presales Portal";
  }, []);

  const stats = [
    {
      title: "Produkter",
      value: totalProducts, // Static value to avoid API overload
      icon: Package,
      gradient: "from-blue-500 to-cyan-500",
      bgGradient:
        "from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20",
      link: "/products",
      description: "Tilgængelige produkter",
    },
    {
      title: "Kunder",
      value: customersLoading ? "..." : totalCustomers.toLocaleString(),
      icon: Users,
      gradient: "from-purple-500 to-pink-500",
      bgGradient:
        "from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20",
      link: "/customers",
      description: "Registrerede kunder",
    },
    {
      title: "I Beregneren",
      value: cartItems.length.toString(),
      icon: ShoppingCart,
      gradient: "from-emerald-500 to-teal-500",
      bgGradient:
        "from-emerald-50 to-teal-50 dark:from-emerald-900/20 dark:to-teal-900/20",
      link: "/calculator",
      description: "Produkter i beregner",
    },
  ];

  // Note: Additional quick actions and features arrays were removed to avoid unused declarations

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 dark:from-gray-900 dark:via-blue-950 dark:to-gray-900">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 via-purple-600/10 to-pink-600/10 dark:from-blue-600/20 dark:via-purple-600/20 dark:to-pink-600/20" />

        {/* Animated background circles */}
        <div className="absolute top-20 left-10 w-72 h-72 bg-blue-400/20 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse delay-1000" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-16">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-2 rounded-full text-sm font-semibold mb-6 shadow-lg animate-fade-in">
              <Sparkles className="w-4 h-4 animate-pulse" />
              CloudFactory Presales Portal
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-slate-900 via-blue-900 to-purple-900 dark:from-slate-100 dark:via-blue-100 dark:to-purple-100 mb-4">
              Velkommen til Presales Dashboard
            </h1>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
            {stats.map((stat, index) => (
              <Link key={index} to={stat.link} className="group">
                <Card className="relative overflow-hidden hover:shadow-lg transition-all duration-300 hover:scale-105">
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-50`}
                  />
                  <CardHeader className="relative flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      {stat.title}
                    </CardTitle>
                    <div
                      className={`p-2 rounded-lg bg-gradient-to-br ${stat.gradient}`}
                    >
                      <stat.icon className="w-4 h-4 text-white" />
                    </div>
                  </CardHeader>
                  <CardContent className="relative">
                    <div className="flex items-end justify-between">
                      <div>
                        <div className="text-3xl font-bold">{stat.value}</div>
                        <CardDescription className="text-xs mt-1">
                          {stat.description}
                        </CardDescription>
                      </div>
                      <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors" />
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Cart Summary (if items in cart) */}
        {cartItems.length > 0 && (
          <Card className="relative overflow-hidden bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-none shadow-2xl mb-16">
            <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent" />
            <CardHeader className="relative">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-2xl text-white mb-2">
                    Din Beregning
                  </CardTitle>
                  <CardDescription className="text-emerald-100">
                    Du har {cartItems.length} produkt
                    {cartItems.length !== 1 ? "er" : ""} i beregneren
                  </CardDescription>
                </div>
                <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-6">
                  <Calculator className="w-12 h-12 text-white" />
                </div>
              </div>
            </CardHeader>
            <CardContent className="relative">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-emerald-100 text-sm">
                      Total værdi
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {formatCurrency(cartTotal, "DKK")}
                    </p>
                  </CardContent>
                </Card>
                <Card className="bg-white/10 backdrop-blur-sm border-white/20">
                  <CardHeader className="pb-2">
                    <CardDescription className="text-emerald-100 text-sm">
                      Antal produkter
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold text-white">
                      {cartItems.reduce((sum, item) => sum + item.quantity, 0)}
                    </p>
                  </CardContent>
                </Card>
              </div>

              <Link
                to="/calculator"
                className="inline-flex items-center gap-2 bg-white dark:bg-emerald-600 text-emerald-600 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-700 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
              >
                <Calculator className="w-5 h-5" />
                Gå til Beregner
                <ArrowRight className="w-5 h-5" />
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity / Tips Section */}
        <div className="mt-16 grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-2xl p-6 border-2 border-blue-200 dark:border-blue-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-blue-600 rounded-lg">
                <TrendingUp className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Kom I Gang
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  1
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Tilføj produkter til beregneren
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Gennemse produktkataloget og vælg de produkter, du vil
                    beregne
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  2
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Juster mængder og rabatter
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Tilpas antal brugere og anvend kundespecifikke rabatter
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                  3
                </div>
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Se automatiske incitamenter
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Incitamenter anvendes automatisk baseret på produkter
                  </p>
                </div>
              </li>
            </ul>
          </div>

          <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-2xl p-6 border-2 border-purple-200 dark:border-purple-800">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100">
                Tips & Tricks
              </h3>
            </div>
            <ul className="space-y-3">
              <li className="flex items-start gap-3">
                <DollarSign className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Eksporter til Excel
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Download dine beregninger som Excel-ark til at dele med
                    kunder
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Incitament perioder
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Sæt start- og slutdatoer for at planlægge fremtidige
                    incitamenter
                  </p>
                </div>
              </li>
              <li className="flex items-start gap-3">
                <Package className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-slate-900 dark:text-slate-100">
                    Produkt varianter
                  </p>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Produkter grupperes automatisk efter varianter for nemmere
                    navigation
                  </p>
                </div>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
