import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Coupon, CouponSchema } from './schemas/coupon.schema';
import { CouponsService } from './coupons.service';
import { CouponsController, CouponsAdminController } from './coupons.controller';

@Module({
    imports: [MongooseModule.forFeature([{ name: Coupon.name, schema: CouponSchema }])],
    controllers: [CouponsController, CouponsAdminController],
    providers: [CouponsService],
    exports: [CouponsService],
})
export class CouponsModule { }
