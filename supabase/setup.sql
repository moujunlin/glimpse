-- Glimpse · setup.sql

CREATE TABLE IF NOT EXISTS glimpses (
  id SERIAL PRIMARY KEY,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  text TEXT NOT NULL,
  photo_url TEXT,
  lori_reply TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_glimpses_date ON glimpses(date DESC);

ALTER TABLE glimpses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow all" ON glimpses FOR ALL USING (true) WITH CHECK (true);

-- Storage bucket for photos
INSERT INTO storage.buckets (id, name, public)
VALUES ('photos', 'photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Public read photos" ON storage.objects
  FOR SELECT USING (bucket_id = 'photos');

CREATE POLICY "Allow upload photos" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'photos');
