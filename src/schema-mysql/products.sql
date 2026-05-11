CREATE DATABASE IF NOT EXISTS manage;
DROP TABLE IF EXISTS products; 

CREATE TABLE products (
  id integer PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255) NOT NULL,
  imageId integer NULL, 
  FOREIGN KEY (imageId) REFERENCES product_images(id),
  created TIMESTAMP NOT NULL DEFAULT NOW()
);

INSERT INTO products (title)
VALUES 
('My First Note'),
('My Second Note');