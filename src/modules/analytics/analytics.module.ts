import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AnalyticsService } from './analytics.service';
import { AnalyticsController } from './analytics.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { User, UserSchema } from '../users/schemas/user.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

import { UsersModule } from '../users/users.module';
import { ProductsModule } from '../products/products.module';
import { OrdersModule } from '../orders/orders.module';

@Module({
    imports: [
        UsersModule,
        ProductsModule,
        OrdersModule,
    ],
    providers: [AnalyticsService],
    controllers: [AnalyticsController],
})
export class AnalyticsModule { }
