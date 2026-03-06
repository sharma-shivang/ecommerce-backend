import { Controller, Get, Post, Delete, Param, Request, UseGuards, Body } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wishlist')
@UseGuards(JwtAuthGuard)
export class WishlistController {
    constructor(private readonly wishlistService: WishlistService) { }

    @Get()
    getWishlist(@Request() req: any) {
        return this.wishlistService.getWishlist(req.user.userId);
    }

    @Post('add')
    addToWishlist(@Request() req: any, @Body('productId') productId: string) {
        return this.wishlistService.addToWishlist(req.user.userId, productId);
    }

    @Delete('remove/:productId')
    removeFromWishlist(@Request() req: any, @Param('productId') productId: string) {
        return this.wishlistService.removeFromWishlist(req.user.userId, productId);
    }

    @Post('move-to-cart/:productId')
    moveToCart(@Request() req: any, @Param('productId') productId: string) {
        return this.wishlistService.moveToCart(req.user.userId, productId);
    }
}
