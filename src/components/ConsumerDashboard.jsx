import { useState, useEffect, useRef } from 'react';
import { apiFetch as fetch } from '../utils/api';
import {
  Store, ShoppingCart, ClipboardList, LogOut, Plus, Minus, Trash2,
  Search, CheckCircle2, Clock, X, UserCircle, ChevronRight, Menu,
  Package, RefreshCw, QrCode, Smartphone, Wallet, Loader2
} from 'lucide-react';
import { kmpSearch } from '../utils/stringMatcher';

const BASE = 'http://localhost:3000';

// ── Simulasi QR Code SVG sederhana (bukan QR asli, hanya demo visual) ──
const FakeQRCode = ({ invoice }) => (
  <svg viewBox="0 0 100 100" className="w-40 h-40" xmlns="http://www.w3.org/2000/svg">
    <rect width="100" height="100" fill="white" rx="4" />
    {/* Pola QR simulasi */}
    {[0,1,2,3,4,5,6].map(r => [0,1,2,3,4,5,6].map(c => {
      const isFinderCorner =
        (r < 7 && c < 7) || (r < 7 && c > 6) || (r > 6 && c < 7);
      const isFill = Math.abs((r * 13 + c * 7 + invoice.charCodeAt(0)) % 3) !== 0;
      return isFill ? (
        <rect key={`${r}-${c}`} x={10 + c * 11} y={10 + r * 11} width={10} height={10} fill="#1a1a2e" rx="1" />
      ) : null;
    }))}
    {/* Finder pattern corners */}
    <rect x="10" y="10" width="28" height="28" fill="none" stroke="#1a1a2e" strokeWidth="3" rx="2" />
    <rect x="15" y="15" width="16" height="16" fill="#1a1a2e" rx="1" />
    <rect x="62" y="10" width="28" height="28" fill="none" stroke="#1a1a2e" strokeWidth="3" rx="2" />
    <rect x="67" y="15" width="16" height="16" fill="#1a1a2e" rx="1" />
    <rect x="10" y="62" width="28" height="28" fill="none" stroke="#1a1a2e" strokeWidth="3" rx="2" />
    <rect x="15" y="67" width="16" height="16" fill="#1a1a2e" rx="1" />
    <text x="50" y="97" textAnchor="middle" fontSize="5" fill="#666">{invoice?.slice(-8)}</text>
  </svg>
);

