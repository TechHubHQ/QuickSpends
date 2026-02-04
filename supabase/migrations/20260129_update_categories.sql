-- Seed ALL categories (Consolidated)

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'unique_default_category_name_type_parent'
    ) THEN
        ALTER TABLE categories 
        ADD CONSTRAINT unique_default_category_name_type_parent 
        UNIQUE NULLS NOT DISTINCT (name, type, parent_id, user_id);
    END IF;
END $$;

DO $$
DECLARE
    parent_id UUID;
BEGIN
    -- Parent: Transport
    -- RENAME existing Bill Payment to Postal & Courier if it exists (Migration step)
    UPDATE categories 
    SET name = 'Postal & Courier', icon = 'truck-delivery', color = '#795548' 
    WHERE name = 'Bill Payment' AND type = 'expense' AND user_id IS NULL;

    -- Parent: Transport
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Transport', 'car', '#1E90FF', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Fuel', 'gas-station', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Parking & Tolls', 'parking', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Maintenance & Service', 'wrench', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Public Transport', 'bus', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Taxi / Cab', 'taxi', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Car Insurance', 'file-document', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Vehicle Accessories', 'car-battery', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Car Wash', 'water-pump', '#1E90FF', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Food & Dining
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Food & Dining', 'silverware-fork-knife', '#FF9800', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Restaurants', 'silverware', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Coffee & Cafes', 'coffee', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Fast Food', 'hamburger', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Alcohol / Bars', 'glass-cocktail', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Breakfast / Brunch', 'egg-fried', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Lunch', 'food', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Dinner', 'food-turkey', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Snacks', 'cookie', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Food Delivery', 'moped', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Groceries
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Groceries', 'cart-outline', '#8BC34A', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Fruits & Vegetables', 'food-apple', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Meat, Fish & Dairy', 'food-steak', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Pantry & Staples', 'shaker', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Beverages', 'cup-water', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Household Supplies', 'paper-roll', '#8BC34A', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Shopping
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Shopping', 'shopping', '#9C27B0', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Clothing', 'tshirt-crew', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Electronics', 'laptop', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Home & Garden', 'flower', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Beauty & Personal Care', 'lipstick', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Books & Stationery', 'book-open-variant', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Shoes & Accessories', 'shoe-heel', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Sports & Outdoors', 'basketball', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Online Shopping', 'web', '#9C27B0', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Utilities
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Utilities', 'flash', '#FFC107', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Electricity', 'lightning-bolt', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Water', 'water', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Internet', 'wifi', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mobile / Phone', 'cellphone', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Gas / Heating', 'fire', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Cable / TV', 'television-classic', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Garbage / Recycling', 'delete', '#FFC107', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Health
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Health', 'doctor', '#4CAF50', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Doctor & Medical', 'stethoscope', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Pharmacy', 'pill', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Gym & Fitness', 'dumbbell', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Health Insurance', 'shield-plus', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Dentist', 'tooth', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mental Health', 'brain', '#4CAF50', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Entertainment
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Entertainment', 'movie', '#E91E63', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Movies', 'filmstrip', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Games', 'controller-classic', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Streaming', 'youtube-tv', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Concerts & Events', 'ticket', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Hobbies', 'palette', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Nightlife', 'music-note', '#E91E63', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Travel
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Travel', 'airplane', '#03A9F4', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Flights', 'airplane-takeoff', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Hotels', 'bed', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Car Rental', 'car-key', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Sightseeing', 'camera', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Travel Insurance', 'file-certificate', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Visa & Passport', 'passport', '#03A9F4', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Education
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Education', 'school', '#FF5722', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Tuition Fees', 'bank', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Books & Supplies', 'book', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Online Courses', 'laptop-account', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Personal Care
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Personal Care', 'spa', '#F06292', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Hair Salon', 'scissors-cutting', '#F06292', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Spa & Massage', 'spa', '#F06292', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Cosmetics', 'lipstick', '#F06292', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Housing
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Housing', 'home', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Rent / Mortgage', 'home-city', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Property Tax', 'file-percent', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Home Insurance', 'home-lock', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Repairs', 'hammer-wrench', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Services', 'broom', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Gifts & Donations
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Gifts & Donations', 'gift', '#E040FB', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Charity', 'heart', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Birthday Gifts', 'cake', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Wedding', 'ring', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Holiday Gifts', 'pine-tree', '#E040FB', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Family
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Family', 'account-group', '#FF9800', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Childcare', 'baby-carriage', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Baby Supplies', 'baby-bottle', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('School Activities', 'school', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Toys', 'toy-brick', '#FF9800', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Pets
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Pets', 'paw', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Pet Food', 'food-drumstick', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Vet & Medical', 'medical-bag', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Grooming', 'content-cut', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Toys & Accessories', 'tennis-ball', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Transfer
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Transfer', 'bank-transfer', '#607D8B', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Self Transfer', 'bank-transfer-out', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Bank Transfer', 'bank', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Wallet Top-up', 'wallet-plus', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Lent to Friend', 'account-arrow-right', '#607D8B', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Bills & Fees
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Bills & Fees', 'file-document-outline', '#F44336', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Credit Card Bill', 'credit-card', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Late Fees', 'alert-circle', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Bank Charges', 'bank-minus', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('ATM Fees', 'atm', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Subscription Renewal', 'autorenew', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mobile Recharge', 'cellphone-wireless', '#F44336', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Taxes
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Taxes', 'file-percent', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Income Tax', 'file-chart', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Property Tax', 'home-analytics', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Sales Tax', 'receipt', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Professional Tax', 'briefcase', '#795548', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Insurance
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Insurance', 'shield-check', '#009688', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Life Insurance', 'heart-pulse', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Health Insurance', 'hospital-box', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Vehicle Insurance', 'car-info', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Home Insurance', 'home-alert', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Travel Insurance', 'airplane-check', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Business
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Business', 'domain', '#3F51B5', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Office Supplies', 'paperclip', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Software', 'microsoft-visual-studio-code', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Advertising', 'bullhorn', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Shipping', 'truck-delivery', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Business Meals', 'food-fork-drink', '#3F51B5', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Investment
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Investment', 'chart-line', '#009688', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Stocks Check', 'finance', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('SIP', 'calendar-clock', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Gold Plan', 'ring', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Mutual Funds', 'chart-pie', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Crypto Buy', 'bitcoin', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Real Estate', 'home-group', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Provident Fund', 'piggy-bank', '#009688', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Subscriptions
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Subscriptions', 'autorenew', '#9E9E9E', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Postal & Courier
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Postal & Courier', 'truck-delivery', '#795548', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Loans & Debt
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Loans & Debt', 'handshake', '#FF5722', 'expense', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Loan Disbursement', 'format-list-bulleted-type', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('EMI Payment', 'calendar-clock', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Debt Repayment', 'cash-check', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Personal Loan', 'account-cash', '#FF5722', 'expense', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Salary
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Salary', 'cash-multiple', '#4CAF50', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Full-time Pay', 'briefcase-check', '#4CAF50', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Bonus', 'star-circle', '#4CAF50', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Commission', 'percent', '#4CAF50', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Refunds
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Refunds', 'cash-refund', '#607D8B', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Freelance
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Freelance', 'briefcase', '#00BCD4', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Investments
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Investments', 'trending-up', '#3F51B5', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Dividends', 'chart-pie', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Interest', 'bank', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Stock Sales', 'finance', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Crypto', 'bitcoin', '#3F51B5', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

    -- Parent: Rental
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Rental', 'home-city', '#673AB7', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Gifts
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Gifts', 'gift', '#E040FB', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Other
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Other', 'dots-horizontal', '#9E9E9E', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Opening Balance
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Opening Balance', 'wallet-outline', '#4CAF50', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    -- Parent: Loans & Debt
    INSERT INTO categories (name, icon, color, type, is_default, user_id)
    VALUES ('Loans & Debt', 'handshake', '#FF5722', 'income', true, NULL)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO UPDATE SET icon = EXCLUDED.icon, color = EXCLUDED.color
    RETURNING id INTO parent_id;

    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Loan Received', 'wallet-plus', '#FF5722', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('Debt Recovery', 'cash-plus', '#FF5722', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;
    INSERT INTO categories (name, icon, color, type, is_default, user_id, parent_id)
    VALUES ('EMI Received', 'calendar-check', '#FF5722', 'income', true, NULL, parent_id)
    ON CONFLICT ON CONSTRAINT unique_default_category_name_type_parent DO NOTHING;

END $$;
