import { useState } from 'react';
import { Store, ShoppingCart } from 'lucide-react';

/**
 * Login.jsx — 3 Mode:
 *   'login'    → Login biasa
 *   'register' → Daftar sebagai Pemilik Warung (Manager)
 *   'konsumen' → Daftar sebagai Pelanggan (Konsumen)
 */
const Login = ({ onSuccess, onBack }) => {
  const [mode, setMode] = useState('login'); // 'login' | 'register' | 'konsumen'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const isLogin = mode === 'login';
  const isKonsumen = mode === 'konsumen';

  const handleSubmit = async () => {
    setError('');
    if (!email || !password) { setError('Email dan password wajib diisi'); return; }
    if (!isLogin && !name) { setError('Nama wajib diisi'); return; }

    setLoading(true);
    const url = isLogin
      ? 'http://localhost:3000/api/auth/login'
      : 'http://localhost:3000/api/auth/register';

    try {
      const body = isLogin
        ? { email, password }
        : { name, email, password, role: isKonsumen ? 'Konsumen' : 'Manager' };

      const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });

      const data = await res.json();
      if (!res.ok) { setError(data.message || 'Terjadi kesalahan'); setLoading(false); return; }

      if (data.token) localStorage.setItem('token', data.token);
      if (data.user) {
        localStorage.setItem('user', JSON.stringify(data.user));
        if (data.user.plan) localStorage.setItem('selectedPlan', data.user.plan);
      }

      onSuccess();
    } catch (err) {
      console.error(err);
      setError('Tidak dapat terhubung ke server');
    }
    setLoading(false);
  };

  const switchMode = (newMode) => { setMode(newMode); setError(''); setName(''); setEmail(''); setPassword(''); };

  const titles = {
    login: 'Masuk ke WarungPOS',
    register: 'Daftar Pemilik Warung',
    konsumen: 'Daftar sebagai Pelanggan',
  };

  const subtitles = {
    login: 'Selamat datang kembali',
    register: 'Kelola toko Anda dengan mudah',
    konsumen: 'Belanja produk favorit Anda',
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0b0e17] text-white px-4 py-10">
      <div className="w-full max-w-md">

        {/* LOGO */}
        <div className="flex items-center justify-center gap-3 mb-8">
          <div className="bg-gradient-to-br from-purple-500 to-purple-700 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30">
            <ShoppingCart size={20} className="text-white" strokeWidth={3} />
          </div>
          <span className="font-bold text-xl text-white">WarungPOS</span>
        </div>

        <div className="bg-[#0f1423] border border-slate-800 p-8 rounded-3xl shadow-2xl">

          {/* BACK */}
          <button onClick={onBack} className="text-slate-400 hover:text-white mb-5 text-sm flex items-center gap-1 transition">
            ← Kembali
          </button>

          {/* TITLE */}
          <div className="mb-6">
            <h2 className="text-2xl font-bold">{titles[mode]}</h2>
            <p className="text-slate-400 text-sm mt-1">{subtitles[mode]}</p>
          </div>

          {/* MODE TABS — hanya tampil jika bukan login */}
          {!isLogin && (
            <div className="flex gap-2 mb-6 p-1 bg-slate-900 rounded-xl">
              <button
                onClick={() => switchMode('register')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${mode === 'register' ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <Store size={15} /> Pemilik Warung
              </button>
              <button
                onClick={() => switchMode('konsumen')}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-bold transition ${isKonsumen ? 'bg-purple-600 text-white' : 'text-slate-400 hover:text-white'}`}
              >
                <ShoppingCart size={15} /> Pelanggan
              </button>
            </div>
          )}

          {/* INFO BOX */}
          {!isLogin && (
            <div className={`rounded-xl p-3 mb-5 text-xs ${isKonsumen ? 'bg-blue-500/5 border border-blue-500/20 text-blue-300' : 'bg-purple-500/5 border border-purple-500/20 text-purple-300'}`}>
              {isKonsumen
                ? '🛍️ Akun pelanggan: browse katalog, tambah ke keranjang, dan pesan langsung. Pesananmu akan diproses oleh kasir toko.'
                : '🏪 Akun pemilik warung: kelola produk, kelola staf, pantau laporan penjualan, dan atur langganan.'}
            </div>
          )}

          {/* ERROR */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-3 rounded-xl mb-4 text-sm">
              {error}
            </div>
          )}

          {/* INPUT NAMA */}
          {!isLogin && (
            <div className="mb-4">
              <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Nama Lengkap</label>
              <input type="text" placeholder={isKonsumen ? 'Nama kamu' : 'Nama pemilik / warung'}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-purple-500 transition text-sm"
                value={name} onChange={e => setName(e.target.value)} />
            </div>
          )}

          {/* INPUT EMAIL */}
          <div className="mb-4">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Email</label>
            <input type="email" placeholder="email@example.com"
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-purple-500 transition text-sm"
              value={email} onChange={e => setEmail(e.target.value)} />
          </div>

          {/* INPUT PASSWORD */}
          <div className="mb-6">
            <label className="block text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">Password</label>
            <input type="password" placeholder="••••••••"
              className="w-full p-3 rounded-xl bg-slate-900 border border-slate-800 focus:outline-none focus:border-purple-500 transition text-sm"
              value={password} onChange={e => setPassword(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSubmit()} />
          </div>

          {/* SUBMIT BUTTON */}
          <button onClick={handleSubmit} disabled={loading}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-500 hover:to-purple-600 disabled:opacity-60 py-3.5 rounded-xl font-bold transition shadow-lg shadow-purple-600/20 text-sm">
            {loading ? 'Memproses...' : isLogin ? 'Masuk' : isKonsumen ? 'Daftar sebagai Pelanggan' : 'Daftar sebagai Pemilik'}
          </button>

          {/* SWITCH MODE */}
          <div className="mt-5 text-center">
            {isLogin ? (
              <p className="text-sm text-slate-500">
                Belum punya akun?{' '}
                <span className="text-purple-400 cursor-pointer hover:underline" onClick={() => switchMode('register')}>
                  Daftar sekarang
                </span>
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Sudah punya akun?{' '}
                <span className="text-purple-400 cursor-pointer hover:underline" onClick={() => switchMode('login')}>
                  Masuk
                </span>
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;