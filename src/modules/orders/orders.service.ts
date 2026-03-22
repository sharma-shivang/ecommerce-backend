import { Injectable, BadRequestException, NotFoundException, ForbiddenException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types, PipelineStage } from 'mongoose';
import { Order, OrderDocument } from './schemas/order.schema';
import { CreateOrderDto } from './dto/create-order.dto';
import { AdminOrdersQueryDto, SortBy, SortOrder } from './dto/admin-orders-query.dto';
import { CartService } from '../cart/cart.service';
import { ProductsService } from '../products/products.service';
import { CouponsService } from '../coupons/coupons.service';

const VALID_STATUSES = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];
const CANCELLABLE_STATUSES = ['pending', 'confirmed'];

@Injectable()
export class OrdersService {
    constructor(
        @InjectModel(Order.name) private orderModel: Model<OrderDocument>,
        private cartService: CartService,
        private productsService: ProductsService,
        private couponsService: CouponsService,
    ) { }

    async checkout(userId: string, createOrderDto: CreateOrderDto) {
        const { cart } = await this.cartService.getCart(userId);

        if (!cart || cart.items.length === 0) {
            throw new BadRequestException('Your cart is empty');
        }

        const orderItems: any[] = [];
        let subtotal = 0;

        for (const item of cart.items) {
            const cartProduct = item.product as any;
            const product = await this.productsService.findOne(cartProduct._id.toString());

            if (!product) {
                throw new NotFoundException(`Product not found: ${cartProduct._id}`);
            }
            if (product.stock < item.quantity) {
                throw new BadRequestException(`Insufficient stock for "${product.title}". Only ${product.stock} left.`);
            }

            const exactProduct = product as any;
            const discountPercent = exactProduct.discountPercent || 0;
            const effectivePrice = Math.round(exactProduct.price * (1 - discountPercent / 100));

            orderItems.push({
                product: exactProduct._id,
                quantity: item.quantity,
                price: effectivePrice,
            });
            subtotal += effectivePrice * item.quantity;
        }

        const FREE_SHIPPING_THRESHOLD = 999;
        const flatShipping = subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : 99;

        // Apply coupon if provided
        let discount = 0;
        let couponCode: string | null = null;
        if (createOrderDto.couponCode) {
            const applied = await this.couponsService.applyAtCheckout(
                createOrderDto.couponCode,
                subtotal,
            );
            discount = applied.discountAmount;
            couponCode = applied.couponCode;
        }

        const total = Math.max(0, subtotal - discount + flatShipping);

        const newOrder = new this.orderModel({
            user: userId,
            items: orderItems,
            shippingAddress: createOrderDto.shippingAddress,
            subtotal,
            shipping: flatShipping,
            discount,
            couponCode,
            total,
            status: 'pending',
            email: createOrderDto.email,
            phone: createOrderDto.phone,
            orderNote: createOrderDto.orderNote ?? null,
        });
        await newOrder.save();

        for (const item of orderItems) {
            await this.productsService.updateStock(item.product.toString(), -item.quantity);
        }

        await this.cartService.clearCart(userId);
        return newOrder;
    }

    async getUserOrders(userId: string) {
        return this.orderModel.find({ user: userId })
            .sort({ createdAt: -1 })
            .populate('items.product', 'title images price category')
            .exec();
    }

    async findOne(orderId: string, userId?: string) {
        const order = await this.orderModel.findById(orderId)
            .populate('items.product', 'title images price category description')
            .exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // If userId provided, ensure the order belongs to that user (non-admin access)
        if (userId && order.user.toString() !== userId) {
            throw new ForbiddenException('You do not have access to this order');
        }

        return order;
    }

    async updateStatus(orderId: string, status: string) {
        if (!VALID_STATUSES.includes(status)) {
            throw new BadRequestException(`Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}`);
        }

        const order = await this.orderModel.findByIdAndUpdate(
            orderId,
            { status },
            { new: true }
        ).populate('items.product', 'title images price category').exec();

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        return order;
    }

    async getAllOrders() {
        return this.orderModel.find()
            .sort({ createdAt: -1 })
            .populate('user', 'name email')
            .populate('items.product', 'title images price')
            .exec();
    }

