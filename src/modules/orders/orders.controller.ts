import { Controller, Post, Get, Patch, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminOrdersQueryDto } from './dto/admin-orders-query.dto';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
    constructor(private readonly ordersService: OrdersService) { }

    // ── User routes ──────────────────────────────────────────────────────────

    @Post('checkout')
    checkout(@Request() req: any, @Body() createOrderDto: CreateOrderDto) {
        return this.ordersService.checkout(req.user.userId, createOrderDto);
    }

    @Get()
    getUserOrders(@Request() req: any) {
        return this.ordersService.getUserOrders(req.user.userId);
    }

    @Get(':id')
    getOrderById(@Request() req: any, @Param('id') id: string) {
        // Admins can see any order; regular users only their own
        const userId = req.user.role === 'admin' ? undefined : req.user.userId;
        return this.ordersService.findOne(id, userId);
    }

    // ── Admin routes ─────────────────────────────────────────────────────────

    @Get('admin/all')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getAllOrders() {
        return this.ordersService.getAllOrders();
    }

    @Get('admin/orders')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    getAdminOrders(@Query() query: AdminOrdersQueryDto) {
        return this.ordersService.getAdminOrders(query);
    }

    @Patch(':id/status')
    @UseGuards(RolesGuard)
    @Roles(UserRole.ADMIN)
    updateStatus(@Param('id') id: string, @Body('status') status: string) {
        return this.ordersService.updateStatus(id, status);
    }

    @Patch(':id/cancel')
    cancelOrder(@Request() req: any, @Param('id') id: string) {
        return this.ordersService.cancelOrder(id, req.user);
    }
}
