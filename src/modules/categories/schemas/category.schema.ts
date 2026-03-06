import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type CategoryDocument = Category & Document;

@Schema({ timestamps: true })
export class Category {
    @Prop({ required: true, trim: true })
    name: string;

    @Prop({ required: true, unique: true, trim: true, lowercase: true })
    slug: string;

    @Prop({ trim: true, default: '' })
    description: string;

    @Prop({ default: '' })
    image: string;

    @Prop({ default: 0 })
    displayOrder: number;

    @Prop({ default: true })
    isActive: boolean;
}

export const CategorySchema = SchemaFactory.createForClass(Category);

// Compound + single field indexes
CategorySchema.index({ slug: 1 }, { unique: true });
CategorySchema.index({ displayOrder: 1 });
CategorySchema.index({ isActive: 1, displayOrder: 1 });
