import { inject, injectable } from 'tsyringe';

import AppError from '@shared/errors/AppError';

import IProductsRepository from '@modules/products/repositories/IProductsRepository';
import ICustomersRepository from '@modules/customers/repositories/ICustomersRepository';
import Order from '../infra/typeorm/entities/Order';
import IOrdersRepository from '../repositories/IOrdersRepository';

interface IProduct {
  id: string;
  quantity: number;
}

interface IRequest {
  customer_id: string;
  products: IProduct[];
}

@injectable()
class CreateOrderService {
  constructor(
    @inject('OrdersRepository')
    private ordersRepository: IOrdersRepository,
    @inject('ProductsRepository')
    private productsRepository: IProductsRepository,
    @inject('CustomerRepository')
    private customersRepository: ICustomersRepository,
  ) {}

  public async execute({ customer_id, products }: IRequest): Promise<Order> {
    const customer = await this.customersRepository.findById(customer_id);

    if (!customer) {
      throw new AppError('Customer not exist');
    }

    const allProducts = await this.productsRepository.findAllById(products);

    const orderedProducts: {
      product_id: string;
      quantity: number;
      price: number;
    }[] = [];

    const updatedQuantity: IProduct[] = [];

    products.forEach(product => {
      const index = allProducts.findIndex(prod => prod.id === product.id);

      if (index < 0) {
        throw new AppError(`${product.id} does not exist `);
      }

      if (allProducts[index].quantity < product.quantity) {
        throw new AppError(`Invalid quantity of ${allProducts[index].name}`);
      }

      const orderedProduct = {
        product_id: product.id,
        quantity: Number(product.quantity),
        price: Number(allProducts[index].price),
      };

      updatedQuantity.push({
        ...product,
        quantity: allProducts[index].quantity - product.quantity,
      });

      orderedProducts.push(orderedProduct);
    });

    await this.productsRepository.updateQuantity(updatedQuantity);

    const order = await this.ordersRepository.create({
      customer,
      products: orderedProducts,
    });

    return order;
  }
}

export default CreateOrderService;
