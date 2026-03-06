import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { validationSchema } from './config/validation.schema';
import { HealthModule } from './modules/health/health.module';
import { UsersModule } from './modules/users/users.module';
import { AuthModule } from './modules/auth/auth.module';
import { ProductsModule } from './modules/products/products.module';
import { CartModule } from './modules/cart/cart.module';
import { OrdersModule } from './modules/orders/orders.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { CouponsModule } from './modules/coupons/coupons.module';
import { AnalyticsModule } from './modules/analytics/analytics.module';
import { WishlistModule } from './modules/wishlist/wishlist.module';
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validationSchema,
    }),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        uri: configService.get<string>('MONGODB_URI'),
        // Add connection options to prevent crashing on invalid dummy URI during setup verification
        serverSelectionTimeoutMS: 5000,
      }),
      inject: [ConfigService],
    }),
    ThrottlerModule.forRoot([{
      ttl: 60000,
      limit: 100,
    }]),
    HealthModule,
    UsersModule,
    AuthModule,
    ProductsModule,
    CartModule,
    WishlistModule,
    OrdersModule,
    CategoriesModule,
    ReviewsModule,
    CouponsModule,
    AnalyticsModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule { }
