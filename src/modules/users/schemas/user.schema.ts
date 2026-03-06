import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export enum UserRole {
    USER = 'user',
    ADMIN = 'admin',
}

export type UserDocument = User & Document;

@Schema({ timestamps: true })
export class User {
    @Prop({ required: true })
    name: string;

    @Prop({ required: true, unique: true })
    email: string;

    @Prop({ required: true, select: false }) // Password shouldn't be selected by default
    password: string;

    @Prop({ type: String, enum: UserRole, default: UserRole.USER })
    role: UserRole;

    @Prop({ default: null })
    refreshToken: string;

    @Prop({ default: null })
    resetPasswordToken: string;

    @Prop({ default: null })
    resetPasswordExpires: Date;
}

export const UserSchema = SchemaFactory.createForClass(User);
