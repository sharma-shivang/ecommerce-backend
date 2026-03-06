import { Controller, Get, UseGuards } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

@Controller('analytics')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AnalyticsController {
    constructor(private readonly analyticsService: AnalyticsService) { }

    @Get('summary')
    async getSummary() {
        return this.analyticsService.getSummary();
    }

    @Get('sales-stats')
    async getSalesStats() {
        return this.analyticsService.getSalesStats();
    }

    @Get('low-stock')
    async getLowStockProducts() {
        return this.analyticsService.getLowStockProducts();
    }
}
