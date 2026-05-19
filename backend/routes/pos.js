import express from 'express';
const router = express.Router();
import db from '../config/db.js';

// Endpoint: POST /api/pos/pay
router.post('/pay', async (req, res) => {
    const { items, payment_method, user_id } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja kosong' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const fee_pos = 2500; 
    const total = subtotal + fee_pos;
    const invoice = `INV-${Date.now()}`;

    try {
        const paymentStatus = 'Selesai'; 

        const [result] = await db.promise().query(
            'INSERT INTO transactions (invoice, user_id, total, fee_pos, method, status) VALUES (?, ?, ?, ?, ?, ?)',
            [invoice, user_id || null, total, fee_pos, payment_method, paymentStatus]
        );

        const transactionId = result.insertId;

        for (const item of items) {
            await db.promise().query(
                'INSERT INTO transaction_items (transaction_id, item_id, qty, price) VALUES (?, ?, ?, ?)',
                [transactionId, item.id, item.qty, item.price]
            );
        }

        res.status(201).json({
            message: 'Transaksi Berhasil',
            invoice,
            total,
            fee_pos,
            status: paymentStatus
        });

    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Terjadi kesalahan pada server' });
    }
});

// Endpoint: GET /api/pos/transactions
router.get('/transactions', async (req, res) => {
    try {
        const [rows] = await db.promise().query('SELECT * FROM transactions ORDER BY created_at DESC');
        res.json(rows);
    } catch (err) {
        res.status(500).json({ message: 'Gagal mengambil riwayat' });
    }
});

export default router;
