import jwt from 'jsonwebtoken';
import db from '../config/db.js';

// Middleware untuk memverifikasi JWT Token
export const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Akses ditolak: Token tidak disertakan' });
  }

  jwt.verify(token, process.env.JWT_SECRET || 'rahasia_super_aman', (err, decodedUser) => {
    if (err) {
      return res.status(403).json({ message: 'Akses ditolak: Token tidak valid atau kedaluwarsa' });
    }
    req.user = decodedUser;
    next();
  });
};

// Middleware untuk memverifikasi role user
export const authorizeRoles = (...allowedRoles) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User tidak terotentikasi' });
    }

    try {
      // Ambil role terbaru dari database untuk keamanan maksimal
      const [rows] = await db.promise().query('SELECT role FROM users WHERE id = ?', [req.user.id]);
      
      if (rows.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      const userRole = rows[0].role;

      // Hubungkan Manager dan Admin sebagai role yang setara (owner)
      const checkRoles = [...allowedRoles];
      if (checkRoles.includes('Manager')) checkRoles.push('Admin');
      if (checkRoles.includes('Admin')) checkRoles.push('Manager');

      if (checkRoles.includes(userRole)) {
        req.user.role = userRole; // Sisipkan role terbaru ke request
        next();
      } else {
        res.status(403).json({ message: `Akses ditolak: Role Anda (${userRole}) tidak diizinkan untuk aksi ini` });
      }
    } catch (err) {
      console.error('Role authorization error:', err);
      res.status(500).json({ message: 'Terjadi kesalahan pada verifikasi hak akses' });
    }
  };
};

// Middleware untuk memverifikasi hak akses berdasarkan permission dinamis dari database
export const authorizePermissions = (...requiredPermissions) => {
  return async (req, res, next) => {
    if (!req.user || !req.user.id) {
      return res.status(401).json({ message: 'User tidak terotentikasi' });
    }

    try {
      const [userRows] = await db.promise().query(
        'SELECT role, admin_id FROM users WHERE id = ?',
        [req.user.id]
      );

      if (userRows.length === 0) {
        return res.status(404).json({ message: 'User tidak ditemukan' });
      }

      const user = userRows[0];

      // Jika owner/admin utama (admin_id IS NULL), maka memiliki wewenang penuh
      if (user.admin_id === null) {
        req.user.role = user.role;
        return next();
      }

      // Jika staf, ambil permission dari tabel roles berdasarkan admin_id dan nama role-nya
      const [roleRows] = await db.promise().query(
        'SELECT permissions FROM roles WHERE admin_id = ? AND name = ?',
        [user.admin_id, user.role]
      );

      if (roleRows.length === 0) {
        return res.status(403).json({ message: 'Akses ditolak: Role Anda tidak terdaftar di sistem' });
      }

      let permissions = [];
      try {
        permissions = JSON.parse(roleRows[0].permissions || '[]');
      } catch (e) {
        permissions = [];
      }

      // Cek apakah user memiliki minimal salah satu permission yang dibutuhkan
      const hasPermission = requiredPermissions.some(p => permissions.includes(p));

      if (hasPermission) {
        req.user.role = user.role;
        next();
      } else {
        res.status(403).json({ message: 'Akses ditolak: Anda tidak memiliki hak akses untuk aksi ini' });
      }
    } catch (err) {
      console.error('Permission authorization error:', err);
      res.status(500).json({ message: 'Terjadi kesalahan pada verifikasi hak akses' });
    }
  };
};
