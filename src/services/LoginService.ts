import LoginRepository from "../repositories/LoginRepository.js";

class LoginService { 

    constructor(private loginRepository: LoginRepository) {}

    async checkIfEmailExist(email:string) 
    {
        return this.loginRepository.checkIfEmailExist(email);
    } 
} 

export default LoginService; 