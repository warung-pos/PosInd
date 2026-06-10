import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
import {
    getProducts,
    createProduct,
    updateProduct,
    deleteProduct
} from '../controllers/productController.js';

const router = express.Router();

// Konfigurasi penyimpanan multer untuk gambar produk
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

// ✅ GET Products: Semua role bisa melihat produk (termasuk Konsumen untuk katalog)
router.get('/', authenticateToken, authorizeRoles('Manager', 'Operator', 'Kasir', 'Konsumen'), getProducts);

// ✅ Write/Edit Products: Hanya Manager & Operator
router.post('/', authenticateToken, authorizeRoles('Manager', 'Operator'), upload.single('image'), createProduct);
router.put('/:id', authenticateToken, authorizeRoles('Manager', 'Operator'), upload.single('image'), updateProduct);
router.delete('/:id', authenticateToken, authorizeRoles('Manager', 'Operator'), deleteProduct);

export default router;
