import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type WishlistDocument = Wishlist & Document;

@Schema({ timestamps: true })
export class Wishlist {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    user: Types.ObjectId;

    @Prop({ type: [{ type: Types.ObjectId, ref: 'Product' }], default: [] })
    products: Types.ObjectId[];
}

export const WishlistSchema = SchemaFactory.createForClass(Wishlist);
