import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const router = express.Router();
import db from '../config/db.js';
import midtransClient from 'midtrans-client';

// Fungsi helper Midtrans Core API
const getCoreApi = () => {
    return new midtransClient.CoreApi({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY || '',
        clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
    });
};

// ✅ Endpoint: POST /api/pos/pay
router.post('/pay', async (req, res) => {
    const { items, payment_method, user_id, cash_paid, change_due } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja kosong' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const fee_pos = 2500;
    const total = subtotal + fee_pos;
    const invoice = `INV-${Date.now()}`;

    try {
        let paymentStatus = 'Selesai';
        let qrisUrl = null;
        let qrString = null;

        if (payment_method === 'SmartBank (QRIS)') {
            paymentStatus = 'Pending';
            qrString = '00020101021226660014ID.CO.QRIS.WWW0215ID10200234567890303000';
            qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=220x220`;
        }

        // Simpan transaksi utama ke MySQL
        const [result] = await db.promise().query(
            'INSERT INTO transactions (invoice, user_id, total, fee_pos, method, status, cash_paid, change_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [invoice, user_id || null, total, fee_pos, payment_method, paymentStatus, cash_paid || null, change_due || null]
        );

        const transactionId = result.insertId;

        // ✅ Simpan item transaksi: snapshot nama produk + subtotal sebagai bukti permanen
        for (const item of items) {
            const itemSubtotal = item.price * item.qty;
            await db.promise().query(
                'INSERT INTO transaction_items (transaction_id, item_id, product_name, qty, price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [transactionId, item.id || null, item.name, item.qty, item.price, itemSubtotal]
            );

            // Jika pembayaran langsung sukses (Cash / E-Wallet), langsung potong stok
            if (paymentStatus === 'Selesai') {
                await db.promise().query(
                    'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                    [item.qty, item.id]
                );
            }
        }

        res.status(201).json({
            message: 'Transaksi Berhasil Di-init',
            invoice,
            total,
            fee_pos,
            status: paymentStatus,
            qrisUrl,
            qrString
        });

    } catch (err) {
        console.error('POS Pay Error:', err);
        res.status(500).json({ message: err.message || 'Terjadi kesalahan pada server' });
    }
});

// ✅ Endpoint: GET /api/pos/status/:invoice
router.get('/status/:invoice', async (req, res) => {
    const { invoice } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        res.json({ status: rows[0].status });
    } catch (err) {
        console.error('POS Status Check Error:', err);
        res.json({ status: 'Pending' });
    }
});

// ✅ Endpoint: POST /api/pos/simulate-success/:invoice
router.post('/simulate-success/:invoice', async (req, res) => {
    const { invoice } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const transaction = rows[0];

        if (transaction.status === 'Pending') {
            await db.promise().query('UPDATE transactions SET status = ? WHERE invoice = ?', ['Selesai', invoice]);

            const [items] = await db.promise().query(
                'SELECT * FROM transaction_items WHERE transaction_id = ?',
                [transaction.id]
            );

            for (const item of items) {
                if (item.item_id) {
                    await db.promise().query(
                        'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                        [item.qty, item.item_id]
                    );
                }
            }
        }

        res.json({ message: 'Simulasi pembayaran berhasil', status: 'Selesai' });
    } catch (err) {
        console.error('POS Simulate Success Error:', err);
        res.status(500).json({ message: 'Gagal melakukan simulasi pembayaran' });
    }
});

// ✅ Endpoint: GET /api/pos/transactions — list semua transaksi beserta detail item
router.get('/transactions', async (req, res) => {
    try {
        const [transactions] = await db.promise().query(
            'SELECT * FROM transactions ORDER BY created_at DESC'
        );

        if (transactions.length === 0) return res.json([]);

        // Ambil semua items dalam 1 query (efisien)
        const transactionIds = transactions.map(t => t.id);
        const [allItems] = await db.promise().query(
            'SELECT * FROM transaction_items WHERE transaction_id IN (?)',
            [transactionIds]
        );

        // Gabungkan items ke transaksi masing-masing
        const result = transactions.map(t => ({
            ...t,
            items: allItems.filter(item => item.transaction_id === t.id)
        }));

        res.json(result);
    } catch (err) {
        console.error('GET transactions error:', err);
        res.status(500).json({ message: 'Gagal mengambil riwayat' });
    }
});

// ✅ Endpoint: GET /api/pos/transactions/:id — detail 1 transaksi
router.get('/transactions/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE id = ?', [id]);
        if (rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const [items] = await db.promise().query(
            'SELECT * FROM transaction_items WHERE transaction_id = ?', [id]
        );

        res.json({ ...rows[0], items });
    } catch (err) {
        console.error('GET transaction detail error:', err);
        res.status(500).json({ message: 'Gagal mengambil detail transaksi' });
    }
});

export default router;
