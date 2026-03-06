import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, ClientSession } from 'mongoose';
import { Cart, CartDocument } from './schemas/cart.schema';
import { ProductsService } from '../products/products.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';

@Injectable()
export class CartService {
    constructor(
        @InjectModel(Cart.name) private cartModel: Model<CartDocument>,
        private productsService: ProductsService,
    ) { }

    async getCart(userId: string) {
        let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) })
            .populate('items.product')
            .populate('savedForLater.product')
            .exec();

        if (!cart) {
            cart = await this.cartModel.create({ user: new Types.ObjectId(userId), items: [], savedForLater: [] });
        }

        // Calculate dynamic subtotal
        let subtotal = 0;
        const validItems: any[] = [];

        cart.items.forEach((item: any) => {
            if (item.product && item.product.price !== undefined) {
                const product = item.product as any;
                const discountPercent = product.discountPercent || 0;
                const effectivePrice = Math.round(product.price * (1 - discountPercent / 100));

                subtotal += effectivePrice * item.quantity;
                validItems.push(item);
            }
        });

        // Optional: sanitize cart locally if products were deleted from the DB
        if (validItems.length !== cart.items.length) {
            cart.items = validItems;
            await cart.save();
        }

        return { cart, subtotal };
    }

    async addToCart(userId: string, dto: AddToCartDto) {
        // Validate product exists and has enough stock
        const product = await this.productsService.findOne(dto.productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.stock < dto.quantity) {
            throw new BadRequestException(`Only ${product.stock} items left in stock`);
        }

        let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!cart) {
            cart = new this.cartModel({ user: new Types.ObjectId(userId), items: [] });
        }

        const exactProductId = new Types.ObjectId(dto.productId);
        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === exactProductId.toString());

        if (existingItemIndex > -1) {
            // Update quantity of existing item
            const newQuantity = cart.items[existingItemIndex].quantity + dto.quantity;
            if (product.stock < newQuantity) {
                throw new BadRequestException(`Cannot add: stock limits exceeded. You already have ${cart.items[existingItemIndex].quantity} in cart.`);
            }
            cart.items[existingItemIndex].quantity = newQuantity;
        } else {
            // Add new item
            cart.items.push({ product: exactProductId, quantity: dto.quantity } as any);
        }

        await cart.save();
        return this.getCart(userId);
    }

    async updateQuantity(userId: string, productId: string, dto: UpdateCartItemDto) {
        if (dto.quantity === 0) {
            return this.removeFromCart(userId, productId);
        }

        const product = await this.productsService.findOne(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        if (product.stock < dto.quantity) {
            throw new BadRequestException(`Only ${product.stock} items left in stock`);
        }

        const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity = dto.quantity;
            await cart.save();
        }

        return this.getCart(userId);
    }

    async removeFromCart(userId: string, productId: string) {
        const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!cart) {
            throw new NotFoundException('Cart not found');
        }

        cart.items = cart.items.filter(item => item.product.toString() !== productId) as any;
        await cart.save();

        return this.getCart(userId);
    }

    async clearCart(userId: string, session?: ClientSession) {
        let cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).session(session || null).exec();
        if (cart) {
            cart.items = [];
            await cart.save({ session });
        }
        return cart;
    }

    async saveForLater(userId: string, productId: string) {
        const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!cart) throw new NotFoundException('Cart not found');

        const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
        if (itemIndex === -1) throw new NotFoundException('Item not found in cart');

        const item = cart.items[itemIndex];

        // Remove from items
        cart.items.splice(itemIndex, 1);

        // Add to savedForLater if not already there
        const alreadySaved = cart.savedForLater.some(i => i.product.toString() === productId);
        if (!alreadySaved) {
            cart.savedForLater.push(item);
        }

        await cart.save();
        return this.getCart(userId);
    }

    async moveToCart(userId: string, productId: string) {
        const cart = await this.cartModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!cart) throw new NotFoundException('Cart not found');

        const savedIndex = cart.savedForLater.findIndex(item => item.product.toString() === productId);
        if (savedIndex === -1) throw new NotFoundException('Item not found in saved list');

        const item = cart.savedForLater[savedIndex];

        // Validate stock
        const product = await this.productsService.findOne(productId);
        if (product.stock < item.quantity) {
            throw new BadRequestException(`Only ${product.stock} items left in stock. Cannot move back to cart.`);
        }

        // Remove from savedForLater
        cart.savedForLater.splice(savedIndex, 1);

        // Add to items
        const existingItemIndex = cart.items.findIndex(i => i.product.toString() === productId);
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += item.quantity;
        } else {
            cart.items.push(item);
        }

        await cart.save();
        return this.getCart(userId);
    }
}
