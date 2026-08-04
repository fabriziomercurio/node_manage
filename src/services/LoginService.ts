import { AuthService } from "../services/AuthService.js";
import { JwtTokenProvider } from "../providers/JwtTokenProvider.js";
import { LoginPayload, ValidateTokenPayload } from "../types/Payload.js";
import bcrypt from 'bcrypt';
import LoginRepository from "../repositories/LoginRepository.js";
import { loadPrivateKey } from "../config/keyPrivateProvider.js";
import { loadPublicKey } from "../config/keyPublicProvider.js";
import RedisService from "../services/RedisService.js";

const privateKey = loadPrivateKey(); 
const publicKey = loadPublicKey();
const tokenService = new AuthService<LoginPayload, ValidateTokenPayload>(new JwtTokenProvider(privateKey));
const redisService = new RedisService;

class LoginService { 

    constructor(private loginRepository: LoginRepository) {} 

    async login(email:string, password:string) { 

        const [result]: any = await this.checkIfEmailExist(email)

        if (result.length === 0) throw new Error("User not found");

        if (!bcrypt.compareSync(password, result[0].password)) throw new Error("Credentials are not correct");
    
        const accessPayload = tokenService.createAccessPayload(result[0].id,result[0].email);

        const accessToken = tokenService.create(accessPayload);

        const refreshPayload = tokenService.createRefreshPayload(accessPayload.id);

        const refreshToken = tokenService.create(refreshPayload);

        redisService.setWhiteList(refreshPayload.jti,refreshToken)

        return {
            accessToken, refreshToken
        }
    } 

    async logout(token:string)
    {
         const accessPayload = tokenService.getPayloadEncoded({
            token: token,
            publicKey: publicKey
        });

        redisService.blackList(accessPayload.jti); 

        return {"message": "you're logout"}
    }

    async checkIfEmailExist(email:string) 
    {
        return this.loginRepository.checkIfEmailExist(email);
    } 
} 

export default LoginService; 