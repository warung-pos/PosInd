-- Migration: Add cash_paid and change_due columns to transactions table
-- Date: 2026-06-03
-- Description: Support Cash payment tracking (amount paid and change given)
-- Safe: Uses DEFAULT NULL so existing rows are unaffected

ALTER TABLE transactions 
  ADD COLUMN cash_paid DECIMAL(15,2) DEFAULT NULL AFTER status,
  ADD COLUMN change_due DECIMAL(15,2) DEFAULT NULL AFTER cash_paid;
