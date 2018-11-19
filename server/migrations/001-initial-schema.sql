-- Up
CREATE TABLE Photo (id INTEGER PRIMARY KEY AUTOINCREMENT, name TEXT, day DATE, timestamp DATETIME);
CREATE INDEX photo_times ON Photo (timestamp);

-- Down
DROP TABLE Photo;
