import { useState, useEffect } from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  BarChart3, 
  LogOut, 
  Plus, 
  Minus,
  Search, 
  Trash2, 
  CheckCircle2,
  TrendingUp,
  Users,
  Wallet,
  History,
  FileText,
  Clock,
  ArrowRight,
  Pencil,
  X,
  TrendingDown,
  PieChart,
  Calendar,
  CreditCard,
  Zap,
  ShieldCheck,
  ChevronRight,
  Info
} from 'lucide-react';

const Dashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('SmartBank (QRIS)');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({ name: '', price: '', stock: '', category: 'Minuman' });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (product = null) => {
    setCurrentProduct(product);
    if (product) {
      setFormData({ name: product.name, price: product.price, stock: product.stock, category: product.category || 'Minuman' });
    } else {
      setFormData({ name: '', price: '', stock: '', category: 'Minuman' });
    }
    setShowProductModal(true);
  };
  
  const [plan, setPlan] = useState(() => localStorage.getItem('selectedPlan') || 'Basic (Gratis)');
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  // Load Data
  const fetchProducts = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/products');
      const data = await res.json();
      setProducts(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err); 
      setProducts([]);
    }
  };

  const fetchTransactions = async () => {
    try {
      const res = await fetch('http://localhost:3000/api/pos/transactions');
      const data = await res.json();
      setTransactions(Array.isArray(data) ? data : []);
    } catch (err) { 
      console.error(err); 
      setTransactions([]);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchTransactions();
  }, [activeTab]);

  const handleOpenCheckout = (planObj) => {
    if (planObj.price === 'Gratis') {
      confirmPlan(planObj.name, 'Gratis');
    } else {
      setSelectedPlanData(planObj);
      setShowCheckoutModal(true);
    }
  };

  const confirmPlan = (name, price) => {
    const fullPlanName = `${name} (${price})`;
    setPlan(fullPlanName);
    localStorage.setItem('selectedPlan', fullPlanName);
    setShowCheckoutModal(false);
    alert(`Sukses! Akun kamu sekarang menggunakan paket ${name}.`);
  };

  // --- LOGIK PRODUK ---
  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.stock) return;
    try {
      const url = currentProduct ? `http://localhost:3000/api/products/${currentProduct.id}` : 'http://localhost:3000/api/products';
      const res = await fetch(url, {
        method: currentProduct ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      if (res.ok) { fetchProducts(); setShowProductModal(false); }
    } catch (err) { console.error(err); }
  };

  // --- LOGIK POS ---
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) { setCart(cart.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i)); }
    else { setCart([...cart, { ...product, qty: 1 }]); }
  };

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    try {
      const res = await fetch('http://localhost:3000/api/pos/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cart, payment_method: paymentMethod, user_id: user.id })
      });
      if (res.ok) { setCart([]); fetchProducts(); setActiveTab('riwayat'); }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const subtotalCart = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const feePOS = 2500;
  const totalCart = subtotalCart > 0 ? subtotalCart + feePOS : 0;

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
    { id: 'produk', label: 'Produk', icon: <Package size={20} /> },
    { id: 'transaksi', label: 'Transaksi POS', icon: <ShoppingCart size={20} /> },
    { id: 'riwayat', label: 'Riwayat', icon: <History size={20} /> },
    { id: 'laporan', label: 'Laporan', icon: <BarChart3 size={20} /> },
    { id: 'paket', label: 'Langganan', icon: <Zap size={20} /> },
  ];

  const pricingPlans = [
    { name: 'Basic', price: 'Gratis', numericPrice: 0, desc: 'Cocok untuk usaha kecil', features: ['Stok Terbatas', 'Laporan Harian', '1 User'] },
    { name: 'Pro', price: 'Rp150.000', numericPrice: 150000, period: '/bulan', desc: 'Paling cocok untuk UMKM', features: ['Stok Tak Terbatas', 'Laporan Pajak', '5 User', 'Support 24/7'], popular: true },
    { name: 'Enterprise', price: 'Rp500.000', numericPrice: 500000, period: '/bulan', desc: 'Solusi lengkap bisnis besar', features: ['Custom Fitur', 'Multi Cabang', 'Unlimited User'] },
  ];

  return (
    <div className="flex h-screen bg-[#0b0e17] text-white font-sans overflow-hidden">
      
      {/* SIDEBAR */}
      <aside className="hidden md:flex flex-col w-64 bg-[#0f1423] border-r border-slate-800">
        <div className="h-20 flex items-center px-6 border-b border-slate-800">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-lg">
            <ShoppingCart size={16} className="text-white" strokeWidth={3} />
          </div>
          <span className="text-xl font-bold tracking-tight">WARUNG<span className="text-purple-400">POS</span></span>
        </div>
        <div className="px-6 py-4 mx-4 my-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Paket Aktif</p>
          <div className="flex items-center gap-2 text-purple-400">
            <CheckCircle2 size={14} />
            <p className="font-bold text-sm">{plan}</p>
          </div>
        </div>
        <nav className="flex-1 px-4 py-2 space-y-1">
          {menuItems.map((item) => (
            <button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}>
              {item.icon} <span className="font-medium text-sm">{item.label}</span>
            </button>
          ))}
        </nav>
        <div className="p-4 border-t border-slate-800">
          <button onClick={onBack} className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors">
            <LogOut size={20} /> <span className="font-medium text-sm">Keluar</span>
          </button>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 flex flex-col overflow-hidden">
        <header className="h-20 flex items-center justify-between px-8 bg-[#0b0e17]/50 backdrop-blur-md border-b border-slate-800/50">
          <h2 className="text-xl font-bold">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          <div className="flex items-center gap-4">
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-purple-500 w-64 outline-none" />
            </div>
            <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-slate-400"><Users size={20} /></div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* TAB PAKET */}
          {activeTab === 'paket' && (
            <div className="animate-in fade-in py-10">
              <div className="text-center mb-12">
                <h3 className="text-3xl font-bold mb-4 text-white">Upgrade Bisnis Kamu</h3>
                <p className="text-slate-400">Pilih paket yang sesuai dengan kebutuhan warung kamu</p>
              </div>
              <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                {pricingPlans.map((p, i) => (
                  <div key={i} className={`relative flex flex-col bg-[#0f1423] border ${p.popular ? 'border-purple-600 shadow-2xl scale-105' : 'border-slate-800'} rounded-[2.5rem] p-10 transition-all hover:translate-y-[-10px]`}>
                    {p.popular && <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-purple-600 text-[10px] font-bold px-4 py-1.5 rounded-full uppercase tracking-widest shadow-lg">Paling Populer</div>}
                    <div className="text-center mb-8">
                      <h4 className="text-xl font-bold mb-2">{p.name}</h4>
                      <p className="text-slate-400 text-xs mb-8">{p.desc}</p>
                      <div className="flex items-end justify-center gap-1">
                        <span className="text-3xl font-bold">{p.price}</span>
                        {p.period && <span className="text-slate-500 text-xs mb-1">{p.period}</span>}
                      </div>
                    </div>
                    <div className="flex-1 space-y-4 mb-10">
                      {p.features.map((f, j) => (
                        <div key={j} className="flex items-center gap-3 text-sm text-slate-300">
                          <CheckCircle2 size={16} className="text-purple-400" /> <span>{f}</span>
                        </div>
                      ))}
                    </div>
                    <button onClick={() => handleOpenCheckout(p)} className={`w-full py-4 rounded-2xl font-bold transition-all ${p.popular ? 'bg-purple-600 hover:bg-purple-700 shadow-lg' : 'bg-slate-800 hover:bg-slate-700'}`}>
                      {p.name === 'Basic' ? 'Mulai Gratis' : 'Pilih Paket'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* DASHBOARD TAB (Tetap Sama) */}
          {activeTab === 'dashboard' && (
            <div className="space-y-8 animate-in fade-in">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {[
                  { label: 'Pendapatan', value: `Rp ${transactions.reduce((s,t) => s + Number(t.total), 0).toLocaleString()}`, icon: <Wallet className="text-emerald-400" />, trend: '+12.5%' },
                  { label: 'Transaksi', value: transactions.length.toString(), icon: <TrendingUp className="text-purple-400" />, trend: '+8.2%' },
                  { label: 'Pelanggan', value: '89', icon: <Users className="text-blue-400" />, trend: '+5.4%' },
                  { label: 'Stok Rendah', value: products.filter(p => p.stock < 20).length.toString(), icon: <Package className="text-orange-400" />, trend: '-2' },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0f1423] p-6 rounded-3xl border border-slate-800 shadow-xl group transition-all hover:border-purple-500/30">
                    <div className="flex justify-between items-start mb-4"><div className="p-3 bg-slate-800/50 rounded-2xl group-hover:scale-110 transition-transform">{stat.icon}</div><span className="text-[10px] font-bold text-emerald-400 bg-emerald-400/10 px-2 py-0.5 rounded-full">{stat.trend}</span></div>
                    <p className="text-slate-500 text-sm font-medium">{stat.label}</p><h3 className="text-2xl font-bold mt-1">{stat.value}</h3>
                  </div>
                ))}
              </div>
              <div className="grid lg:grid-cols-3 gap-8">
                <div className="lg:col-span-2 bg-[#0f1423] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                  <div className="flex justify-between items-center mb-8"><h3 className="font-bold text-lg">Penjualan Terakhir</h3><button onClick={() => setActiveTab('riwayat')} className="text-xs text-purple-400 hover:underline">Lihat Semua</button></div>
                  <div className="space-y-4">
                    {transactions.slice(0, 4).map((t, i) => (
                      <div key={i} className="flex items-center justify-between p-5 bg-slate-800/30 rounded-3xl border border-transparent hover:border-slate-700 transition-all">
                        <div className="flex items-center gap-4">
                          <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-400"><Clock size={20} /></div>
                          <div><p className="font-bold text-sm">Pesanan {t.invoice}</p><p className="text-xs text-slate-500">{new Date(t.created_at).toLocaleString()} • {t.method}</p></div>
                        </div>
                        <p className="font-bold text-emerald-400 text-lg">Rp {Number(t.total).toLocaleString()}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="bg-[#0f1423] border border-slate-800 p-8 rounded-[2.5rem] shadow-xl">
                  <h3 className="font-bold text-lg mb-8">Produk Terlaris</h3>
                  <div className="space-y-6">
                    {products.sort((a,b) => b.sales - a.sales).slice(0, 4).map((p, i) => (
                      <div key={p.id} className="flex items-center gap-4"><span className="text-slate-500 font-bold text-lg min-w-[24px]">0{i+1}</span><div className="flex-1"><p className="font-bold text-sm text-slate-200">{p.name}</p><div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden"><div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${(p.sales/100)*100}%` }}></div></div></div><span className="text-xs font-bold text-slate-400">{p.sales} terjual</span></div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* HALAMAN PRODUK & TRANSAKSI TETAP SAMA... */}
          {activeTab === 'produk' && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Daftar Produk</h3><button onClick={() => handleOpenModal()} className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-2xl font-bold transition shadow-lg"><Plus size={18} /> Tambah Produk</button></div>
              <div className="bg-[#0f1423] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 border-b border-slate-800"><tr><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama Produk</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Kategori</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Harga</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Stok</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">{filteredProducts.map((p) => (
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-colors"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500"><Package size={20} /></div><span className="font-bold">{p.name}</span></div></td><td className="px-6 py-4 text-sm text-slate-400">{p.category}</td><td className="px-6 py-4 font-bold text-purple-400">Rp {Number(p.price).toLocaleString()}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.stock < 20 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{p.stock} Tersedia</span></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleOpenModal(p)} className="p-2 text-slate-500 hover:text-white"><Pencil size={18} /></button><button className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={18} /></button></div></td></tr>
                    ))}</tbody>
                </table>
              </div>
            </div>
          )}

          {activeTab === 'transaksi' && (
            <div className="grid lg:grid-cols-2 gap-8 animate-in fade-in">
              <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar pb-8">
                <h3 className="font-bold text-lg mb-4">Pilih Produk</h3>
                <div className="grid sm:grid-cols-2 gap-4">{filteredProducts.map((p) => (
                    <div key={p.id} onClick={() => addToCart(p)} className="bg-[#0f1423] border border-slate-800 p-4 rounded-3xl hover:border-purple-500 cursor-pointer transition-all group">
                      <div className="w-full h-32 bg-slate-800 rounded-2xl mb-3 flex items-center justify-center text-slate-600 overflow-hidden"><img src={`https://placehold.co/200x200/1e293b/94a3b8?text=${p.name}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" /></div>
                      <h4 className="font-bold">{p.name}</h4><p className="text-purple-400 font-bold">Rp {Number(p.price).toLocaleString()}</p>
                    </div>
                  ))}</div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="bg-[#0f1423] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">Keranjang</h3>
                  <div className="space-y-6">{cart.length === 0 ? <div className="py-10 text-center text-slate-500">Kosong</div> : cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-2 border-b border-slate-800/50 last:border-0">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl overflow-hidden"><img src={`https://placehold.co/100x100/1e293b/94a3b8?text=${item.name[0]}`} alt="" className="w-full h-full object-cover" /></div>
                        <div className="flex-1"><div className="flex justify-between items-start"><h4 className="font-bold leading-tight">{item.name}</h4><p className="font-bold">Rp {(item.price * item.qty).toLocaleString()}</p></div>
                        <div className="flex items-center gap-3 mt-2"><button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: Math.max(0, i.qty-1)} : i).filter(i => i.qty > 0))} className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center"><Minus size={14} /></button><span className="font-bold text-sm">{item.qty}</span><button onClick={() => addToCart(item)} className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center"><Plus size={14} /></button></div></div>
                      </div>
                    ))}</div>
                </div>
                <div className="bg-[#0f1423] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                   <h3 className="font-bold mb-6">Pembayaran</h3>
                   <div className="space-y-3">{['SmartBank (QRIS)', 'E-Wallet', 'Tunai'].map(m => (
                     <label key={m} className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${paymentMethod === m ? 'border-purple-600 bg-purple-600/10' : 'border-slate-800'}`}>
                       <input type="radio" className="hidden" checked={paymentMethod === m} onChange={() => setPaymentMethod(m)} />
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === m ? 'border-purple-600' : 'border-slate-600'}`}>{paymentMethod === m && <div className="w-3 h-3 rounded-full bg-purple-600" />}</div>
                       <p className="font-bold text-sm">{m}</p>
                     </label>
                   ))}</div>
                   <div className="mt-8 pt-6 border-t border-dashed border-slate-800 space-y-2">
                     <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>Rp {subtotalCart.toLocaleString()}</span></div>
                     <div className="flex justify-between text-sm text-slate-400"><span>Fee POS</span><span className="text-purple-400">+ Rp {feePOS.toLocaleString()}</span></div>
                     <div className="flex justify-between pt-2"><span className="text-white font-bold text-xl">Total</span><span className="text-purple-400 font-bold text-xl">Rp {totalCart.toLocaleString()}</span></div>
                     <button onClick={handleCheckoutPOS} disabled={loading} className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-bold mt-4 shadow-lg">{loading ? 'Proses...' : 'Bayar Sekarang'}</button>
                   </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'riwayat' && (
             <div className="bg-[#0f1423] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl animate-in fade-in">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 border-b border-slate-800"><tr><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Invoice</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Tanggal</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Metode</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Total</th><th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Status</th></tr></thead>
                  <tbody className="divide-y divide-slate-800">{transactions.map((t) => (
                      <tr key={t.id} className="hover:bg-slate-800/20 transition-colors"><td className="px-6 py-4 font-bold text-purple-400">{t.invoice}</td><td className="px-6 py-4 text-xs text-slate-500">{new Date(t.created_at).toLocaleString()}</td><td className="px-6 py-4 text-sm font-medium">{t.method}</td><td className="px-6 py-4 font-bold text-sm">Rp {Number(t.total).toLocaleString()}</td><td className="px-6 py-4"><span className="px-3 py-1 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400">{t.status}</span></td></tr>
                    ))}</tbody>
                </table>
             </div>
          )}

          {activeTab === 'laporan' && (
            <div className="animate-in fade-in space-y-8">
               <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Ringkasan Bisnis</h3></div>
               <div className="grid md:grid-cols-3 gap-6">{[
                  { label: 'Pendapatan', value: `Rp ${transactions.reduce((s,t) => s + Number(t.total), 0).toLocaleString()}`, icon: <Wallet className="text-emerald-400" />, trend: '+15.2%', up: true },
                  { label: 'Transaksi', value: transactions.length.toString(), icon: <TrendingUp className="text-purple-400" />, trend: '+5.4%', up: true },
                  { label: 'Rata-rata Order', value: `Rp ${(transactions.length > 0 ? transactions.reduce((s,t) => s + Number(t.total), 0) / transactions.length : 0).toLocaleString()}`, icon: <BarChart3 className="text-blue-400" />, trend: '-2.1%', up: false },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0f1423] p-6 rounded-3xl border border-slate-800 shadow-xl"><p className="text-slate-500 text-sm font-medium">{stat.label}</p><h3 className="text-2xl font-bold mt-1">{stat.value}</h3></div>
                ))}</div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL CHECKOUT LANGGANAN (NEW) */}
      {showCheckoutModal && selectedPlanData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white text-[#1a1a1a] w-full max-w-[450px] rounded-[1.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            {/* Header Checkout */}
            <div className="p-6 flex items-center justify-between border-b border-gray-100">
               <div className="flex items-center gap-3">
                 <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                   <Zap className="text-white" fill="white" size={24} />
                 </div>
                 <div>
                   <h4 className="font-extrabold text-lg leading-tight">WarungPOS {selectedPlanData.name}</h4>
                   <p className="text-xs text-gray-500 font-medium">Langganan</p>
                 </div>
               </div>
               <div className="text-right">
                 <p className="font-bold text-lg">{selectedPlanData.price}</p>
                 <button onClick={() => setShowCheckoutModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
               </div>
            </div>

            {/* Billing Info */}
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h5 className="font-bold text-sm">Tagihan bulanan</h5>
                  <p className="text-[10px] text-gray-400 font-medium mt-0.5">Awal penagihan: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>
                <p className="font-bold text-sm">{selectedPlanData.price}/bl</p>
              </div>

              {/* Payment Selector (Simulasi ShopeePay) */}
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-100 cursor-pointer hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-6 bg-orange-500 rounded flex items-center justify-center text-[8px] text-white font-bold italic">ShopeePay</div>
                  <p className="text-sm font-bold">ShopeePay •••• 0973</p>
                </div>
                <ChevronRight size={18} className="text-gray-400" />
              </div>

              <div className="space-y-4 pt-2">
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Penagihan akan diperpanjang secara otomatis setiap bulan. Pengembalian dana tidak akan diberikan atas pembayaran untuk periode penagihan parsial. Batalkan kapan saja di Setelan. <span className="text-blue-600 cursor-pointer">Pelajari lebih lanjut</span>.
                </p>
                <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                  Dengan melanjutkan, Anda menyatakan bahwa Anda telah berusia minimum 18 tahun dan menyetujui <span className="text-blue-600 cursor-pointer">persyaratan ini</span>.
                </p>
              </div>

              {/* Price Breakdown */}
              <div className="pt-4 border-t border-gray-100 space-y-2">
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Sub-total</span>
                  <span>{selectedPlanData.price}</span>
                </div>
                <div className="flex justify-between text-xs text-gray-500 font-medium">
                  <span>Pajak (11%)</span>
                  <span>Rp {(selectedPlanData.numericPrice * 0.11).toLocaleString()}</span>
                </div>
                <div className="flex justify-between items-end pt-4">
                  <span className="font-bold text-base">Total hari ini</span>
                  <span className="font-black text-2xl">Rp {(selectedPlanData.numericPrice * 1.11).toLocaleString()}</span>
                </div>
              </div>
            </div>

            {/* Confirm Button */}
            <div className="p-6 pt-2">
              <button 
                onClick={() => confirmPlan(selectedPlanData.name, selectedPlanData.price)}
                className="w-full bg-[#065fd4] hover:bg-[#0551b8] text-white py-4 rounded-full font-bold text-sm transition-colors shadow-lg active:scale-95"
              >
                Beli
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK (Tetap Sama) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">{currentProduct ? 'Edit' : 'Tambah'} Produk</h3><button onClick={() => setShowProductModal(false)}><X /></button></div>
             <div className="space-y-4">
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Nama" />
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Harga" />
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Stok" />
                <button onClick={handleSaveProduct} className="w-full bg-purple-600 py-3 rounded-xl font-bold">Simpan</button>
             </div>
          </div>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
      `}</style>
    </div>
  );
};

export default Dashboard;