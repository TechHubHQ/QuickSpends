-- Add Family Member Support Subcategory to Housing

DO $$
DECLARE
    parent_id UUID;
BEGIN
    -- Find the Housing parent category
    SELECT id INTO parent_id
    FROM categories
    WHERE name = 'Housing' AND type = 'expense' AND is_default = true AND user_id IS NULL;

    -- Add the subcategory if the parent exists
    IF parent_id IS NOT NULL THEN
        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Family Member Support', 'account-heart', '#795548', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    END IF;

END $$;
