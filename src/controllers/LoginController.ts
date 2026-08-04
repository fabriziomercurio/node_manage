import { Request, Response } from "express";
import LoginService from "../services/LoginService.js";
import LoginRepository from "../repositories/LoginRepository.js";
import { UserSchema } from "../validations/schemas/UserSchema.js";

const loginService = new LoginService(new LoginRepository);

const loginController = {

    async login(req: Request, res: Response) {
        try {

            const validation = UserSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(404).json({ message: validation.error?.issues });
            }

            const { accessToken, refreshToken } = await loginService.login(req.body.email, req.body.password);

            return res.status(200).json({ "message": "you're logged", "accessToken": accessToken, "refreshToken": refreshToken });

        } catch (err) {
            return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
        }
    },

    async logout(req: Request, res: Response) {
        try {

            const token = req.headers['authorization']!;
            const { message } = await loginService.logout(token);

            return res.status(200).json({ message });

        } catch (error) {
            return res.status(401).json({
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
}

export default loginController; 
