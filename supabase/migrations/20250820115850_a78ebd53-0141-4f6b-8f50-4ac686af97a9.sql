-- Update existing 'failed' status to 'rejected' to match the new constraint
UPDATE payments SET status = 'rejected' WHERE status = 'failed';

-- Remove existing check constraints on payment status
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_status_check;
ALTER TABLE payments DROP CONSTRAINT IF EXISTS valid_payment_status;

-- Add new constraint that allows all required status values
ALTER TABLE payments ADD CONSTRAINT valid_payment_status 
CHECK (status IN ('pending', 'paid', 'partial', 'rejected'));