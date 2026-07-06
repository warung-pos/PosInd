import express from 'express';
import { authenticateToken } from '../middleware/auth.js';
import {
  getRoles,
  createRole,
  updateRole,
  deleteRole
} from '../controllers/roleController.js';

const router = express.Router();

// Semua rute ini membutuhkan token autentikasi
router.use(authenticateToken);

// Admin & Staff bisa mendapatkan daftar role di perusahaan mereka
router.get('/', getRoles);

// Hanya Owner/Admin utama (admin_id IS NULL) yang boleh create, update, delete
router.post('/', createRole);
router.put('/:id', updateRole);
router.delete('/:id', deleteRole);

export default router;
