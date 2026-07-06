import { useState, useEffect, lazy, Suspense } from 'react';
import AdminDashboard from './AdminDashboard';
import CashierDashboard from './CashierDashboard';
import { apiFetch } from '../utils/api';
import { ROLES, setDynamicPermissions, canAccess } from '../rbac/permissions';

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
  const [loadingRoles, setLoadingRoles] = useState(true);

  // Sinkronisasi data profile dari backend secara real-time dan fetch roles
  useEffect(() => {
    if (user && user.id) {
      // 1. Sync Profile
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

      // 2. Fetch Roles & Permissions
      apiFetch(`http://localhost:3000/api/roles`)
        .then(res => res.json())
        .then(roles => {
          if (Array.isArray(roles)) {
            setDynamicPermissions(roles);
          }
          setLoadingRoles(false);
        })
        .catch(err => {
          console.error('Gagal mengambil data role', err);
          setLoadingRoles(false);
        });
    } else {
      setLoadingRoles(false);
    }
  }, []);

  const activeRole = profileData?.role || user?.role;

  // Tunggu loading role selesai agar rbac tidak salah route di awal
  if (loadingRoles) {
    return (
      <div style={{ display:'flex', alignItems:'center', justifyContent:'center', height:'100vh', background:'#0f172a', color:'#94a3b8', fontSize:'1rem' }}>
        Membuat sesi aman...
      </div>
    );
  }

  // ─── Route ke Dashboard sesuai Role & Permissions ─────────────────────────
  // Konsumen → ConsumerDashboard (Katalog + Keranjang + Pesanan)
  if (activeRole === 'Konsumen' || (!canAccess(activeRole, 'dashboard') && canAccess(activeRole, 'katalog'))) {
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

  // Kasir / role custom lain yang hanya memiliki akses POS (punya transaksi tapi tidak punya staf/laporan)
  if (canAccess(activeRole, 'transaksi') && !canAccess(activeRole, 'laporan') && !canAccess(activeRole, 'staf')) {
    return <CashierDashboard onBack={onBack} />;
  }

  // Admin, Operator, Manager atau role custom pengelola → AdminDashboard (dengan tab guard RBAC)
  return <AdminDashboard onBack={onBack} />;
};

export default Dashboard;