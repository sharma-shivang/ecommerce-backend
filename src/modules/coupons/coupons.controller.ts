import {
    Controller, Get, Post, Patch, Delete,
    Body, Param, Query, UseGuards,
} from '@nestjs/common';
import { CouponsService } from './coupons.service';
import { CreateCouponDto, UpdateCouponDto, ValidateCouponDto } from './dto/coupon.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

// ── Public endpoint: validate coupon preview ──────────────────────────────────
@Controller('coupons')
export class CouponsController {
    constructor(private readonly couponsService: CouponsService) { }

    /** POST /coupons/validate — validate without consuming */
    @Post('validate')
    @UseGuards(JwtAuthGuard)
    validate(@Body() dto: ValidateCouponDto) {
        return this.couponsService.validate(dto.code, dto.orderSubtotal);
    }
}

// ── Admin endpoints ───────────────────────────────────────────────────────────
@Controller('admin/coupons')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class CouponsAdminController {
    constructor(private readonly couponsService: CouponsService) { }

    @Post()
    create(@Body() dto: CreateCouponDto) {
        return this.couponsService.create(dto);
    }

    @Get()
    findAll() {
        return this.couponsService.findAll();
    }

    @Patch(':id')
    update(@Param('id') id: string, @Body() dto: UpdateCouponDto) {
        return this.couponsService.update(id, dto);
    }

    @Delete(':id')
    remove(@Param('id') id: string) {
        return this.couponsService.remove(id);
    }
}
