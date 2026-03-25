import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, Query } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
    constructor(private readonly cartService: CartService) { }

    @Get()
    getCart(@Request() req: any) {
        return this.cartService.getCart(req.user.userId);
    }

    @Post('add')
    addToCart(@Request() req: any, @Body() addToCartDto: AddToCartDto) {
        return this.cartService.addToCart(req.user.userId, addToCartDto);
    }

    @Patch('update')
    updateQuantity(
        @Request() req: any,
        @Body() updateCartItemDto: UpdateCartItemDto & { productId: string },
    ) {
        return this.cartService.updateQuantity(
            req.user.userId,
            updateCartItemDto.productId,
            updateCartItemDto,
        );
    }

    @Delete('remove/:productId')
    removeFromCart(
        @Request() req: any,
        @Param('productId') productId: string,
        @Query('variantSku') variantSku?: string
    ) {
        return this.cartService.removeFromCart(req.user.userId, productId, variantSku);
    }

    @Patch('save-for-later/:productId')
    saveForLater(
        @Request() req: any,
        @Param('productId') productId: string,
        @Query('variantSku') variantSku?: string
    ) {
        return this.cartService.saveForLater(req.user.userId, productId, variantSku);
    }

    @Patch('move-to-cart/:productId')
    moveToCart(
        @Request() req: any,
        @Param('productId') productId: string,
        @Query('variantSku') variantSku?: string
    ) {
        return this.cartService.moveToCart(req.user.userId, productId, variantSku);
    }
}
