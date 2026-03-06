import {
    Controller, Get, Post, Delete, Patch,
    Param, Body, UseGuards, Request, Query,
} from '@nestjs/common';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto, ModerateReviewDto } from './dto/review.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../users/schemas/user.schema';

// ══════════════════════════════════════
// PUBLIC + AUTH ROUTES
// ══════════════════════════════════════
@Controller('reviews')
export class ReviewsController {
    constructor(private readonly reviewsService: ReviewsService) { }

    /** GET /reviews/product/:productId — approved reviews for a product */
    @Get('product/:productId')
    getProductReviews(@Param('productId') productId: string) {
        return this.reviewsService.getProductReviews(productId);
    }

    /** GET /reviews/product/:productId/eligibility — can this user review? */
    @Get('product/:productId/eligibility')
    @UseGuards(JwtAuthGuard)
    getEligibility(@Param('productId') productId: string, @Request() req: any) {
        return this.reviewsService.getReviewEligibility(req.user.userId, productId);
    }

    /** POST /reviews/product/:productId — submit a review */
    @Post('product/:productId')
    @UseGuards(JwtAuthGuard)
    createReview(
        @Param('productId') productId: string,
        @Body() dto: CreateReviewDto,
        @Request() req: any,
    ) {
        return this.reviewsService.createReview(req.user.userId, productId, dto);
    }

    /** DELETE /reviews/:id — delete own review */
    @Delete(':id')
    @UseGuards(JwtAuthGuard)
    deleteReview(@Param('id') id: string, @Request() req: any) {
        return this.reviewsService.deleteReview(req.user.userId, id);
    }
}

// ══════════════════════════════════════
// ADMIN ROUTES
// ══════════════════════════════════════
@Controller('admin/reviews')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class ReviewsAdminController {
    constructor(private readonly reviewsService: ReviewsService) { }

    /** GET /admin/reviews?status=pending|approved|rejected&categoryId=&productId= */
    @Get()
    getAllReviews(
        @Query('status') status?: string,
        @Query('categoryId') categoryId?: string,
        @Query('productId') productId?: string,
    ) {
        return this.reviewsService.getAllReviews(status, categoryId, productId);
    }

    /** GET /admin/reviews/pending */
    @Get('pending')
    getPendingReviews() {
        return this.reviewsService.getPendingReviews();
    }

    /** PATCH /admin/reviews/:id/moderate */
    @Patch(':id/moderate')
    moderateReview(@Param('id') id: string, @Body() dto: ModerateReviewDto) {
        return this.reviewsService.moderateReview(id, dto);
    }

    /** DELETE /admin/reviews/:id */
    @Delete(':id')
    adminDeleteReview(@Param('id') id: string) {
        return this.reviewsService.adminDeleteReview(id);
    }
}