    // ── Advanced admin orders with aggregation ────────────────────────────────
    async getAdminOrders(query: AdminOrdersQueryDto) {
        const {
            categoryId,
            subCategoryId,
            sortBy = SortBy.CREATED_AT,
            order = SortOrder.DESC,
            page = 1,
            limit = 10,
        } = query;

        const skip = (page - 1) * limit;
        const sortDir = order === SortOrder.ASC ? 1 : -1;
        const sortField = sortBy === SortBy.TOTAL ? 'total' : 'createdAt';

        // ── Pipeline stages ─────────────────────────────────────────────────
        const pipeline: PipelineStage[] = [];

        // Only do the product $lookup if we're filtering by category/subcategory
        const needsProductLookup = !!(categoryId || subCategoryId);

        if (needsProductLookup) {
            // 1. Unwind items so we can join each line item to its product
            pipeline.push({ $unwind: '$items' });

            // 2. Lookup the product for each line item
            pipeline.push({
                $lookup: {
                    from: 'products',
                    localField: 'items.product',
                    foreignField: '_id',
                    as: 'items.productDetails',
                },
            });

            pipeline.push({
                $unwind: {
                    path: '$items.productDetails',
                    preserveNullAndEmptyArrays: false,
                },
            });

            // 3. Match on category — subCategoryId takes priority
            // Products currently carry category as a string name;
            // subCategoryId filtering looks up in the subcategories collection
            if (subCategoryId) {
                // Lookup the subcategory to get its name, then match products
                pipeline.push({
                    $lookup: {
                        from: 'subcategories',
                        let: { scId: new Types.ObjectId(subCategoryId) },
                        pipeline: [{ $match: { $expr: { $eq: ['$_id', '$$scId'] } } }],
                        as: 'subcategoryDoc',
                    },
                });
                pipeline.push({ $unwind: { path: '$subcategoryDoc', preserveNullAndEmptyArrays: false } });
                // match product category against subcategory name
                pipeline.push({
                    $match: {
                        $expr: {
                            $eq: [
                                { $toLower: '$items.productDetails.category' },
                                { $toLower: '$subcategoryDoc.name' },
                            ],
                        },
                    },
                });
            } else if (categoryId) {
                // categoryId here is the Category document _id — lookup name first
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
                                { $toLower: '$items.productDetails.category' },
                                { $toLower: '$categoryDoc.name' },
                            ],
                        },
                    },
                });
            }

            // 4. Re-group orders back (de-duplicate after unwind+filter)
            pipeline.push({
                $group: {
                    _id: '$_id',
                    user: { $first: '$user' },
                    items: { $push: '$items' },
                    shippingAddress: { $first: '$shippingAddress' },
                    subtotal: { $first: '$subtotal' },
                    tax: { $first: '$tax' },
                    shipping: { $first: '$shipping' },
                    total: { $first: '$total' },
                    status: { $first: '$status' },
                    createdAt: { $first: '$createdAt' },
                    updatedAt: { $first: '$updatedAt' },
                },
            });
        }

        // 5. Sort
        pipeline.push({ $sort: { [sortField]: sortDir } });

        // 6. $facet — paginated data + total count + global revenue stats in one pass
        pipeline.push({
            $facet: {
                orders: [
                    { $skip: skip },
                    { $limit: limit },
                    // Populate user details
                    {
                        $lookup: {
                            from: 'users',
                            localField: 'user',
                            foreignField: '_id',
                            as: 'user',
                            pipeline: [{ $project: { name: 1, email: 1 } }],
                        },
                    },
                    { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
                    // Populate product details in items
                    {
                        $lookup: {
                            from: 'products',
                            localField: 'items.product',
                            foreignField: '_id',
                            as: '_productDocs',
                            pipeline: [{ $project: { title: 1, images: 1, price: 1, category: 1 } }],
                        },
                    },
                ],
                meta: [
                    { $count: 'total' },
                ],
                revenue: [
                    { $group: { _id: null, totalRevenue: { $sum: '$total' }, totalOrders: { $sum: 1 } } },
                ],
            },
        });

        const [result] = await this.orderModel.aggregate(pipeline).exec();

        const orders = result?.orders ?? [];
        const total = result?.meta?.[0]?.total ?? 0;
        const totalRevenue = result?.revenue?.[0]?.totalRevenue ?? 0;
        const totalOrders = result?.revenue?.[0]?.totalOrders ?? 0;
        const totalPages = Math.ceil(total / limit);

        return {
            orders,
            total,
            page,
            totalPages,
            totalRevenue: Math.round(totalRevenue * 100) / 100,
            totalOrders,
        };
    }

    async cancelOrder(orderId: string, user: any) {
        const order = await this.orderModel.findById(orderId);

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        // Verify ownership: regular users can only cancel their own orders
        if (user.role !== 'admin' && order.user.toString() !== user.userId) {
            throw new ForbiddenException('You do not have permission to cancel this order');
        }

        // Validate status: only allow cancellation if pending or confirmed
        if (!CANCELLABLE_STATUSES.includes(order.status)) {
            throw new BadRequestException(`Order cannot be cancelled. Current status: ${order.status}`);
        }

        // Update status to cancelled
        order.status = 'cancelled';
        await order.save();

        // Restore stock for each item
        for (const item of order.items) {
            try {
                await this.productsService.updateStock(
                    item.product.toString(),
                    item.quantity,
                );
            } catch (err) {
                console.error(`Failed to restore stock for product ${item.product}:`, err);
            }
        }

        console.log(`[REFUND] Placeholder: trigger refund for order ${order._id} of amount ${order.total}`);

        return order;
    }
}

