import { Request, Response } from "express";
import { AuthService } from "../services/AuthService.js";
import { JwtTokenProvider } from "../providers/JwtTokenProvider.js";
import { LoginPayload, ValidateTokenPayload } from "../types/Payload.js";
import bcrypt from 'bcrypt';
import LoginService from "../services/LoginService.js";
import LoginRepository from "../repositories/LoginRepository.js";
import { UserSchema } from "../validations/schemas/UserSchema.js";
import Connected from "../db/connected.js";
import { Redis } from "../classes/Redis.js";
import { TOKEN_CONFIG } from "../helpers/TokenConfig.js";
import { loadPrivateKey } from "../config/keyPrivateProvider.js";
import { loadPublicKey } from "../config/keyPublicProvider.js";

const connected = new Connected(new Redis);
const privateKey = loadPrivateKey(); 
const publicKey = loadPublicKey();
const tokenService = new AuthService<LoginPayload, ValidateTokenPayload>(new JwtTokenProvider(privateKey));
const loginService = new LoginService(new LoginRepository);

const loginController = {

    async login(req: Request, res: Response) {
        try {

            const { email, password } = req.body;

            const redis = await connected.connection();

            const validation = UserSchema.safeParse(req.body);

            if (!validation.success) {
                return res.status(404).json({ message: validation.error?.issues });
            }

            const [result]: any = await loginService.checkIfEmailExist(email)

            if (result.length === 0) return res.status(404).json({ message: "User not found" });

            if (!bcrypt.compareSync(password, result[0].password)) return res.status(404).json({ message: "Credentials are not correct" });

            const accessPayload = { jti: crypto.randomUUID(), id: result[0].id, email: result[0].email, exp: Math.floor(Date.now() / 1000) + TOKEN_CONFIG.accessTokenExp }; 

            const accessToken = tokenService.create(accessPayload);

            const refreshPayload = {
                id: accessPayload.id,
                jti: crypto.randomUUID(),
                exp: Math.floor(Date.now() / 1000) + TOKEN_CONFIG.refreshTokenExp
            }

            const refreshToken = tokenService.create(refreshPayload);

            await redis.set(
                `refresh_token:whitelist:${refreshPayload.jti}`,
                refreshToken,
                {
                    EX: 60 * 60 * 24 * 30
                }
            );

            return res.status(200).json({ "message": "you're logged", "accessToken": accessToken, "refreshToken": refreshToken });

        } catch (err) {
            return res.status(500).json({
                message: err instanceof Error ? err.message : "Unknown error"
            });
        }
    },

    async logout(req: Request, res: Response) {
        try {

            const redis = await connected.connection();

            const token = req.headers['authorization']!;

            const accessPayload = tokenService.getPayloadEncoded({
                token: token,
                publicKey: publicKey
            });

            await redis.set(
                `access_token:blacklist:${accessPayload.jti}`,
                'invalid',
                {
                    EX: 60 * 60 * 24 * 30
                }
            );


            await redis.del(`refresh_token:whitelist:${accessPayload.jti}`);

            return res.status(200).json({ "message": "you're logout" });

        } catch (error) {
            return res.status(401).json({
                message: error instanceof Error ? error.message : "Unknown error"
            });
        }
    }
}

export default loginController; 
