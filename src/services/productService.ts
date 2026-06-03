import ProductRepository from "../repositories/productRepository.js"; 

class ProductService 
{
    constructor(private repo:ProductRepository){} 

    async show() 
    {
        return this.repo.show();  
    }
}

export default ProductService; 