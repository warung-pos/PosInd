import db from '../config/db.js';

// 1. Bayar Transaksi
export const payTransaction = async (req, res) => {
    const { items, payment_method, user_id, cash_paid, change_due, branch } = req.body;

    if (!items || items.length === 0) {
        return res.status(400).json({ message: 'Keranjang belanja kosong' });
    }

    const subtotal = items.reduce((sum, item) => sum + (item.price * item.qty), 0);
    const fee_pos = Math.round(subtotal * 0.01);
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
        } else if (payment_method === 'Konsumen (Mandiri)') {
            paymentStatus = 'Pending';
        }

        // Simpan transaksi utama ke MySQL
        const [result] = await db.promise().query(
            'INSERT INTO transactions (invoice, user_id, total, fee_pos, method, status, cash_paid, change_due, branch) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)',
            [invoice, user_id || null, total, fee_pos, payment_method, paymentStatus, cash_paid || null, change_due || null, branch || 'Cabang Utama']
        );

        const transactionId = result.insertId;

        // Simpan item transaksi
        for (const item of items) {
            const itemSubtotal = item.price * item.qty;
            await db.promise().query(
                'INSERT INTO transaction_items (transaction_id, item_id, product_name, qty, price, subtotal) VALUES (?, ?, ?, ?, ?, ?)',
                [transactionId, item.id || null, item.name, item.qty, item.price, itemSubtotal]
            );

            // Jika pembayaran langsung sukses (Cash / E-Wallet), langsung potong stok dan tambah penjualan
            if (paymentStatus === 'Selesai') {
                await db.promise().query(
                    'UPDATE products SET stock = GREATEST(0, stock - ?), sales = sales + ? WHERE id = ?',
                    [item.qty, item.qty, item.id]
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
};

// 2. Cek Status Transaksi
export const checkTransactionStatus = async (req, res) => {
    const { invoice } = req.params;
    try {
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });
        res.json({ status: rows[0].status });
    } catch (err) {
        console.error('POS Status Check Error:', err);
        res.json({ status: 'Pending' });
    }
};

// 3. Simulasi Sukses QRIS
export const simulateSuccess = async (req, res) => {
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
                        'UPDATE products SET stock = GREATEST(0, stock - ?), sales = sales + ? WHERE id = ?',
                        [item.qty, item.qty, item.item_id]
                    );
                }
            }
        }

        res.json({ message: 'Simulasi pembayaran berhasil', status: 'Selesai' });
    } catch (err) {
        console.error('POS Simulate Success Error:', err);
        res.status(500).json({ message: 'Gagal melakukan simulasi pembayaran' });
    }
};

// 4. Ambil Semua Transaksi dengan Detail Items
export const getTransactions = async (req, res) => {
    try {
        const [transactions] = await db.promise().query(
            'SELECT * FROM transactions ORDER BY created_at DESC'
        );

        if (transactions.length === 0) return res.json([]);

        // Ambil semua items dalam 1 query
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
};

// 5. Detail 1 Transaksi
export const getTransactionDetail = async (req, res) => {
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
};
// 6. Kasir Proses Pesanan Konsumen (Pending → Selesai)
export const processConsumerOrder = async (req, res) => {
    const { invoice } = req.params;
    const { payment_method, cash_paid, change_due } = req.body;

    try {
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) return res.status(404).json({ message: 'Pesanan tidak ditemukan' });

        const transaction = rows[0];
        if (transaction.status !== 'Pending') {
            return res.status(400).json({ message: 'Pesanan ini sudah diproses atau bukan status Pending' });
        }

        // Update status dan metode pembayaran
        await db.promise().query(
            'UPDATE transactions SET status = ?, method = ?, cash_paid = ?, change_due = ? WHERE invoice = ?',
            ['Selesai', payment_method || transaction.method, cash_paid || null, change_due || null, invoice]
        );

        // Kurangi stok produk
        const [items] = await db.promise().query(
            'SELECT * FROM transaction_items WHERE transaction_id = ?',
            [transaction.id]
        );
        for (const item of items) {
            if (item.item_id) {
                await db.promise().query(
                    'UPDATE products SET stock = GREATEST(0, stock - ?), sales = sales + ? WHERE id = ?',
                    [item.qty, item.qty, item.item_id]
                );
            }
        }

        res.json({ message: 'Pesanan berhasil diproses', status: 'Selesai' });
    } catch (err) {
        console.error('Process Consumer Order Error:', err);
        res.status(500).json({ message: 'Gagal memproses pesanan' });
    }
};

