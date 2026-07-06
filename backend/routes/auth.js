import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, authorizeRoles, authorizePermissions } from '../middleware/auth.js';
import {
  register,
  login,
  getProfile,
  updateProfile,
  changePassword,
  updatePlan,
  getStaff,
  createStaff,
  deleteStaff
} from '../controllers/authController.js';

const router = express.Router();

// Konfigurasi penyimpanan multer untuk avatar profil
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
    cb(null, 'profile-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

// ✅ Public Routes
router.post('/register', register);
router.post('/login', login);

// ✅ Protected Routes (Semua role terotentikasi)
router.get('/profile/:id', authenticateToken, getProfile);
router.put('/profile/:id', authenticateToken, upload.single('profile_image'), updateProfile);
router.post('/change-password/:id', authenticateToken, changePassword);

// ✅ Owner/Admin Only Routes (Membutuhkan permission 'paket')
router.put('/update-plan/:id', authenticateToken, authorizePermissions('paket'), updatePlan);

// ✅ Staff Management (Membutuhkan permission 'staf')
router.post('/staff', authenticateToken, authorizePermissions('staf'), createStaff);
router.delete('/staff/:id', authenticateToken, authorizePermissions('staf'), deleteStaff);
router.get('/staff', authenticateToken, authorizePermissions('staf'), getStaff);

export default router;