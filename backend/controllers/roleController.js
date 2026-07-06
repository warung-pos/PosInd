import db from '../config/db.js';

// ✅ GET ALL ROLES (for the logged in user's company)
export const getRoles = async (req, res) => {
  try {
    const userId = req.user.id;

    // Ambil info user untuk tahu admin_id nya
    const [userRows] = await db.promise().query(
      'SELECT id, role, admin_id FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = userRows[0];
    const companyAdminId = user.admin_id || user.id;

    const [rows] = await db.promise().query(
      'SELECT id, admin_id, name, permissions, is_default, created_at FROM roles WHERE admin_id = ? ORDER BY is_default DESC, id ASC',
      [companyAdminId]
    );

    // Parse permissions JSON string ke Array untuk frontend
    const formattedRoles = rows.map(role => {
      let permissions = [];
      try {
        permissions = typeof role.permissions === 'string' ? JSON.parse(role.permissions) : role.permissions;
      } catch (e) {
        permissions = [];
      }
      return {
        ...role,
        permissions
      };
    });

    res.json(formattedRoles);
  } catch (err) {
    console.error('Error in getRoles:', err);
    res.status(500).json({ message: 'Gagal mengambil data role' });
  }
};

// ✅ CREATE CUSTOM ROLE
export const createRole = async (req, res) => {
  const { name, permissions } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Nama role wajib diisi' });
  }

  const permissionsStr = JSON.stringify(permissions || []);

  try {
    // Ambil info user
    const [userRows] = await db.promise().query(
      'SELECT id, role, admin_id FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = userRows[0];
    // Hanya Admin utama (owner) yang boleh menambah/mengubah role
    if (user.admin_id !== null) {
      return res.status(403).json({ message: 'Hanya Admin utama yang dapat mengelola role' });
    }

    const companyAdminId = user.id;

    // Cek apakah role dengan nama yang sama sudah ada untuk admin ini
    const [existing] = await db.promise().query(
      'SELECT id FROM roles WHERE admin_id = ? AND name = ?',
      [companyAdminId, name.trim()]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Nama role sudah terdaftar' });
    }

    const [result] = await db.promise().query(
      'INSERT INTO roles (admin_id, name, permissions, is_default) VALUES (?, ?, ?, 0)',
      [companyAdminId, name.trim(), permissionsStr]
    );

    res.status(201).json({
      message: 'Role berhasil dibuat',
      role: {
        id: result.insertId,
        admin_id: companyAdminId,
        name: name.trim(),
        permissions: permissions || [],
        is_default: 0
      }
    });
  } catch (err) {
    console.error('Error in createRole:', err);
    res.status(500).json({ message: 'Gagal membuat role' });
  }
};

// ✅ UPDATE ROLE
export const updateRole = async (req, res) => {
  const { id } = req.params;
  const { name, permissions } = req.body;
  const userId = req.user.id;

  if (!name) {
    return res.status(400).json({ message: 'Nama role wajib diisi' });
  }

  const permissionsStr = JSON.stringify(permissions || []);

  try {
    const [userRows] = await db.promise().query(
      'SELECT id, role, admin_id FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = userRows[0];
    if (user.admin_id !== null) {
      return res.status(403).json({ message: 'Hanya Admin utama yang dapat mengelola role' });
    }

    const companyAdminId = user.id;

    // Cek keberadaan role
    const [roleRows] = await db.promise().query(
      'SELECT * FROM roles WHERE id = ? AND admin_id = ?',
      [id, companyAdminId]
    );

    if (roleRows.length === 0) {
      return res.status(404).json({ message: 'Role tidak ditemukan atau Anda tidak berwenang' });
    }

    const existingRole = roleRows[0];

    // Jika default role, batasi agar tidak bisa edit nama (tapi boleh edit permissions)
    if (existingRole.is_default === 1 && existingRole.name !== name.trim()) {
      return res.status(400).json({ message: 'Nama role default tidak dapat diubah' });
    }

    // Jika nama berubah, cek duplikasi nama lain
    if (existingRole.name !== name.trim()) {
      const [duplicate] = await db.promise().query(
        'SELECT id FROM roles WHERE admin_id = ? AND name = ? AND id != ?',
        [companyAdminId, name.trim(), id]
      );
      if (duplicate.length > 0) {
        return res.status(400).json({ message: 'Nama role sudah terdaftar' });
      }
    }

    await db.promise().query(
      'UPDATE roles SET name = ?, permissions = ? WHERE id = ? AND admin_id = ?',
      [name.trim(), permissionsStr, id, companyAdminId]
    );

    res.json({
      message: 'Role berhasil diperbarui',
      role: {
        id: parseInt(id),
        admin_id: companyAdminId,
        name: name.trim(),
        permissions: permissions || [],
        is_default: existingRole.is_default
      }
    });
  } catch (err) {
    console.error('Error in updateRole:', err);
    res.status(500).json({ message: 'Gagal memperbarui role' });
  }
};

// ✅ DELETE ROLE
export const deleteRole = async (req, res) => {
  const { id } = req.params;
  const userId = req.user.id;

  try {
    const [userRows] = await db.promise().query(
      'SELECT id, role, admin_id FROM users WHERE id = ?',
      [userId]
    );

    if (userRows.length === 0) {
      return res.status(404).json({ message: 'User tidak ditemukan' });
    }

    const user = userRows[0];
    if (user.admin_id !== null) {
      return res.status(403).json({ message: 'Hanya Admin utama yang dapat mengelola role' });
    }

    const companyAdminId = user.id;

    // Cek keberadaan role
    const [roleRows] = await db.promise().query(
      'SELECT * FROM roles WHERE id = ? AND admin_id = ?',
      [id, companyAdminId]
    );

    if (roleRows.length === 0) {
      return res.status(404).json({ message: 'Role tidak ditemukan atau Anda tidak berwenang' });
    }

    const roleToDelete = roleRows[0];

    // Cek jika default role
    if (roleToDelete.is_default === 1) {
      return res.status(400).json({ message: 'Role bawaan sistem tidak dapat dihapus' });
    }

    // Cek jika ada staff yang sedang menggunakan role ini
    const [staffRows] = await db.promise().query(
      'SELECT id FROM users WHERE admin_id = ? AND role = ? LIMIT 1',
      [companyAdminId, roleToDelete.name]
    );

    if (staffRows.length > 0) {
      return res.status(400).json({ 
        message: `Role "${roleToDelete.name}" sedang digunakan oleh staf Anda. Silakan ubah dahulu role staf tersebut sebelum menghapus role ini.` 
      });
    }

    await db.promise().query(
      'DELETE FROM roles WHERE id = ? AND admin_id = ?',
      [id, companyAdminId]
    );

    res.json({ message: 'Role berhasil dihapus' });
  } catch (err) {
    console.error('Error in deleteRole:', err);
    res.status(500).json({ message: 'Gagal menghapus role' });
  }
};
