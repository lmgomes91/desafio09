import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import Product from '../infra/typeorm/entities/Product';
import IProductsRepository from '../repositories/IProductsRepository';

interface IRequest {
  name: string;
  price: number;
  quantity: number;
}

@injectable()
class CreateProductService {
  constructor(
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
  ) {}

  public async execute({ name, price, quantity }: IRequest): Promise<Product> {
    const checkProduct = await this.productsRepository.findByName(name);
    if (checkProduct) {
      throw new AppError('Product name already used');
    }

    if (price < 0.01) {
      throw new AppError('Price Invalid');
    }

    if (quantity < 1) {
      throw new AppError('Quantity invalid');
    }

    const newProdcut = await this.productsRepository.create({
      name,
      price,
      quantity,
    });

    return newProdcut;
  }
}

export default CreateProductService;
