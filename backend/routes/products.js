import express from 'express';
const router = express.Router();
import db from '../config/db.js';

// 1. Ambil Semua Produk
router.get('/', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM products ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil data produk' });
    }
});

// 2. Tambah Produk Baru
router.post('/', async (req, res) => {
    const { name, price, stock, category } = req.body;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO products (name, price, stock, category) VALUES (?, ?, ?, ?)',
            [name, price, stock, category]
        );
        res.status(201).json({ id: result.insertId, name, price, stock, category });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menambah produk' });
    }
});

// 3. Update Produk
router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    try {
        await db.promise().query(
            'UPDATE products SET name = ?, price = ?, stock = ?, category = ? WHERE id = ?',
            [name, price, stock, category, id]
        );
        res.json({ message: 'Produk berhasil diupdate' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal update produk' });
    }
});

// 4. Hapus Produk
router.delete('/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await db.promise().query('DELETE FROM products WHERE id = ?', [id]);
        res.json({ message: 'Produk berhasil dihapus' });
    } catch (err) {
        res.status(500).json({ message: 'Gagal menghapus produk' });
    }
});

export default router;
