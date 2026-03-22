import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { Product } from '../../products/schemas/product.schema';
import { User } from '../../users/schemas/user.schema';

export type CartDocument = Cart & Document;

@Schema()
export class CartItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Product | Types.ObjectId;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: false })
    variantSku?: string;

    @Prop({ required: false })
    size?: string;

    @Prop({ required: false })
    color?: string;
}

export const CartItemSchema = SchemaFactory.createForClass(CartItem);

@Schema({ timestamps: true })
export class Cart {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, unique: true })
    user: User | Types.ObjectId;

    @Prop({ type: [CartItemSchema], default: [] })
    items: CartItem[];

    @Prop({ type: [CartItemSchema], default: [] })
    savedForLater: CartItem[];
}

export const CartSchema = SchemaFactory.createForClass(Cart);
