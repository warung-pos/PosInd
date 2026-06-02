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
  Info,
  Printer,
  Settings,
  Moon,
  Camera,
  UserCircle,
  Menu
} from 'lucide-react';

const Dashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('SmartBank (QRIS)');
  const [cashReceived, setCashReceived] = useState('');
  const [showProductModal, setShowProductModal] = useState(false);
  const [showCheckoutModal, setShowCheckoutModal] = useState(false);
  const [selectedPlanData, setSelectedPlanData] = useState(null);
  const [checkoutStep, setCheckoutStep] = useState('main'); // 'main' | 'payment_selector' | 'success'
  const [checkoutPaymentMethod, setCheckoutPaymentMethod] = useState({
    id: 'shopeepay',
    name: 'ShopeePay',
    account: '•••• 0973',
    logoColor: 'bg-[#ee4d2d]',
    logoText: 'ShopeePay'
  });
  const [checkoutInvoice, setCheckoutInvoice] = useState('');
  const [checkoutDate, setCheckoutDate] = useState('');
  
  const [currentProduct, setCurrentProduct] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  // Midtrans QRIS & Invoice States
  const [showQRModal, setShowQRModal] = useState(false);
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [activeQRTransaction, setActiveQRTransaction] = useState(null);
  const [paymentStatus, setPaymentStatus] = useState('Pending');
  const [timeLeft, setTimeLeft] = useState(300);
  const [formData, setFormData] = useState({ 
    name: '', 
    price: '', 
    stock: '', 
    category: 'Minuman',
    image: '',
    imageFile: null,
    imagePreview: ''
  });

  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(false);

  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const handleOpenModal = (product = null) => {
    setCurrentProduct(product);
    if (product) {
      setFormData({ 
        name: product.name, 
        price: product.price, 
        stock: product.stock, 
        category: product.category || 'Minuman',
        image: product.image || '',
        imageFile: null,
        imagePreview: product.image ? `http://localhost:3000/uploads/${product.image}` : ''
      });
    } else {
      setFormData({ 
        name: '', 
        price: '', 
        stock: '', 
        category: 'Minuman',
        image: '',
        imageFile: null,
        imagePreview: ''
      });
    }
    setShowProductModal(true);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
        URL.revokeObjectURL(formData.imagePreview);
      }
      setFormData(prev => ({
        ...prev,
        imageFile: file,
        imagePreview: URL.createObjectURL(file)
      }));
    }
  };

  const handleCloseModal = () => {
    if (formData.imagePreview && formData.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(formData.imagePreview);
    }
    setShowProductModal(false);
  };
  
  const [plan, setPlan] = useState(() => localStorage.getItem('selectedPlan') || 'Basic (Gratis)');
  const [user, setUser] = useState(() => JSON.parse(localStorage.getItem('user') || '{}'));

  // Profile & Auth States
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [showEditProfileModal, setShowEditProfileModal] = useState(false);
  const [showLogoutConfirmModal, setShowLogoutConfirmModal] = useState(false);
  const [showAccountSettingsModal, setShowAccountSettingsModal] = useState(false);
  const [showChangePasswordModal, setShowChangePasswordModal] = useState(false);
  const [darkMode, setDarkMode] = useState(() => localStorage.getItem('darkMode') !== 'false');
  const [toast, setToast] = useState(null);
  const [passwordForm, setPasswordForm] = useState({ oldPassword: '', newPassword: '', confirmPassword: '' });
  const [passwordMsg, setPasswordMsg] = useState({ type: '', text: '' });
  const [accountSettings, setAccountSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('accountSettings') || '{"notifications":true,"kasirSound":false,"language":"id","showWelcome":true}'); }
    catch { return { notifications: true, kasirSound: false, language: 'id', showWelcome: true }; }
  });
  const [profileData, setProfileData] = useState({
    id: user?.id,
    name: user?.name || 'Admin User',
    email: user?.email || '',
    role: user?.role || 'Admin',
    profile_image: user?.profile_image || null,
  });
  const [editProfileForm, setEditProfileForm] = useState({ name: '', email: '', imageFile: null, imagePreview: '' });

  const showToast = (type, text) => {
    setToast({ type, text });
    setTimeout(() => setToast(null), 3000);
  };

  const toggleDarkMode = () => {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', String(next));
  };

  const saveAccountSettings = (updated) => {
    setAccountSettings(updated);
    localStorage.setItem('accountSettings', JSON.stringify(updated));
  };

  // Fetch Latest Profile Data
  useEffect(() => {
    if (user && user.id) {
      fetch(`http://localhost:3000/api/auth/profile/${user.id}`)
        .then(res => res.json())
        .then(data => {
            if (!data.message) {
               setProfileData(data);
               const updatedUser = { ...user, ...data };
               setUser(updatedUser);
               localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        })
        .catch(err => console.error('Gagal memuat profil', err));
    }
  }, []);

  // 🔥 DETEKSI PENDING CHECKOUT DARI LANDING PAGE
  useEffect(() => {
    const pendingPlanStr = localStorage.getItem('pendingCheckoutPlan');
    if (pendingPlanStr) {
      try {
        const pendingPlan = JSON.parse(pendingPlanStr);
        const matchedPlan = pricingPlans.find(p => p.name === pendingPlan.name);
        if (matchedPlan) {
          setSelectedPlanData(matchedPlan);
          setCheckoutStep('main');
          setShowCheckoutModal(true);
        }
      } catch (e) {
        console.error('Gagal membaca pending checkout plan:', e);
      }
      localStorage.removeItem('pendingCheckoutPlan');
    }
  }, []);

  const handleOpenEditProfile = () => {
    setEditProfileForm({
      name: profileData.name || '',
      imageFile: null,
      imagePreview: profileData.profile_image ? `http://localhost:3000/uploads/${profileData.profile_image}` : ''
    });
    setShowProfileMenu(false);
    setShowEditProfileModal(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    onBack();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    if (!user || !user.id) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('name', editProfileForm.name || profileData.name);
    fd.append('email', profileData.email);
    if (editProfileForm.imageFile) fd.append('profile_image', editProfileForm.imageFile);
    try {
        const res = await fetch(`http://localhost:3000/api/auth/profile/${user.id}`, { method: 'PUT', body: fd });
        if (res.ok) {
            const data = await res.json();
            setProfileData(data.user);
            const updatedUser = { ...user, ...data.user };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
            setShowEditProfileModal(false);
            showToast('success', 'Profile berhasil diperbarui!');
        } else { const e2 = await res.json(); showToast('error', e2.message || 'Gagal menyimpan'); }
    } catch { showToast('error', 'Kesalahan koneksi server'); }
    finally { setLoading(false); }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordMsg({ type: '', text: '' });
    if (passwordForm.newPassword !== passwordForm.confirmPassword)
      return setPasswordMsg({ type: 'error', text: 'Password baru tidak cocok!' });
    if (passwordForm.newPassword.length < 6)
      return setPasswordMsg({ type: 'error', text: 'Password minimal 6 karakter!' });
    setLoading(true);
    try {
      const res = await fetch(`http://localhost:3000/api/auth/change-password/${user.id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oldPassword: passwordForm.oldPassword, newPassword: passwordForm.newPassword })
      });
      const data = await res.json();
      if (res.ok) {
        setPasswordMsg({ type: 'success', text: 'Password berhasil diubah!' });
        setPasswordForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
        setTimeout(() => { setShowChangePasswordModal(false); setPasswordMsg({ type: '', text: '' }); }, 2000);
      } else { setPasswordMsg({ type: 'error', text: data.message || 'Gagal mengubah password' }); }
    } catch { setPasswordMsg({ type: 'error', text: 'Kesalahan koneksi server' }); }
    finally { setLoading(false); }
  };

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

  // Polling status dan countdown timer untuk QRIS
  useEffect(() => {
    let pollInterval;
    let timerInterval;

    if (showQRModal && activeQRTransaction) {
      // Countdown Timer
      timerInterval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setPaymentStatus('Gagal');
            clearInterval(timerInterval);
            clearInterval(pollInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Polling Status Midtrans
      pollInterval = setInterval(async () => {
        try {
          const res = await fetch(`http://localhost:3000/api/pos/status/${activeQRTransaction.invoice}`);
          if (res.ok) {
            const data = await res.json();
            if (data.status === 'Selesai') {
              setPaymentStatus('Selesai');
              setActiveQRTransaction(prev => ({ ...prev, status: 'Selesai' }));
              clearInterval(pollInterval);
              clearInterval(timerInterval);
              
              // Tampilkan Invoice
              setTimeout(() => {
                setShowQRModal(false);
                setShowInvoiceModal(true);
                setCart([]);
                fetchProducts();
                fetchTransactions();
              }, 1500);
            } else if (data.status === 'Gagal') {
              setPaymentStatus('Gagal');
              clearInterval(pollInterval);
              clearInterval(timerInterval);
            }
          }
        } catch (err) {
          console.error('Polling status error:', err);
        }
      }, 3000);
    }

    return () => {
      clearInterval(pollInterval);
      clearInterval(timerInterval);
    };
  }, [showQRModal, activeQRTransaction]);

  const handleOpenCheckout = (planObj) => {
    if (planObj.price === 'Gratis' || planObj.numericPrice === 0) {
      confirmPlan(planObj.name, 'Gratis');
    } else {
      setSelectedPlanData(planObj);
      setCheckoutStep('main');
      setShowCheckoutModal(true);
    }
  };

  const confirmPlan = async (name, price) => {
    setLoading(true);
    const invoiceNum = `INV-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
    const dateStr = new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
    
    try {
      if (user && user.id) {
        const res = await fetch(`http://localhost:3000/api/auth/update-plan/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: `${name} (${price})` })
        });
        
        if (res.ok) {
          const data = await res.json();
          const fullPlanName = `${name} (${price})`;
          setPlan(fullPlanName);
          localStorage.setItem('selectedPlan', fullPlanName);
          
          const updatedUser = { ...user, plan: fullPlanName };
          setUser(updatedUser);
          localStorage.setItem('user', JSON.stringify(updatedUser));
          
          if (price === 'Gratis') {
            alert(`Sukses! Akun kamu sekarang menggunakan paket ${name}.`);
          } else {
            setCheckoutInvoice(invoiceNum);
            setCheckoutDate(dateStr);
            setCheckoutStep('success');
          }
        } else {
          const data = await res.json();
          alert(`Gagal memperbarui plan: ${data.message}`);
        }
      } else {
        const fullPlanName = `${name} (${price})`;
        setPlan(fullPlanName);
        localStorage.setItem('selectedPlan', fullPlanName);
        if (price === 'Gratis') {
          alert(`Sukses! Akun kamu sekarang menggunakan paket ${name}.`);
        } else {
          setCheckoutInvoice(invoiceNum);
          setCheckoutDate(dateStr);
          setCheckoutStep('success');
        }
      }
    } catch (err) {
      console.error(err);
      alert('Kesalahan koneksi ke server.');
    } finally {
      setLoading(false);
    }
  };

  // --- LOGIK PRODUK ---
  const handleSaveProduct = async () => {
    if (!formData.name || !formData.price || !formData.stock) return;
    try {
      const url = currentProduct ? `http://localhost:3000/api/products/${currentProduct.id}` : 'http://localhost:3000/api/products';
      
      const data = new FormData();
      data.append('name', formData.name);
      data.append('price', formData.price);
      data.append('stock', formData.stock);
      data.append('category', formData.category || 'Minuman');
      if (formData.imageFile) {
        data.append('image', formData.imageFile);
      }

      const res = await fetch(url, {
        method: currentProduct ? 'PUT' : 'POST',
        body: data
      });
      if (res.ok) { 
        fetchProducts(); 
        handleCloseModal(); 
      }
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;
    try {
      const res = await fetch(`http://localhost:3000/api/products/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) { fetchProducts(); }
    } catch (err) { console.error(err); }
  };

  // --- LOGIK POS ---
  const addToCart = (product) => {
    const existing = cart.find(item => item.id === product.id);
    if (existing) { setCart(cart.map(i => i.id === product.id ? {...i, qty: i.qty + 1} : i)); }
    else { setCart([...cart, { ...product, qty: 1 }]); }
  };

  const handleSimulateQRISSuccess = async () => {
    if (!activeQRTransaction) return;
    try {
      const res = await fetch(`http://localhost:3000/api/pos/simulate-success/${activeQRTransaction.invoice}`, {
        method: 'POST'
      });
      if (res.ok) {
        setPaymentStatus('Selesai');
        setActiveQRTransaction(prev => ({ ...prev, status: 'Selesai' }));
        setTimeout(() => {
          setShowQRModal(false);
          setShowInvoiceModal(true);
          setCart([]);
          fetchProducts();
          fetchTransactions();
        }, 1500);
      } else {
        alert('Gagal mensimulasikan pembayaran.');
      }
    } catch (err) {
      console.error(err);
      alert('Gagal menghubungkan ke server.');
    }
  };

  const handleCheckoutPOS = async () => {
    if (cart.length === 0) return;
    setLoading(true);
    const isCash = paymentMethod === 'Cash';
    const payload = { 
      items: cart, 
      payment_method: paymentMethod, 
      user_id: user.id 
    };
    if (isCash) {
      payload.cash_paid = Number(cashReceived);
      payload.change_due = Number(cashReceived) - totalCart;
    }
    try {
      const res = await fetch('http://localhost:3000/api/pos/pay', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        const data = await res.json();
        if (paymentMethod === 'SmartBank (QRIS)') {
          setActiveQRTransaction({
            invoice: data.invoice,
            total: data.total,
            fee_pos: data.fee_pos,
            qrisUrl: data.qrisUrl,
            qrString: data.qrString,
            items: [...cart],
            method: 'SmartBank (QRIS)',
            status: 'Pending',
            created_at: new Date().toISOString()
          });
          setPaymentStatus('Pending');
          setTimeLeft(300);
          setShowQRModal(true);
        } else {
          setCart([]);
          fetchProducts();
          fetchTransactions();
          setActiveQRTransaction({
            invoice: data.invoice,
            total: data.total,
            fee_pos: data.fee_pos,
            items: [...cart],
            method: paymentMethod,
            status: 'Selesai',
            created_at: new Date().toISOString(),
            cash_paid: payload.cash_paid,
            change_due: payload.change_due
          });
          setCashReceived(''); // Reset cash input
          setShowInvoiceModal(true);
        }
      } else {
        const data = await res.json();
        alert(`Gagal memproses transaksi: ${data.message}`);
      }
    } catch (err) { 
      console.error(err);
      alert('Gagal menghubungkan ke server.');
    } finally { 
      setLoading(false); 
    }
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
    <div className={`flex h-screen font-sans overflow-hidden transition-colors duration-300 ${darkMode ? 'bg-[#0b0e17] text-white' : 'bg-slate-100 text-slate-800'}`}>
      
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
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowMobileSidebar(true)} 
              className="md:hidden p-2 -ml-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors"
            >
              <Menu size={24} />
            </button>
            <h2 className="text-xl font-bold">{menuItems.find(i => i.id === activeTab)?.label}</h2>
          </div>
          <div className="flex items-center gap-4">
            {/* Search Bar */}
            <div className="relative hidden sm:block">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
              <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-purple-500 w-64 outline-none" />
            </div>

            {/* Profile Avatar Button */}
            <div className="relative">
              <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className={`w-10 h-10 rounded-full bg-slate-800 border-2 hover:border-purple-500 flex items-center justify-center overflow-hidden transition-all shadow-lg active:scale-95 ${showProfileMenu ? 'border-purple-500 shadow-purple-500/15' : 'border-slate-700'}`}
              >
                {profileData?.profile_image ? (
                  <img src={`http://localhost:3000/uploads/${profileData.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <UserCircle size={24} className="text-slate-400" />
                )}
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          
          {/* USER PROFILE MODAL */}
          {showProfileMenu && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
              <div className="bg-[#0f1423] border border-slate-800 rounded-3xl p-6 shadow-2xl w-full max-w-sm">
                <div className="flex items-start justify-between pb-4 border-b border-slate-800/80">
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700">
                      {profileData?.profile_image ? (
                        <img src={`http://localhost:3000/uploads/${profileData.profile_image}`} alt="Profile" className="w-full h-full object-cover" />
                      ) : (
                        <UserCircle size={48} className="text-slate-400 w-full h-full p-2" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug">{profileData?.name}</h4>
                      <p className="text-xs text-slate-400 mt-0.5">{profileData?.email}</p>
                    </div>
                  </div>
                  <button onClick={() => setShowProfileMenu(false)} className="p-1.5 text-slate-500 hover:text-white hover:bg-slate-800/50 rounded-lg"><X size={18} /></button>
                </div>
                
                <div className="mt-5 grid grid-cols-2 gap-3">
                  <button onClick={handleOpenEditProfile} className="flex flex-col items-center gap-2 p-3 text-xs font-semibold bg-slate-800/50 rounded-xl hover:bg-slate-700"><Pencil size={18} className="text-purple-400" /> Edit</button>
                  <button onClick={() => { setShowProfileMenu(false); setShowAccountSettingsModal(true); }} className="flex flex-col items-center gap-2 p-3 text-xs font-semibold bg-slate-800/50 rounded-xl hover:bg-slate-700"><Settings size={18} className="text-blue-400" /> Akun</button>
                  <button onClick={() => { setShowProfileMenu(false); setShowChangePasswordModal(true); }} className="flex flex-col items-center gap-2 p-3 text-xs font-semibold bg-slate-800/50 rounded-xl hover:bg-slate-700"><ShieldCheck size={18} className="text-emerald-400" /> Password</button>
                  <button onClick={toggleDarkMode} className="flex flex-col items-center gap-2 p-3 text-xs font-semibold bg-slate-800/50 rounded-xl hover:bg-slate-700"><Moon size={18} className="text-yellow-400" /> DarkMode</button>
                </div>
                
                <button onClick={() => { setShowProfileMenu(false); setShowLogoutConfirmModal(true); }} className="w-full mt-4 flex items-center justify-center gap-2 p-3 text-xs font-bold text-red-400 bg-red-500/10 rounded-xl"><LogOut size={16} /> Keluar</button>
              </div>
            </div>
          )}

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
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {[
                  { label: 'Pendapatan', value: `Rp ${transactions.reduce((s,t) => s + Number(t.total), 0).toLocaleString()}`, icon: <Wallet className="text-emerald-400" />, trend: '+12.5%', up: true },
                  { label: 'Transaksi', value: transactions.length.toString(), icon: <TrendingUp className="text-purple-400" />, trend: '+8.2%', up: true },
                  { label: 'Pelanggan', value: '89', icon: <Users className="text-blue-400" />, trend: '+5.4%', up: true },
                  { label: 'Stok Rendah', value: products.filter(p => p.stock < 20).length.toString(), icon: <Package className="text-orange-400" />, trend: '-2', up: false },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0f1423] p-5 rounded-3xl border border-slate-800 shadow-xl group transition-all hover:border-purple-500/30 flex flex-col gap-3">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-800/50 rounded-2xl group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </div>
                      <span className={`text-[10px] font-bold ${stat.up ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'} px-2.5 py-1 rounded-full`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                      <h3 className="text-xl font-bold mt-0.5">{stat.value}</h3>
                    </div>
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
                      <tr key={p.id} className="hover:bg-slate-800/20 transition-colors"><td className="px-6 py-4"><div className="flex items-center gap-3"><div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 overflow-hidden">{p.image ? <img src={`http://localhost:3000/uploads/${p.image}`} alt={p.name} className="w-full h-full object-cover" /> : <Package size={20} />}</div><span className="font-bold">{p.name}</span></div></td><td className="px-6 py-4 text-sm text-slate-400">{p.category}</td><td className="px-6 py-4 font-bold text-purple-400">Rp {Number(p.price).toLocaleString()}</td><td className="px-6 py-4"><span className={`px-3 py-1 rounded-full text-[10px] font-bold ${p.stock < 20 ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>{p.stock} Tersedia</span></td><td className="px-6 py-4 text-right"><div className="flex justify-end gap-2"><button onClick={() => handleOpenModal(p)} className="p-2 text-slate-500 hover:text-white"><Pencil size={18} /></button><button onClick={() => handleDeleteProduct(p.id)} className="p-2 text-slate-500 hover:text-red-400"><Trash2 size={18} /></button></div></td></tr>
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
                      <div className="w-full h-32 bg-slate-800 rounded-2xl mb-3 flex items-center justify-center text-slate-600 overflow-hidden">
                        {p.image ? (
                          <img src={`http://localhost:3000/uploads/${p.image}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        ) : (
                          <img src={`https://placehold.co/200x200/1e293b/94a3b8?text=${p.name}`} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform" />
                        )}
                      </div>
                      <h4 className="font-bold">{p.name}</h4><p className="text-purple-400 font-bold">Rp {Number(p.price).toLocaleString()}</p>
                    </div>
                  ))}</div>
              </div>
              <div className="flex flex-col gap-6">
                <div className="bg-[#0f1423] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">Keranjang</h3>
                  <div className="space-y-6">{cart.length === 0 ? <div className="py-10 text-center text-slate-500">Kosong</div> : cart.map((item) => (
                      <div key={item.id} className="flex items-center gap-4 py-2 border-b border-slate-800/50 last:border-0">
                        <div className="w-16 h-16 bg-slate-800 rounded-2xl overflow-hidden">
                          {item.image ? (
                            <img src={`http://localhost:3000/uploads/${item.image}`} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <img src={`https://placehold.co/100x100/1e293b/94a3b8?text=${item.name[0]}`} alt="" className="w-full h-full object-cover" />
                          )}
                        </div>
                        <div className="flex-1"><div className="flex justify-between items-start"><h4 className="font-bold leading-tight">{item.name}</h4><p className="font-bold">Rp {(item.price * item.qty).toLocaleString()}</p></div>
                        <div className="flex items-center gap-3 mt-2"><button onClick={() => setCart(cart.map(i => i.id === item.id ? {...i, qty: Math.max(0, i.qty-1)} : i).filter(i => i.qty > 0))} className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center"><Minus size={14} /></button><span className="font-bold text-sm">{item.qty}</span><button onClick={() => addToCart(item)} className="w-7 h-7 bg-slate-800 rounded-lg flex items-center justify-center"><Plus size={14} /></button></div></div>
                      </div>
                    ))}</div>
                </div>
                <div className="bg-[#0f1423] border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl">
                   <h3 className="font-bold mb-6">Pembayaran</h3>
                   <div className="space-y-3">{['SmartBank (QRIS)', 'Cash'].map(m => (
                     <label key={m} className={`flex items-center gap-4 p-5 rounded-3xl border-2 cursor-pointer transition-all ${paymentMethod === m ? 'border-purple-600 bg-purple-600/10' : 'border-slate-800'}`}>
                       <input type="radio" className="hidden" checked={paymentMethod === m} onChange={() => {
                         setPaymentMethod(m);
                         setCashReceived(''); // Reset cash input when switching methods
                       }} />
                       <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === m ? 'border-purple-600' : 'border-slate-600'}`}>{paymentMethod === m && <div className="w-3 h-3 rounded-full bg-purple-600" />}</div>
                       <p className="font-bold text-sm">{m}</p>
                     </label>
                   ))}</div>

                   {/* Input Cash Realtime */}
                   {paymentMethod === 'Cash' && (
                     <div className="mt-6 p-5 bg-[#171c2f] border border-slate-800/80 rounded-3xl space-y-4 animate-in slide-in-from-top-4 duration-200">
                       <div>
                         <label className="block text-xs text-slate-400 font-bold uppercase tracking-wider mb-2">Uang Dibayar</label>
                         <div className="relative">
                           <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">Rp</span>
                           <input
                             type="text"
                             value={cashReceived === '' ? '' : Number(cashReceived).toLocaleString('id-ID')}
                             onChange={(e) => {
                               const cleanVal = e.target.value.replace(/\D/g, '');
                               setCashReceived(cleanVal ? Number(cleanVal) : '');
                             }}
                             className="w-full pl-12 pr-24 py-4 bg-slate-900 border border-slate-800 rounded-2xl text-white font-bold focus:outline-none focus:border-purple-600 transition text-sm"
                             placeholder="0"
                           />
                           <button
                             type="button"
                             onClick={() => setCashReceived(totalCart)}
                             className="absolute right-3 top-1/2 -translate-y-1/2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-[10px] font-bold rounded-xl transition uppercase tracking-wider"
                           >
                             Uang Pas
                           </button>
                         </div>
                       </div>

                       {cashReceived !== '' && (
                         <div className="flex justify-between items-center p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50">
                           <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kembalian</span>
                           <span className={`font-mono text-base font-black ${Number(cashReceived) - totalCart < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                             Rp {(Number(cashReceived) - totalCart).toLocaleString('id-ID')}
                           </span>
                         </div>
                       )}

                       {cashReceived !== '' && Number(cashReceived) - totalCart < 0 && (
                         <div className="text-xs font-bold text-red-500 bg-red-500/10 border border-red-500/20 px-4 py-3 rounded-2xl text-center">
                           ⚠️ Uang pelanggan kurang
                         </div>
                       )}
                     </div>
                   )}

                   <div className="mt-8 pt-6 border-t border-dashed border-slate-800 space-y-2">
                     <div className="flex justify-between text-sm text-slate-400"><span>Subtotal</span><span>Rp {subtotalCart.toLocaleString()}</span></div>
                     <div className="flex justify-between text-sm text-slate-400"><span>Fee POS</span><span className="text-purple-400">+ Rp {feePOS.toLocaleString()}</span></div>
                     <div className="flex justify-between pt-2"><span className="text-white font-bold text-xl">Total</span><span className="text-purple-400 font-bold text-xl">Rp {totalCart.toLocaleString()}</span></div>
                     
                     <button 
                       onClick={handleCheckoutPOS} 
                       disabled={loading || (paymentMethod === 'Cash' && (cashReceived === '' || Number(cashReceived) < totalCart))} 
                       className={`w-full py-4 rounded-2xl font-bold mt-4 shadow-lg transition-all active:scale-[0.98] ${
                         paymentMethod === 'Cash' && (cashReceived === '' || Number(cashReceived) < totalCart)
                           ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700/50'
                           : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/20'
                       }`}
                     >
                       {loading ? 'Proses...' : (paymentMethod === 'Cash' ? 'Bayar Tunai' : 'Bayar Sekarang')}
                     </button>
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
            <div className="animate-in fade-in space-y-6">
               <div className="flex justify-between items-center"><h3 className="text-xl font-bold">Ringkasan Bisnis</h3></div>
               <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">{[
                  { label: 'Pendapatan', value: `Rp ${transactions.reduce((s,t) => s + Number(t.total), 0).toLocaleString()}`, icon: <Wallet className="text-emerald-400" />, trend: '+15.2%', up: true },
                  { label: 'Transaksi', value: transactions.length.toString(), icon: <TrendingUp className="text-purple-400" />, trend: '+5.4%', up: true },
                  { label: 'Rata-rata Order', value: `Rp ${(transactions.length > 0 ? transactions.reduce((s,t) => s + Number(t.total), 0) / transactions.length : 0).toLocaleString()}`, icon: <BarChart3 className="text-blue-400" />, trend: '-2.1%', up: false },
                ].map((stat, i) => (
                  <div key={i} className="bg-[#0f1423] p-5 rounded-3xl border border-slate-800 shadow-xl flex flex-col gap-3 group transition-all hover:border-purple-500/30">
                    <div className="flex items-center justify-between">
                      <div className="p-3 bg-slate-800/50 rounded-2xl group-hover:scale-110 transition-transform">
                        {stat.icon}
                      </div>
                      <span className={`text-[10px] font-bold ${stat.up ? 'text-emerald-400 bg-emerald-400/10' : 'text-red-400 bg-red-400/10'} px-2.5 py-1 rounded-full`}>
                        {stat.trend}
                      </span>
                    </div>
                    <div>
                      <p className="text-slate-500 text-xs font-medium">{stat.label}</p>
                      <h3 className="text-xl font-bold mt-0.5">{stat.value}</h3>
                    </div>
                  </div>
                ))}</div>
            </div>
          )}

        </div>
      </main>

      {/* MODAL CHECKOUT LANGGANAN (NEW & HIGH FIDELITY) */}
      {showCheckoutModal && selectedPlanData && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-white text-[#1a1a1a] w-full max-w-[450px] rounded-[1.5rem] overflow-hidden shadow-2xl animate-in zoom-in duration-300">
            {checkoutStep === 'main' && (
              <>
                {/* Header Checkout */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-600 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/20">
                      <Zap className="text-white" fill="white" size={24} />
                    </div>
                    <div>
                      <h4 className="font-extrabold text-lg text-gray-900 leading-tight">WarungPOS {selectedPlanData.name}</h4>
                      <p className="text-xs text-gray-500 font-medium">Langganan</p>
                    </div>
                  </div>
                  <div className="text-right flex items-center gap-3">
                    <button onClick={() => setShowCheckoutModal(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
                      <X size={18} />
                    </button>
                  </div>
                </div>

                {/* Billing Info */}
                <div className="p-6 space-y-6">
                  <div className="flex justify-between items-center text-gray-900">
                    <div>
                      <h5 className="font-bold text-sm">Tagihan bulanan</h5>
                      <p className="text-[10px] text-gray-400 font-medium mt-0.5">Awal penagihan: {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                    </div>
                    <p className="font-bold text-sm">{selectedPlanData.price}/bl</p>
                  </div>

                  {/* Payment Selector */}
                  <div 
                    onClick={() => setCheckoutStep('payment_selector')}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl border border-gray-200 cursor-pointer hover:bg-gray-100 hover:border-gray-300 transition-all text-gray-900"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`px-2.5 py-1 rounded text-[10px] font-black text-white ${checkoutPaymentMethod.logoColor} uppercase tracking-wider italic`}>
                        {checkoutPaymentMethod.logoText || checkoutPaymentMethod.name}
                      </div>
                      <p className="text-sm font-bold">{checkoutPaymentMethod.name} {checkoutPaymentMethod.account}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-400" />
                  </div>

                  <div className="space-y-4 pt-2">
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                      Penagihan akan diperpanjang secara otomatis setiap bulan. Pengembalian dana tidak akan diberikan atas pembayaran untuk periode penagihan parsial. Batalkan kapan saja di Setelan. <span className="text-blue-600 cursor-pointer hover:underline font-semibold">Pelajari lebih lanjut</span>.
                    </p>
                    <p className="text-[11px] text-gray-500 leading-relaxed font-medium">
                      Dengan melanjutkan, Anda menyatakan bahwa Anda telah berusia minimum 18 tahun dan menyetujui <span className="text-blue-600 cursor-pointer hover:underline font-semibold">persyaratan ini</span>.
                    </p>
                  </div>

                  {/* Price Breakdown */}
                  <div className="pt-4 border-t border-gray-100 space-y-2 text-gray-600">
                    <div className="flex justify-between text-xs font-medium">
                      <span>Sub-total</span>
                      <span>{selectedPlanData.price}</span>
                    </div>
                    <div className="flex justify-between text-xs font-medium">
                      <span>Pajak (11%)</span>
                      <span>Rp {(selectedPlanData.numericPrice * 0.11).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-end pt-4 border-t border-gray-100/50">
                      <span className="font-bold text-gray-900 text-sm">Total hari ini</span>
                      <span className="font-black text-2xl text-gray-900">Rp {(selectedPlanData.numericPrice * 1.11).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Confirm Button */}
                <div className="p-6 pt-2">
                  <button 
                    onClick={() => confirmPlan(selectedPlanData.name, selectedPlanData.price)}
                    disabled={loading}
                    className="w-full bg-[#065fd4] hover:bg-[#0551b8] text-white py-4 rounded-full font-bold text-sm transition-all shadow-lg active:scale-95 disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <span className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></span>
                        Memproses...
                      </>
                    ) : (
                      'Beli'
                    )}
                  </button>
                </div>
              </>
            )}

            {checkoutStep === 'payment_selector' && (
              <>
                {/* Header Selector */}
                <div className="p-6 flex items-center justify-between border-b border-gray-100">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setCheckoutStep('main')}
                      className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors animate-in slide-in-from-right-4 duration-300"
                    >
                      <ArrowRight size={18} className="rotate-180" />
                    </button>
                    <div>
                      <h4 className="font-extrabold text-lg text-gray-900 leading-tight">Metode Pembayaran</h4>
                      <p className="text-xs text-gray-500 font-medium">Pilih opsi pembayaran anda</p>
                    </div>
                  </div>
                  <button onClick={() => setShowCheckoutModal(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* List of Payment Methods */}
                <div className="p-6 space-y-3 overflow-y-auto max-h-[380px] custom-scrollbar">
                  {[
                    { id: 'shopeepay', name: 'ShopeePay', account: '•••• 0973', logoColor: 'bg-[#ee4d2d]', logoText: 'ShopeePay' },
                    { id: 'gopay', name: 'GoPay', account: '•••• 8821', logoColor: 'bg-[#00aed6]', logoText: 'GoPay' },
                    { id: 'dana', name: 'DANA', account: '•••• 4920', logoColor: 'bg-[#108ee9]', logoText: 'DANA' },
                    { id: 'ovo', name: 'OVO', account: '•••• 1544', logoColor: 'bg-[#4c2a86]', logoText: 'OVO' },
                    { id: 'bca_va', name: 'BCA Virtual Account', account: '', logoColor: 'bg-[#005c9a]', logoText: 'BCA VA' },
                    { id: 'mandiri_va', name: 'Mandiri Virtual Account', account: '', logoColor: 'bg-[#f7931e]', logoText: 'Mandiri' },
                    { id: 'credit_card', name: 'Kartu Kredit', account: '•••• 4321', logoColor: 'bg-slate-700', logoText: 'VISA' },
                  ].map((method) => (
                    <div
                      key={method.id}
                      onClick={() => {
                        setCheckoutPaymentMethod(method);
                        setCheckoutStep('main');
                      }}
                      className={`flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer hover:bg-slate-50 ${
                        checkoutPaymentMethod.id === method.id 
                          ? 'border-purple-600 bg-purple-50/30 font-bold' 
                          : 'border-gray-200 bg-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`px-2 py-0.5 rounded text-[8px] font-black text-white ${method.logoColor} uppercase tracking-wider italic`}>
                          {method.logoText}
                        </div>
                        <div>
                          <p className="text-sm text-gray-900">{method.name}</p>
                          {method.account && <p className="text-xs text-gray-500 font-medium">{method.account}</p>}
                        </div>
                      </div>
                      <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                        checkoutPaymentMethod.id === method.id ? 'border-purple-600 bg-purple-600' : 'border-gray-300 bg-white'
                      }`}>
                        {checkoutPaymentMethod.id === method.id && (
                          <div className="w-1.5 h-1.5 rounded-full bg-white" />
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}

            {checkoutStep === 'success' && (
              <>
                {/* Header Success */}
                <div className="p-6 flex justify-end">
                  <button onClick={() => setShowCheckoutModal(false)} className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 hover:bg-gray-200 flex items-center justify-center transition-colors">
                    <X size={18} />
                  </button>
                </div>

                {/* Success Body */}
                <div className="p-6 text-center space-y-6">
                  {/* Checkmark Animation Container */}
                  <div className="flex justify-center">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center relative animate-in zoom-in duration-300">
                      <div className="absolute inset-0 rounded-full bg-emerald-400/20 animate-ping"></div>
                      <CheckCircle2 size={44} className="text-emerald-500 animate-in fade-in zoom-in duration-500" strokeWidth={2.5} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <h4 className="font-extrabold text-2xl text-gray-900">Pembayaran Berhasil!</h4>
                    <p className="text-sm text-gray-500 max-w-sm mx-auto">
                      Selamat! Akun kamu sekarang sudah aktif menggunakan paket <span className="font-bold text-purple-600">{selectedPlanData.name}</span>.
                    </p>
                  </div>

                  {/* Invoice Receipt Detail */}
                  <div className="bg-gray-50 rounded-2xl p-5 border border-gray-100 space-y-3 text-left">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Nomor Invoice</span>
                      <span className="font-mono font-bold text-gray-800">{checkoutInvoice}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Metode Pembayaran</span>
                      <span className="font-bold text-gray-800">{checkoutPaymentMethod.name}</span>
                    </div>
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Tanggal Pembayaran</span>
                      <span className="font-bold text-gray-800">{checkoutDate}</span>
                    </div>
                    <div className="h-px bg-gray-200/50 my-2"></div>
                    <div className="flex justify-between text-sm">
                      <span className="font-bold text-gray-700">Total Dibayar</span>
                      <span className="font-black text-purple-600">Rp {(selectedPlanData.numericPrice * 1.11).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                </div>

                {/* Success Action Button */}
                <div className="p-6 pt-2">
                  <button 
                    onClick={() => setShowCheckoutModal(false)}
                    className="w-full bg-purple-600 hover:bg-purple-700 text-white py-4 rounded-full font-bold text-sm transition-all shadow-lg active:scale-95 animate-pulse"
                  >
                    Mulai Gunakan Fitur
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* MODAL TAMBAH PRODUK (Tetap Sama) */}
      {showProductModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-3xl p-8 shadow-2xl animate-in zoom-in duration-200">
             <div className="flex justify-between items-center mb-6"><h3 className="text-xl font-bold">{currentProduct ? 'Edit' : 'Tambah'} Produk</h3><button onClick={handleCloseModal}><X /></button></div>
             <div className="space-y-4">
                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Nama" />
                <input type="number" value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Harga" />
                <input type="number" value={formData.stock} onChange={e => setFormData({...formData, stock: e.target.value})} className="w-full bg-slate-800 border border-slate-700 rounded-xl p-3 outline-none" placeholder="Stok" />
                
                {/* Upload Gambar dengan Desain Premium */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-slate-400 block">Gambar Produk</label>
                  <div className="flex items-center gap-4">
                    {formData.imagePreview ? (
                      <div className="relative w-20 h-20 bg-slate-800 border border-slate-700 rounded-2xl overflow-hidden group">
                        <img src={formData.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                        <button 
                          type="button"
                          onClick={() => setFormData({ ...formData, imageFile: null, imagePreview: '' })}
                          className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-red-400 font-bold"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    ) : (
                      <div className="w-20 h-20 bg-slate-800 border border-dashed border-slate-700 rounded-2xl flex items-center justify-center text-slate-500">
                        <Package size={24} />
                      </div>
                    )}
                    <label className="flex-1 flex flex-col items-center justify-center px-4 py-3 bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-slate-600 rounded-xl cursor-pointer transition-all text-xs font-semibold text-slate-300">
                      <span>Pilih File Gambar</span>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageChange} 
                        className="hidden" 
                      />
                    </label>
                  </div>
                </div>

                <button onClick={handleSaveProduct} className="w-full bg-purple-600 py-3 rounded-xl font-bold mt-4">Simpan</button>
             </div>
          </div>
        </div>
      )}

      {/* MODAL QRIS PAYMENT */}
      {showQRModal && activeQRTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <h3 className="text-xl font-bold mb-2">Pembayaran QRIS</h3>
            <p className="text-slate-400 text-xs mb-6">Pindai kode QR menggunakan aplikasi e-wallet Anda</p>
            
            {/* QR Code Container */}
            <div className="bg-white p-6 rounded-3xl inline-block shadow-lg mx-auto mb-6">
              {activeQRTransaction.qrString ? (
                <img 
                  src={`https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(activeQRTransaction.qrString)}&size=220x220`} 
                  alt="QRIS Code" 
                  className="w-56 h-56 object-contain" 
                />
              ) : activeQRTransaction.qrisUrl ? (
                <img 
                  src={activeQRTransaction.qrisUrl} 
                  alt="QRIS Code" 
                  className="w-56 h-56 object-contain" 
                />
              ) : (
                <div className="w-56 h-56 bg-slate-100 flex items-center justify-center text-slate-500 font-bold">QRIS Gagal Di-load</div>
              )}
            </div>

            {/* Price Detail */}
            <div className="bg-slate-800/30 border border-slate-800 rounded-2xl py-3 px-6 mb-6">
              <span className="text-xs text-slate-500 font-medium font-bold block">TOTAL PEMBAYARAN</span>
              <p className="text-2xl font-black text-purple-400 mt-1">Rp {Number(activeQRTransaction.total).toLocaleString()}</p>
            </div>

            {/* Status & Timer */}
            <div className="space-y-4">
              <div className="flex items-center justify-center gap-3">
                {paymentStatus === 'Pending' ? (
                  <>
                    <div className="w-3 h-3 bg-yellow-500 rounded-full animate-ping" />
                    <span className="text-sm font-semibold text-yellow-500">Menunggu Pembayaran...</span>
                  </>
                ) : paymentStatus === 'Selesai' ? (
                  <>
                    <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
                    <span className="text-sm font-semibold text-emerald-500">Pembayaran Sukses!</span>
                  </>
                ) : (
                  <>
                    <div className="w-3 h-3 bg-red-500 rounded-full" />
                    <span className="text-sm font-semibold text-red-500">Pembayaran Gagal/Kedaluwarsa</span>
                  </>
                )}
              </div>

              {paymentStatus === 'Pending' && (
                <div className="text-xs text-slate-500">
                  Kedaluwarsa dalam: <span className="font-mono text-white bg-slate-800 px-2 py-1 rounded-md ml-1">{Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</span>
                </div>
              )}
            </div>

            {/* Action Buttons */}
            <div className="mt-8 space-y-3">
              {paymentStatus === 'Pending' && (
                <button 
                  onClick={handleSimulateQRISSuccess}
                  className="w-full py-4 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-purple-600/20 active:scale-[0.98] transition-all"
                >
                  Simulasi Pembayaran Berhasil
                </button>
              )}
              
              <button 
                onClick={() => {
                  setShowQRModal(false);
                  setActiveQRTransaction(null);
                }} 
                className="w-full py-3 bg-slate-800 hover:bg-slate-700/80 rounded-xl text-sm font-bold transition text-slate-400 hover:text-white"
              >
                Batal / Kembali
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL INVOICE */}
      {showInvoiceModal && activeQRTransaction && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md print:bg-white print:p-0 print:static print:inset-auto">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200 relative overflow-hidden print:border-none print:shadow-none print:bg-white print:text-black print:max-w-none print:p-0 print:rounded-none">
            
            {/* Area Print Invoice */}
            <div id="invoice-print" className="print:p-6 print:text-black print:bg-white text-slate-200">
              {/* Header Invoice */}
              <div className="text-center mb-6 pb-4 border-b border-dashed border-slate-800 print:border-slate-300">
                <h2 className="text-2xl font-extrabold tracking-wider text-white print:text-black mb-1">WARUNG<span className="text-purple-500 print:text-purple-600">POS</span></h2>
                <p className="text-xs text-slate-400 print:text-slate-500">Premium Digital POS System</p>
                
                <div className="w-12 h-12 bg-emerald-500/10 border border-emerald-500/20 rounded-full flex items-center justify-center text-emerald-400 mx-auto my-3 print:hidden">
                  <CheckCircle2 size={24} />
                </div>
                
                <div className="mt-2 text-xs font-bold bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full inline-block print:border print:border-emerald-500 print:text-emerald-700">
                  STATUS: Pembayaran Sukses
                </div>
              </div>

              {/* Meta Info */}
              <div className="space-y-1 text-xs text-slate-400 print:text-slate-700 mb-4">
                <div className="flex justify-between">
                  <span>No. Invoice:</span>
                  <span className="font-mono text-white print:text-black font-semibold">{activeQRTransaction.invoice}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal:</span>
                  <span className="text-white print:text-black">
                    {activeQRTransaction.created_at ? new Date(activeQRTransaction.created_at).toLocaleString('id-ID') : new Date().toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="text-white print:text-black font-semibold">{activeQRTransaction.method || 'Cash'}</span>
                </div>
              </div>

              {/* Receipt Content */}
              <div className="border-t border-b border-dashed border-slate-800 print:border-slate-300 py-4 space-y-3">
                <span className="text-[10px] font-bold text-slate-500 print:text-slate-700 uppercase tracking-widest block">Daftar Item</span>
                {activeQRTransaction.items?.map((item, idx) => (
                  <div key={idx} className="flex justify-between text-sm">
                    <span className="text-slate-400 print:text-black font-medium">
                      {item.name} <span className="text-xs text-slate-500 print:text-slate-600">x{item.qty}</span>
                    </span>
                    <span className="font-semibold text-slate-200 print:text-black">
                      Rp {(item.price * item.qty).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Payment Summary */}
              <div className="pt-4 space-y-2 text-xs text-slate-400 print:text-slate-700">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-medium text-slate-300 print:text-black">
                    Rp {(activeQRTransaction.total - activeQRTransaction.fee_pos).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Biaya Layanan (POS)</span>
                  <span className="font-medium text-slate-300 print:text-black">
                    Rp {Number(activeQRTransaction.fee_pos).toLocaleString('id-ID')}
                  </span>
                </div>
                <div className="flex justify-between pt-2 border-t border-slate-800/50 print:border-slate-300 text-sm">
                  <span className="font-bold text-slate-200 print:text-black">Total Pembayaran</span>
                  <span className="font-extrabold text-purple-400 print:text-purple-600 text-base">
                    Rp {Number(activeQRTransaction.total).toLocaleString('id-ID')}
                  </span>
                </div>

                {activeQRTransaction.method === 'Cash' && activeQRTransaction.cash_paid !== undefined && (
                  <div className="pt-2 border-t border-dashed border-slate-800/50 print:border-slate-300 space-y-1">
                    <div className="flex justify-between text-slate-350 print:text-black text-xs">
                      <span>Uang Dibayar</span>
                      <span className="font-semibold text-slate-200 print:text-black">Rp {Number(activeQRTransaction.cash_paid).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between text-slate-350 print:text-black text-xs">
                      <span>Kembalian</span>
                      <span className="font-bold text-emerald-400 print:text-emerald-700">Rp {Number(activeQRTransaction.change_due).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                )}
              </div>
              
              <div className="text-center mt-6 pt-4 border-t border-dashed border-slate-800 print:border-slate-300 text-[10px] text-slate-500 print:text-slate-600">
                <p className="font-bold">Terima kasih atas kunjungan Anda!</p>
                <p className="mt-1">Powered by WarungPOS</p>
              </div>
            </div>

            {/* Action Buttons (DI LUAR area invoice-print) */}
            <div className="mt-8 space-y-3 print:hidden">
              <button 
                onClick={() => window.print()} 
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-4 rounded-2xl font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Cetak Invoice
              </button>

              <button 
                onClick={() => {
                  setShowInvoiceModal(false);
                  setActiveQRTransaction(null);
                }} 
                className="w-full bg-purple-600 hover:bg-purple-700 py-4 rounded-2xl font-bold transition shadow-lg active:scale-95"
              >
                Selesai
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL EDIT PROFILE */}
      {showEditProfileModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Edit Profile</h3>
              <button onClick={() => setShowEditProfileModal(false)} className="text-slate-500 hover:text-white transition"><X size={24} /></button>
            </div>
            
            <form onSubmit={handleSaveProfile} className="space-y-6">
              {/* Photo Upload Area */}
              <div className="flex flex-col items-center gap-4">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full overflow-hidden bg-slate-800 border-2 border-slate-700 group-hover:border-purple-500 transition-colors">
                    {editProfileForm.imagePreview ? (
                      <img src={editProfileForm.imagePreview} alt="Preview" className="w-full h-full object-cover" />
                    ) : (
                      <UserCircle size={48} className="text-slate-400 w-full h-full p-4" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-8 h-8 bg-purple-600 rounded-full flex items-center justify-center cursor-pointer hover:bg-purple-700 transition shadow-lg border border-purple-400/20">
                    <Camera size={14} className="text-white" />
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        setEditProfileForm(prev => ({
                          ...prev,
                          imageFile: file,
                          imagePreview: URL.createObjectURL(file)
                        }));
                      }
                    }} />
                  </label>
                </div>
                <p className="text-xs text-slate-500">Upload avatar baru (Opsional)</p>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nama Lengkap</label>
                  <input type="text" value={editProfileForm.name} onChange={(e) => setEditProfileForm({...editProfileForm, name: e.target.value})} className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition" placeholder="Nama (opsional, biarkan kosong untuk tidak mengubah)" />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email Akun</label>
                  <input type="email" value={profileData.email} readOnly className="w-full bg-slate-800/60 border border-slate-700 rounded-xl px-4 py-3 text-slate-400 cursor-not-allowed" />
                  <p className="text-[10px] text-slate-600 mt-1">Email tidak dapat diubah melalui halaman ini.</p>
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]">
                {loading ? 'Menyimpan...' : 'Simpan Perubahan'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL LOGOUT CONFIRMATION */}
      {showLogoutConfirmModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-sm rounded-[2rem] p-8 shadow-2xl animate-in zoom-in duration-200 text-center">
            <div className="w-16 h-16 bg-red-500/10 border border-red-500/20 rounded-full flex items-center justify-center text-red-400 mx-auto mb-4">
              <LogOut size={32} />
            </div>
            <h3 className="text-xl font-bold mb-2">Yakin ingin keluar?</h3>
            <p className="text-sm text-slate-400 mb-8">Anda harus login kembali untuk masuk ke dashboard POS.</p>
            <div className="flex gap-3">
              <button onClick={() => setShowLogoutConfirmModal(false)} className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-bold transition">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-500 hover:bg-red-600 text-white rounded-xl font-bold transition shadow-lg shadow-red-500/20">Ya, Keluar</button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN AKUN */}
      {showAccountSettingsModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center"><Settings size={20} className="text-blue-400" /></div>
                <h3 className="text-xl font-bold">Pengaturan Akun</h3>
              </div>
              <button onClick={() => setShowAccountSettingsModal(false)} className="text-slate-500 hover:text-white transition"><X size={24} /></button>
            </div>

            <div className="space-y-5">
              {/* Notifikasi */}
              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60">
                <div>
                  <p className="font-semibold text-sm">Notifikasi</p>
                  <p className="text-xs text-slate-500 mt-0.5">Tampilkan notifikasi sistem</p>
                </div>
                <button onClick={() => saveAccountSettings({...accountSettings, notifications: !accountSettings.notifications})}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${accountSettings.notifications ? 'bg-purple-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${accountSettings.notifications ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Suara Kasir */}
              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60">
                <div>
                  <p className="font-semibold text-sm">Suara Kasir</p>
                  <p className="text-xs text-slate-500 mt-0.5">Bunyi saat transaksi berhasil</p>
                </div>
                <button onClick={() => saveAccountSettings({...accountSettings, kasirSound: !accountSettings.kasirSound})}
                  className={`w-12 h-6 rounded-full relative transition-colors duration-300 ${accountSettings.kasirSound ? 'bg-purple-600' : 'bg-slate-700'}`}>
                  <div className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow transition-all duration-300 ${accountSettings.kasirSound ? 'left-7' : 'left-1'}`}></div>
                </button>
              </div>

              {/* Bahasa */}
              <div className="flex items-center justify-between p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60">
                <div>
                  <p className="font-semibold text-sm">Bahasa</p>
                  <p className="text-xs text-slate-500 mt-0.5">Pilih bahasa antarmuka</p>
                </div>
                <select value={accountSettings.language} onChange={(e) => saveAccountSettings({...accountSettings, language: e.target.value})}
                  className="bg-slate-800 border border-slate-700 text-white text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-purple-500">
                  <option value="id">🇮🇩 Bahasa Indonesia</option>
                  <option value="en">🇺🇸 English</option>
                </select>
              </div>

              {/* Informasi Akun */}
              <div className="p-4 bg-slate-900/60 rounded-2xl border border-slate-800/60 space-y-2">
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-3">Informasi Akun</p>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Nama</span><span className="font-semibold">{profileData.name}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Email</span><span className="font-semibold">{profileData.email}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Role</span><span className="text-purple-400 font-bold">{profileData.role}</span></div>
                <div className="flex justify-between text-sm"><span className="text-slate-400">Paket</span><span className="text-emerald-400 font-bold">{plan}</span></div>
              </div>
            </div>

            <button onClick={() => setShowAccountSettingsModal(false)} className="w-full mt-6 bg-purple-600 hover:bg-purple-700 text-white font-bold py-4 rounded-xl transition-all active:scale-[0.98]">
              Simpan & Tutup
            </button>
          </div>
        </div>
      )}

      {/* MODAL GANTI PASSWORD */}
      {showChangePasswordModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-emerald-500/10 rounded-2xl flex items-center justify-center"><ShieldCheck size={20} className="text-emerald-400" /></div>
                <h3 className="text-xl font-bold">Ganti Password</h3>
              </div>
              <button onClick={() => setShowChangePasswordModal(false)} className="text-slate-500 hover:text-white transition"><X size={24} /></button>
            </div>

            <form onSubmit={handleChangePassword} className="space-y-4">
              {[
                { label: 'Password Lama', key: 'oldPassword', placeholder: 'Masukkan password lama' },
                { label: 'Password Baru', key: 'newPassword', placeholder: 'Min. 6 karakter' },
                { label: 'Konfirmasi Password Baru', key: 'confirmPassword', placeholder: 'Ulangi password baru' },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">{label}</label>
                  <input type="password" value={passwordForm[key]} onChange={(e) => setPasswordForm({...passwordForm, [key]: e.target.value})}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition"
                    placeholder={placeholder} required />
                </div>
              ))}

              {passwordMsg.text && (
                <div className={`px-4 py-3 rounded-xl text-sm font-medium flex items-center gap-2 ${passwordMsg.type === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-red-500/10 text-red-400 border border-red-500/20'}`}>
                  {passwordMsg.type === 'success' ? '✅' : '⚠️'} {passwordMsg.text}
                </div>
              )}

              <button type="submit" disabled={loading} className="w-full mt-2 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-emerald-600/20 transition-all active:scale-[0.98]">
                {loading ? 'Memproses...' : 'Ubah Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST NOTIFICATION */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 px-5 py-4 rounded-2xl shadow-2xl text-sm font-bold animate-in slide-in-from-bottom-4 duration-300 ${toast.type === 'success' ? 'bg-emerald-600 text-white shadow-emerald-600/30' : 'bg-red-600 text-white shadow-red-600/30'}`}>
          {toast.type === 'success' ? '✅' : '⚠️'} {toast.text}
        </div>
      )}

      {/* MOBILE SIDEBAR DRAWER */}
      {showMobileSidebar && (
        <div className="fixed inset-0 z-[70] md:hidden flex">
          {/* Backdrop */}
          <div onClick={() => setShowMobileSidebar(false)} className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300" />
          
          {/* Sidebar Drawer */}
          <aside className="relative flex flex-col w-64 h-full bg-[#0f1423] border-r border-slate-800 z-10 animate-in slide-in-from-left duration-200">
            <div className="h-20 flex items-center justify-between px-6 border-b border-slate-800">
              <div className="flex items-center">
                <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-8 h-8 rounded-lg flex items-center justify-center mr-3 shadow-lg">
                  <ShoppingCart size={16} className="text-white" strokeWidth={3} />
                </div>
                <span className="text-xl font-bold tracking-tight">WARUNG<span className="text-purple-400">POS</span></span>
              </div>
              <button onClick={() => setShowMobileSidebar(false)} className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800/50 transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="px-6 py-4 mx-4 my-4 bg-purple-500/5 border border-purple-500/20 rounded-2xl">
              <p className="text-[10px] uppercase tracking-wider text-slate-500 font-bold mb-1">Paket Aktif</p>
              <div className="flex items-center gap-2 text-purple-400">
                <CheckCircle2 size={14} />
                <p className="font-bold text-sm">{plan}</p>
              </div>
            </div>
            
            <nav className="flex-1 px-4 py-2 space-y-1 overflow-y-auto custom-scrollbar">
              {menuItems.map((item) => (
                <button 
                  key={item.id} 
                  onClick={() => {
                    setActiveTab(item.id);
                    setShowMobileSidebar(false);
                  }} 
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all ${activeTab === item.id ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white hover:bg-slate-800/50'}`}
                >
                  {item.icon} <span className="font-medium text-sm">{item.label}</span>
                </button>
              ))}
            </nav>
            
            <div className="p-4 border-t border-slate-800">
              <button 
                onClick={() => {
                  setShowMobileSidebar(false);
                  onBack();
                }} 
                className="flex items-center gap-3 px-4 py-3 w-full text-slate-400 hover:text-red-400 hover:bg-red-400/10 rounded-xl transition-colors"
              >
                <LogOut size={20} /> <span className="font-medium text-sm">Keluar</span>
              </button>
            </div>
          </aside>
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        /* Light mode structural overrides */
        .bg-slate-100 aside, .bg-slate-100 .bg-\\[\\#0f1423\\] { background: #ffffff !important; }
        .bg-slate-100 .border-slate-800 { border-color: #e2e8f0 !important; }
        .bg-slate-100 .bg-slate-800\\/50 { background: rgba(226,232,240,0.6) !important; }
        .bg-slate-100 .bg-slate-900 { background: #f8fafc !important; }
        @keyframes slide-in-from-bottom-4 { from { transform: translateY(1rem); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
        @keyframes slideInLeft { from { transform: translateX(-100%); } to { transform: translateX(0); } }
        .animate-in.slide-in-from-left { animation: slideInLeft 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
      `}</style>
    </div>
  );
};

export default Dashboard;