import { useState, useEffect } from 'react';
import { apiFetch as fetch } from '../utils/api';
import { getMenuItems, canAccess, getDefaultTab, ROLES } from '../rbac/permissions';
import Unauthorized from './Unauthorized';
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
  Clock,
  ArrowRight,
  Pencil,
  X,
  Zap,
  ShieldCheck,
  ChevronRight,
  Printer,
  Settings,
  Moon,
  Camera,
  UserCircle,
  Menu
} from 'lucide-react';
import { kmpSearch } from '../utils/stringMatcher';
import { getGreedyChange } from '../utils/greedyChange';
import { binarySearchById } from '../utils/binarySearch';

const pricingPlans = [
  {
    name: 'Basic',
    price: 'Gratis',
    numericPrice: 0,
    desc: 'Sempurna untuk memulai usaha kecil',
    color: 'from-slate-500 to-slate-600',
    icon: '🛒',
    features: [
      { text: 'Hingga 30 produk', included: true },
      { text: '1 akun pengguna', included: true },
      { text: 'Transaksi POS dasar', included: true },
      { text: 'Laporan harian', included: true },
      { text: 'Cetak struk (thermal)', included: true },
      { text: 'Pembayaran Cash', included: true },
      { text: 'Pembayaran QRIS', included: false },
      { text: 'Laporan pajak & keuangan', included: false },
      { text: 'Multi cabang', included: false },
      { text: 'Export laporan (Excel/PDF)', included: false },
      { text: 'Support prioritas 24/7', included: false },
      { text: 'Custom branding struk', included: false },
    ]
  },
  {
    name: 'Pro',
    price: 'Rp150.000',
    numericPrice: 150000,
    period: '/bulan',
    desc: 'Solusi terbaik untuk UMKM berkembang',
    color: 'from-purple-500 to-purple-700',
    icon: '⚡',
    popular: true,
    features: [
      { text: 'Produk tak terbatas', included: true },
      { text: 'Hingga 5 akun pengguna', included: true },
      { text: 'Transaksi POS lengkap', included: true },
      { text: 'Laporan harian & mingguan', included: true },
      { text: 'Cetak struk (thermal)', included: true },
      { text: 'Pembayaran Cash', included: true },
      { text: 'Pembayaran QRIS (Midtrans)', included: true },
      { text: 'Laporan pajak & keuangan', included: true },
      { text: 'Multi cabang', included: false },
      { text: 'Export laporan (Excel/PDF)', included: true },
      { text: 'Support prioritas 24/7', included: true },
      { text: 'Custom branding struk', included: false },
    ]
  },
  {
    name: 'Enterprise',
    price: 'Rp500.000',
    numericPrice: 500000,
    period: '/bulan',
    desc: 'Untuk bisnis besar & multi-cabang',
    color: 'from-amber-500 to-orange-600',
    icon: '👑',
    features: [
      { text: 'Produk tak terbatas', included: true },
      { text: 'Unlimited akun pengguna', included: true },
      { text: 'Transaksi POS lengkap', included: true },
      { text: 'Laporan real-time & analitik', included: true },
      { text: 'Cetak struk (thermal)', included: true },
      { text: 'Pembayaran Cash', included: true },
      { text: 'Pembayaran QRIS (Midtrans)', included: true },
      { text: 'Laporan pajak & keuangan', included: true },
      { text: 'Multi cabang (unlimited)', included: true },
      { text: 'Export laporan (Excel/PDF)', included: true },
      { text: 'Support prioritas 24/7', included: true },
      { text: 'Custom branding struk', included: true },
    ]
  },
];

const faqList = [
  { q: 'Apakah bisa upgrade atau downgrade paket kapan saja?', a: 'Ya, kamu bisa upgrade atau downgrade paket kapan saja. Perubahan akan langsung berlaku setelah pembayaran dikonfirmasi.' },
  { q: 'Apakah data saya aman saat upgrade?', a: 'Tentu! Semua data produk, transaksi, dan laporan kamu tetap aman saat melakukan perubahan paket.' },
  { q: 'Metode pembayaran apa saja yang tersedia?', a: 'Kami menerima pembayaran melalui ShopeePay, GoPay, DANA, OVO, BCA Virtual Account, Mandiri Virtual Account, dan Kartu Kredit.' },
  { q: 'Apakah ada garansi uang kembali?', a: 'Kami menyediakan garansi uang kembali dalam 7 hari pertama jika kamu tidak puas dengan layanan kami.' },
  { q: 'Berapa batas produk di paket Basic?', a: 'Paket Basic memungkinkan kamu mengelola hingga 30 produk. Upgrade ke Pro untuk produk tak terbatas.' },
];

const generateInvoiceNumber = () => `INV-SUB-${Math.floor(100000 + Math.random() * 900000)}`;
const getFormattedDate = () => new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });

