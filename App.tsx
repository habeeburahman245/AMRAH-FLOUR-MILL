import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Product, AdminNotification } from './types';
import { generateProducts, generateNotifications } from './services/geminiService';
import { useWishlist } from './hooks/useWishlist';
import { useAuth } from './hooks/useAuth';
import { useCart } from './hooks/useCart';
import { useDarkMode } from './hooks/useDarkMode';
import { ProductCard } from './components/ProductCard';
import { ProductModal } from './components/ProductModal';
import { AdminView } from './components/AdminView';
import { UserDashboardView } from './components/UserDashboardView';
import { ToastProvider } from './components/Toast';
import { StarRating } from './components/StarRating';
import { MiniCart } from './components/MiniCart';
import { CheckoutView } from './components/CheckoutView';
import { OrderConfirmationView } from './components/OrderConfirmationView';
import { LoginModal } from './components/LoginModal';
import { Footer } from './components/Footer';


type View = 'store' | 'admin' | 'dashboard' | 'checkout' | 'confirmation' | 'contact';

const App: React.FC = () => {
  // Core State
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [view, setView] = useState<View>('store');
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isLoginModalOpen, setLoginModalOpen] = useState(false);
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [adminNotifications, setAdminNotifications] = useState<AdminNotification[]>([]);

  // Hooks
  const { wishlist, toggleWishlist, isWishlisted } = useWishlist();
  const auth = useAuth();
  const { itemCount, clearCart } = useCart();
  const [theme, toggleTheme] = useDarkMode();

  // Filter and Sort State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Infinity]);
  const [minRating, setMinRating] = useState(0);
  const [sortBy, setSortBy] = useState('relevance');
  
  // Fetch notifications for header badge
  useEffect(() => {
    if (auth.isLoggedIn && auth.role) {
      const fetchNotifs = async () => {
        try {
          const notifs = await generateNotifications();
          setAdminNotifications(notifs);
        } catch (err) {
          console.error("Failed to fetch admin notifications for header", err);
        }
      };
      fetchNotifs();
    } else {
      setAdminNotifications([]);
    }
  }, [auth.isLoggedIn, auth.role]);

  const unreadNotifCount = useMemo(() => adminNotifications.filter(n => !n.isRead).length, [adminNotifications]);

  // Fetch initial products
  useEffect(() => {
    if (products.length === 0) {
      const fetchProducts = async () => {
        try {
          setIsLoading(true);
          setError(null);
          const generatedProducts = await generateProducts();
          setProducts(generatedProducts);
        } catch (err) {
          setError("Failed to load products. Please check your API key and network connection.");
          console.error(err);
        } finally {
          setIsLoading(false);
        }
      };
      fetchProducts();
    }
  }, [products.length]);
  
  // Close cart and mobile menu when view changes
  useEffect(() => {
    setIsCartOpen(false);
    setMobileMenuOpen(false);
  }, [view]);

  // Derived state for filters
  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))), [products]);
  const brands = useMemo(() => Array.from(new Set(products.map(p => p.brand))), [products]);

  // Event Handlers
  const handleSelectProduct = useCallback((product: Product) => setSelectedProduct(product), []);
  const handleCloseModal = useCallback(() => setSelectedProduct(null), []);
  const handleToggleWishlist = useCallback((productId: string) => toggleWishlist(productId), [toggleWishlist]);
  
  const handleCategoryChange = (category: string) => {
    setSelectedCategories(prev => prev.includes(category) ? prev.filter(c => c !== category) : [...prev, category]);
  };
  const handleBrandChange = (brand: string) => {
    setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);
  };
  
  const handleCheckout = () => setView('checkout');

  const handlePlaceOrder = () => {
      const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;
      setLastOrderId(orderId);
      clearCart();
      setView('confirmation');
  };

  const handleLoginSuccess = () => {
      setLoginModalOpen(false);
      setView('admin');
  }

  // Main product filtering and sorting logic
  const filteredAndSortedProducts = useMemo(() => {
    return products
      .filter(p => {
        const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesCategory = selectedCategories.length === 0 || selectedCategories.includes(p.category);
        const matchesBrand = selectedBrands.length === 0 || selectedBrands.includes(p.brand);
        const matchesPrice = p.price >= priceRange[0] && p.price <= priceRange[1];
        const matchesRating = p.rating >= minRating;
        return matchesSearch && matchesCategory && matchesBrand && matchesPrice && matchesRating;
      })
      .sort((a, b) => {
        switch (sortBy) {
          case 'price_asc': return a.price - b.price;
          case 'price_desc': return b.price - a.price;
          case 'rating_desc': return b.rating - a.rating;
          default: return 0; // 'relevance' - no specific sort
        }
      });
  }, [products, searchTerm, selectedCategories, selectedBrands, priceRange, minRating, sortBy]);
  
  const renderStoreView = () => (
    <>
      <main className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mb-8 p-6 bg-white dark:bg-gray-800 rounded-lg shadow">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 items-end">
            {/* Search */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Search Products</label>
              <input type="text" id="search" placeholder="Enter product name..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2" />
            </div>
            {/* Sort */}
            <div>
              <label htmlFor="sort" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Sort by</label>
              <select id="sort" value={sortBy} onChange={e => setSortBy(e.target.value)} className="mt-1 block w-full rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2">
                <option value="relevance">Relevance</option>
                <option value="price_asc">Price: Low to High</option>
                <option value="price_desc">Price: High to Low</option>
                <option value="rating_desc">Highest Rating</option>
              </select>
            </div>
             {/* Rating */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Rating</label>
                <div className="flex items-center gap-2 mt-2">
                    {[4, 3, 2, 1].map(r => (
                        <button key={r} onClick={() => setMinRating(minRating === r ? 0 : r)} className={`flex items-center gap-1 text-xs px-2 py-1 rounded-full border ${minRating === r ? 'bg-indigo-600 text-white border-indigo-600' : 'bg-white dark:bg-gray-700 dark:border-gray-600 dark:hover:bg-gray-600 hover:bg-gray-100'}`}>
                            {r} <StarRating rating={1} className="text-yellow-400" /> & up
                        </button>
                    ))}
                </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
            {/* Filters Sidebar */}
            <aside className="w-1/4 xl:w-1/5 hidden md:block">
                 <div className="space-y-6">
                     <div>
                        <h3 className="font-semibold text-lg mb-3 dark:text-gray-200">Category</h3>
                        <div className="space-y-2">
                            {categories.map(c => <label key={c} className="flex items-center"><input type="checkbox" checked={selectedCategories.includes(c)} onChange={() => handleCategoryChange(c)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-100 dark:bg-gray-700" /> <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{c}</span></label>)}
                        </div>
                     </div>
                     <div>
                        <h3 className="font-semibold text-lg mb-3 dark:text-gray-200">Brand</h3>
                        <div className="space-y-2">
                            {brands.map(b => <label key={b} className="flex items-center"><input type="checkbox" checked={selectedBrands.includes(b)} onChange={() => handleBrandChange(b)} className="h-4 w-4 rounded border-gray-300 dark:border-gray-600 text-indigo-600 focus:ring-indigo-500 bg-gray-100 dark:bg-gray-700" /> <span className="ml-3 text-sm text-gray-600 dark:text-gray-400">{b}</span></label>)}
                        </div>
                     </div>
                      <div>
                        <h3 className="font-semibold text-lg mb-3 dark:text-gray-200">Price Range</h3>
                        <div className="space-y-2">
                            <button onClick={()=>setPriceRange([0, 50])} className={`w-full text-left p-2 rounded text-sm dark:text-gray-300 ${priceRange[1] === 50 ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Under $50</button>
                            <button onClick={()=>setPriceRange([50, 200])} className={`w-full text-left p-2 rounded text-sm dark:text-gray-300 ${priceRange[0] === 50 ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>$50 to $200</button>
                            <button onClick={()=>setPriceRange([200, 1000])} className={`w-full text-left p-2 rounded text-sm dark:text-gray-300 ${priceRange[0] === 200 ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>$200 to $1000</button>
                            <button onClick={()=>setPriceRange([1000, Infinity])} className={`w-full text-left p-2 rounded text-sm dark:text-gray-300 ${priceRange[0] === 1000 ? 'bg-indigo-100 dark:bg-indigo-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>Over $1000</button>
                             <button onClick={()=>setPriceRange([0, Infinity])} className={`w-full text-left p-2 rounded text-sm dark:text-gray-300 ${priceRange[1] === Infinity ? 'font-bold' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}>All Prices</button>
                        </div>
                     </div>
                 </div>
            </aside>

            {/* Product Grid */}
            <div className="flex-1">
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">{`Showing ${filteredAndSortedProducts.length} of ${products.length} products`}</p>
                 {isLoading && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {Array.from({ length: 8 }).map((_, index) => (
                        <div key={index} className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 animate-pulse">
                            <div className="bg-gray-200 dark:bg-gray-700 h-48 rounded"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mt-4"></div>
                            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-1/2 mt-2"></div>
                            <div className="flex justify-between mt-4"><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/4"></div><div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3"></div></div>
                        </div>
                        ))}
                    </div>
                )}
                {error && (
                    <div className="text-center py-20 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-500/30 rounded-lg"><h2 className="text-2xl font-semibold text-red-700 dark:text-red-300">An Error Occurred</h2><p className="text-red-600 dark:text-red-400 mt-2">{error}</p></div>
                )}
                {!isLoading && !error && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-3 gap-6">
                        {filteredAndSortedProducts.map((product) => (
                        <ProductCard key={product.id} product={product} onSelect={handleSelectProduct} isWishlisted={isWishlisted(product.id)} onToggleWishlist={handleToggleWishlist} />
                        ))}
                    </div>
                )}
                 {!isLoading && !error && filteredAndSortedProducts.length === 0 && (
                     <div className="text-center py-20 bg-gray-50 dark:bg-gray-800 rounded-lg"><h2 className="text-2xl font-semibold text-gray-700 dark:text-gray-300">No Products Found</h2><p className="text-gray-600 dark:text-gray-400 mt-2">Try adjusting your filters to find what you're looking for.</p></div>
                 )}
            </div>
        </div>
      </main>
      <ProductModal product={selectedProduct} onClose={handleCloseModal} />
    </>
  );

  const renderContactView = () => (
    <div className="container mx-auto p-8 flex items-center justify-center" style={{minHeight: 'calc(100vh - 200px)'}}>
      <div className="bg-white dark:bg-gray-800 p-10 rounded-lg shadow-xl max-w-2xl mx-auto w-full">
          <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-200 mb-4 text-center">Contact Us</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-8 text-center">Have questions? We'd love to hear from you. Reach out to us via the form below.</p>
          <form className="text-left space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div>
                  <label htmlFor="contact-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Name</label>
                  <input type="text" id="contact-name" className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
               <div>
                  <label htmlFor="contact-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Email</label>
                  <input type="email" id="contact-email" className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500" />
              </div>
               <div>
                  <label htmlFor="contact-message" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Message</label>
                  <textarea id="contact-message" rows={4} className="mt-1 block w-full p-2 rounded-md border-gray-300 dark:border-gray-600 dark:bg-gray-700 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"></textarea>
              </div>
              <button type="submit" className="w-full bg-indigo-600 text-white font-semibold py-3 px-6 rounded-lg hover:bg-indigo-700 transition-colors">
                  Send Message
              </button>
          </form>
      </div>
    </div>
  );

  const renderCurrentView = () => {
    switch (view) {
        case 'dashboard':
            return <UserDashboardView products={products} wishlist={wishlist} onNavigateToStore={() => setView('store')} onToggleWishlist={handleToggleWishlist} onSelectProduct={handleSelectProduct} />;
        case 'checkout':
            return <CheckoutView onPlaceOrder={handlePlaceOrder} onNavigateToStore={() => setView('store')} />;
        case 'confirmation':
            return <OrderConfirmationView orderId={lastOrderId} onNavigateToStore={() => setView('store')} />;
        case 'contact':
            return renderContactView();
        case 'store':
        default:
            return renderStoreView();
    }
  }

  // If view is 'admin', render AdminView as a full-page component
  if (view === 'admin' && auth.isLoggedIn && auth.role) {
      return (
           <ToastProvider>
                <AdminView 
                    products={products} 
                    setProducts={setProducts} 
                    onNavigateToStore={() => setView('store')} 
                    username={auth.user || 'Admin'}
                    userRole={auth.role}
                    onLogout={() => { auth.logout(); setView('store'); }}
                    theme={theme}
                    toggleTheme={toggleTheme}
                />
           </ToastProvider>
      );
  }

  return (
    <ToastProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-200 font-sans flex flex-col">
        <div className="flex-grow">
          <header className="bg-gradient-to-r from-white to-gray-50 dark:from-gray-800 dark:to-gray-900 shadow-md sticky top-0 z-40 border-b border-gray-200 dark:border-gray-700">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between items-center py-4">
                <button onClick={() => setView('store')} className="text-2xl font-bold text-gray-900 dark:text-white">AI-Store</button>
                
                <nav className="hidden md:flex items-center gap-2">
                  <button onClick={() => setView('store')} className="text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md transition-colors">Home</button>
                  <button onClick={() => setView('store')} className="text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md transition-colors">Products</button>
                  <div className="relative group">
                    <button onClick={() => setView('contact')} className="text-base font-medium text-gray-500 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white px-3 py-2 rounded-md transition-colors flex items-center gap-1">
                      Contact Us
                      <svg className="w-4 h-4 transition-transform group-hover:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                    </button>
                    <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-40 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-md shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none group-hover:pointer-events-auto">
                      <a href="mailto:contact@aistore.com" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Email Us</a>
                      <a href="tel:+1234567890" className="block px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700">Call Us</a>
                    </div>
                  </div>
                </nav>

                <div className="flex items-center gap-4">
                  <div className="hidden md:flex items-center gap-4">
                   { auth.isLoggedIn ? (
                      <>
                        {auth.role && ['admin', 'manager', 'editor'].includes(auth.role) &&
                          <button onClick={() => setView('admin')} className="relative text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">
                            Admin
                            {unreadNotifCount > 0 && (
                              <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-4 w-4 flex items-center justify-center text-[10px]">
                                {unreadNotifCount}
                              </span>
                            )}
                          </button>
                        }
                         <button onClick={() => setView('dashboard')} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Account</button>
                         <button onClick={() => { auth.logout(); setView('store'); }} className="text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400">Logout</button>
                      </>
                   ) : (
                      <button onClick={() => setLoginModalOpen(true)} className="text-sm font-medium bg-indigo-600 text-white px-4 py-2 rounded-md hover:bg-indigo-700">Admin Login</button>
                   )}
                  </div>

                  <button className="relative" aria-label={`Wishlist with ${wishlist.size} items`} onClick={() => auth.isLoggedIn ? setView('dashboard') : setLoginModalOpen(true)}>
                     <svg className="w-7 h-7 text-gray-500 dark:text-gray-400 hover:text-red-500 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                    {wishlist.size > 0 && (
                      <span className="absolute -top-1 -right-2 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                        {wishlist.size}
                      </span>
                    )}
                  </button>
                  
                   <button className="relative" aria-label={`Cart with ${itemCount} items`} onClick={() => setIsCartOpen(true)}>
                      <svg className="w-7 h-7 text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z"></path></svg>
                       {itemCount > 0 && (
                          <span className="absolute -top-1 -right-2 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                            {itemCount}
                          </span>
                        )}
                   </button>
                   <div className="md:hidden">
                       <button onClick={() => setMobileMenuOpen(!isMobileMenuOpen)}>
                           <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={isMobileMenuOpen ? "M6 18L18 6M6 6l12 12" : "M4 6h16M4 12h16m-7 6h7"}></path></svg>
                       </button>
                   </div>
                </div>
              </div>
              {isMobileMenuOpen && (
                <div className="md:hidden">
                  <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 border-t border-gray-200 dark:border-gray-700">
                    <button onClick={() => setView('store')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">Home</button>
                    <button onClick={() => setView('store')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">Products</button>
                    <button onClick={() => setView('contact')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">Contact Us</button>
                    <div className="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
                      { auth.isLoggedIn ? (
                          <>
                            {auth.role && ['admin', 'manager', 'editor'].includes(auth.role) && <button onClick={() => setView('admin')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">Admin Dashboard</button>}
                            <button onClick={() => setView('dashboard')} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">My Account</button>
                            <button onClick={() => { auth.logout(); setView('store'); }} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">Logout</button>
                          </>
                      ) : (
                          <button onClick={() => setLoginModalOpen(true)} className="w-full text-left block px-3 py-2 rounded-md text-base font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 hover:bg-gray-50 dark:hover:text-white dark:hover:bg-gray-700">Admin Login</button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </header>
          {renderCurrentView()}
        </div>
        {!view.startsWith('admin') && <Footer />}
        <MiniCart isOpen={isCartOpen} onClose={() => setIsCartOpen(false)} onCheckout={handleCheckout} />
        {isLoginModalOpen && <LoginModal onClose={() => setLoginModalOpen(false)} onLoginSuccess={handleLoginSuccess} />}
      </div>
    </ToastProvider>
  );
};

export default App;