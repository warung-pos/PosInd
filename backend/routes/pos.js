import express from 'express';
import { authenticateToken, authorizePermissions } from '../middleware/auth.js';
import {
    payTransaction,
    checkTransactionStatus,
    simulateSuccess,
    getTransactions,
    getTransactionDetail,
    processConsumerOrder,
    getMyOrders,
    getPendingOrders,
    confirmConsumerPayment,
} from '../controllers/posController.js';

const router = express.Router();

// ✅ Melindungi seluruh rute POS dengan middleware authenticateToken
router.use(authenticateToken);

// ✅ Rute POS Umum
router.post('/pay', payTransaction);
router.get('/status/:invoice', checkTransactionStatus);
router.post('/simulate-success/:invoice', simulateSuccess);
router.get('/transactions', getTransactions);
router.get('/transactions/:id', getTransactionDetail);

// ✅ Rute Konsumen
router.get('/my-orders', getMyOrders);
router.put('/confirm-consumer', confirmConsumerPayment);

// ✅ Rute Kasir — Kelola Pesanan Masuk dari Konsumen (Membutuhkan permission 'pesanan' atau 'transaksi')
router.get('/pending-orders', authorizePermissions('pesanan', 'transaksi'), getPendingOrders);
router.post('/process/:invoice', authorizePermissions('pesanan', 'transaksi'), processConsumerOrder);

export default router;
