import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CouponDocument = Coupon & Document;

export enum DiscountType {
    PERCENTAGE = 'percentage',
    FIXED = 'fixed',
}

@Schema({ timestamps: true })
export class Coupon {
    @Prop({ required: true, unique: true, uppercase: true, trim: true })
    code: string;

    @Prop({ required: true, enum: DiscountType })
    discountType: DiscountType;

    @Prop({ required: true, min: 0 })
    discountValue: number; // % or fixed amount

    @Prop({ default: 0, min: 0 })
    minOrderAmount: number; // minimum subtotal to apply coupon

    @Prop({ type: Number, default: null })
    maxUses: number | null; // null = unlimited

    @Prop({ default: 0 })
    usedCount: number;

    @Prop({ type: Date, default: null })
    expiresAt: Date | null; // null = never expires

    @Prop({ default: true })
    isActive: boolean;

    @Prop({ trim: true })
    description: string;
}

export const CouponSchema = SchemaFactory.createForClass(Coupon);
CouponSchema.index({ code: 1 }, { unique: true });
