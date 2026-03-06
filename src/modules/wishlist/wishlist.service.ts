import { Injectable, NotFoundException, BadRequestException, ConflictException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Wishlist, WishlistDocument } from './schemas/wishlist.schema';
import { ProductsService } from '../products/products.service';
import { CartService } from '../cart/cart.service';

@Injectable()
export class WishlistService {
    constructor(
        @InjectModel(Wishlist.name) private wishlistModel: Model<WishlistDocument>,
        private productsService: ProductsService,
        private cartService: CartService,
    ) { }

    async getWishlist(userId: string) {
        let wishlist = await this.wishlistModel
            .findOne({ user: new Types.ObjectId(userId) })
            .populate('products')
            .exec();

        if (!wishlist) {
            wishlist = await this.wishlistModel.create({
                user: new Types.ObjectId(userId),
                products: [],
            });
        }

        return wishlist;
    }

    async addToWishlist(userId: string, productId: string) {
        const product = await this.productsService.findOne(productId);
        if (!product) {
            throw new NotFoundException('Product not found');
        }

        let wishlist = await this.wishlistModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!wishlist) {
            wishlist = new this.wishlistModel({ user: new Types.ObjectId(userId), products: [] });
        }

        const prodId = new Types.ObjectId(productId);
        if (wishlist.products.some(id => id.toString() === prodId.toString())) {
            throw new ConflictException('Product already in wishlist');
        }

        wishlist.products.push(prodId);
        await wishlist.save();
        return this.getWishlist(userId);
    }

    async removeFromWishlist(userId: string, productId: string) {
        const wishlist = await this.wishlistModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!wishlist) {
            throw new NotFoundException('Wishlist not found');
        }

        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        await wishlist.save();
        return this.getWishlist(userId);
    }

    async moveToCart(userId: string, productId: string) {
        // Check if product exists in wishlist
        const wishlist = await this.wishlistModel.findOne({ user: new Types.ObjectId(userId) }).exec();
        if (!wishlist || !wishlist.products.some(id => id.toString() === productId)) {
            throw new NotFoundException('Product not found in wishlist');
        }

        // Add to cart (CartService handles stock validation)
        await this.cartService.addToCart(userId, { productId, quantity: 1 });

        // Remove from wishlist
        wishlist.products = wishlist.products.filter(id => id.toString() !== productId);
        await wishlist.save();

        return {
            wishlist: await this.getWishlist(userId),
            cart: await this.cartService.getCart(userId)
        };
    }
}
