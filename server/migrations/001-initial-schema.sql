-- Up
CREATE TABLE Photo (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, day DATE, timestamp DATETIME, color CHAR(7) DEFAULT '#ffffff', contrast CHAR(7) DEFAULT '#000000');
CREATE INDEX photo_times ON Photo (timestamp);

-- Down
DROP TABLE Photo;
