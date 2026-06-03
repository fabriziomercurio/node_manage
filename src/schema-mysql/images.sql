CREATE DATABASE IF NOT EXISTS manage;
DROP TABLE IF EXISTS product_images; 

CREATE TABLE product_images (
  id integer PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(255) NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(), 
  updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO product_images (name)
VALUES 
('My First Note'),
('My Second Note');


