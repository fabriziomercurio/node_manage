import UserRepository from "../repositories/UserRepository.js";

class UserService { 

    constructor(private userRepository: UserRepository) {}

    async store(email:string,hash:string) 
    {
        return this.userRepository.store(email,hash); 
    } 
} 

export default UserService; 