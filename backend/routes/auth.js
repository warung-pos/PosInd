import express from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// Konfigurasi penyimpanan multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const dir = 'uploads/';
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ✅ REGISTER (simpan ke database)
router.post('/register', async (req, res) => {
  const { name, username, email, password } = req.body;
  const displayName = name || username || 'Admin User';

  try {
    const hashedPassword = await bcrypt.hash(password, 10);

    db.query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [email, hashedPassword, displayName, 'Admin'],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Email sudah digunakan' });
        }

        const userId = result.insertId;
        const token = jwt.sign(
          { id: userId, email: email },
          process.env.JWT_SECRET || 'secret',
          { expiresIn: '1d' }
        );

        res.json({
          message: 'Register berhasil',
          token,
          user: {
            id: userId,
            email: email,
            name: displayName,
            role: 'Admin',
            profile_image: null,
            plan: 'basic'
          }
        });
      }
    );
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});


// ✅ LOGIN (ambil dari database)
router.post('/login', (req, res) => {
  const { email, password } = req.body;

  db.query(
    'SELECT * FROM users WHERE email = ?',
    [email],
    async (err, results) => {
      if (err) {
        return res.status(500).json({ message: 'Server error' });
      }

      if (results.length === 0) {
        return res.status(401).json({ message: 'User tidak ditemukan' });
      }

      const user = results[0];

      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.status(401).json({ message: 'Password salah' });
      }

      const token = jwt.sign(
        { id: user.id, email: user.email },
        process.env.JWT_SECRET || 'secret',
        { expiresIn: '1d' }
      );

      res.json({
        message: 'Login berhasil',
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          profile_image: user.profile_image,
          plan: user.plan
        }
      });
    }
  );
});

// ✅ GET PROFILE
router.get('/profile/:id', async (req, res) => {
  try {
    const [rows] = await db.promise().query('SELECT id, email, name, role, profile_image, plan FROM users WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil profile' });
  }
});

// ✅ UPDATE PROFILE
router.put('/profile/:id', upload.single('profile_image'), async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  try {
    const [rows] = await db.promise().query('SELECT profile_image FROM users WHERE id = ?', [id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    let image = rows[0].profile_image;

    // Jika ada file gambar baru yg diupload
    if (req.file) {
      // Hapus gambar lama jika ada
      if (image) {
        const oldPath = path.join('uploads', image);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
      image = req.file.filename;
    }

    await db.promise().query(
      'UPDATE users SET name = ?, email = ?, profile_image = ? WHERE id = ?',
      [name, email, image, id]
    );

    // Return updated user data
    const [updatedRows] = await db.promise().query('SELECT id, email, name, role, profile_image, plan FROM users WHERE id = ?', [id]);
    res.json({ message: 'Profile berhasil diupdate', user: updatedRows[0] });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal update profile' });
  }
});

// ✅ CHANGE PASSWORD
router.post('/change-password/:id', async (req, res) => {
  const { id } = req.params;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return res.status(400).json({ message: 'Password lama dan baru wajib diisi' });
  }
  if (newPassword.length < 6) {
    return res.status(400).json({ message: 'Password baru minimal 6 karakter' });
  }

  try {
    const [rows] = await db.promise().query('SELECT password FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    const isMatch = await bcrypt.compare(oldPassword, rows[0].password);
    if (!isMatch) return res.status(401).json({ message: 'Password lama tidak sesuai' });

    const hashed = await bcrypt.hash(newPassword, 10);
    await db.promise().query('UPDATE users SET password = ? WHERE id = ?', [hashed, id]);
    res.json({ message: 'Password berhasil diubah' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengubah password' });
  }
});

// ✅ UPDATE PLAN
router.put('/update-plan/:id', async (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).json({ message: 'Plan wajib diisi' });
  }

  try {
    const [rows] = await db.promise().query('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    await db.promise().query('UPDATE users SET plan = ? WHERE id = ?', [plan, id]);
    res.json({ message: 'Plan berhasil diperbarui', plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui plan' });
  }
});

export default router;