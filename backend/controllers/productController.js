import db from '../config/db.js';
import path from 'path';
import fs from 'fs';

// 1. Ambil Semua Produk (dengan filter Cabang)
export const getProducts = async (req, res) => {
    const { branch } = req.query;
    try {
        let query = 'SELECT * FROM products';
        let params = [];
        if (branch) {
            query += ' WHERE branch = ?';
            params.push(branch);
        }
        query += ' ORDER BY created_at DESC';
        const [rows] = await db.promise().query(query, params);
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil data produk' });
    }
};

// 2. Tambah Produk Baru
export const createProduct = async (req, res) => {
    const { name, price, stock, category, branch } = req.body;
    const image = req.file ? req.file.filename : null;
    const userId = req.headers['x-user-id'] || (req.user ? req.user.id : null);

    try {
        // Enforce product limit for Basic plan
        if (userId) {
            const [userRows] = await db.promise().query('SELECT plan FROM users WHERE id = ?', [userId]);
            if (userRows.length > 0) {
                const userPlan = userRows[0].plan || 'basic';
                if (userPlan.toLowerCase().includes('basic')) {
                    const [prodCountRows] = await db.promise().query('SELECT COUNT(*) as total FROM products');
                    if (prodCountRows[0].total >= 30) {
                        return res.status(403).json({
                            message: 'Batas produk untuk paket Basic adalah 30 produk. Silakan upgrade ke paket Pro atau Enterprise.'
                        });
                    }
                }
            }
        }

        const [result] = await db.promise().query(
            'INSERT INTO products (name, price, stock, category, image, branch) VALUES (?, ?, ?, ?, ?, ?)',
            [name, price, stock, category || 'Minuman', image, branch || 'Cabang Utama']
        );
        res.status(201).json({ id: result.insertId, name, price, stock, category, image, branch: branch || 'Cabang Utama' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menambah produk' });
    }
};

// 3. Update Produk
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category, branch } = req.body;
    
    try {
        // Ambil gambar produk lama untuk dihapus jika diganti
        const [rows] = await db.promise().query('SELECT image FROM products WHERE id = ?', [id]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Produk tidak ditemukan' });
        }

        let image = rows[0].image;
        if (req.file) {
            if (image) {
                const oldPath = path.join('uploads', image);
                if (fs.existsSync(oldPath)) {
                    fs.unlinkSync(oldPath);
                }
            }
            image = req.file.filename;
        }

        await db.promise().query(
            'UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image = ?, branch = ? WHERE id = ?',
            [name, price, stock, category || 'Minuman', image, branch || 'Cabang Utama', id]
        );
        res.json({ message: 'Produk berhasil diupdate', image, branch: branch || 'Cabang Utama' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal update produk' });
    }
};

// 4. Hapus Produk
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    try {
        // Hapus file gambar produk dari disk jika ada
        const [rows] = await db.promise().query('SELECT image FROM products WHERE id = ?', [id]);
        if (rows.length > 0 && rows[0].image) {
            const oldPath = path.join('uploads', rows[0].image);
            if (fs.existsSync(oldPath)) {
                fs.unlinkSync(oldPath);
            }
        }

        await db.promise().query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus produk' });
    }
};