// 7. Riwayat Pesanan Konsumen (filter by user_id)
export const getMyOrders = async (req, res) => {
    const { user_id } = req.query;
    if (!user_id) return res.status(400).json({ message: 'user_id wajib disertakan' });

    try {
        const [transactions] = await db.promise().query(
            'SELECT * FROM transactions WHERE user_id = ? ORDER BY created_at DESC',
            [user_id]
        );

        if (transactions.length === 0) return res.json([]);

        const transactionIds = transactions.map(t => t.id);
        const [allItems] = await db.promise().query(
            'SELECT * FROM transaction_items WHERE transaction_id IN (?)',
            [transactionIds]
        );

        const result = transactions.map(t => ({
            ...t,
            items: allItems.filter(item => item.transaction_id === t.id)
        }));

        res.json(result);
    } catch (err) {
        console.error('GET my orders error:', err);
        res.status(500).json({ message: 'Gagal mengambil riwayat pesanan' });
    }
};

// 8. Ambil Pesanan Masuk (Pending) untuk Kasir
export const getPendingOrders = async (req, res) => {
    try {
        const [transactions] = await db.promise().query(
            "SELECT * FROM transactions WHERE status = 'Pending' ORDER BY created_at ASC"
        );

        if (transactions.length === 0) return res.json([]);

        const transactionIds = transactions.map(t => t.id);
        const [allItems] = await db.promise().query(
            'SELECT * FROM transaction_items WHERE transaction_id IN (?)',
            [transactionIds]
        );

        const result = transactions.map(t => ({
            ...t,
            items: allItems.filter(item => item.transaction_id === t.id)
        }));

        res.json(result);
    } catch (err) {
        console.error('GET pending orders error:', err);
        res.status(500).json({ message: 'Gagal mengambil pesanan masuk' });
    }
};

// 9. Konfirmasi Pembayaran QRIS Consumer (Simulasi SmartBank)
export const confirmConsumerPayment = async (req, res) => {
    const { invoice } = req.body;
    if (!invoice) return res.status(400).json({ message: 'Invoice wajib diisi' });

    try {
        const [rows] = await db.promise().query('SELECT * FROM transactions WHERE invoice = ?', [invoice]);
        if (rows.length === 0) return res.status(404).json({ message: 'Transaksi tidak ditemukan' });

        const transaction = rows[0];
        if (transaction.status === 'Selesai') {
            return res.json({ message: 'Transaksi sudah selesai', invoice, status: 'Selesai' });
        }

        // Tandai sebagai Selesai
        await db.promise().query('UPDATE transactions SET status = ? WHERE invoice = ?', ['Selesai', invoice]);

        // Potong stok produk
        const [items] = await db.promise().query(
            'SELECT * FROM transaction_items WHERE transaction_id = ?',
            [transaction.id]
        );
        for (const item of items) {
            await db.promise().query(
                'UPDATE products SET stock = GREATEST(0, stock - ?), sales = sales + ? WHERE id = ?',
                [item.qty, item.qty, item.item_id]
            );
        }

        res.json({ message: 'Pembayaran QRIS dikonfirmasi', invoice, status: 'Selesai' });
    } catch (err) {
        console.error('Confirm consumer payment error:', err);
        res.status(500).json({ message: 'Gagal mengkonfirmasi pembayaran' });
    }
};

