CREATE TABLE IF NOT EXISTS city_information (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  latitude DECIMAL(9, 6) NOT NULL,
  longitude DECIMAL(9, 6) NOT NULL,
  UNIQUE (name, latitude, longitude)
);

CREATE TABLE IF NOT EXISTS personal_information (
  id SERIAL PRIMARY KEY,
  first_name VARCHAR(100) NOT NULL,
  last_name VARCHAR(100) NOT NULL,
  birthdate DATE NOT NULL,
  city_id INTEGER NOT NULL REFERENCES city_information(id)
);