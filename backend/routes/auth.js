import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { authenticateToken, authorizeRoles } from '../middleware/auth.js';
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

// ✅ Owner/Manager Only Routes
router.put('/update-plan/:id', authenticateToken, authorizeRoles('Manager'), updatePlan);
router.post('/staff', authenticateToken, authorizeRoles('Manager'), createStaff);
router.delete('/staff/:id', authenticateToken, authorizeRoles('Manager'), deleteStaff);

// ✅ Manager & Operator Shared Routes
router.get('/staff', authenticateToken, authorizeRoles('Manager', 'Operator'), getStaff);

export default router;