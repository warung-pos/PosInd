import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
const router = express.Router();
import db from '../config/db.js';
import midtransClient from 'midtrans-client';


// Fungsi helper untuk mendapatkan instance Midtrans Core API secara dinamis setelah dotenv terisi
const getCoreApi = () => {
    console.log("SERVER KEY:", process.env.MIDTRANS_SERVER_KEY);
    console.log("CLIENT KEY:", process.env.MIDTRANS_CLIENT_KEY);

    return new midtransClient.CoreApi({
        isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
        serverKey: process.env.MIDTRANS_SERVER_KEY || '',
        clientKey: process.env.MIDTRANS_CLIENT_KEY || ''
    });
};

// Endpoint: POST /api/pos/pay
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

        // Jika metode pembayaran adalah QRIS, generate QRIS dummy/simulasi
        if (payment_method === 'SmartBank (QRIS)') {
            paymentStatus = 'Pending';
            // Gunakan QRIS string simulasi yang valid untuk generator QR
            qrString = '00020101021226660014ID.CO.QRIS.WWW0215ID10200234567890303000';
            qrisUrl = `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(qrString)}&size=220x220`;
        }

        // Simpan transaksi utama ke MySQL
        const [result] = await db.promise().query(
            'INSERT INTO transactions (invoice, user_id, total, fee_pos, method, status, cash_paid, change_due) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [invoice, user_id || null, total, fee_pos, payment_method, paymentStatus, cash_paid || null, change_due || null]
        );

        const transactionId = result.insertId;

        // Simpan item transaksi ke MySQL
        for (const item of items) {
            await db.promise().query(
                'INSERT INTO transaction_items (transaction_id, item_id, qty, price) VALUES (?, ?, ?, ?)',
                [transactionId, item.id, item.qty, item.price]
            );

            // Jika pembayaran langsung sukses (Tunai / E-Wallet), langsung potong stok
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

// Endpoint: GET /api/pos/status/:invoice
router.get('/status/:invoice', async (req, res) => {
    const { invoice } = req.params;

    try {
        // Ambil transaksi lokal dari DB
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        const transaction = rows[0];
        res.json({ status: transaction.status });

    } catch (err) {
        console.error('POS Status Check Error:', err);
        res.json({ status: 'Pending' });
    }
});

// Endpoint: POST /api/pos/simulate-success/:invoice
router.post('/simulate-success/:invoice', async (req, res) => {
    const { invoice } = req.params;

    try {
        // Ambil transaksi lokal dari DB
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) {
            return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        }

        const transaction = rows[0];

        if (transaction.status === 'Pending') {
            // Update status menjadi Selesai di DB
            await db.promise().query('UPDATE transactions SET status = ? WHERE invoice = ?', ['Selesai', invoice]);

            // Ambil items dari transaksi ini
            const [items] = await db.promise().query(
                'SELECT * FROM transaction_items WHERE transaction_id = ?', 
                [transaction.id]
            );

            // Kurangi stok masing-masing produk
            for (const item of items) {
                await db.promise().query(
                    'UPDATE products SET stock = GREATEST(0, stock - ?) WHERE id = ?',
                    [item.qty, item.item_id]
                );
            }
        }

        res.json({ message: 'Simulasi pembayaran berhasil', status: 'Selesai' });

    } catch (err) {
        console.error('POS Simulate Success Error:', err);
        res.status(500).json({ message: 'Gagal melakukan simulasi pembayaran' });
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

