PRAGMA foreign_keys=ON;
CREATE TABLE IF NOT EXISTS categories(id TEXT PRIMARY KEY,name TEXT NOT NULL,slug TEXT NOT NULL UNIQUE);
CREATE TABLE IF NOT EXISTS products(id TEXT PRIMARY KEY,name TEXT NOT NULL,category_id TEXT,price INTEGER NOT NULL DEFAULT 0,old_price INTEGER NOT NULL DEFAULT 0,discount INTEGER NOT NULL DEFAULT 0,image TEXT DEFAULT '',description TEXT DEFAULT '',active INTEGER NOT NULL DEFAULT 1,created_at INTEGER NOT NULL,FOREIGN KEY(category_id) REFERENCES categories(id) ON DELETE SET NULL);
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category_id);
INSERT OR IGNORE INTO categories(id,name,slug) VALUES
('cat-kitchen','لوازم آشپزخانه','kitchen'),
('cat-beauty','لوازم آرایشی و برقی','beauty'),
('cat-home','لوازم خانگی','home'),
('cat-health','سلامت و ماساژ','health');
