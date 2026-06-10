import { useState, useEffect } from 'react';
import { apiFetch as fetch } from '../utils/api';
import {
  Store, ShoppingCart, ClipboardList, LogOut, Plus, Minus, Trash2,
  Search, CheckCircle2, Clock, X, UserCircle, ChevronRight, Menu,
  Package, RefreshCw
} from 'lucide-react';

const BASE = 'http://localhost:3000';

const ConsumerDashboard = ({ onBack }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const [activeTab, setActiveTab] = useState('katalog');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(null);
  const [toasts, setToasts] = useState([]);

  const showToast = (type, msg) => {
    const id = Date.now();
    setToasts(t => [...t, { id, type, msg }]);
    setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3500);
  };

  // Fetch produk
  useEffect(() => {
    fetch(`${BASE}/api/products`)
      .then(r => r.json())
      .then(data => {
        const list = Array.isArray(data) ? data : [];
        setProducts(list);
        const cats = ['Semua', ...new Set(list.map(p => p.category).filter(Boolean))];
        setCategories(cats);
      })
      .catch(() => {});
  }, []);

  // Fetch pesanan saya
  const fetchMyOrders = async () => {
    setLoadingOrders(true);
    try {
      const res = await fetch(`${BASE}/api/pos/my-orders?user_id=${user.id}`);
      const data = await res.json();
      setMyOrders(Array.isArray(data) ? data : []);
    } catch { setMyOrders([]); }
    setLoadingOrders(false);
  };

  useEffect(() => {
    if (activeTab === 'mypesanan') fetchMyOrders();
  }, [activeTab]);

  // Cart helpers
  const addToCart = (product) => {
    if (product.stock <= 0) { showToast('error', 'Stok produk habis'); return; }
    setCart(c => {
      const existing = c.find(i => i.id === product.id);
      if (existing) {
        if (existing.qty >= product.stock) { showToast('error', 'Stok tidak mencukupi'); return c; }
        return c.map(i => i.id === product.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...c, { ...product, qty: 1 }];
    });
    showToast('success', `${product.name} ditambahkan`);
  };

  const updateQty = (id, delta) => setCart(c =>
    c.map(i => i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i)
  );

  const removeFromCart = (id) => setCart(c => c.filter(i => i.id !== id));

  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const cartCount = cart.reduce((s, i) => s + i.qty, 0);

  // Checkout
  const handleCheckout = async () => {
    if (cart.length === 0) { showToast('error', 'Keranjang masih kosong'); return; }
    try {
      const res = await fetch(`${BASE}/api/pos/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          payment_method: 'Konsumen (Mandiri)',
          user_id: user.id,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setCheckoutDone(data);
        setCart([]);
        setShowCart(false);
        showToast('success', 'Pesanan berhasil dikirim! Menunggu kasir memproses.');
      } else {
        showToast('error', data.message || 'Checkout gagal');
      }
    } catch { showToast('error', 'Koneksi gagal'); }
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onBack();
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchCat && matchSearch;
  });

  const menuItems = [
    { id: 'katalog', label: 'Katalog Produk', icon: <Store size={20} /> },
    { id: 'mypesanan', label: 'Pesanan Saya', icon: <ClipboardList size={20} /> },
  ];

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      <div className="h-20 flex items-center px-6 border-b border-slate-800">
        <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3">
          <ShoppingCart size={16} className="text-white" strokeWidth={3} />
        </div>
        <span className="font-bold text-white text-lg">WarungPOS</span>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map(item => (
          <button key={item.id} onClick={() => { setActiveTab(item.id); setShowMobileSidebar(false); }}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
            {item.icon}
            <span className="text-sm font-medium">{item.label}</span>
          </button>
        ))}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <div className="flex items-center gap-3 px-3 py-3 mb-2">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-purple-700 flex items-center justify-center">
            <UserCircle size={20} className="text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-purple-400">Konsumen</p>
          </div>
        </div>
        <button onClick={logout} className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition">
          <LogOut size={18} /><span className="text-sm font-medium">Keluar</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen font-sans overflow-hidden bg-[#0b0e17] text-white">

      {/* TOAST */}
      <div className="fixed top-6 right-6 z-[100] space-y-2">
        {toasts.map(t => (
          <div key={t.id} className={`flex items-center gap-3 px-5 py-3 rounded-2xl shadow-xl text-sm font-medium animate-in fade-in slide-in-from-right-4 ${t.type === 'success' ? 'bg-emerald-600' : 'bg-red-600'}`}>
            {t.type === 'success' ? '✓' : '✕'} {t.msg}
          </div>
        ))}
      </div>

      {/* SIDEBAR DESKTOP */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f1423] border-r border-slate-800">
        <Sidebar />
      </aside>

      {/* SIDEBAR MOBILE */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowMobileSidebar(false)} />
          <aside className="relative w-64 h-full bg-[#0f1423] border-r border-slate-800 flex flex-col">
            <Sidebar />
          </aside>
        </div>
      )}

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* HEADER */}
        <header className="h-16 bg-[#0f1423] border-b border-slate-800 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <button className="md:hidden text-slate-400" onClick={() => setShowMobileSidebar(true)}>
              <Menu size={22} />
            </button>
            <h2 className="text-lg font-bold">{menuItems.find(i => i.id === activeTab)?.label || 'Katalog'}</h2>
          </div>
          <button onClick={() => setShowCart(true)} className="relative flex items-center gap-2 bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-xl text-sm font-bold transition">
            <ShoppingCart size={16} />
            Keranjang
            {cartCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center">{cartCount}</span>
            )}
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-6">

          {/* ─── TAB: KATALOG ─── */}
          {activeTab === 'katalog' && (
            <div className="animate-in fade-in space-y-6">
              {/* Search & Filter */}
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" />
                  <input value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                    placeholder="Cari produk..."
                    className="w-full pl-10 pr-4 py-3 bg-[#0f1423] border border-slate-800 rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-purple-500 transition" />
                </div>
                <div className="flex gap-2 flex-wrap">
                  {categories.map(cat => (
                    <button key={cat} onClick={() => setSelectedCategory(cat)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold transition ${selectedCategory === cat ? 'bg-purple-600 text-white' : 'bg-[#0f1423] border border-slate-800 text-slate-400 hover:text-white'}`}>
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Product Grid */}
              {filteredProducts.length === 0 ? (
                <div className="text-center py-20 text-slate-500">
                  <Package size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Tidak ada produk ditemukan</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                  {filteredProducts.map(product => {
                    const inCart = cart.find(i => i.id === product.id);
                    const outOfStock = product.stock <= 0;
                    return (
                      <div key={product.id} className={`bg-[#0f1423] border rounded-2xl overflow-hidden transition group ${outOfStock ? 'border-slate-800 opacity-60' : 'border-slate-800 hover:border-purple-700/50 hover:shadow-lg hover:shadow-purple-900/10'}`}>
                        <div className="aspect-square bg-slate-800 overflow-hidden">
                          {product.image ? (
                            <img src={`${BASE}/uploads/${product.image}`} alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-4xl">🛍️</div>
                          )}
                        </div>
                        <div className="p-3">
                          <p className="font-semibold text-sm mb-1 line-clamp-2">{product.name}</p>
                          <p className="text-purple-400 font-bold text-sm mb-1">Rp {Number(product.price).toLocaleString()}</p>
                          <p className={`text-[11px] mb-3 ${outOfStock ? 'text-red-400' : 'text-slate-500'}`}>
                            {outOfStock ? 'Stok habis' : `Stok: ${product.stock}`}
                          </p>
                          {outOfStock ? (
                            <div className="w-full py-2 text-center text-xs text-slate-600 bg-slate-800/50 rounded-lg">Tidak tersedia</div>
                          ) : inCart ? (
                            <div className="flex items-center justify-between bg-purple-600/10 border border-purple-600/30 rounded-lg px-2 py-1">
                              <button onClick={() => inCart.qty === 1 ? removeFromCart(product.id) : updateQty(product.id, -1)} className="text-purple-400 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-600 transition">
                                <Minus size={14} />
                              </button>
                              <span className="text-sm font-bold text-purple-400">{inCart.qty}</span>
                              <button onClick={() => addToCart(product)} className="text-purple-400 hover:text-white w-7 h-7 flex items-center justify-center rounded-lg hover:bg-purple-600 transition">
                                <Plus size={14} />
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => addToCart(product)}
                              className="w-full flex items-center justify-center gap-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg transition">
                              <Plus size={13} /> Tambah
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* ─── TAB: PESANAN SAYA ─── */}
          {activeTab === 'mypesanan' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-2xl font-bold">Pesanan Saya</h2>
                  <p className="text-slate-400 text-sm mt-1">Riwayat pesanan yang telah kamu buat</p>
                </div>
                <button onClick={fetchMyOrders} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition">
                  <RefreshCw size={14} /> Refresh
                </button>
              </div>

              {loadingOrders ? (
                <div className="text-center py-20 text-slate-500">Memuat pesanan...</div>
              ) : myOrders.length === 0 ? (
                <div className="bg-[#0f1423] border border-slate-800 rounded-3xl p-16 text-center">
                  <div className="text-6xl mb-4">🛒</div>
                  <h3 className="text-xl font-bold text-slate-300 mb-2">Belum Ada Pesanan</h3>
                  <p className="text-slate-500 mb-6">Mulai belanja dari katalog produk kami</p>
                  <button onClick={() => setActiveTab('katalog')} className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl transition">
                    Lihat Katalog
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {myOrders.map(order => (
                    <div key={order.id} className="bg-[#0f1423] border border-slate-800 rounded-2xl p-6">
                      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
                        <div>
                          <span className="font-bold text-purple-400">{order.invoice}</span>
                          <p className="text-xs text-slate-500 mt-1">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${order.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {order.status === 'Selesai' ? '✓ Selesai' : '⏳ Menunggu Kasir'}
                          </span>
                          <span className="font-bold">Rp {Number(order.total).toLocaleString()}</span>
                        </div>
                      </div>
                      <div className="space-y-2">
                        {(order.items || []).map((item, i) => (
                          <div key={i} className="flex justify-between text-sm text-slate-400">
                            <span>{item.qty}× {item.product_name}</span>
                            <span>Rp {Number(item.price * item.qty).toLocaleString()}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* DRAWER KERANJANG */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-[#0f1423] border-l border-slate-800 flex flex-col h-full shadow-2xl animate-in slide-in-from-right">
            <div className="flex items-center justify-between p-6 border-b border-slate-800">
              <div>
                <h3 className="text-xl font-bold">Keranjang</h3>
                <p className="text-slate-400 text-sm">{cartCount} item</p>
              </div>
              <button onClick={() => setShowCart(false)} className="text-slate-400 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16 text-slate-500">
                  <ShoppingCart size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Keranjang kosong</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item.id} className="flex items-center gap-4 bg-slate-800/40 rounded-2xl p-4">
                    <div className="w-14 h-14 rounded-xl bg-slate-700 overflow-hidden flex-shrink-0">
                      {item.image ? (
                        <img src={`${BASE}/uploads/${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                      ) : <div className="w-full h-full flex items-center justify-center text-2xl">🛍️</div>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm truncate">{item.name}</p>
                      <p className="text-purple-400 text-sm font-bold">Rp {Number(item.price).toLocaleString()}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => updateQty(item.id, -1)} className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition">
                        <Minus size={14} />
                      </button>
                      <span className="w-8 text-center font-bold text-sm">{item.qty}</span>
                      <button onClick={() => updateQty(item.id, 1)} className="w-8 h-8 bg-slate-700 hover:bg-slate-600 rounded-lg flex items-center justify-center transition">
                        <Plus size={14} />
                      </button>
                      <button onClick={() => removeFromCart(item.id)} className="w-8 h-8 text-red-400 hover:bg-red-500/10 rounded-lg flex items-center justify-center transition ml-1">
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-800 space-y-4">
                <div className="flex justify-between font-bold text-lg">
                  <span>Total</span>
                  <span className="text-purple-400">Rp {cartTotal.toLocaleString()}</span>
                </div>
                <p className="text-slate-500 text-xs text-center">Pesananmu akan diproses oleh kasir toko</p>
                <button onClick={handleCheckout}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold rounded-2xl text-lg transition shadow-lg shadow-purple-600/20">
                  Pesan Sekarang ✓
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL PESANAN BERHASIL */}
      {checkoutDone && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1423] border border-slate-700 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-5">
              <CheckCircle2 size={40} className="text-emerald-400" />
            </div>
            <h3 className="text-2xl font-bold mb-2">Pesanan Dikirim!</h3>
            <p className="text-slate-400 text-sm mb-2">Invoice: <span className="text-purple-400 font-bold">{checkoutDone.invoice}</span></p>
            <p className="text-slate-400 text-sm mb-6">Total: <span className="font-bold text-white">Rp {Number(checkoutDone.total).toLocaleString()}</span></p>
            <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-4 mb-6 text-left">
              <div className="flex items-center gap-2 mb-2">
                <Clock size={16} className="text-amber-400" />
                <span className="text-amber-400 font-bold text-sm">Menunggu Kasir</span>
              </div>
              <p className="text-slate-400 text-xs">Pesananmu sedang menunggu diproses oleh kasir. Cek status di tab "Pesanan Saya".</p>
            </div>
            <div className="flex gap-3">
              <button onClick={() => { setCheckoutDone(null); setActiveTab('mypesanan'); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition">Lihat Pesanan</button>
              <button onClick={() => setCheckoutDone(null)}
                className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold transition">Lanjut Belanja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboard;
