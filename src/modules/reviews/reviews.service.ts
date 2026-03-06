import {
    Injectable, NotFoundException, BadRequestException,
    ForbiddenException, ConflictException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Review, ReviewDocument, ReviewStatus } from './schemas/review.schema';
import { CreateReviewDto, ModerateReviewDto } from './dto/review.dto';
import { Order, OrderDocument } from '../orders/schemas/order.schema';
import { Product, ProductDocument } from '../products/schemas/product.schema';

@Injectable()
export class ReviewsService {
    constructor(
        @InjectModel(Review.name) private reviewModel: Model<ReviewDocument>,
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        @InjectModel(Product.name) private productModel: Model<ProductDocument>,
    ) { }

    // ── Verified buyer check ───────────────────────────────────────────────────
    private async isVerifiedBuyer(userId: string, productId: string): Promise<boolean> {
        const order = await this.orderModel.findOne({
            user: new Types.ObjectId(userId),
            'items.product': new Types.ObjectId(productId),
            status: { $in: ['delivered', 'shipped'] },
        }).lean();
        return !!order;
    }

    // ── Create review ──────────────────────────────────────────────────────────
    async createReview(userId: string, productId: string, dto: CreateReviewDto): Promise<Review> {
        const product = await this.productModel.findById(productId).lean();
        if (!product) throw new NotFoundException('Product not found');

        // Prevent duplicate reviews
        const existing = await this.reviewModel.findOne({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
        }).lean();
        if (existing) throw new ConflictException('You have already reviewed this product');

        const verified = await this.isVerifiedBuyer(userId, productId);

        const review = new this.reviewModel({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
            rating: dto.rating,
            comment: dto.comment,
            verifiedPurchase: verified,
            // ALL reviews are auto-approved immediately so they appear right away.
            // Admin can reject/moderate retroactively from the admin panel.
            status: ReviewStatus.APPROVED,
        });

        await review.save();
        await this.recalculateProductRating(productId);

        return review.populate('user', 'name');
    }

    // ── Get approved reviews for a product ────────────────────────────────────
    async getProductReviews(productId: string) {
        const reviews = await this.reviewModel
            .find({
                product: new Types.ObjectId(productId),
                status: ReviewStatus.APPROVED,
            })
            .sort({ createdAt: -1 })
            .populate('user', 'name')
            .lean();

        const total = reviews.length;
        const avg = total > 0
            ? Math.round((reviews.reduce((s, r) => s + r.rating, 0) / total) * 10) / 10
            : 0;

        // Rating breakdown
        const breakdown = [5, 4, 3, 2, 1].map(star => ({
            star,
            count: reviews.filter(r => r.rating === star).length,
        }));

        return { reviews, total, averageRating: avg, breakdown };
    }

    // ── Check if user can review (has purchased + not reviewed yet) ────────────
    async getReviewEligibility(userId: string, productId: string) {
        const verified = await this.isVerifiedBuyer(userId, productId);
        const alreadyReviewed = !!(await this.reviewModel.findOne({
            user: new Types.ObjectId(userId),
            product: new Types.ObjectId(productId),
        }).lean());
        return { canReview: !alreadyReviewed, verifiedPurchase: verified, alreadyReviewed };
    }

    // ── Delete own review ──────────────────────────────────────────────────────
    async deleteReview(userId: string, reviewId: string): Promise<void> {
        const review = await this.reviewModel.findById(reviewId).lean();
        if (!review) throw new NotFoundException('Review not found');
        if ((review as any).user.toString() !== userId) throw new ForbiddenException('Not your review');
        await this.reviewModel.findByIdAndDelete(reviewId);
        await this.recalculateProductRating((review as any).product.toString());
    }

    // ── Admin: get all pending reviews ────────────────────────────────────────
    async getPendingReviews() {
        return this.reviewModel
            .find({ status: ReviewStatus.PENDING })
            .sort({ createdAt: 1 })
            .populate('user', 'name email')
            .populate('product', 'title images')
            .lean();
    }

