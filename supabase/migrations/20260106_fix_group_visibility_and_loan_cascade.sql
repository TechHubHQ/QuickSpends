-- Fix Group Visibility and Loan Deletion

-- 1. FIX GROUP VISIBILITY
-- Add SELECT policy for groups to allow members to see them
CREATE POLICY "Group members can view groups"
ON groups FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM group_members
    WHERE group_members.group_id = groups.id
    AND group_members.user_id = auth.uid()
  )
);

-- 2. FIX LOAN DELETION
-- Drop existing Foreign Key on transactions.loan_id
ALTER TABLE transactions
DROP CONSTRAINT transactions_loan_id_fkey;

-- Add new Foreign Key with CASCADE DELETE
ALTER TABLE transactions
ADD CONSTRAINT transactions_loan_id_fkey
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;

-- Also fix repayment_schedules just in case (though usually handled by code, DB enforcement is safer)
ALTER TABLE repayment_schedules
DROP CONSTRAINT repayment_schedules_loan_id_fkey;

ALTER TABLE repayment_schedules
ADD CONSTRAINT repayment_schedules_loan_id_fkey
FOREIGN KEY (loan_id)
REFERENCES loans(id)
ON DELETE CASCADE;
