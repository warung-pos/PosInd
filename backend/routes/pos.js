import express from 'express';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    payTransaction,
    checkTransactionStatus,
    simulateSuccess,
    getTransactions,
    getTransactionDetail,
    processConsumerOrder,
    getMyOrders,
    getPendingOrders,
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

// ✅ Rute Kasir — Kelola Pesanan Masuk dari Konsumen
router.get('/pending-orders', authorizeRoles('Kasir', 'Manager'), getPendingOrders);
router.post('/process/:invoice', authorizeRoles('Kasir', 'Manager'), processConsumerOrder);

export default router;
