import z from "zod" 

export const UserSchema = z.object({
    email: z.email('Email is invalid').min(6,'Email is too short').max(255,'Email is too long'), 
    password: z.string().nonempty('Password is required').min(8, "The password must be at least 8 characters long") 
   
        .max(50, "The password cannot exceed 50 characters")
        .regex(/[A-Z]/, "It must contain at least one uppercase letter")
        .regex(/[a-z]/, "It must contain at least one lowercase letter")
        .regex(/[0-9]/, "It must contain at least one number")
        .regex(/[^A-Za-z0-9]/, "It must contain at least one special character")
})