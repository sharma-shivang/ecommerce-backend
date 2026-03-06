import {
    Injectable, NotFoundException, BadRequestException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Coupon, CouponDocument, DiscountType } from './schemas/coupon.schema';
import { CreateCouponDto, UpdateCouponDto } from './dto/coupon.dto';

export interface CouponValidationResult {
    valid: boolean;
    coupon?: CouponDocument;
    discountAmount: number;
    message: string;
}

@Injectable()
export class CouponsService {
    constructor(
        @InjectModel(Coupon.name) private couponModel: Model<CouponDocument>,
    ) { }

    // ── Admin: Create coupon ──────────────────────────────────────────────────
    async create(dto: CreateCouponDto): Promise<Coupon> {
        const code = dto.code.toUpperCase().trim();
        const existing = await this.couponModel.findOne({ code }).lean();
        if (existing) throw new ConflictException(`Coupon code "${code}" already exists`);

        const coupon = new this.couponModel({
            ...dto,
            code,
            expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
            maxUses: dto.maxUses ?? null,
        });
        return coupon.save();
    }

    // ── Admin: list all coupons ────────────────────────────────────────────────
    async findAll(): Promise<Coupon[]> {
        return this.couponModel.find().sort({ createdAt: -1 }).lean();
    }

    // ── Admin: update coupon ───────────────────────────────────────────────────
    async update(id: string, dto: UpdateCouponDto): Promise<Coupon> {
        const coupon = await this.couponModel.findByIdAndUpdate(id, dto, { new: true });
        if (!coupon) throw new NotFoundException('Coupon not found');
        return coupon;
    }

    // ── Admin: delete coupon ──────────────────────────────────────────────────
    async remove(id: string): Promise<void> {
        const res = await this.couponModel.findByIdAndDelete(id);
        if (!res) throw new NotFoundException('Coupon not found');
    }

    // ── Public: validate coupon (returns discount amount, not increments usage)─
    async validate(code: string, orderSubtotal: number): Promise<CouponValidationResult> {
        const coupon = await this.couponModel.findOne({ code: code.toUpperCase().trim() });

        if (!coupon) return { valid: false, discountAmount: 0, message: 'Invalid coupon code' };
        if (!coupon.isActive) return { valid: false, discountAmount: 0, message: 'This coupon is no longer active' };
        if (coupon.expiresAt && new Date() > coupon.expiresAt)
            return { valid: false, discountAmount: 0, message: 'This coupon has expired' };
        if (coupon.maxUses !== null && coupon.usedCount >= coupon.maxUses)
            return { valid: false, discountAmount: 0, message: 'This coupon has reached its usage limit' };
        if (orderSubtotal < coupon.minOrderAmount)
            return {
                valid: false, discountAmount: 0,
                message: `Minimum order of $${coupon.minOrderAmount.toFixed(2)} required for this coupon`,
            };

        const discountAmount = this.calculateDiscount(coupon, orderSubtotal);
        return {
            valid: true,
            coupon,
            discountAmount,
            message: coupon.discountType === DiscountType.PERCENTAGE
                ? `${coupon.discountValue}% off applied — saving $${discountAmount.toFixed(2)}`
                : `$${discountAmount.toFixed(2)} discount applied`,
        };
    }

    // ── Internal: apply coupon at checkout (validates + increments usedCount) ──
    async applyAtCheckout(code: string, orderSubtotal: number): Promise<{ discountAmount: number; couponCode: string }> {
        const result = await this.validate(code, orderSubtotal);
        if (!result.valid || !result.coupon) {
            throw new BadRequestException(result.message);
        }

        // Increment usage count atomically
        await this.couponModel.findByIdAndUpdate(result.coupon._id, { $inc: { usedCount: 1 } });

        return {
            discountAmount: result.discountAmount,
            couponCode: result.coupon.code,
        };
    }

    // ── Helpers ──────────────────────────────────────────────────────────────
    private calculateDiscount(coupon: CouponDocument, subtotal: number): number {
        if (coupon.discountType === DiscountType.PERCENTAGE) {
            return Math.round((subtotal * coupon.discountValue) / 100 * 100) / 100;
        }
        // Fixed — cap to subtotal so discount never exceeds what user owes
        return Math.min(coupon.discountValue, subtotal);
    }
}
