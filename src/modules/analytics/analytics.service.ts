import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { User, UserDocument } from '../users/schemas/user.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class AnalyticsService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(User.name) private userModel: Model<UserDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    async getSummary() {
        const [totalOrders, totalUsers, revenueResult] = await Promise.all([
            this.orderModel.countDocuments(),
            this.userModel.countDocuments(),
            this.orderModel.aggregate([
                { $match: { status: { $ne: 'cancelled' } } },
                { $group: { _id: null, totalRevenue: { $sum: '$total' } } },
            ]),
        ]);

        return {
            totalOrders,
            totalUsers,
            totalRevenue: revenueResult[0]?.totalRevenue || 0,
        };
    }

    async getSalesStats() {
        // Last 30 days daily sales
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

        return this.orderModel.aggregate([
            {
                $match: {
                    createdAt: { $gte: thirtyDaysAgo },
                    status: { $ne: 'cancelled' },
                },
            },
            {
                $group: {
                    _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } },
                    revenue: { $sum: '$total' },
                    orders: { $sum: 1 },
                },
            },
            { $sort: { _id: 1 } },
        ]);
    }

    async getLowStockProducts(threshold = 10) {
        return this.productModel
            .find({ stock: { $lt: threshold } })
            .select('title stock price category')
            .sort({ stock: 1 })
            .exec();
    }
}