const ConsumerDashboard = ({ onBack }) => {
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const plan = user.plan || '';
  const canUseQRIS = plan.toLowerCase().includes('pro') || plan.toLowerCase().includes('enterprise');

  const [activeTab, setActiveTab] = useState('katalog');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('Semua');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState([]);
  const [showCart, setShowCart] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('kasir'); // 'kasir' | 'qris'
  const [myOrders, setMyOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState(false);

  // State untuk flow QR
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrInvoice, setQrInvoice] = useState(null);
  const [qrTotal, setQrTotal] = useState(0);
  const [qrStatus, setQrStatus] = useState('waiting'); // 'waiting' | 'confirming' | 'success'
  const [qrCountdown, setQrCountdown] = useState(120);
  const countdownRef = useRef(null);

  // State untuk sukses order mandiri
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

  // Countdown QR
  useEffect(() => {
    if (showQRModal && qrStatus === 'waiting') {
      countdownRef.current = setInterval(() => {
        setQrCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownRef.current);
            setQrStatus('expired');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(countdownRef.current);
  }, [showQRModal, qrStatus]);

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

  // ── Checkout: Bayar di Kasir ──
  const handleCheckoutKasir = async () => {
    if (cart.length === 0) { showToast('error', 'Keranjang masih kosong'); return; }
    setCheckoutLoading(true);
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
        setCheckoutDone({ ...data, paymentType: 'kasir' });
        setCart([]);
        setShowCart(false);
        showToast('success', 'Pesanan berhasil dikirim! Menunggu kasir memproses.');
      } else {
        showToast('error', data.message || 'Checkout gagal');
      }
    } catch { showToast('error', 'Koneksi gagal'); }
    setCheckoutLoading(false);
  };

  // ── Checkout: SmartBank QRIS ──
  const handleCheckoutQRIS = async () => {
    if (cart.length === 0) { showToast('error', 'Keranjang masih kosong'); return; }
    setCheckoutLoading(true);
    try {
      const res = await fetch(`${BASE}/api/pos/pay`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(i => ({ id: i.id, name: i.name, price: i.price, qty: i.qty })),
          payment_method: 'SmartBank (QRIS)',
          user_id: user.id,
        })
      });
      const data = await res.json();
      if (res.ok) {
        setQrInvoice(data.invoice);
        setQrTotal(data.total || cartTotal);
        setQrStatus('waiting');
        setQrCountdown(120);
        setShowCart(false);
        setShowQRModal(true);
      } else {
        showToast('error', data.message || 'Gagal membuat pesanan QRIS');
      }
    } catch { showToast('error', 'Koneksi gagal'); }
    setCheckoutLoading(false);
  };

  const handleCheckout = () => {
    if (paymentMethod === 'qris') {
      handleCheckoutQRIS();
    } else {
      handleCheckoutKasir();
    }
  };

  // ── Konfirmasi bayar QRIS (simulasi) ──
  const handleConfirmQRPayment = async () => {
    setQrStatus('confirming');
    clearInterval(countdownRef.current);
    // Simulasi delay konfirmasi
    await new Promise(r => setTimeout(r, 1500));
    // Update status transaksi ke Selesai
    try {
      await fetch(`${BASE}/api/pos/confirm-consumer`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ invoice: qrInvoice })
      });
    } catch (e) { /* ignore if endpoint not ready */ }
    setQrStatus('success');
    setTimeout(() => {
      setShowQRModal(false);
      setCheckoutDone({ invoice: qrInvoice, total: qrTotal, paymentType: 'qris' });
      setCart([]);
    }, 1800);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onBack();
  };

  const filteredProducts = products.filter(p => {
    const matchCat = selectedCategory === 'Semua' || p.category === selectedCategory;
    const matchSearch = kmpSearch(p.name.toLowerCase(), searchQuery.toLowerCase());
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
                          <p className="text-[11px] text-slate-600 mt-0.5">via {order.method}</p>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className={`px-3 py-1 rounded-full text-[11px] font-bold ${order.status === 'Selesai' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'}`}>
                            {order.status === 'Selesai' ? '✓ Selesai' : '⏳ Menunggu'}
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

      {/* ─── DRAWER KERANJANG ─── */}
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

                {/* ── Pilihan Metode Bayar ── */}
                <div className="space-y-2">
                  <p className="text-xs text-slate-500 font-semibold uppercase tracking-wider">Metode Pembayaran</p>

                  {/* Bayar di Kasir */}
                  <button
                    onClick={() => setPaymentMethod('kasir')}
                    className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${paymentMethod === 'kasir' ? 'border-purple-500 bg-purple-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${paymentMethod === 'kasir' ? 'bg-purple-600' : 'bg-slate-700'}`}>
                      <Wallet size={15} className="text-white" />
                    </div>
                    <div className="text-left flex-1">
                      <p className={`text-sm font-bold ${paymentMethod === 'kasir' ? 'text-white' : 'text-slate-300'}`}>Bayar di Kasir</p>
                      <p className="text-[11px] text-slate-500">Pesanan dikirim, bayar langsung ke kasir</p>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === 'kasir' ? 'border-purple-500 bg-purple-500' : 'border-slate-600'}`} />
                  </button>

                  {/* SmartBank QRIS */}
                  <div className="relative">
                    <button
                      onClick={() => canUseQRIS && setPaymentMethod('qris')}
                      disabled={!canUseQRIS}
                      className={`w-full flex items-center gap-3 p-3.5 rounded-xl border transition-all ${!canUseQRIS ? 'border-slate-800 opacity-50 cursor-not-allowed bg-slate-800/20' : paymentMethod === 'qris' ? 'border-emerald-500 bg-emerald-500/10' : 'border-slate-700 hover:border-slate-600 bg-slate-800/40'}`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${paymentMethod === 'qris' ? 'bg-emerald-600' : 'bg-slate-700'}`}>
                        <QrCode size={15} className="text-white" />
                      </div>
                      <div className="text-left flex-1">
                        <div className="flex items-center gap-2">
                          <p className={`text-sm font-bold ${paymentMethod === 'qris' ? 'text-white' : 'text-slate-300'}`}>SmartBank (QRIS)</p>
                          {!canUseQRIS && (
                            <span className="text-[9px] font-extrabold bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded uppercase">Pro+</span>
                          )}
                        </div>
                        <p className="text-[11px] text-slate-500">Scan QR, bayar langsung di tempat</p>
                      </div>
                      <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 ${paymentMethod === 'qris' ? 'border-emerald-500 bg-emerald-500' : 'border-slate-600'}`} />
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  disabled={checkoutLoading}
                  className={`w-full py-4 font-bold rounded-2xl text-lg transition shadow-lg active:scale-[0.98] disabled:opacity-70 flex items-center justify-center gap-2 ${
                    paymentMethod === 'qris'
                      ? 'bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white shadow-emerald-600/20'
                      : 'bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white shadow-purple-600/20'
                  }`}
                >
                  {checkoutLoading ? (
                    <><Loader2 size={18} className="animate-spin" /> Memproses...</>
                  ) : paymentMethod === 'qris' ? (
                    <><QrCode size={18} /> Tampilkan QR Code</>
                  ) : (
                    <>✓ Pesan Sekarang</>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── MODAL QR SMARTBANK ─── */}
      {showQRModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 rounded-3xl w-full max-w-sm shadow-2xl animate-in zoom-in-95 fade-in overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 p-5 text-center relative">
              <div className="flex items-center justify-center gap-2 mb-1">
                <Smartphone size={18} className="text-white" />
                <span className="font-extrabold text-white text-sm tracking-wide uppercase">SmartBank QRIS</span>
              </div>
              <p className="text-emerald-100 text-xs">Scan QR di bawah untuk membayar</p>
              {qrStatus === 'waiting' && (
                <button onClick={() => { setShowQRModal(false); clearInterval(countdownRef.current); }} className="absolute top-4 right-4 text-white/60 hover:text-white">
                  <X size={18} />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="p-6 text-center space-y-4">
              {qrStatus === 'waiting' && (
                <>
                  {/* QR Code area */}
                  <div className="flex items-center justify-center">
                    <div className="bg-white p-4 rounded-2xl shadow-lg border-4 border-emerald-500/30">
                      <FakeQRCode invoice={qrInvoice || 'INV-000'} />
                    </div>
                  </div>
                  <div>
                    <p className="text-slate-400 text-xs mb-1">Invoice</p>
                    <p className="font-mono font-bold text-purple-400 text-sm">{qrInvoice}</p>
                  </div>
                  <div className="bg-slate-800/60 rounded-2xl p-4">
                    <p className="text-slate-400 text-xs mb-1">Total Pembayaran</p>
                    <p className="text-2xl font-extrabold text-white">Rp {Number(qrTotal).toLocaleString()}</p>
                  </div>
                  <div className="flex items-center justify-center gap-2 text-amber-400 text-sm">
                    <Clock size={14} />
                    <span className="font-bold">{Math.floor(qrCountdown / 60)}:{String(qrCountdown % 60).padStart(2, '0')}</span>
                    <span className="text-slate-500 text-xs">sisa waktu</span>
                  </div>
                  {/* Tombol simulasi konfirmasi */}
                  <button
                    onClick={handleConfirmQRPayment}
                    className="w-full py-4 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-2xl transition active:scale-[0.98] shadow-lg shadow-emerald-600/20"
                  >
                    ✅ Konfirmasi Bayar (Simulasi)
                  </button>
                  <p className="text-slate-600 text-[11px]">Tekan tombol di atas setelah scan & bayar QR</p>
                </>
              )}

              {qrStatus === 'confirming' && (
                <div className="py-8 space-y-4">
                  <div className="w-16 h-16 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto animate-pulse">
                    <Loader2 size={32} className="text-emerald-400 animate-spin" />
                  </div>
                  <p className="font-bold text-white">Memverifikasi Pembayaran...</p>
                  <p className="text-slate-400 text-sm">Tunggu sebentar</p>
                </div>
              )}

              {qrStatus === 'success' && (
                <div className="py-8 space-y-4">
                  <div className="w-20 h-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                    <CheckCircle2 size={40} className="text-emerald-400" />
                  </div>
                  <p className="text-xl font-extrabold text-white">Pembayaran Berhasil!</p>
                  <p className="text-slate-400 text-sm">Menampilkan detail pesanan...</p>
                </div>
              )}

              {qrStatus === 'expired' && (
                <div className="py-6 space-y-4">
                  <div className="text-5xl">⏰</div>
                  <p className="font-bold text-red-400">QR Kode Kedaluwarsa</p>
                  <p className="text-slate-400 text-sm">Silakan ulangi pesanan Anda</p>
                  <button onClick={() => setShowQRModal(false)} className="w-full py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition">
                    Tutup
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── MODAL PESANAN BERHASIL ─── */}
      {checkoutDone && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#0f1423] border border-slate-700 rounded-3xl p-8 w-full max-w-sm text-center shadow-2xl animate-in fade-in zoom-in-95">
            <div className={`w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5 ${checkoutDone.paymentType === 'qris' ? 'bg-emerald-500/10' : 'bg-purple-500/10'}`}>
              <CheckCircle2 size={40} className={checkoutDone.paymentType === 'qris' ? 'text-emerald-400' : 'text-purple-400'} />
            </div>

            {checkoutDone.paymentType === 'qris' ? (
              <>
                <h3 className="text-2xl font-bold mb-1">Pembayaran Sukses! 🎉</h3>
                <p className="text-emerald-400 text-sm font-semibold mb-4">SmartBank (QRIS) terkonfirmasi</p>
              </>
            ) : (
              <>
                <h3 className="text-2xl font-bold mb-1">Pesanan Dikirim!</h3>
                <p className="text-slate-400 text-sm mb-4">Bayar langsung ke kasir</p>
              </>
            )}

            <div className="bg-slate-800/50 rounded-2xl p-4 mb-5 text-left space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Invoice</span>
                <span className="font-mono font-bold text-purple-400">{checkoutDone.invoice}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Total</span>
                <span className="font-bold text-white">Rp {Number(checkoutDone.total).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Metode</span>
                <span className="font-bold text-white">{checkoutDone.paymentType === 'qris' ? '📱 SmartBank (QRIS)' : '💵 Bayar di Kasir'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-400">Status</span>
                <span className={`font-bold ${checkoutDone.paymentType === 'qris' ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {checkoutDone.paymentType === 'qris' ? '✓ Lunas' : '⏳ Menunggu Kasir'}
                </span>
              </div>
            </div>

            {checkoutDone.paymentType === 'kasir' && (
              <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-3 mb-5 text-left">
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={14} className="text-amber-400" />
                  <span className="text-amber-400 font-bold text-xs">Instruksi</span>
                </div>
                <p className="text-slate-400 text-xs">Tunjukkan nomor invoice ke kasir untuk menyelesaikan pembayaran Anda.</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={() => { setCheckoutDone(null); setActiveTab('mypesanan'); }}
                className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm font-bold transition">Lihat Pesanan</button>
              <button onClick={() => setCheckoutDone(null)}
                className={`flex-1 py-3 text-white rounded-xl text-sm font-bold transition ${checkoutDone.paymentType === 'qris' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-purple-600 hover:bg-purple-700'}`}>Lanjut Belanja</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConsumerDashboard;
