-- Add Sports & Athletics Category

DO $$
DECLARE
    parent_id UUID;
BEGIN
    -- Top-level category: Sports & Athletics
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Sports & Athletics', 'soccer', '#00E676', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Subcategories
    IF parent_id IS NOT NULL THEN
        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Turf & Field Rental', 'soccer-field', '#00E676', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Match Fees & Registration', 'stadium-variant', '#00E676', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Pick-up Games', 'account-group', '#00E676', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Football & Equipment', 'football', '#00E676', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

        INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
        VALUES ('Gym & Fitness', 'dumbbell', '#00E676', 'expense', true, NULL, parent_id)
        ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    END IF;

END $$;
