import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type ReviewDocument = Review & Document;

export enum ReviewStatus {
    PENDING = 'pending',
    APPROVED = 'approved',
    REJECTED = 'rejected',
}

@Schema({ timestamps: true })
export class Review {
    @Prop({ type: Types.ObjectId, ref: 'User', required: true })
    user: Types.ObjectId;

    @Prop({ type: Types.ObjectId, ref: 'Product', required: true })
    product: Types.ObjectId;

    @Prop({ required: true, min: 1, max: 5 })
    rating: number;

    @Prop({ required: true, trim: true, minlength: 10, maxlength: 1000 })
    comment: string;

    @Prop({
        type: String,
        enum: ReviewStatus,
        default: ReviewStatus.PENDING,
    })
    status: ReviewStatus;

    @Prop({ default: false })
    verifiedPurchase: boolean;
}

export const ReviewSchema = SchemaFactory.createForClass(Review);

// One review per user per product
ReviewSchema.index({ user: 1, product: 1 }, { unique: true });
ReviewSchema.index({ product: 1, status: 1 });
ReviewSchema.index({ product: 1, createdAt: -1 });
