import express from 'express';
const router = express.Router();
import db from '../config/db.js';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

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
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

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
router.post('/', upload.single('image'), async (req, res) => {
    const { name, price, stock, category } = req.body;
    const image = req.file ? req.file.filename : null;
    try {
        const [result] = await db.promise().query(
            'INSERT INTO products (name, price, stock, category, image) VALUES (?, ?, ?, ?, ?)',
            [name, price, stock, category || 'Minuman', image]
        );
        res.status(201).json({ id: result.insertId, name, price, stock, category, image });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal menambah produk' });
    }
});

// 3. Update Produk
router.put('/:id', upload.single('image'), async (req, res) => {
    const { id } = req.params;
    const { name, price, stock, category } = req.body;
    
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
            'UPDATE products SET name = ?, price = ?, stock = ?, category = ?, image = ? WHERE id = ?',
            [name, price, stock, category || 'Minuman', image, id]
        );
        res.json({ message: 'Produk berhasil diupdate', image });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Gagal update produk' });
    }
});

// 4. Hapus Produk
router.delete('/:id', async (req, res) => {
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
});

export default router;

