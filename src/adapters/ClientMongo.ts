import { MongoClient } from "mongodb";
import { env } from "../config/database.js"; 

export const clientMongo:MongoClient = new MongoClient(`mongodb://${env.mongo.host}:${env.mongo.port}`); 


