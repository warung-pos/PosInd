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

      if (allowedRoles.includes(userRole)) {
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