const CashierDashboard = ({ onBack }) => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showMobileSidebar, setShowMobileSidebar] = useState(false);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState(() => (localStorage.getItem('selectedPlan') || 'Basic (Gratis)').toLowerCase().includes('basic') ? 'Cash' : 'SmartBank (QRIS)');
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

  const filteredProducts = products.filter(p => kmpSearch(p.name.toLowerCase(), searchQuery.toLowerCase()));

  const handleOpenModal = (product = null) => {
    if (!product && plan.toLowerCase().includes('basic') && products.length >= 30) {
      setUpgradeModalReason('Batas produk untuk paket Basic adalah 30 produk. Upgrade ke Pro untuk produk tak terbatas!');
      setShowUpgradeModal(true);
      return;
    }
    if (product) {
      // Gunakan Binary Search (Decrease & Conquer) untuk mencari data produk lokal
      const foundProduct = binarySearchById(products, product.id);
      setCurrentProduct(foundProduct || product);
    } else {
      setCurrentProduct(null);
    }
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

  // Plan-specific States (Branches, Staff, Receipt Branding, Locks)
  const [activeBranch, setActiveBranch] = useState(() => localStorage.getItem('activeBranch') || 'Cabang Utama');
  const [branches, setBranches] = useState(() => {
    try { return JSON.parse(localStorage.getItem('branches') || '["Cabang Utama"]'); }
    catch { return ["Cabang Utama"]; }
  });
  const [staff, setStaff] = useState([]);
  const [showAddStaffModal, setShowAddStaffModal] = useState(false);
  const [staffForm, setStaffForm] = useState({ name: '', email: '', password: '', role: 'Kasir' });
  const [showBranchSettings, setShowBranchSettings] = useState(false);
  const [newBranchName, setNewBranchName] = useState('');
  const [receiptSettings, setReceiptSettings] = useState(() => {
    try { return JSON.parse(localStorage.getItem('receiptSettings') || '{"title":"WARUNGPOS","headerNote":"Premium Digital POS System","footerNote":"Terima kasih atas kunjungan Anda! Powered by WarungPOS"}'); }
    catch { return { title: "WARUNGPOS", headerNote: "Premium Digital POS System", footerNote: "Terima kasih atas kunjungan Anda! Powered by WarungPOS" }; }
  });
  const [showReceiptBrandingModal, setShowReceiptBrandingModal] = useState(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeModalReason, setUpgradeModalReason] = useState('');

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

  const playCashSound = () => {
    if (!accountSettings.kasirSound) return;
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      
      // Coin 1 clink
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(800, audioCtx.currentTime);
      osc1.frequency.exponentialRampToValueAtTime(1600, audioCtx.currentTime + 0.12);
      gain1.gain.setValueAtTime(0.25, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.12);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start();
      osc1.stop(audioCtx.currentTime + 0.12);
      
      // Coin 2 clink
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(1200, audioCtx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(2200, audioCtx.currentTime + 0.15);
        gain2.gain.setValueAtTime(0.2, audioCtx.currentTime);
        gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.15);
      }, 70);
      
      // Drawer bell
      setTimeout(() => {
        const osc3 = audioCtx.createOscillator();
        const gain3 = audioCtx.createGain();
        osc3.type = 'sine';
        osc3.frequency.setValueAtTime(987.77, audioCtx.currentTime); // B5 note
        gain3.gain.setValueAtTime(0.15, audioCtx.currentTime);
        gain3.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc3.connect(gain3);
        gain3.connect(audioCtx.destination);
        osc3.start();
        osc3.stop(audioCtx.currentTime + 0.4);
      }, 140);
    } catch (err) {
      console.warn('Web Audio API is not supported or blocked:', err);
    }
  };

  // Fetch Latest Profile Data
  useEffect(() => {
    const cachedUser = JSON.parse(localStorage.getItem('user') || '{}');
    if (cachedUser && cachedUser.id) {
      fetch(`http://localhost:3000/api/auth/profile/${cachedUser.id}`)
        .then(res => res.json())
        .then(data => {
            if (!data.message) {
               setProfileData(data);
               const updatedUser = { ...cachedUser, ...data };
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
          setTimeout(() => {
            setSelectedPlanData(matchedPlan);
            setCheckoutStep('main');
            setShowCheckoutModal(true);
          }, 0);
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
      const isEnterprise = plan.toLowerCase().includes('enterprise');
      const branchParam = isEnterprise ? `?branch=${encodeURIComponent(activeBranch)}` : '';
      const res = await fetch(`http://localhost:3000/api/products${branchParam}`);
      const data = await res.json();
      // Urutkan berdasarkan id untuk mendukung Binary Search (Decrease & Conquer)
      const sortedData = Array.isArray(data) ? data.sort((a, b) => a.id - b.id) : [];
      setProducts(sortedData);
    } catch (err) { 
      console.error(err); 
      setProducts([]);
    }
  };

  const fetchStaff = async () => {
    if (!user || !user.id) return;
    if (plan.toLowerCase().includes('basic')) return;
    try {
      const adminId = user.admin_id || user.id;
      const res = await fetch(`http://localhost:3000/api/auth/staff?admin_id=${adminId}`);
      if (res.ok) {
        const data = await res.json();
        setStaff(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Gagal mengambil data staf:', err);
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
    const timer = setTimeout(() => {
      fetchProducts();
      fetchTransactions();
      if (activeTab === 'staf') {
        fetchStaff();
      }
    }, 0);
    return () => clearTimeout(timer);
  }, [activeTab, activeBranch]);

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
    const invoiceNum = generateInvoiceNumber();
    const dateStr = getFormattedDate();
    
    try {
      if (user && user.id) {
        const res = await fetch(`http://localhost:3000/api/auth/update-plan/${user.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ plan: `${name} (${price})` })
        });
        
        if (res.ok) {
          await res.json();
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
      
      const isEnterprise = plan.toLowerCase().includes('enterprise');
      data.append('branch', isEnterprise ? activeBranch : 'Cabang Utama');

      const headers = {};
      if (user && user.id) {
        headers['x-user-id'] = String(user.id);
      }

      const res = await fetch(url, {
        method: currentProduct ? 'PUT' : 'POST',
        headers: headers,
        body: data
      });
      
      if (res.ok) { 
        fetchProducts(); 
        handleCloseModal(); 
        showToast('success', `Produk berhasil ${currentProduct ? 'diperbarui' : 'ditambahkan'}`);
      } else {
        const errData = await res.json();
        showToast('error', errData.message || 'Gagal menyimpan produk');
      }
    } catch (err) { 
      console.error(err);
      showToast('error', 'Kesalahan koneksi ke server');
    }
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

  // --- LOGIK MANAJEMEN STAF ---
  const handleSaveStaff = async (e) => {
    e.preventDefault();
    if (!staffForm.name || !staffForm.email || !staffForm.password) {
      showToast('error', 'Semua kolom wajib diisi!');
      return;
    }
    const adminId = user.id;
    try {
      const res = await fetch('http://localhost:3000/api/auth/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...staffForm, admin_id: adminId })
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Staf berhasil ditambahkan!');
        setStaffForm({ name: '', email: '', password: '', role: 'Kasir' });
        setShowAddStaffModal(false);
        fetchStaff();
      } else {
        showToast('error', data.message || 'Gagal menambahkan staf');
      }
    } catch (err) {
      showToast('error', 'Kesalahan koneksi ke server');
    }
  };

  const handleDeleteStaff = async (staffId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus staf ini?')) return;
    const adminId = user.id;
    try {
      const res = await fetch(`http://localhost:3000/api/auth/staff/${staffId}?admin_id=${adminId}`, {
        method: 'DELETE'
      });
      const data = await res.json();
      if (res.ok) {
        showToast('success', 'Staf berhasil dihapus!');
        fetchStaff();
      } else {
        showToast('error', data.message || 'Gagal menghapus staf');
      }
    } catch (err) {
      showToast('error', 'Kesalahan koneksi ke server');
    }
  };

  // --- LOGIK POS ---
  const addToCart = (product) => {
    // Gunakan Binary Search (Decrease & Conquer) untuk memvalidasi produk di list lokal yang sudah terurut
    const validatedProduct = binarySearchById(products, product.id);
    if (!validatedProduct) return;

    const existing = cart.find(item => item.id === validatedProduct.id);
    if (existing) { setCart(cart.map(i => i.id === validatedProduct.id ? {...i, qty: i.qty + 1} : i)); }
    else { setCart([...cart, { ...validatedProduct, qty: 1 }]); }
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
        playCashSound();
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
    const isEnterprise = plan.toLowerCase().includes('enterprise');
    const payload = { 
      items: cart, 
      payment_method: paymentMethod, 
      user_id: user.id,
      branch: isEnterprise ? activeBranch : 'Cabang Utama'
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
          playCashSound();
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

  const handlePrintReceipt = () => {
    if (!activeQRTransaction) return;
    const tx = activeQRTransaction;
    const subtotal = tx.total - (tx.fee_pos || 0);
    const dateStr = tx.created_at 
      ? new Date(tx.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
      : new Date().toLocaleString('id-ID');

    const itemsHtml = (tx.items || []).map(item => `
      <tr>
        <td style="padding:3px 0;font-size:11px;">${item.name}</td>
        <td style="text-align:center;font-size:11px;">x${item.qty}</td>
        <td style="text-align:right;font-size:11px;">Rp ${(item.price * item.qty).toLocaleString('id-ID')}</td>
      </tr>
    `).join('');

    const cashSection = (tx.method === 'Cash' && tx.cash_paid !== undefined) ? `
      <tr><td colspan="3" style="border-top:1px dashed #ccc;padding-top:6px;"></td></tr>
      <tr>
        <td colspan="2" style="font-size:11px;">Uang Dibayar</td>
        <td style="text-align:right;font-size:11px;">Rp ${Number(tx.cash_paid).toLocaleString('id-ID')}</td>
      </tr>
      <tr>
        <td colspan="2" style="font-size:11px;font-weight:bold;">Kembalian</td>
        <td style="text-align:right;font-size:11px;font-weight:bold;">Rp ${Number(tx.change_due).toLocaleString('id-ID')}</td>
      </tr>
    ` : '';

    const feeLine = (tx.fee_pos > 0) ? `
      <tr>
        <td colspan="2" style="font-size:11px;">Biaya Layanan (1%)</td>
        <td style="text-align:right;font-size:11px;">Rp ${Number(tx.fee_pos).toLocaleString('id-ID')}</td>
      </tr>
    ` : '';

    const brandTitle = receiptSettings?.title || 'WARUNGPOS';
    const brandHeader = receiptSettings?.headerNote || 'Premium Digital POS System';
    const brandFooter = receiptSettings?.footerNote || 'Terima kasih atas kunjungan Anda! Powered by WarungPOS';

    const receiptHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body {
            font-family: 'Courier New', Courier, monospace;
            font-size: 12px;
            color: #000;
            background: #fff;
            width: 80mm;
            padding: 12px 14px;
          }
          .center { text-align: center; }
          .separator { border-top: 1px dashed #000; margin: 8px 0; }
          .brand { font-size: 20px; font-weight: 900; letter-spacing: 2px; margin-bottom: 2px; }
          .brand span { color: #6d28d9; }
          .tagline { font-size: 10px; color: #555; margin-bottom: 6px; }
          .status-badge {
            display: inline-block;
            border: 1px solid #059669;
            color: #059669;
            font-size: 9px;
            font-weight: bold;
            padding: 2px 8px;
            border-radius: 20px;
            margin-bottom: 4px;
            letter-spacing: 1px;
          }
          table { width: 100%; border-collapse: collapse; }
          td { vertical-align: top; }
          .meta-label { color: #555; font-size: 10px; }
          .meta-val { font-size: 10px; font-weight: bold; text-align: right; }
          .total-label { font-size: 13px; font-weight: 900; }
          .total-val { font-size: 13px; font-weight: 900; text-align: right; color: #6d28d9; }
          .footer { font-size: 10px; color: #555; text-align: center; margin-top: 6px; }
          @page { size: 80mm auto; margin: 0; }
        </style>
      </head>
      <body>
        <div class="center">
          <div class="brand">${brandTitle}</div>
          <div class="tagline">${brandHeader}</div>
          <div class="status-badge">&#10003; PEMBAYARAN SUKSES</div>
        </div>
        <div class="separator"></div>

        <table>
          <tr>
            <td class="meta-label">No. Invoice</td>
            <td class="meta-val">${tx.invoice}</td>
          </tr>
          <tr>
            <td class="meta-label">Tanggal</td>
            <td class="meta-val">${dateStr}</td>
          </tr>
          <tr>
            <td class="meta-label">Metode</td>
            <td class="meta-val">${tx.method || 'Cash'}</td>
          </tr>
        </table>

        <div class="separator"></div>
        <div style="font-size:9px;font-weight:bold;letter-spacing:1px;color:#777;margin-bottom:4px;">DAFTAR ITEM</div>

        <table>
          ${itemsHtml}
        </table>

        <div class="separator"></div>

        <table>
          <tr>
            <td colspan="2" class="meta-label">Subtotal</td>
            <td style="text-align:right;font-size:11px;">Rp ${subtotal.toLocaleString('id-ID')}</td>
          </tr>
          ${feeLine}
          <tr><td colspan="3" style="height:4px;"></td></tr>
          <tr>
            <td colspan="2" class="total-label">TOTAL</td>
            <td class="total-val">Rp ${Number(tx.total).toLocaleString('id-ID')}</td>
          </tr>
          ${cashSection}
        </table>

        <div class="separator"></div>
        <div class="footer">
          <p style="font-weight:bold;">${brandFooter}</p>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(receiptHtml);
    iframe.contentDocument.close();
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1000);
    };
  };

  const handleExportCSV = () => {
    if (plan.toLowerCase().includes('basic')) {
      setUpgradeModalReason('Ekspor laporan (CSV/Excel) hanya tersedia di paket Pro & Enterprise.');
      setShowUpgradeModal(true);
      return;
    }
    const headers = ['ID', 'Invoice', 'Tanggal', 'Metode Pembayaran', 'Total', 'Fee POS', 'Status'];
    const rows = transactions.map(t => [
      t.id,
      t.invoice,
      new Date(t.created_at).toLocaleString(),
      t.method,
      t.total,
      t.fee_pos,
      t.status
    ]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `laporan_transaksi_${Date.now()}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', 'Laporan berhasil diekspor ke CSV!');
  };

  const handlePrintPDFReport = () => {
    if (plan.toLowerCase().includes('basic')) {
      setUpgradeModalReason('Ekspor laporan (PDF) hanya tersedia di paket Pro & Enterprise.');
      setShowUpgradeModal(true);
      return;
    }

    const totalPendapatan = transactions.reduce((s, t) => s + Number(t.total), 0);
    const totalMingguan = Math.round(totalPendapatan * 5.4);
    const estimasiPajak = Math.round(totalPendapatan * 0.11);
    const penjualanBersih = Math.round(totalPendapatan / 1.11);
    const printDate = new Date().toLocaleString('id-ID', { day: '2-digit', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' });

    const chartBars = [40, 65, 30, 85, 50, 95, 75];
    const maxBar = Math.max(...chartBars);
    const chartHeight = 80;
    const barWidth = 28;
    const gap = 8;
    const svgWidth = chartBars.length * (barWidth + gap);
    const barsHtml = chartBars.map((val, i) => {
      const h = Math.round((val / maxBar) * chartHeight);
      const x = i * (barWidth + gap);
      const y = chartHeight - h;
      const days = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];
      return `
        <rect x="${x}" y="${y}" width="${barWidth}" height="${h}" rx="4" fill="#7c3aed" />
        <text x="${x + barWidth / 2}" y="${chartHeight + 14}" text-anchor="middle" font-size="9" fill="#666">${days[i]}</text>
      `;
    }).join('');
    const chartSvg = `<svg width="${svgWidth}" height="${chartHeight + 20}" xmlns="http://www.w3.org/2000/svg">${barsHtml}</svg>`;

    const reportHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Segoe UI', Arial, sans-serif; font-size: 12px; color: #1e293b; background: #fff; padding: 24px 28px; max-width: 794px; margin: 0 auto; }
          .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #7c3aed; padding-bottom: 14px; }
          .brand { font-size: 22px; font-weight: 900; letter-spacing: 2px; color: #7c3aed; }
          .subtitle { font-size: 11px; color: #64748b; margin-top: 4px; }
          .print-date { font-size: 10px; color: #94a3b8; margin-top: 2px; }
          .section-title { font-size: 13px; font-weight: 700; color: #7c3aed; margin: 18px 0 10px 0; padding-bottom: 4px; border-bottom: 1px solid #e2e8f0; }
          .stat-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; margin-bottom: 10px; }
          .stat-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 14px; }
          .stat-label { font-size: 10px; color: #64748b; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
          .stat-value { font-size: 16px; font-weight: 800; color: #1e293b; margin-top: 4px; }
          .stat-value.purple { color: #7c3aed; }
          .stat-value.green { color: #059669; }
          .stat-value.red { color: #dc2626; }
          .tax-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .tax-table th { background: #f1f5f9; font-size: 10px; font-weight: 700; text-transform: uppercase; padding: 8px 10px; text-align: left; color: #475569; }
          .tax-table td { padding: 8px 10px; border-bottom: 1px solid #f1f5f9; font-size: 11px; }
          .tax-table tr:last-child td { border-bottom: none; }
          .total-row td { font-weight: 800; font-size: 12px; background: #faf5ff; color: #7c3aed; border-top: 2px solid #e9d5ff !important; }
          .chart-wrap { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 14px 18px; margin-top: 8px; }
          .chart-title { font-size: 11px; font-weight: 700; color: #475569; margin-bottom: 10px; }
          .tx-table { width: 100%; border-collapse: collapse; margin-top: 8px; }
          .tx-table th { background: #f1f5f9; font-size: 9px; font-weight: 700; text-transform: uppercase; padding: 7px 8px; text-align: left; color: #475569; }
          .tx-table td { padding: 7px 8px; border-bottom: 1px solid #f8fafc; font-size: 10px; color: #334155; }
          .tx-table tr:last-child td { border-bottom: none; }
          .footer { text-align: center; margin-top: 24px; padding-top: 12px; border-top: 1px dashed #cbd5e1; font-size: 10px; color: #94a3b8; }
          @page { size: A4; margin: 15mm 15mm; }
        </style>
      </head>
      <body>
        <div class="header">
          <div class="brand">WARUNGPOS</div>
          <div class="subtitle">Laporan Analitik &amp; Keuangan Bisnis &mdash; Paket ${plan}</div>
          <div class="print-date">Dicetak pada: ${printDate}</div>
        </div>
        <div class="section-title">📊 Ringkasan Pendapatan</div>
        <div class="stat-grid">
          <div class="stat-card"><div class="stat-label">Pendapatan Harian</div><div class="stat-value green">Rp ${totalPendapatan.toLocaleString('id-ID')}</div></div>
          <div class="stat-card"><div class="stat-label">Estimasi Mingguan</div><div class="stat-value purple">Rp ${totalMingguan.toLocaleString('id-ID')}</div></div>
          <div class="stat-card"><div class="stat-label">Estimasi Pajak PPN (11%)</div><div class="stat-value red">Rp ${estimasiPajak.toLocaleString('id-ID')}</div></div>
        </div>
        <div class="section-title">🧾 Laporan Pajak &amp; Keuangan</div>
        <table class="tax-table">
          <thead><tr><th>Keterangan</th><th style="text-align:right">Jumlah (Rp)</th></tr></thead>
          <tbody>
            <tr><td>Total Penjualan Kotor (PPN Termasuk)</td><td style="text-align:right">Rp ${totalPendapatan.toLocaleString('id-ID')}</td></tr>
            <tr><td>Total Penjualan Bersih (DPP)</td><td style="text-align:right">Rp ${penjualanBersih.toLocaleString('id-ID')}</td></tr>
            <tr><td>Pajak Keluaran (PPN 11%)</td><td style="text-align:right">Rp ${estimasiPajak.toLocaleString('id-ID')}</td></tr>
            <tr><td>Total Transaksi</td><td style="text-align:right">${transactions.length} transaksi</td></tr>
            <tr class="total-row"><td>Total Pendapatan Pajak Terlapor</td><td style="text-align:right">Rp ${estimasiPajak.toLocaleString('id-ID')}</td></tr>
          </tbody>
        </table>
        <div class="section-title">📈 Grafik Penjualan Mingguan (Estimasi)</div>
        <div class="chart-wrap"><div class="chart-title">Distribusi Penjualan 7 Hari Terakhir</div>${chartSvg}</div>
        <div class="section-title">📋 Riwayat Transaksi (${transactions.length > 0 ? `${Math.min(transactions.length, 20)} Terbaru` : 'Tidak Ada Data'})</div>
        <table class="tx-table">
          <thead><tr><th>Invoice</th><th>Tanggal</th><th>Metode</th><th style="text-align:right">Total</th><th style="text-align:center">Status</th></tr></thead>
          <tbody>
            ${transactions.slice(0, 20).map(t => `<tr><td style="color:#7c3aed;font-weight:700">${t.invoice}</td><td>${new Date(t.created_at).toLocaleString('id-ID')}</td><td>${t.method || '-'}</td><td style="text-align:right;font-weight:600">Rp ${Number(t.total).toLocaleString('id-ID')}</td><td style="text-align:center"><span style="background:#dcfce7;color:#15803d;padding:2px 8px;border-radius:12px;font-size:9px;font-weight:700">${t.status || 'Selesai'}</span></td></tr>`).join('')}
            ${transactions.length === 0 ? '<tr><td colspan="5" style="text-align:center;color:#94a3b8;padding:20px">Belum ada data transaksi</td></tr>' : ''}
          </tbody>
        </table>
        <div class="footer">
          <p>Laporan digenerate otomatis oleh sistem <strong>WarungPOS</strong> &mdash; ${printDate}</p>
          <p style="margin-top:4px">Paket: ${plan} | Seluruh data bersumber dari transaksi terkonfirmasi</p>
        </div>
      </body>
      </html>
    `;

    const iframe = document.createElement('iframe');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = 'none';
    document.body.appendChild(iframe);
    iframe.contentDocument.open();
    iframe.contentDocument.write(reportHtml);
    iframe.contentDocument.close();
    iframe.onload = () => {
      iframe.contentWindow.focus();
      iframe.contentWindow.print();
      setTimeout(() => document.body.removeChild(iframe), 1500);
    };
  };

  const subtotalCart = cart.reduce((sum, item) => sum + (item.price * item.qty), 0);
  const feePOS = (paymentMethod === 'SmartBank (QRIS)' || paymentMethod === 'Cash') ? Math.round(subtotalCart * 0.01) : 0;
  const totalCart = subtotalCart > 0 ? subtotalCart + feePOS : 0;

  // ─── RBAC: Ambil menu dan hak akses dari sumber terpusat ───
  const currentRole = profileData?.role || ROLES.KASIR;
  const allowedMenuItems = getMenuItems(currentRole);

  // Safety: jika tab aktif bukan dalam daftar izin, redirect ke default
  useEffect(() => {
    if (currentRole && !canAccess(currentRole, activeTab)) {
      setActiveTab(getDefaultTab(currentRole));
    }
  }, [currentRole, activeTab]);

  // ─── KOMPONEN PESANAN MASUK (Inline) ──────────────────────
  const PesananMasukTab = () => {
    const [pendingOrders, setPendingOrders] = useState([]);
    const [loadingOrders, setLoadingOrders] = useState(true);
    const [processingInvoice, setProcessingInvoice] = useState(null);
    const [processModal, setProcessModal] = useState(null);
    const [processPayMethod, setProcessPayMethod] = useState('Cash');
    const [processCash, setProcessCash] = useState('');

    const fetchPending = async () => {
      setLoadingOrders(true);
      try {
        const res = await fetch('http://localhost:3000/api/pos/pending-orders');
        const data = await res.json();
        setPendingOrders(Array.isArray(data) ? data : []);
      } catch { setPendingOrders([]); }
      setLoadingOrders(false);
    };

    useEffect(() => { fetchPending(); }, []);

    const handleProcess = async () => {
      if (!processModal) return;
      setProcessingInvoice(processModal.invoice);
      try {
        const cashNum = parseFloat(processCash) || 0;
        const changeDue = processPayMethod === 'Cash' ? cashNum - processModal.total : 0;
        const res = await fetch(`http://localhost:3000/api/pos/process/${processModal.invoice}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ payment_method: processPayMethod, cash_paid: cashNum || null, change_due: changeDue > 0 ? changeDue : null })
        });
        const data = await res.json();
        if (res.ok) {
          showToast('success', `Pesanan ${processModal.invoice} berhasil diproses!`);
          setProcessModal(null); setProcessCash(''); fetchPending();
        } else { showToast('error', data.message || 'Gagal memproses pesanan'); }
      } catch { showToast('error', 'Koneksi gagal'); }
      setProcessingInvoice(null);
    };

    return (
      <div className="animate-in fade-in space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Pesanan Masuk</h2>
            <p className="text-slate-400 text-sm mt-1">Pesanan mandiri dari pelanggan yang menunggu diproses</p>
          </div>
          <button onClick={fetchPending} className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-700 rounded-xl text-sm transition">🔄 Refresh</button>
        </div>
        {loadingOrders ? (
          <div className="text-center py-20 text-slate-500">Memuat pesanan...</div>
        ) : pendingOrders.length === 0 ? (
          <div className="bg-[#0f1423] border border-slate-800 rounded-3xl p-16 text-center">
            <div className="text-6xl mb-4">📋</div>
            <h3 className="text-xl font-bold text-slate-300 mb-2">Tidak Ada Pesanan Masuk</h3>
            <p className="text-slate-500">Pesanan baru dari pelanggan akan muncul di sini</p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingOrders.map(order => (
              <div key={order.id} className="bg-[#0f1423] border border-slate-800 rounded-2xl p-6 hover:border-purple-800/50 transition">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="font-bold text-purple-400">{order.invoice}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">⏳ Menunggu</span>
                    </div>
                    <p className="text-xs text-slate-500">{new Date(order.created_at).toLocaleString('id-ID')}</p>
                    <div className="mt-3 space-y-1">
                      {(order.items || []).map((item, i) => (
                        <div key={i} className="flex gap-3 text-sm">
                          <span className="text-slate-400">{item.qty}×</span>
                          <span>{item.product_name}</span>
                          <span className="text-slate-400 ml-auto">Rp {Number(item.price).toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-3">
                    <div>
                      <p className="text-xs text-slate-500">Total</p>
                      <p className="text-xl font-bold">Rp {Number(order.total).toLocaleString()}</p>
                    </div>
                    <button onClick={() => setProcessModal({ invoice: order.invoice, total: Number(order.total), items: order.items })}
                      className="px-5 py-2.5 bg-gradient-to-r from-emerald-600 to-emerald-700 hover:from-emerald-500 hover:to-emerald-600 text-white font-bold rounded-xl text-sm transition">
                      ✓ Proses Pesanan
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        {processModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-[#0f1423] border border-slate-700 rounded-3xl p-8 w-full max-w-md shadow-2xl animate-in fade-in zoom-in-95">
              <h3 className="text-xl font-bold mb-1">Proses Pembayaran</h3>
              <p className="text-slate-400 text-sm mb-6">{processModal.invoice}</p>
              <div className="bg-slate-800/50 rounded-xl p-4 mb-6">
                {(processModal.items || []).map((item, i) => (
                  <div key={i} className="flex justify-between text-sm py-1">
                    <span className="text-slate-300">{item.qty}× {item.product_name}</span>
                    <span>Rp {Number(item.price * item.qty).toLocaleString()}</span>
                  </div>
                ))}
                <div className="border-t border-slate-700 mt-3 pt-3 flex justify-between font-bold">
                  <span>Total</span>
                  <span className="text-purple-400">Rp {processModal.total.toLocaleString()}</span>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Metode Pembayaran</label>
                <select value={processPayMethod} onChange={e => setProcessPayMethod(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm">
                  <option value="Cash">💵 Cash</option>
                  <option value="SmartBank (QRIS)">📱 SmartBank (QRIS)</option>
                </select>
              </div>
              {processPayMethod === 'Cash' && (
                <div className="mb-6">
                  <label className="block text-xs font-bold text-slate-400 mb-2 uppercase">Uang Diterima</label>
                  <input type="number" value={processCash} onChange={e => setProcessCash(e.target.value)}
                    placeholder="Masukkan nominal" min={processModal.total}
                    className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm" />
                  {processCash && parseFloat(processCash) >= processModal.total && (
                    <div className="mt-2 space-y-2 text-left">
                      <p className="text-emerald-400 text-sm font-bold">Kembalian: Rp {(parseFloat(processCash) - processModal.total).toLocaleString('id-ID')}</p>
                      <div>
                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Pecahan Kembalian:</span>
                        <div className="flex flex-wrap gap-1.5">
                          {getGreedyChange(parseFloat(processCash) - processModal.total).map((c, idx) => (
                            <span key={idx} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold px-2 py-0.5 rounded-lg">
                              Rp {c.denomination.toLocaleString('id-ID')} x{c.count}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div className="flex gap-3">
                <button onClick={() => { setProcessModal(null); setProcessCash(''); }}
                  className="flex-1 py-3 bg-slate-800 hover:bg-slate-700 rounded-xl font-bold text-sm transition">Batal</button>
                <button onClick={handleProcess} disabled={!!processingInvoice}
                  className="flex-1 py-3 bg-gradient-to-r from-emerald-600 to-emerald-700 text-white font-bold rounded-xl text-sm transition disabled:opacity-50">
                  {processingInvoice ? 'Memproses...' : '✓ Konfirmasi'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };

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
          {allowedMenuItems.map((item) => (
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
             <h2 className="text-xl font-bold">{allowedMenuItems.find(i => i.id === activeTab)?.label || 'Dashboard'}</h2>
          </div>

          <div className="flex items-center gap-4">
            {/* Search Bar - hanya tampil di Produk & Transaksi POS */}
            {(activeTab === 'produk' || activeTab === 'transaksi') && (
              <div className="relative hidden sm:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={16} />
                <input type="text" placeholder="Cari produk..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="bg-slate-800/50 border border-slate-700 rounded-full py-2 pl-10 pr-4 text-sm focus:border-purple-500 w-64 outline-none" />
              </div>
            )}

            {/* Branch Selector */}
            <div className="relative">
              {!plan.toLowerCase().includes('enterprise') ? (
                <div className="flex items-center gap-2 px-4 py-2 bg-slate-800/40 border border-slate-700/50 rounded-2xl text-xs text-slate-400 font-semibold cursor-not-allowed">
                  <span>🏢 Cabang Utama</span>
                  <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-500 font-extrabold px-1.5 py-0.5 rounded-md">👑 ENT</span>
                </div>
              ) : (
                <select 
                  value={activeBranch} 
                  onChange={(e) => {
                    const selected = e.target.value;
                    if (selected === '__add_new__') {
                      setShowBranchSettings(true);
                      return;
                    }
                    setActiveBranch(selected);
                    localStorage.setItem('activeBranch', selected);
                  }}
                  className="bg-slate-800 border border-slate-700 text-white text-xs font-bold rounded-2xl px-4 py-2 focus:outline-none focus:border-purple-500 cursor-pointer shadow-md"
                >
                  {branches.map(b => (
                    <option key={b} value={b}>🏢 {b}</option>
                  ))}
                  <option value="__add_new__">➕ Tambah Cabang...</option>
                </select>
              )}
            </div>

            {/* Receipt Branding Button - Enterprise Only & Only on Dashboard Tab */}
            {activeTab === 'dashboard' && plan.toLowerCase().includes('enterprise') && (
              <button
                onClick={() => setShowReceiptBrandingModal(true)}
                title="Custom Branding Struk"
                className="flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 text-amber-400 rounded-xl text-xs font-bold hover:bg-amber-500/20 transition-all active:scale-95"
              >
                <Printer size={14} /> Branding Struk
              </button>
            )}

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

          {/* ─── TAB GUARD: Blokir akses tab yang tidak diizinkan ─── */}
          {!canAccess(currentRole, activeTab) && (
            <Unauthorized
              role={currentRole}
              tabLabel={allowedMenuItems.find(i => i.id === activeTab)?.label || activeTab}
              onGoBack={() => setActiveTab(getDefaultTab(currentRole))}
            />
          )}

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
            <div className="animate-in fade-in space-y-16 pb-10">

              {/* HEADER */}
              <div className="text-center pt-6">
                <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/30 text-purple-400 text-xs font-bold px-4 py-2 rounded-full mb-6 uppercase tracking-widest">
                  <Zap size={12} /> Pilih Paket Terbaik
                </div>
                <h3 className="text-4xl font-extrabold mb-4 text-white leading-tight">Kembangkan Bisnis Kamu<br /><span className="text-purple-400">Tanpa Batas</span></h3>
                <p className="text-slate-400 max-w-lg mx-auto">Mulai gratis, upgrade kapan saja. Semua paket dilengkapi fitur POS modern untuk warung dan UMKM Indonesia.</p>
              </div>

              {/* PRICING CARDS */}
              <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto items-start">
                {pricingPlans.map((p, i) => (
                  <div key={i} className={`relative flex flex-col bg-[#0f1423] border ${
                    p.popular ? 'border-purple-600 shadow-2xl shadow-purple-900/30 md:-mt-4' : 'border-slate-800'
                  } rounded-[2rem] overflow-hidden transition-all hover:translate-y-[-6px] hover:shadow-xl`}>

                    {/* Card gradient top bar */}
                    <div className={`h-1.5 w-full bg-gradient-to-r ${p.color}`} />

                    {p.popular && (
                      <div className="absolute top-4 right-4 bg-purple-600 text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">⭐ Terpopuler</div>
                    )}

                    <div className="p-8">
                      {/* Plan icon & name */}
                      <div className="flex items-center gap-3 mb-4">
                        <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${p.color} flex items-center justify-center text-2xl shadow-lg`}>{p.icon}</div>
                        <div>
                          <h4 className="text-lg font-extrabold text-white">{p.name}</h4>
                          <p className="text-slate-500 text-xs">{p.desc}</p>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="flex items-end gap-1 my-6">
                        <span className="text-4xl font-black text-white">{p.price}</span>
                        {p.period && <span className="text-slate-500 text-sm mb-1">{p.period}</span>}
                      </div>

                      {/* CTA Button */}
                      <button
                        onClick={() => handleOpenCheckout(p)}
                        className={`w-full py-3.5 rounded-2xl font-bold transition-all text-sm active:scale-95 text-white shadow-lg bg-gradient-to-r ${p.color} hover:opacity-90 hover:shadow-xl`}
                      >
                        {p.name === 'Basic' ? '🚀 Mulai Gratis' : '📦 Pilih Paket'}
                      </button>

                      {/* Divider */}
                      <div className="border-t border-slate-800 my-6" />

                      {/* Features */}
                      <div className="space-y-3">
                        <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-4">Yang kamu dapatkan:</p>
                        {p.features.map((f, j) => (
                          <div key={j} className={`flex items-center gap-3 text-sm ${ f.included ? 'text-slate-200' : 'text-slate-600 line-through' }`}>
                            {f.included
                              ? <CheckCircle2 size={15} className="text-emerald-400 shrink-0" />
                              : <X size={15} className="text-slate-700 shrink-0" />
                            }
                            <span>{f.text}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* COMPARISON TABLE */}
              <div className="max-w-5xl mx-auto">
                <h4 className="text-xl font-bold text-center mb-8">Perbandingan Lengkap Fitur</h4>
                <div className="bg-[#0f1423] border border-slate-800 rounded-3xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-slate-800">
                        <th className="px-6 py-5 text-left text-slate-400 font-semibold w-1/2">Fitur</th>
                        <th className="px-4 py-5 text-center text-slate-400 font-semibold">Basic</th>
                        <th className="px-4 py-5 text-center text-purple-400 font-bold bg-purple-500/5">Pro</th>
                        <th className="px-4 py-5 text-center text-amber-400 font-semibold">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60">
                      {[
                        { label: 'Jumlah Produk', basic: '30 produk', pro: 'Tak Terbatas', ent: 'Tak Terbatas' },
                        { label: 'Jumlah Pengguna', basic: '1 user', pro: '5 user', ent: 'Unlimited' },
                        { label: 'Transaksi POS', basic: '✅', pro: '✅', ent: '✅' },
                        { label: 'Cetak Struk', basic: '✅', pro: '✅', ent: '✅' },
                        { label: 'Pembayaran Cash', basic: '✅', pro: '✅', ent: '✅' },
                        { label: 'Pembayaran QRIS', basic: '❌', pro: '✅', ent: '✅' },
                        { label: 'Laporan Harian', basic: '✅', pro: '✅', ent: '✅' },
                        { label: 'Laporan Pajak', basic: '❌', pro: '✅', ent: '✅' },
                        { label: 'Export Excel/PDF', basic: '❌', pro: '✅', ent: '✅' },
                        { label: 'Multi Cabang', basic: '❌', pro: '❌', ent: '✅' },
                        { label: 'Custom Branding Struk', basic: '❌', pro: '❌', ent: '✅' },
                        { label: 'Support Prioritas 24/7', basic: '❌', pro: '✅', ent: '✅' },
                      ].map((row, i) => (
                        <tr key={i} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4 text-slate-300 font-medium">{row.label}</td>
                          <td className="px-4 py-4 text-center text-slate-400">{row.basic}</td>
                          <td className="px-4 py-4 text-center text-slate-200 bg-purple-500/5 font-medium">{row.pro}</td>
                          <td className="px-4 py-4 text-center text-slate-400">{row.ent}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* FAQ */}
              <div className="max-w-3xl mx-auto">
                <h4 className="text-xl font-bold text-center mb-8">Pertanyaan Umum (FAQ)</h4>
                <div className="space-y-4">
                  {faqList.map((item, i) => (
                    <div key={i} className="bg-[#0f1423] border border-slate-800 rounded-2xl p-6 hover:border-slate-700 transition-colors">
                      <p className="font-bold text-white mb-2 flex items-start gap-2"><span className="text-purple-400 shrink-0">Q.</span>{item.q}</p>
                      <p className="text-slate-400 text-sm leading-relaxed pl-5">{item.a}</p>
                    </div>
                  ))}
                </div>
              </div>

              {/* BOTTOM CTA */}
              <div className="max-w-2xl mx-auto text-center bg-gradient-to-br from-purple-900/30 to-slate-900 border border-purple-500/20 rounded-3xl p-10">
                <div className="text-3xl mb-4">🚀</div>
                <h4 className="text-2xl font-bold mb-3">Masih ragu?</h4>
                <p className="text-slate-400 mb-6 text-sm">Coba paket Pro selama 7 hari gratis. Tidak perlu kartu kredit.</p>
                <button
                  onClick={() => handleOpenCheckout(pricingPlans.find(p => p.name === 'Pro'))}
                  className="bg-purple-600 hover:bg-purple-700 text-white px-10 py-4 rounded-2xl font-bold transition-all shadow-lg shadow-purple-600/20 active:scale-95"
                >
                  Coba Pro Gratis 7 Hari
                </button>
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
                    {[...products].sort((a,b) => (b.sales || 0) - (a.sales || 0)).slice(0, 4).map((p, i) => {
                      const maxSales = Math.max(...products.map(x => x.sales || 0), 1);
                      const barWidth = Math.min(100, Math.round(((p.sales || 0) / maxSales) * 100));
                      return (
                        <div key={p.id} className="flex items-center gap-4">
                          <span className="text-slate-500 font-bold text-lg min-w-[24px]">0{i+1}</span>
                          <div className="flex-1">
                            <p className="font-bold text-sm text-slate-200">{p.name}</p>
                            <div className="w-full bg-slate-800 h-2 rounded-full mt-2 overflow-hidden">
                              <div className="bg-purple-500 h-full rounded-full transition-all duration-1000" style={{ width: `${barWidth}%` }}></div>
                            </div>
                          </div>
                          <span className="text-xs font-bold text-slate-400">{p.sales} terjual</span>
                        </div>
                      );
                    })}
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
                   <div className="space-y-3">{['SmartBank (QRIS)', 'Cash'].map(m => {
                      const isQRIS = m === 'SmartBank (QRIS)';
                      const isBasic = plan.toLowerCase().includes('basic');
                      const isLocked = isQRIS && isBasic;
                      return (
                        <div 
                          key={m} 
                          onClick={() => {
                            if (isLocked) {
                              setUpgradeModalReason('Pembayaran QRIS otomatis (Midtrans) hanya tersedia di paket Pro & Enterprise.');
                              setShowUpgradeModal(true);
                              return;
                            }
                            setPaymentMethod(m);
                            setCashReceived(''); // Reset cash input when switching methods
                          }}
                          className={`flex items-center justify-between p-5 rounded-3xl border-2 cursor-pointer transition-all ${
                            paymentMethod === m && !isLocked ? 'border-purple-600 bg-purple-600/10' : 'border-slate-800'
                          } ${isLocked ? 'opacity-65' : ''}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${paymentMethod === m && !isLocked ? 'border-purple-600' : 'border-slate-600'}`}>{paymentMethod === m && !isLocked && <div className="w-3 h-3 rounded-full bg-purple-600" />}</div>
                            <p className="font-bold text-sm">{m}</p>
                          </div>
                          {isLocked && (
                            <span className="bg-purple-600/20 border border-purple-500/30 text-purple-400 text-[9px] font-extrabold px-2.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">🔒 PRO</span>
                          )}
                        </div>
                      );
                    })}</div>

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
                         <div className="p-4 bg-slate-900/50 rounded-2xl border border-slate-800/50 space-y-3">
                           <div className="flex justify-between items-center">
                             <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Kembalian</span>
                             <span className={`font-mono text-base font-black ${Number(cashReceived) - totalCart < 0 ? 'text-red-500' : 'text-emerald-400'}`}>
                               Rp {(Number(cashReceived) - totalCart).toLocaleString('id-ID')}
                             </span>
                           </div>
                           {Number(cashReceived) - totalCart >= 0 && (
                             <div className="border-t border-slate-800 pt-2 text-left animate-in fade-in duration-200">
                               <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider block mb-1">Pecahan Kembalian:</span>
                               <div className="flex flex-wrap gap-1.5">
                                 {getGreedyChange(Number(cashReceived) - totalCart).length === 0 ? (
                                   <span className="text-xs text-slate-500">Tidak ada kembalian</span>
                                 ) : (
                                   getGreedyChange(Number(cashReceived) - totalCart).map((c, idx) => (
                                     <span key={idx} className="bg-purple-500/10 border border-purple-500/20 text-purple-400 text-[10px] font-bold px-2.5 py-1 rounded-xl">
                                       Rp {c.denomination.toLocaleString('id-ID')} x{c.count}
                                     </span>
                                   ))
                                 )}
                               </div>
                             </div>
                           )}
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

          {activeTab === 'pesanan' && (
            <PesananMasukTab />
          )}

          {activeTab === 'laporan' && (
            <div className="animate-in fade-in space-y-8">
              {/* Header Laporan */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <h3 className="text-xl font-bold text-white">Laporan & Analitik Bisnis</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {plan.toLowerCase().includes('basic') 
                      ? 'Paket Basic: Laporan Harian saja' 
                      : plan.toLowerCase().includes('pro') 
                        ? 'Paket Pro: Laporan Harian, Mingguan & Pajak' 
                        : 'Paket Enterprise: Analitik Real-time & Multi Cabang'}
                  </p>
                </div>
                
                {/* Export Buttons */}
                <div className="flex gap-2 w-full sm:w-auto">
                  <button 
                    onClick={handleExportCSV}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      plan.toLowerCase().includes('basic') 
                        ? 'bg-slate-800 text-slate-500 border border-slate-700/50' 
                        : 'bg-[#0f1423] hover:bg-slate-800 text-white border border-slate-800'
                    }`}
                  >
                    📥 Export CSV {plan.toLowerCase().includes('basic') && '🔒'}
                  </button>
                  <button 
                    onClick={handlePrintPDFReport}
                    className={`flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
                      plan.toLowerCase().includes('basic') 
                        ? 'bg-slate-800 text-slate-500 border border-slate-700/50' 
                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-600/10'
                    }`}
                  >
                    📄 Cetak PDF {plan.toLowerCase().includes('basic') && '🔒'}
                  </button>
                </div>
              </div>

              {/* STATS CARDS */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {[
                  { label: 'Pendapatan (Harian)', value: `Rp ${transactions.reduce((s,t) => s + Number(t.total), 0).toLocaleString('id-ID')}`, icon: <Wallet className="text-emerald-400" />, trend: '+15.2%', up: true },
                  { 
                    label: 'Pendapatan (Mingguan)', 
                    value: plan.toLowerCase().includes('basic') ? '🔒 Upgrade Pro' : `Rp ${(transactions.reduce((s,t) => s + Number(t.total), 0) * 5.4).toLocaleString('id-ID')}`, 
                    icon: <TrendingUp className="text-purple-400" />, 
                    trend: plan.toLowerCase().includes('basic') ? 'Locked' : '+18.7%', 
                    up: true 
                  },
                  { 
                    label: 'Estimasi Pajak PPN (11%)', 
                    value: plan.toLowerCase().includes('basic') ? '🔒 Upgrade Pro' : `Rp ${Math.round(transactions.reduce((s,t) => s + Number(t.total), 0) * 0.11).toLocaleString('id-ID')}`, 
                    icon: <BarChart3 className="text-blue-400" />, 
                    trend: plan.toLowerCase().includes('basic') ? 'Locked' : 'Pajak', 
                    up: false 
                  },
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
                ))}
              </div>

              {/* ADDITIONAL REPORTS SECTION FOR PRO & ENTERPRISE */}
              {plan.toLowerCase().includes('basic') ? (
                <div className="bg-gradient-to-br from-purple-900/10 to-slate-900 border border-purple-500/15 rounded-[2rem] p-8 text-center space-y-4">
                  <div className="text-3xl">📊</div>
                  <h4 className="text-lg font-bold text-white">Analitik Mingguan & Laporan Pajak Terkunci</h4>
                  <p className="text-slate-400 text-xs max-w-md mx-auto">
                    Upgrade ke paket Pro atau Enterprise untuk membuka laporan mingguan/bulanan, laporan pajak otomatis, analisis profit margin, serta ekspor file laporan ke CSV/Excel dan PDF.
                  </p>
                  <button 
                    onClick={() => setActiveTab('paket')}
                    className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-6 py-3 rounded-xl shadow-lg transition active:scale-95"
                  >
                    👑 Upgrade ke Pro / Enterprise
                  </button>
                </div>
              ) : (
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Mingguan/Bulanan Chart Mock */}
                  <div className="bg-[#0f1423] border border-slate-800 p-6 rounded-[2rem] shadow-xl">
                    <h4 className="font-bold text-sm text-slate-200 mb-4">Grafik Penjualan Mingguan</h4>
                    <div className="h-48 flex items-end gap-3 pt-6 px-4">
                      {[40, 65, 30, 85, 50, 95, 75].map((val, idx) => (
                        <div key={idx} className="flex-1 flex flex-col items-center gap-2">
                          <div className="w-full bg-purple-600/20 hover:bg-purple-600 rounded-t-lg transition-all" style={{ height: `${val}%` }}></div>
                          <span className="text-[10px] text-slate-500 font-bold">Day {idx+1}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Ringkasan Pajak & Laporan Keuangan */}
                  <div className="bg-[#0f1423] border border-slate-800 p-6 rounded-[2rem] shadow-xl space-y-4">
                    <h4 className="font-bold text-sm text-slate-200">Laporan Pajak & Keuangan</h4>
                    <div className="space-y-3 text-xs text-slate-400">
                      <div className="flex justify-between">
                        <span>Total Penjualan Bersih:</span>
                        <span className="text-white font-bold">
                          Rp {Math.round(transactions.reduce((s,t) => s + Number(t.total), 0) / 1.11).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pajak Keluaran (PPN 11%):</span>
                        <span className="text-white font-bold">
                          Rp {Math.round(transactions.reduce((s,t) => s + Number(t.total), 0) * 0.11).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span>Total Penjualan Kotor (PPN Inc.):</span>
                        <span className="text-white font-bold">
                          Rp {transactions.reduce((s,t) => s + Number(t.total), 0).toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="h-px bg-slate-800/80 my-2"></div>
                      <div className="flex justify-between text-sm">
                        <span className="font-bold text-slate-300">Total Pendapatan Pajak Terlapor:</span>
                        <span className="text-purple-400 font-black">
                          Rp {Math.round(transactions.reduce((s,t) => s + Number(t.total), 0) * 0.11).toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB KELOLA STAF */}
          {activeTab === 'staf' && plan.toLowerCase().includes('basic') && (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-6 animate-in fade-in">
              <div className="w-24 h-24 bg-purple-500/10 border border-purple-500/20 rounded-full flex items-center justify-center text-purple-400 shadow-xl">
                <Users size={44} />
              </div>
              <h3 className="text-3xl font-extrabold text-white">Multi User (Kelola Staf)</h3>
              <p className="text-slate-400 max-w-md mx-auto text-sm leading-relaxed">
                Kelola kasir dan karyawan Anda dengan akun terpisah untuk melacak kinerja penjualan staf secara akurat. Fitur ini hanya tersedia pada paket Pro & Enterprise.
              </p>
              <button 
                onClick={() => setActiveTab('paket')}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white px-8 py-3.5 rounded-2xl font-bold shadow-lg shadow-purple-600/20 active:scale-95 transition-all text-sm"
              >
                👑 Upgrade ke Paket Pro/Enterprise
              </button>
            </div>
          )}

          {activeTab === 'staf' && !plan.toLowerCase().includes('basic') && (
            <div className="animate-in fade-in space-y-6">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-xl font-bold text-white">Kelola Staf & Kasir</h3>
                  <p className="text-slate-500 text-xs mt-0.5">
                    {plan.toLowerCase().includes('pro') 
                      ? `Paket Pro: maksimal 4 staf (${staff.length}/4 staf terdaftar)` 
                      : `Paket Enterprise: staf tak terbatas (${staff.length} staf terdaftar)`}
                  </p>
                </div>
                <button 
                  onClick={() => {
                    if (plan.toLowerCase().includes('pro') && staff.length >= 4) {
                      setUpgradeModalReason('Batas staf untuk paket Pro adalah 4 staf. Upgrade ke Enterprise untuk staf tak terbatas!');
                      setShowUpgradeModal(true);
                      return;
                    }
                    setShowAddStaffModal(true);
                  }}
                  className="flex items-center gap-2 bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-2xl font-bold transition shadow-lg text-white"
                >
                  <Plus size={18} /> Tambah Staf
                </button>
              </div>

              <div className="bg-[#0f1423] border border-slate-800 rounded-3xl overflow-hidden shadow-2xl">
                <table className="w-full text-left">
                  <thead className="bg-slate-800/50 border-b border-slate-800">
                    <tr>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Nama</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Email</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase">Role</th>
                      <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {staff.length === 0 ? (
                      <tr>
                        <td colSpan="4" className="text-center py-10 text-slate-500 font-medium text-sm">Belum ada staf terdaftar. Klik "Tambah Staf" untuk memulai.</td>
                      </tr>
                    ) : (
                      staff.map((s) => (
                        <tr key={s.id} className="hover:bg-slate-800/20 transition-colors">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 bg-slate-800 rounded-xl flex items-center justify-center text-slate-500 overflow-hidden">
                                {s.profile_image ? (
                                  <img src={`http://localhost:3000/uploads/${s.profile_image}`} alt={s.name} className="w-full h-full object-cover" />
                                ) : (
                                  <UserCircle size={20} className="text-slate-400" />
                                )}
                              </div>
                              <span className="font-bold text-white">{s.name}</span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-slate-400">{s.email}</td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold bg-purple-500/10 text-purple-400">
                              {s.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <button 
                              onClick={() => handleDeleteStaff(s.id)} 
                              className="p-2 text-slate-500 hover:text-red-400 transition"
                            >
                              <Trash2 size={18} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
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
                onClick={handlePrintReceipt} 
                className="w-full bg-slate-800 hover:bg-slate-700 border border-slate-700 text-white py-4 rounded-2xl font-bold transition shadow-lg active:scale-95 flex items-center justify-center gap-2"
              >
                <Printer size={18} /> Cetak Struk
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

      {/* MODAL BRANCH SETTINGS */}
      {showBranchSettings && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold">🏢 Kelola Cabang</h3>
                <p className="text-xs text-slate-500 mt-1">Enterprise — Cabang Unlimited</p>
              </div>
              <button onClick={() => { setShowBranchSettings(false); setNewBranchName(''); }} className="text-slate-500 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>

            {/* List Cabang */}
            <div className="space-y-2 mb-6 max-h-64 overflow-y-auto custom-scrollbar">
              {branches.map((b, idx) => (
                <div key={b} className={`flex items-center justify-between px-4 py-3 rounded-xl border transition-all ${
                  activeBranch === b
                    ? 'bg-purple-600/10 border-purple-500/50 text-purple-300'
                    : 'bg-slate-800/40 border-slate-700/50 text-slate-300'
                }`}>
                  <div className="flex items-center gap-3">
                    <span className="text-base">🏢</span>
                    <span className="font-semibold text-sm">{b}</span>
                    {activeBranch === b && <span className="text-[9px] bg-purple-500/20 border border-purple-500/30 text-purple-400 font-extrabold px-2 py-0.5 rounded-md">AKTIF</span>}
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setActiveBranch(b);
                        localStorage.setItem('activeBranch', b);
                        showToast('success', `Beralih ke cabang: ${b}`);
                      }}
                      className="text-xs px-3 py-1.5 bg-slate-700 hover:bg-purple-600 text-slate-300 hover:text-white rounded-lg transition font-semibold"
                    >
                      Pilih
                    </button>
                    {idx !== 0 && (
                      <button
                        onClick={() => {
                          if (!confirm(`Hapus cabang "${b}"? Data produk cabang ini tetap tersimpan.`)) return;
                          const updated = branches.filter(x => x !== b);
                          setBranches(updated);
                          localStorage.setItem('branches', JSON.stringify(updated));
                          if (activeBranch === b) {
                            setActiveBranch('Cabang Utama');
                            localStorage.setItem('activeBranch', 'Cabang Utama');
                          }
                          showToast('success', `Cabang "${b}" dihapus`);
                        }}
                        className="text-xs px-3 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition font-semibold"
                      >
                        Hapus
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Tambah Cabang Baru */}
            <div className="border-t border-slate-800 pt-5">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Tambah Cabang Baru</p>
              <div className="flex gap-3">
                <input
                  type="text"
                  value={newBranchName}
                  onChange={e => setNewBranchName(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (!newBranchName.trim()) return;
                      if (branches.includes(newBranchName.trim())) { showToast('error', 'Nama cabang sudah ada!'); return; }
                      const updated = [...branches, newBranchName.trim()];
                      setBranches(updated);
                      localStorage.setItem('branches', JSON.stringify(updated));
                      setActiveBranch(newBranchName.trim());
                      localStorage.setItem('activeBranch', newBranchName.trim());
                      showToast('success', `Cabang "${newBranchName.trim()}" ditambahkan!`);
                      setNewBranchName('');
                    }
                  }}
                  placeholder="Nama cabang baru..."
                  className="flex-1 bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-purple-500 transition"
                />
                <button
                  onClick={() => {
                    if (!newBranchName.trim()) return;
                    if (branches.includes(newBranchName.trim())) { showToast('error', 'Nama cabang sudah ada!'); return; }
                    const updated = [...branches, newBranchName.trim()];
                    setBranches(updated);
                    localStorage.setItem('branches', JSON.stringify(updated));
                    setActiveBranch(newBranchName.trim());
                    localStorage.setItem('activeBranch', newBranchName.trim());
                    showToast('success', `Cabang "${newBranchName.trim()}" ditambahkan!`);
                    setNewBranchName('');
                  }}
                  className="px-5 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-bold text-sm transition active:scale-95"
                >
                  + Tambah
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL RECEIPT BRANDING */}
      {showReceiptBrandingModal && (
        <div className="fixed inset-0 z-[65] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-lg rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div>
                <h3 className="text-xl font-bold">🎨 Custom Branding Struk</h3>
                <p className="text-xs text-slate-500 mt-1">Personalisasi tampilan struk pembayaran Anda</p>
              </div>
              <button onClick={() => setShowReceiptBrandingModal(false)} className="text-slate-500 hover:text-white transition p-2 hover:bg-slate-800 rounded-xl"><X size={20} /></button>
            </div>

            <div className="space-y-5">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nama Toko / Brand</label>
                <input
                  type="text"
                  value={receiptSettings.title}
                  onChange={e => setReceiptSettings(prev => ({...prev, title: e.target.value}))}
                  placeholder="Contoh: WARUNGPOS"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm font-bold tracking-wider"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Keterangan Header</label>
                <input
                  type="text"
                  value={receiptSettings.headerNote}
                  onChange={e => setReceiptSettings(prev => ({...prev, headerNote: e.target.value}))}
                  placeholder="Contoh: Toko Baju Murah — Jakarta Selatan"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm"
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Pesan Footer Struk</label>
                <textarea
                  value={receiptSettings.footerNote}
                  onChange={e => setReceiptSettings(prev => ({...prev, footerNote: e.target.value}))}
                  placeholder="Contoh: Terima kasih! Barang yang sudah dibeli tidak dapat ditukar."
                  rows={3}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm resize-none"
                />
              </div>

              {/* Preview */}
              <div className="bg-slate-900 border border-slate-700/50 rounded-2xl p-5">
                <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mb-3">Preview Struk</p>
                <div className="font-mono text-xs text-slate-200 space-y-1 text-center">
                  <p className="text-base font-extrabold tracking-widest">{receiptSettings.title || 'NAMA TOKO'}</p>
                  <p className="text-slate-400 text-[11px]">{receiptSettings.headerNote || 'Keterangan header...'}</p>
                  <div className="border-t border-dashed border-slate-600 my-2"></div>
                  <p className="text-[10px] text-left text-slate-400">No. Invoice: INV-XXXXXX</p>
                  <p className="text-[10px] text-left text-slate-400">Tanggal: 07 Jun 2026</p>
                  <div className="border-t border-dashed border-slate-600 my-2"></div>
                  <p className="text-[10px] text-left">Produk A x1 ......... Rp 25.000</p>
                  <p className="text-[10px] text-left">Produk B x2 ......... Rp 50.000</p>
                  <div className="border-t border-dashed border-slate-600 my-2"></div>
                  <p className="text-sm font-bold">TOTAL: Rp 75.000</p>
                  <div className="border-t border-dashed border-slate-600 my-2"></div>
                  <p className="text-[10px] text-slate-400 italic">{receiptSettings.footerNote || 'Pesan footer...'}</p>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => {
                    localStorage.setItem('receiptSettings', JSON.stringify(receiptSettings));
                    showToast('success', 'Branding struk berhasil disimpan!');
                    setShowReceiptBrandingModal(false);
                  }}
                  className="flex-1 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-white font-bold py-4 rounded-xl shadow-lg transition-all active:scale-[0.98]"
                >
                  💾 Simpan Branding
                </button>
                <button
                  onClick={() => {
                    const def = { title: 'WARUNGPOS', headerNote: 'Premium Digital POS System', footerNote: 'Terima kasih atas kunjungan Anda! Powered by WarungPOS' };
                    setReceiptSettings(def);
                    localStorage.setItem('receiptSettings', JSON.stringify(def));
                    showToast('success', 'Branding direset ke default');
                  }}
                  className="px-5 py-4 bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-300 font-bold rounded-xl transition-all active:scale-[0.98]"
                >
                  Reset
                </button>
              </div>
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

      {/* MODAL TAMBAH STAF */}
      {showAddStaffModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="bg-[#0f1423] border border-slate-800 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl animate-in zoom-in duration-200">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-purple-500/10 rounded-2xl flex items-center justify-center">
                  <Users size={20} className="text-purple-400" />
                </div>
                <h3 className="text-xl font-bold text-white">Tambah Staf Baru</h3>
              </div>
              <button 
                onClick={() => {
                  setShowAddStaffModal(false);
                  setStaffForm({ name: '', email: '', password: '', role: 'Kasir' });
                }} 
                className="text-slate-500 hover:text-white transition"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleSaveStaff} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nama Staf</label>
                <input 
                  type="text" 
                  value={staffForm.name} 
                  onChange={(e) => setStaffForm({...staffForm, name: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm"
                  placeholder="Nama Lengkap" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email Staf</label>
                <input 
                  type="email" 
                  value={staffForm.email} 
                  onChange={(e) => setStaffForm({...staffForm, email: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm"
                  placeholder="email@example.com" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
                <input 
                  type="password" 
                  value={staffForm.password} 
                  onChange={(e) => setStaffForm({...staffForm, password: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm"
                  placeholder="Min. 6 karakter" 
                  required 
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Role / Jabatan</label>
                <select 
                  value={staffForm.role} 
                  onChange={(e) => setStaffForm({...staffForm, role: e.target.value})}
                  className="w-full bg-slate-900 border border-slate-800 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-purple-500 transition text-sm cursor-pointer"
                >
                  <option value="Kasir">Kasir</option>
                  <option value="Manajer">Manajer</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>

              <button 
                type="submit" 
                disabled={loading} 
                className="w-full mt-4 bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 text-white font-bold py-4 rounded-xl shadow-lg shadow-purple-600/20 transition-all active:scale-[0.98]"
              >
                {loading ? 'Memproses...' : 'Tambah Staf'}
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
              {allowedMenuItems.map((item) => (
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

export default CashierDashboard;