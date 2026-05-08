import { useState } from 'react';

const Register = ({ onSuccess, onBack }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async () => {
    setError('');

    try {
      const res = await fetch('http://localhost:3000/api/auth/register', {
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
        setError(data.message || 'Register gagal');
        return;
      }

      console.log(data);

      // opsional: langsung login setelah register
      onSuccess();

    } catch (err) {
      console.error(err);
      setError('Server error');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0f1423] text-white px-4">
      
      <div className="bg-[#151b2b] border border-slate-800 p-8 rounded-2xl w-full max-w-md shadow-xl">

        {/* BACK */}
        <button 
          onClick={onBack}
          className="text-slate-400 hover:text-white mb-4 text-sm"
        >
          ← Kembali
        </button>

        {/* TITLE */}
        <h2 className="text-2xl font-bold mb-6 text-center">
          Daftar Akun
        </h2>

        {/* ERROR */}
        {error && (
          <div className="bg-red-500/10 border border-red-500 text-red-400 p-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        {/* INPUT NAME */}
        <input
          type="text"
          placeholder="Nama"
          className="w-full mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />

        {/* INPUT EMAIL */}
        <input
          type="email"
          placeholder="Email"
          className="w-full mb-4 p-3 rounded-lg bg-slate-800 border border-slate-700"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        {/* INPUT PASSWORD */}
        <input
          type="password"
          placeholder="Password"
          className="w-full mb-6 p-3 rounded-lg bg-slate-800 border border-slate-700"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        {/* BUTTON */}
        <button
          onClick={handleRegister}
          className="w-full bg-purple-600 hover:bg-purple-700 py-3 rounded-xl font-bold"
        >
          Register
        </button>

      </div>
    </div>
  );
};

export default Register;