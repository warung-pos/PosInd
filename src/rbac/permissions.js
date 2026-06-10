/**
 * =========================================================
 * RBAC — Role-Based Access Control
 * Sumber kebenaran tunggal (Single Source of Truth) untuk
 * semua definisi hak akses di seluruh aplikasi WarungPOS.
 *
 * 4 Role sesuai ketentuan:
 *   Manager  — KPI, Laporan, Kelola Staf, Langganan
 *   Operator — Kelola Produk & Stok
 *   Kasir    — Transaksi POS, Pesanan Masuk
 *   Konsumen — Katalog, Keranjang, Checkout, Pesanan Saya
 * =========================================================
 */

import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  BarChart3,
  History,
  Users,
  Zap,
  Store,
  ClipboardList,
} from 'lucide-react';
import React from 'react';

// ─── Konstanta Nama Role ────────────────────────────────────
export const ROLES = {
  MANAGER:  'Manager',
  OPERATOR: 'Operator',
  KASIR:    'Kasir',
  KONSUMEN: 'Konsumen',
};

// ─── Definisi Semua Menu yang Ada ──────────────────────────
const ALL_MENU_ITEMS = [
  { id: 'dashboard',  label: 'Dashboard',       icon: React.createElement(LayoutDashboard, { size: 20 }) },
  { id: 'produk',     label: 'Produk',           icon: React.createElement(Package,         { size: 20 }) },
  { id: 'transaksi',  label: 'Transaksi POS',    icon: React.createElement(ShoppingCart,    { size: 20 }) },
  { id: 'pesanan',    label: 'Pesanan Masuk',    icon: React.createElement(ClipboardList,   { size: 20 }) },
  { id: 'riwayat',    label: 'Riwayat',          icon: React.createElement(History,         { size: 20 }) },
  { id: 'laporan',    label: 'Laporan',           icon: React.createElement(BarChart3,       { size: 20 }) },
  { id: 'staf',       label: 'Kelola Staf',      icon: React.createElement(Users,           { size: 20 }) },
  { id: 'paket',      label: 'Langganan',         icon: React.createElement(Zap,            { size: 20 }) },
  { id: 'katalog',    label: 'Katalog Produk',   icon: React.createElement(Store,           { size: 20 }) },
  { id: 'mypesanan',  label: 'Pesanan Saya',     icon: React.createElement(ClipboardList,   { size: 20 }) },
];

// ─── Mapping Role → Daftar Tab yang Diizinkan ──────────────
export const ROLE_PERMISSIONS = {
  [ROLES.MANAGER]: [
    'dashboard',
    'laporan',
    'staf',
    'paket',
  ],
  [ROLES.OPERATOR]: [
    'dashboard',
    'produk',
  ],
  [ROLES.KASIR]: [
    'dashboard',
    'transaksi',
    'pesanan',
    'riwayat',
  ],
  [ROLES.KONSUMEN]: [
    'katalog',
    'mypesanan',
  ],
};

// ─── Helper: Cek apakah role memiliki akses ke tab ─────────
export const canAccess = (role, tabId) => {
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed) return false;
  return allowed.includes(tabId);
};

// ─── Helper: Dapatkan daftar menu item untuk role tertentu ──
export const getMenuItems = (role) => {
  const allowed = ROLE_PERMISSIONS[role] || [];
  return allowed
    .map(tabId => ALL_MENU_ITEMS.find(item => item.id === tabId))
    .filter(Boolean);
};

// ─── Helper: Tab default saat pertama kali login ────────────
export const getDefaultTab = (role) => {
  const allowed = ROLE_PERMISSIONS[role];
  if (!allowed || allowed.length === 0) return 'dashboard';
  return allowed[0];
};
