import http from "node:http";  
import mysql from "mysql2/promise"; 
import express from 'express';
import apiRoute from './routes/api.js';
import cors from 'cors';

const pool = mysql.createPool({
  host: 'db',
  user: 'root',
  database: 'manage',
  port: 3306,
  password: 'root',
}); 

const app = express() 
app.use(cors({
  origin: 'http://localhost:5000'
}));
app.use(express.json())
app.use(express.static('uploads'))
app.use('/api/',apiRoute)

app.listen(3000);



