import { Request, Response, NextFunction } from "express";

/**
* !/^[1-9][0-9]*$/ this regex not accepts value like 012 or 001 
*
* test() is a method of a regex pattern that checks if a string is correct
*/    

const validateId = (id:string) => {
    return (req:Request, res:Response, next:NextFunction) => { 
     const rawId:any = req.params[id]; 

       if (!/^[1-9][0-9]*$/.test(rawId as any)) { 
          return res.status(400).json({
              error: `${id} is invalid`
          });
       } 

     req.params[id] = String(Number(rawId)); 
     next();       
    }
}

export default validateId; 