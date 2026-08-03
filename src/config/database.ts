export const env = {
    database:{
        host:process.env.DB_HOST!, 
        user:process.env.DB_USER!,
        name: process.env.DB_NAME!,
        port: Number(process.env.DB_PORT ?? 3306),
        password: process.env.DB_PASSWORD!      
    }, 
    redis:{
        host: process.env.REDIS_HOST!,
        port: Number(process.env.REDIS_PORT!)
    }, 
    mongo:{
        host: process.env.MONGO_HOST!,
        port: Number(process.env.MONGO_PORT!)
    }
} 

