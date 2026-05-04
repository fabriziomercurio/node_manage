CREATE DATABASE IF NOT EXISTS manage;
DROP TABLE IF EXISTS product_images; 

CREATE TABLE product_images (
  id integer PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NULL,
  created TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO product_images (name)
VALUES 
('My First Note'),
('My Second Note');