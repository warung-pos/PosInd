import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import db from '../config/db.js';
import path from 'path';
import fs from 'fs';

// ✅ REGISTER
export const register = async (req, res) => {
  const { name, username, email, password, role: requestedRole } = req.body;
  const displayName = name || username || 'Pengguna';

  // Hanya Manager dan Konsumen yang bisa self-register
  const allowedSelfRegisterRoles = ['Manager', 'Konsumen'];
  const role = allowedSelfRegisterRoles.includes(requestedRole) ? requestedRole : 'Manager';

  if (!email || !password) {
    return res.status(400).json({ message: 'Email dan password wajib diisi' });
  }

  const trimmedEmail = email.trim();

  try {
    // 1. Cek apakah email sudah terdaftar terlebih dahulu
    const [existingUsers] = await db.promise().query(
      'SELECT id FROM users WHERE email = ?',
      [trimmedEmail]
    );

    if (existingUsers.length > 0) {
      return res.status(400).json({ message: 'Email sudah digunakan' });
    }

    // 2. Hash password dan simpan user baru
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await db.promise().query(
      'INSERT INTO users (email, password, name, role) VALUES (?, ?, ?, ?)',
      [trimmedEmail, hashedPassword, displayName, role]
    );

    const userId = result.insertId;
    const token = jwt.sign(
      { id: userId, email: trimmedEmail },
      process.env.JWT_SECRET || 'rahasia_super_aman',
      { expiresIn: '1d' }
    );

    res.json({
      message: 'Register berhasil',
      token,
      user: {
        id: userId,
        email: trimmedEmail,
        name: displayName,
        role: role,
        profile_image: null,
        plan: 'basic'
      }
    });
  } catch (err) {
    console.error('Register Error:', err);
    res.status(500).json({ message: 'Terjadi kesalahan pada server' });
  }
};

// ✅ LOGIN
export const login = (req, res) => {
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
        process.env.JWT_SECRET || 'rahasia_super_aman',
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
};

// ✅ GET PROFILE
export const getProfile = async (req, res) => {
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
};

// ✅ UPDATE PROFILE
export const updateProfile = async (req, res) => {
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
};

// ✅ CHANGE PASSWORD
export const changePassword = async (req, res) => {
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
};

// ✅ UPDATE PLAN (Synchronizes to staff accounts as well)
export const updatePlan = async (req, res) => {
  const { id } = req.params;
  const { plan } = req.body;

  if (!plan) {
    return res.status(400).json({ message: 'Plan wajib diisi' });
  }

  try {
    const [rows] = await db.promise().query('SELECT id FROM users WHERE id = ?', [id]);
    if (rows.length === 0) return res.status(404).json({ message: 'User tidak ditemukan' });

    await db.promise().query('UPDATE users SET plan = ? WHERE id = ? OR admin_id = ?', [plan, id, id]);
    res.json({ message: 'Plan berhasil diperbarui', plan });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal memperbarui plan' });
  }
};

// ✅ GET STAFF (Fetch all cashiers under an admin)
export const getStaff = async (req, res) => {
  const { admin_id } = req.query;
  if (!admin_id) {
    return res.status(400).json({ message: 'admin_id wajib disertakan' });
  }
  try {
    const [rows] = await db.promise().query(
      'SELECT id, email, name, role, profile_image, plan FROM users WHERE admin_id = ? ORDER BY id DESC',
      [admin_id]
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal mengambil data staf' });
  }
};

// ✅ POST STAFF (Create staff under a manager with subscription limits check)
export const createStaff = async (req, res) => {
  const { name, email, password, role, admin_id } = req.body;

  if (!email || !password || !name || !admin_id) {
    return res.status(400).json({ message: 'Semua kolom wajib diisi' });
  }

  // Role yang boleh dibuat oleh Manager
  const allowedStaffRoles = ['Operator', 'Kasir', 'Konsumen'];
  const staffRole = allowedStaffRoles.includes(role) ? role : 'Kasir';

  try {
    // 1. Get Manager Details (specifically their plan)
    const [adminRows] = await db.promise().query('SELECT plan FROM users WHERE id = ?', [admin_id]);
    if (adminRows.length === 0) {
      return res.status(404).json({ message: 'Manager tidak ditemukan' });
    }
    const adminPlan = adminRows[0].plan || 'basic';

    // 2. Enforce limits based on subscription plan
    if (adminPlan.toLowerCase().includes('basic')) {
      return res.status(403).json({
        message: 'Paket Basic hanya mendukung 1 pengguna (Manager saja). Silakan upgrade ke paket Pro atau Enterprise untuk menambah staf.'
      });
    } else if (adminPlan.toLowerCase().includes('pro')) {
      const [countRows] = await db.promise().query('SELECT COUNT(*) as total FROM users WHERE admin_id = ?', [admin_id]);
      if (countRows[0].total >= 4) { // Manager (1) + Staff (4) = 5 users total
        return res.status(403).json({
          message: 'Batas pengguna untuk paket Pro adalah 5 pengguna (1 Manager + 4 Staf). Silakan upgrade ke paket Enterprise untuk staf tak terbatas.'
        });
      }
    }

    // 3. Create staff user
    const hashedPassword = await bcrypt.hash(password, 10);
    db.query(
      'INSERT INTO users (email, password, name, role, plan, admin_id) VALUES (?, ?, ?, ?, ?, ?)',
      [email, hashedPassword, name, staffRole, adminPlan, admin_id],
      (err, result) => {
        if (err) {
          return res.status(500).json({ message: 'Email sudah digunakan oleh pengguna lain' });
        }
        res.status(201).json({
          message: 'Staf berhasil didaftarkan',
          user: {
            id: result.insertId,
            email,
            name,
            role: staffRole,
            plan: adminPlan,
            admin_id
          }
        });
      }
    );
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error saat mendaftarkan staf' });
  }
};

// ✅ DELETE STAFF (Delete cashier under an admin)
export const deleteStaff = async (req, res) => {
  const { id } = req.params;
  const { admin_id } = req.query;

  if (!admin_id) {
    return res.status(400).json({ message: 'admin_id wajib disertakan untuk verifikasi' });
  }

  try {
    // Delete profile image if exists
    const [rows] = await db.promise().query('SELECT profile_image FROM users WHERE id = ? AND admin_id = ?', [id, admin_id]);
    if (rows.length === 0) {
      return res.status(404).json({ message: 'Staf tidak ditemukan atau Anda tidak berwenang' });
    }

    if (rows[0].profile_image) {
      const imgPath = path.join('uploads', rows[0].profile_image);
      if (fs.existsSync(imgPath)) {
        fs.unlinkSync(imgPath);
      }
    }

    await db.promise().query('DELETE FROM users WHERE id = ? AND admin_id = ?', [id, admin_id]);
    res.json({ message: 'Staf berhasil dihapus' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Gagal menghapus staf' });
  }
};
