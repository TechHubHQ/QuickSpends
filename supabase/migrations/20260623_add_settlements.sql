CREATE TABLE settlements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    total_amount NUMERIC NOT NULL DEFAULT 0,
    settled_amount NUMERIC NOT NULL DEFAULT 0,
    person_name TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('lent', 'borrowed')),
    notes TEXT,
    due_date TIMESTAMPTZ,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'closed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE settlements ENABLE ROW LEVEL SECURITY;

CREATE POLICY settlements_user_select ON settlements FOR SELECT USING (user_id = auth.uid());
CREATE POLICY settlements_user_insert ON settlements FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY settlements_user_update ON settlements FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY settlements_user_delete ON settlements FOR DELETE USING (user_id = auth.uid());

CREATE INDEX idx_settlements_user_id ON settlements(user_id);
CREATE INDEX idx_settlements_status ON settlements(status);
