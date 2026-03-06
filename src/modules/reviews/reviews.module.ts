import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Review, ReviewSchema } from './schemas/review.schema';
import { ReviewsService } from './reviews.service';
import { ReviewsController, ReviewsAdminController } from './reviews.controller';
import { Order, OrderSchema } from '../orders/schemas/order.schema';
import { Product, ProductSchema } from '../products/schemas/product.schema';

@Module({
    imports: [
        MongooseModule.forFeature([
            { name: Review.name, schema: ReviewSchema },
            { name: Order.name, schema: OrderSchema },
            { name: Product.name, schema: ProductSchema },
        ]),
    ],
    controllers: [ReviewsController, ReviewsAdminController],
    providers: [ReviewsService],
    exports: [ReviewsService],
})
export class ReviewsModule { }
