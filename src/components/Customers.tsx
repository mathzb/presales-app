import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Users,
  AlertCircle,
  Loader2,
  Search,
  ChevronLeft,
  ChevronRight,
  Mail,
  Phone,
  MapPin,
  Building2,
} from "lucide-react";
import { useCustomers } from "../hooks/useCustomers";
import { Customer } from "../types/customer";
import {
  WHITELABEL_OPTIONS,
  getCustomerReferenceName,
} from "../utils/referenceMap";
import WhitelabelBadge from "./ui/WhitelabelBadge";
import { logger } from "../utils/logger";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

export default function Customers() {
  const log = logger.createScopedLogger("Customers");
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [selectedWhitelabel, setSelectedWhitelabel] = useState<string>("all");
  const [pageIndex, setPageIndex] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const { data, isLoading, error, refetch } = useCustomers(250);

  // Component mount logging
  useEffect(() => {
    document.title = "Kunder - Cloud Factory Presales Portal";
    log.info("Customers component mounted");
    return () => {
      log.debug("Customers component unmounted");
    };
  }, []);

  // Log fetch errors
  useEffect(() => {
    if (error) {
      log.error("Failed to load customers", error as Error);
    }
  }, [error]);

  const allCustomers = data?.results || [];

  const whitelabelOptions = WHITELABEL_OPTIONS;

  const filteredCustomers = useMemo(() => {
    const searchLower = searchTerm.trim().toLowerCase();
    return allCustomers.filter((customer) => {
      // whitelabel filter
      if (selectedWhitelabel !== "all") {
        if (customer.customerReference !== selectedWhitelabel) return false;
      }
      if (!searchLower) return true;
      return (
        customer.name.toLowerCase().includes(searchLower) ||
        customer.email.toLowerCase().includes(searchLower) ||
        customer.phone.toLowerCase().includes(searchLower) ||
        customer.customerReference.toLowerCase().includes(searchLower)
      );
    });
  }, [allCustomers, searchTerm, selectedWhitelabel]);

  const totalRecords = filteredCustomers.length;
  const totalPages = Math.ceil(totalRecords / pageSize);

  const paginatedCustomers = useMemo(() => {
    const startIndex = (pageIndex - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    return filteredCustomers.slice(startIndex, endIndex);
  }, [filteredCustomers, pageIndex, pageSize]);

  const metadata = {
    page: pageIndex,
    pageSize,
    totalPages,
    totalRecords,
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <Card>
          <CardContent className="p-8 text-center">
            <Loader2 className="w-12 h-12 text-slate-600 dark:text-slate-400 animate-spin mx-auto mb-4" />
            <p className="text-slate-600 dark:text-slate-300 text-lg">
              Indlæser alle kunder...
            </p>
            <p className="text-muted-foreground text-sm mt-2">
              Dette kan tage et øjeblik
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 dark:from-gray-900 dark:to-gray-800">
        <Card className="max-w-md">
          <CardContent className="p-8">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-slate-800 dark:text-slate-200 mb-2 text-center">
              Fejl ved indlæsning af kunder
            </h2>
            <p className="text-muted-foreground text-center mb-4">
              {error instanceof Error
                ? error.message
                : "Kunne ikke indlæse kunder"}
            </p>
            <Button onClick={() => refetch()} className="w-full">
              Prøv igen
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-purple-50 to-slate-100 dark:from-gray-900 dark:via-purple-950 dark:to-gray-900">
      {/* Hero Header */}
      <div className="bg-gradient-to-r from-purple-800 via-purple-700 to-pink-800 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 via-pink-600/10 to-blue-600/10 pointer-events-none" />
        <div className="absolute top-10 right-10 w-72 h-72 bg-pink-400/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 left-10 w-96 h-96 bg-purple-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
          <div className="text-center">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm text-white px-4 py-2 rounded-full text-sm font-semibold mb-6">
              <Users className="w-4 h-4" />
              {allCustomers.length} Registrerede Kunder
            </div>
            <h1 className="text-5xl md:text-6xl font-bold text-white mb-4">
              Kundehåndtering
            </h1>
            <p className="text-xl text-purple-100 max-w-2xl mx-auto mb-6">
              Søg, administrer og håndter alle kundeoplysninger
            </p>
            <div className="flex items-center justify-center gap-3">
              <WhitelabelBadge
                whitelabelKey={selectedWhitelabel}
                onClear={() => setSelectedWhitelabel("all")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Search and Filters */}
        <div className="mb-8 space-y-6">
          <div className="max-w-2xl mx-auto">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl opacity-0 group-hover:opacity-10 blur transition-opacity pointer-events-none" />
              <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-slate-400 dark:text-slate-500 group-focus-within:text-purple-500 transition-colors pointer-events-none" />
              <Input
                type="text"
                placeholder="Søg kunder... (navn, email, telefon, reference)"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPageIndex(1);
                }}
                className="w-full pl-14 pr-6 py-4 text-lg shadow-lg hover:shadow-xl"
              />
            </div>
          </div>

          <Card className="max-w-2xl mx-auto">
            <CardContent className="p-6">
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <label className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    Whitelabel:
                  </label>
                  <select
                    value={selectedWhitelabel}
                    onChange={(e) => {
                      setSelectedWhitelabel(e.target.value);
                      setPageIndex(1);
                    }}
                    className="px-4 py-2 border-2 border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 font-medium hover:border-purple-500 transition-colors"
                  >
                    {whitelabelOptions.map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-3">
                  <label
                    htmlFor="pageSize"
                    className="text-sm font-semibold text-slate-700 dark:text-slate-300"
                  >
                    Vis per side:
                  </label>
                  <select
                    id="pageSize"
                    value={pageSize}
                    onChange={(e) => {
                      setPageSize(Number(e.target.value));
                      setPageIndex(1);
                    }}
                    className="px-4 py-2 border-2 border-slate-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 dark:focus:ring-purple-400 bg-white dark:bg-gray-700 text-slate-900 dark:text-slate-100 font-medium hover:border-purple-500 transition-colors"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                    <option value={250}>250</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 text-sm font-medium text-slate-600 dark:text-slate-400">
                  <span className="px-3 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg">
                    {(metadata.page - 1) * metadata.pageSize + 1} -{" "}
                    {Math.min(
                      metadata.page * metadata.pageSize,
                      metadata.totalRecords
                    )}
                  </span>
                  <span>af</span>
                  <span className="px-3 py-1 bg-slate-100 dark:bg-gray-700 text-slate-700 dark:text-slate-300 rounded-lg font-bold">
                    {metadata.totalRecords}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {paginatedCustomers.length === 0 ? (
          <Card className="shadow-2xl border-2">
            <CardContent className="p-16 text-center">
              <div className="inline-flex p-6 bg-purple-100 dark:bg-purple-900/30 rounded-full mb-6">
                <Users className="w-16 h-16 text-purple-500 dark:text-purple-400" />
              </div>
              <h3 className="text-2xl font-bold text-slate-800 dark:text-slate-200 mb-2">
                Ingen kunder fundet
              </h3>
              <p className="text-muted-foreground text-lg">
                {searchTerm
                  ? `Prøv at søge efter noget andet end "${searchTerm}"`
                  : "Der er ingen kunder tilgængelige i øjeblikket"}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {paginatedCustomers.map((customer: Customer) => (
              <Card
                key={customer.id}
                onClick={() => {
                  log.userAction("Navigate to customer detail", {
                    customerId: customer.id,
                    customerName: customer.name,
                  });
                  navigate(`/customers/${customer.id}`);
                }}
                className="overflow-hidden border-2 hover:border-purple-400 dark:hover:border-purple-600 cursor-pointer group transform hover:scale-[1.02] transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-4 bg-gradient-to-br from-purple-100 to-pink-100 dark:from-purple-900/30 dark:to-pink-900/30 rounded-xl group-hover:from-purple-200 group-hover:to-pink-200 dark:group-hover:from-purple-900/50 dark:group-hover:to-pink-900/50 transition-colors">
                      <Building2 className="w-8 h-8 text-purple-700 dark:text-purple-300" />
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-slate-900 dark:text-slate-100 mb-3 group-hover:text-purple-700 dark:group-hover:text-purple-300 transition-colors">
                    {customer.name}
                  </h3>

                  <div className="space-y-2 mb-4">
                    {customer.email && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Mail className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span className="truncate">{customer.email}</span>
                      </div>
                    )}

                    {customer.phone && (
                      <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <Phone className="w-4 h-4 text-slate-400 dark:text-slate-500" />
                        <span>{customer.phone}</span>
                      </div>
                    )}

                    {customer.address && (
                      <div className="flex items-start gap-2 text-sm text-slate-600 dark:text-slate-400">
                        <MapPin className="w-4 h-4 text-slate-400 dark:text-slate-500 mt-0.5" />
                        <div className="flex-1">
                          {customer.address.streetName && (
                            <div>{customer.address.streetName}</div>
                          )}
                          {customer.address.streetName2 && (
                            <div>{customer.address.streetName2}</div>
                          )}
                          <div>
                            {customer.address.postalCode}{" "}
                            {customer.address.city}
                          </div>
                          {customer.address.countryCode && (
                            <div className="text-xs text-slate-500 dark:text-slate-400 mt-1">
                              {customer.address.countryCode}
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-slate-200 dark:border-gray-700 pt-4 space-y-2">
                    {customer.customerReference && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          Reference:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          {getCustomerReferenceName(customer.customerReference)}
                        </span>
                      </div>
                    )}
                    {customer.vatId && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          CVR:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          {customer.vatId}
                        </span>
                      </div>
                    )}
                    {customer.displayCurrency && (
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500 dark:text-slate-400">
                          Valuta:
                        </span>
                        <span className="text-slate-900 dark:text-slate-100 font-medium">
                          {customer.displayCurrency}
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {metadata.totalPages > 1 && (
          <div className="mt-8 flex items-center justify-center gap-2">
            <Button
              onClick={() => setPageIndex(Math.max(1, pageIndex - 1))}
              disabled={pageIndex === 1}
              variant="outline"
              className="gap-1"
            >
              <ChevronLeft className="w-4 h-4" />
              Forrige
            </Button>

            <div className="flex items-center gap-2">
              {pageIndex > 3 && (
                <>
                  <Button onClick={() => setPageIndex(1)} variant="outline">
                    1
                  </Button>
                  <span className="text-slate-400 dark:text-slate-600">
                    ...
                  </span>
                </>
              )}

              {[...Array(5)].map((_, i) => {
                const page = pageIndex - 2 + i;
                if (page < 1 || page > metadata.totalPages) return null;
                return (
                  <Button
                    key={page}
                    onClick={() => setPageIndex(page)}
                    variant={page === pageIndex ? "default" : "outline"}
                  >
                    {page}
                  </Button>
                );
              })}

              {pageIndex < metadata.totalPages - 2 && (
                <>
                  <span className="text-slate-400 dark:text-slate-600">
                    ...
                  </span>
                  <Button
                    onClick={() => setPageIndex(metadata.totalPages)}
                    variant="outline"
                  >
                    {metadata.totalPages}
                  </Button>
                </>
              )}
            </div>

            <Button
              onClick={() =>
                setPageIndex(Math.min(metadata.totalPages, pageIndex + 1))
              }
              disabled={pageIndex === metadata.totalPages}
              variant="outline"
              className="gap-1"
            >
              Næste
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