    // ── Admin: get all reviews (with optional category/product filter) ─────────
    async getAllReviews(status?: string, categoryId?: string, productId?: string) {
        // Fast path: simple filter by productId only
        if (productId && !categoryId) {
            const filter: any = { product: new Types.ObjectId(productId) };
            if (status) filter.status = status;
            return this.reviewModel
                .find(filter)
                .sort({ createdAt: -1 })
                .populate('user', 'name email')
                .populate('product', 'title images category')
                .lean();
        }

        // Aggregation path: join products (and optionally categories) for filtering
        const pipeline: any[] = [
            // Join product
            {
                $lookup: {
                    from: 'products',
                    localField: 'product',
                    foreignField: '_id',
                    as: 'productDoc',
                },
            },
            { $unwind: { path: '$productDoc', preserveNullAndEmptyArrays: false } },
        ];

        if (categoryId) {
            // Join category to resolve its name, then match against product.category string
            pipeline.push({
                $lookup: {
                    from: 'categories',
                    let: { catId: new Types.ObjectId(categoryId) },
                    pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$catId'] } } }],
                    as: 'categoryDoc',
                },
            });
            pipeline.push({ $unwind: { path: '$categoryDoc', preserveNullAndEmptyArrays: false } });
            pipeline.push({
                $match: {
                    $expr: {
                        $eq: [
                            { $toLower: '$productDoc.category' },
                            { $toLower: '$categoryDoc.name' },
                        ],
                    },
                },
            });
        }

        // Status filter
        if (status) pipeline.push({ $match: { status } });

        pipeline.push({ $sort: { createdAt: -1 } });

        // Join user info
        pipeline.push({
            $lookup: {
                from: 'users',
                localField: 'user',
                foreignField: '_id',
                pipeline: [{ $project: { name: 1, email: 1 } }],
                as: 'user',
            },
        });
        pipeline.push({ $unwind: { path: '$user', preserveNullAndEmptyArrays: true } });

        // Shape product back to same structure as populate
        pipeline.push({
            $addFields: {
                product: {
                    _id: '$productDoc._id',
                    title: '$productDoc.title',
                    images: '$productDoc.images',
                    category: '$productDoc.category',
                },
            },
        });
        pipeline.push({ $project: { productDoc: 0, categoryDoc: 0 } });

        return this.reviewModel.aggregate(pipeline).exec();
    }

    // ── Admin: moderate (approve / reject) ────────────────────────────────────
    async moderateReview(reviewId: string, dto: ModerateReviewDto): Promise<Review> {
        const review = await this.reviewModel.findByIdAndUpdate(
            reviewId,
            { status: dto.status },
            { new: true },
        ).populate('user', 'name').populate('product', 'title');
        if (!review) throw new NotFoundException('Review not found');

        // Recalculate product rating when approved
        await this.recalculateProductRating((review as any).product._id.toString());
        return review;
    }

    // ── Admin: delete any review ──────────────────────────────────────────────
    async adminDeleteReview(reviewId: string): Promise<void> {
        const review = await this.reviewModel.findByIdAndDelete(reviewId).lean();
        if (!review) throw new NotFoundException('Review not found');
        await this.recalculateProductRating((review as any).product.toString());
    }

    // ── Recalculate and persist average rating on product ─────────────────────
    private async recalculateProductRating(productId: string): Promise<void> {
        const [{ avgRating } = { avgRating: 0 }] = await this.reviewModel.aggregate([
            {
                $match: {
                    product: new Types.ObjectId(productId),
                    status: ReviewStatus.APPROVED,
                },
            },
            { $group: { _id: null, avgRating: { $avg: '$rating' } } },
        ]);

        await this.productModel.findByIdAndUpdate(productId, {
            rating: Math.round((avgRating ?? 0) * 10) / 10,
        });
    }
}
