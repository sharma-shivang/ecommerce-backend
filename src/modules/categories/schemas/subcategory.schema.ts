import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

export type SubCategoryDocument = SubCategory & Document;

@Schema({ timestamps: true })
export class SubCategory {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, trim: true, lowercase: true })
    slug: string;

    @Prop({ type: Types.ObjectId, ref: 'Category', required: true })
    categoryId: Types.ObjectId;

    @Prop({ default: 0 })
    displayOrder: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const SubCategorySchema = SchemaFactory.createForClass(SubCategory);

// name unique per category
SubCategorySchema.index({ categoryId: 1, name: 1 }, { unique: true });
SubCategorySchema.index({ categoryId: 1, displayOrder: 1 });
SubCategorySchema.index({ categoryId: 1, isActive: 1 });
SubCategorySchema.index({ slug: 1 });
