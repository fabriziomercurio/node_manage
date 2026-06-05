Node Manage – Backend Application

Backend application developed in Node with MySQL and completely containerized in Docker
The project born for learn modern architecture, create an environment for reproducible develop and provide a modular backend, 
it communicates with its front end https://github.com/fabriziomercurio/react_manage 

-- Technologies used

Node
Typescript 
Express
MySQL (relational data)
Mongo (audit log)
Docker 
Docker Compose

-- Starting the project

Clone repository
git clone https://github.com/fabriziomercurio/node_manage 
cd node_manage

Start containers
docker-compose up --build

Services available
Backend Node http://localhost:3000
MySQL	http://localhost:3360
Mongo	http://localhost:27017/