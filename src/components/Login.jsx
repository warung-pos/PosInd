import { useState } from 'react';

const Login = ({ onSuccess, onBack }) => {
  const [isLogin, setIsLogin] = useState(true);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    setError('');

    const url = isLogin
      ? 'http://localhost:3000/api/auth/login'
      : 'http://localhost:3000/api/auth/register';

    try {
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          password
        })
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.message || 'Terjadi kesalahan');
        return;
      }

      // simpan token kalau ada (biasanya saat login)
      if (data.token) {
        localStorage.setItem('token', data.token);
      }

      // langsung masuk setelah login/register
      onSuccess();

    } catch (err) {
      console.error(err);
      setError('Server error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1423] text-white px-4">
      
      <div className="bg-[#151b2b] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-xl">
        
        {/* BACK BUTTON */}
        <button 
          onClick={onBack}
          className="text-slate-400 hover:text-white mb-4 text-sm"
        >
          ← Kembali
        </button>

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          {isLogin ? 'Masuk ke WarungPOS' : 'Daftar Akun'}
        </h2>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* INPUT NAME (hanya register) */}
        {!isLogin && (
          <input
            type="text"
            placeholder="Nama"
            className="w-full mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-purple-500"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        )}

        {/* INPUT EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-purple-500"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* INPUT PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-lg bg-slate-800 border border-slate-700 focus:outline-none focus:border-purple-500"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={handleSubmit}
          className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold transition"
        >
          {isLogin ? 'Login' : 'Register'}
        </button>

        {/* SWITCH LOGIN / REGISTER */}
        <p className="text-xs text-slate-500 mt-4 text-center">
          {isLogin ? 'Belum punya akun?' : 'Sudah punya akun?'}{' '}
          <span 
            className="text-purple-400 cursor-pointer"
            onClick={() => {
              setIsLogin(!isLogin);
              setError('');
            }}
          >
            {isLogin ? 'Daftar' : 'Login'}
          </span>
        </p>

      </div>
    </div>
  );
};

export default Login;