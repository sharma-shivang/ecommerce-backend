import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ProductDocument = Product & Document;

@Schema({ _id: false })
export class ProductVariant {
    @Prop({ required: true })
    size: string;

    @Prop({ required: true })
    color: string;

    @Prop({ required: true })
    price: number;

    @Prop({ required: true, min: 0 })
    stock: number;

    @Prop({ required: true, unique: true, sparse: true })
    sku: string;

    @Prop({ type: [String], default: [] })
    images: string[];
}

const ProductVariantSchema = SchemaFactory.createForClass(ProductVariant);

@Schema({ timestamps: true })
export class Product {
    @Prop({ required: true, index: true })
    title: string;

    @Prop({ required: true })
    description: string;

    @Prop({ required: true, min: 0, index: true })
    price: number;

    @Prop({ type: [String], default: [] })
    images: string[];

    @Prop({ required: true, index: true })
    category: string;

    @Prop({ required: true, min: 0, default: 0 })
    stock: number;

    @Prop({ min: 0, max: 5, default: 0 })
    rating: number;

    @Prop({ min: 0, max: 100, default: 0 })
    discountPercent: number; // 0 = no discount

    @Prop({ default: false, index: true })
    isFeatured: boolean;

    @Prop({ type: [ProductVariantSchema], default: [] })
    variants: ProductVariant[];
}

export const ProductSchema = SchemaFactory.createForClass(Product);

// Text Index for Search
ProductSchema.index({ title: 'text', description: 'text' });
