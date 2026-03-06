import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';
import { User } from '../../users/schemas/user.schema';
import { Product } from '../../products/schemas/product.schema';

export type OrderDocument = Order & Document;

@Schema()
export class OrderItem {
    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Product | Types.ObjectId;

    @Prop({ required: true, min: 1 })
    quantity: number;

    @Prop({ required: true })
    price: number; // Snapshot of the price at purchase
}

@Schema()
export class ShippingAddress {
    @Prop({ required: true })
    street: string;

    @Prop({ required: true })
    city: string;

    @Prop({ required: true })
    state: string;

    @Prop({ required: true })
    zipCode: string;

    @Prop({ required: true })
    country: string;
}

@Schema({ timestamps: true })
export class Order {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true, index: true })
    user: User | Types.ObjectId;

    @Prop({ type: [SchemaFactory.createForClass(OrderItem)], required: true })
    items: OrderItem[];

    @Prop({ type: SchemaFactory.createForClass(ShippingAddress), required: true })
    shippingAddress: ShippingAddress;

    @Prop({ required: true })
    subtotal: number;

    @Prop({ required: true })
    shipping: number;

    @Prop({ required: true })
    total: number;

    @Prop({
        type: String,
        enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'],
        default: 'pending',
        index: true,
    })
    status: string;

    @Prop({ type: String, default: null })
    couponCode: string | null;

    @Prop({ default: 0 })
    discount: number; // amount saved

    @Prop({ default: '' })
    email: string;

    @Prop({ default: '' })
    phone: string;

    @Prop({ type: String, default: null })
    orderNote: string | null;
}

export const OrderSchema = SchemaFactory.createForClass(Order);
