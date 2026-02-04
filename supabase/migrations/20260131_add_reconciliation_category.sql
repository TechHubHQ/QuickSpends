-- Add Reconciliation Category for Balance Adjustments

DO $$
DECLARE
    parent_id UUID;
BEGIN
    -- 1. Add for EXPENSE (Money out adjustment)
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Reconciliation', 'scale-balance', '#78909C', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING
    RETURNING id INTO parent_id;

    -- Subcategories for Expense Reconciliation
    IF parent_id IS NOT NULL THEN
        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Balance Correction', 'pencil-remove', '#78909C', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Service Charge', 'bank-minus', '#78909C', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    END IF;

    -- 2. Add for INCOME (Money in adjustment/Refunds not linked to original)
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Reconciliation', 'scale-balance', '#78909C', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING
    RETURNING id INTO parent_id;

    -- Subcategories for Income Reconciliation
    IF parent_id IS NOT NULL THEN
        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Balance Correction', 'pencil-plus', '#78909C', 'income', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Refund / Reversal', 'undo', '#78909C', 'income', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    END IF;

END $$;
