import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, ClientSession, Types } from 'mongoose';
import { Product, ProductDocument } from './schemas/product.schema';
import { CreateProductDto } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { QueryProductDto } from './dto/query-product.dto';

@Injectable()
export class ProductsService {
    constructor(
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async create(createProductDto: CreateProductDto): Promise<Product> {
        const createdProduct = new this.productModel(createProductDto);
        return createdProduct.save();
    }

    async findAll(queryDto: QueryProductDto) {
        const { search, category, page = 1, limit = 10 } = queryDto;

        const query: any = {};

        if (search) {
            query.$text = { $search: search };
        }

        if (category) {
            query.category = category;
        }

        const skip = (page - 1) * limit;

        const [data, total] = await Promise.all([
            this.productModel.find(query).skip(skip).limit(limit).exec(),
            this.productModel.countDocuments(query).exec(),
        ]);

        return {
            data,
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        };
    }

    async findAllAdmin(): Promise<Product[]> {
        return this.productModel.find().sort({ createdAt: -1 }).exec();
    }

    async findOne(id: string): Promise<Product> {
        const product = await this.productModel.findById(id).exec();
        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }
        return product;
    }

    async update(id: string, updateProductDto: UpdateProductDto): Promise<Product> {
        const updatedProduct = await this.productModel
            .findByIdAndUpdate(id, updateProductDto, { new: true })
            .exec();

        if (!updatedProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return updatedProduct;
    }

    async remove(id: string): Promise<Product> {
        const deletedProduct = await this.productModel.findByIdAndDelete(id).exec();

        if (!deletedProduct) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return deletedProduct;
    }

    async updateStock(id: string, quantityChange: number, session?: ClientSession): Promise<Product> {
        const product = await this.productModel.findByIdAndUpdate(
            id,
            { $inc: { stock: quantityChange } },
            { new: true, session }
        ).exec();

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async findAllFeatured(limit: number = 8): Promise<Product[]> {
        return this.productModel
            .find({ isFeatured: true, stock: { $gt: 0 } })
            .sort({ createdAt: -1 })
            .limit(limit)
            .exec();
    }

    async updateFeatured(id: string, isFeatured: boolean): Promise<Product> {
        const product = await this.productModel
            .findByIdAndUpdate(id, { isFeatured }, { new: true })
            .exec();

        if (!product) {
            throw new NotFoundException(`Product with ID ${id} not found`);
        }

        return product;
    }

    async findRelated(id: string, limit: number = 4): Promise<Product[]> {
        const product = await this.findOne(id);

        return this.productModel
            .find({
                category: product.category,
                _id: { $ne: new Types.ObjectId(id) },
                stock: { $gt: 0 },
            })
            .sort({ rating: -1, createdAt: -1 })
            .limit(limit)
            .exec();
    }
}
