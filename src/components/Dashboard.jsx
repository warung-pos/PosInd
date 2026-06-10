import { useState, useEffect, lazy, Suspense } from 'react';
import AdminDashboard from './AdminDashboard';
import CashierDashboard from './CashierDashboard';
import { apiFetch } from '../utils/api';
import { ROLES } from '../rbac/permissions';

// Lazy load komponen baru untuk performa lebih baik
const ConsumerDashboard = lazy(() => import('./ConsumerDashboard'));

const Dashboard = ({ onBack }) => {
  // ─── Cek sesi awal — jika tidak ada token atau user, keluar ─
  const token = localStorage.getItem('token');
  const rawUser = localStorage.getItem('user');

  if (!token || !rawUser) {
    onBack();
    return null;
  }

  const [user, setUser] = useState(() => {
    try {
      return JSON.parse(rawUser || '{}');
    } catch {
      return {};
    }
  });
  const [profileData, setProfileData] = useState(user);

  // Sinkronisasi data profile dari backend secara real-time
  useEffect(() => {
    if (user && user.id) {
      apiFetch(`http://localhost:3000/api/auth/profile/${user.id}`)
        .then(res => res.json())
        .then(data => {
          if (!data.message) {
            setProfileData(data);
            const updatedUser = { ...user, ...data };
            setUser(updatedUser);
            localStorage.setItem('user', JSON.stringify(updatedUser));
          }
        })
        .catch(err => console.error('Gagal sinkronisasi profil', err));
    }
  }, []);

  const activeRole = profileData?.role || user?.role;

  // ─── Route ke Dashboard sesuai Role ─────────────────────────
  // Kasir → CashierDashboard (Transaksi POS + Pesanan Masuk)
  if (activeRole === ROLES.KASIR) {
    return <CashierDashboard onBack={onBack} />;
  }

  // Konsumen → ConsumerDashboard (Katalog + Keranjang + Pesanan)
  if (activeRole === ROLES.KONSUMEN) {
    return (
      <Suspense fallback={
        <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f172a', color:'#94a3b8', fontSize:'1rem' }}>
          Memuat dashboard...
        </div>
      }>
        <ConsumerDashboard onBack={onBack} />
      </Suspense>
    );
  }

  // Manager & Operator → AdminDashboard (tab guard RBAC yang bedakan)
  // Manager: dashboard, laporan, staf, paket
  // Operator: dashboard, produk
  return <AdminDashboard onBack={onBack} />;
};

export default Dashboard;