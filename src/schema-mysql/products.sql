CREATE DATABASE IF NOT EXISTS manage;
DROP TABLE IF EXISTS products; 

CREATE TABLE products (
  id integer PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  imageId integer NULL, 
  FOREIGN KEY (imageId) REFERENCES product_images(id),
  created_at TIMESTAMP NOT NULL DEFAULT NOW(), 
  updated_at TIMESTAMP NOT NULL DEFAULT NOW() ON UPDATE CURRENT_TIMESTAMP
);

INSERT INTO products (title)
VALUES 
('My First Note'),
('My Second Note');