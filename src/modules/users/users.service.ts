import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User, UserDocument, UserRole } from './schemas/user.schema';
import { CreateUserDto } from './dto/create-user.dto';

@Injectable()
export class UsersService {
    constructor(
        @InjectModel(User.name) private readonly userModel: Model<UserDocument>,
    ) { }

    async create(createUserDto: CreateUserDto): Promise<UserDocument> {
        const createdUser = new this.userModel(createUserDto);
        return createdUser.save();
    }

    async findByEmail(email: string): Promise<UserDocument | null> {
        // Explicitly add +password since we default excluded it in the schema, but auth logic needs it
        return this.userModel.findOne({ email }).select('+password').exec();
    }

    async findById(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).exec();
    }

    async findByResetToken(token: string): Promise<UserDocument | null> {
        return this.userModel.findOne({ resetPasswordToken: token }).select('+password').exec();
    }

    async findByIdWithPassword(id: string): Promise<UserDocument | null> {
        return this.userModel.findById(id).select('+password').exec();
    }

    async update(id: string, updateData: any): Promise<UserDocument | null> {
        return this.userModel.findByIdAndUpdate(id, updateData, { new: true }).exec();
    }

    async updateRefreshToken(userId: string, refreshToken: string | null) {
        return this.userModel.findByIdAndUpdate(userId, { refreshToken }).exec();
    }

    // Used for initial server start-up logic if zero admins exist
    async createInitialAdmin(hashedPassword: string) {
        const adminEmail = 'admin@elevatex.com';
        const existingAdmin = await this.userModel.findOne({ email: adminEmail });
        if (!existingAdmin) {
            await this.userModel.create({
                name: 'Super Admin',
                email: adminEmail,
                password: hashedPassword,
                role: UserRole.ADMIN,
            });
            console.log('Initial admin created.');
        }
    }

    async findOrCreate(userData: any): Promise<UserDocument> {
        const { email, firstName, lastName } = userData;
        let user = await this.userModel.findOne({ email });

        if (!user) {
            user = await this.userModel.create({
                name: `${firstName} ${lastName}`,
                email,
                password: Math.random().toString(36).slice(-8), // Placeholder password for OAuth users
                role: UserRole.USER,
            });
        }

        return user;
    }
}
