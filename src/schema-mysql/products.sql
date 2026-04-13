CREATE DATABASE IF NOT EXISTS manage;
USE manage;

CREATE TABLE products (
  id integer PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  created TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO products (title)
VALUES 
('My First Note'),
('My Second Note');