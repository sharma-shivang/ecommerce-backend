const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI).then(() => {
    console.log("Connected to MongoDB for seeding");
}).catch(err => {
    console.error("MongoDB connection error:", err);
    process.exit(1);
});

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true, select: false },
    role: { type: String, enum: ['user', 'admin'], default: 'user' },
}, { timestamps: true });

const ProductVariantSchema = new mongoose.Schema({
    size: { type: String, required: true },
    color: { type: String, required: true },
    price: { type: Number, required: true },
    stock: { type: Number, required: true, min: 0 },
    sku: { type: String, required: true, unique: true },
    images: { type: [String], default: [] }
}, { _id: false });

const ProductSchema = new mongoose.Schema({
    title: { type: String, required: true },
    description: { type: String, required: true },
    price: { type: Number, required: true, min: 0 },
    images: { type: [String], default: [] },
    category: { type: String, required: true },
    stock: { type: Number, min: 0, default: 0 },
    rating: { type: Number, min: 0, max: 5, default: 0 },
    discountPercent: { type: Number, min: 0, max: 100, default: 0 },
    isFeatured: { type: Boolean, default: false },
    variants: { type: [ProductVariantSchema], default: [] }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const Product = mongoose.model('Product', ProductSchema);

async function seed() {
    try {
        const hashedPassword = await bcrypt.hash('admin123', 10);

        await User.updateOne(
            { email: 'admin@elevatex.com' },
            {
                $set: {
                    name: 'Admin User',
                    password: hashedPassword,
                    role: 'admin'
                }
            },
            { upsert: true }
        );
        console.log('Admin user seeded (Email: admin@elevatex.com / Password: admin123)');

        await Product.updateOne(
            { title: 'ElevateX Signature Smartwatch' },
            {
                $set: {
                    description: 'A premium smartwatch designed for the modern lifestyle. Features health tracking, NFC payments, and a stunning AMOLED display.',
                    price: 299,
                    images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800'],
                    category: 'Electronics',
                    stock: 50,
                    rating: 4.8,
                    discountPercent: 10,
                    isFeatured: true,
                    variants: [
                        {
                            size: 'Free Size',
                            color: 'Midnight Black',
                            price: 299,
                            stock: 25,
                            sku: 'EX-SW-MB-001',
                            images: ['https://images.unsplash.com/photo-1579586337278-3befd40fd17a?auto=format&fit=crop&q=80&w=800']
                        },
                        {
                            size: 'Free Size',
                            color: 'Silver',
                            price: 319,
                            stock: 25,
                            sku: 'EX-SW-SV-002',
                            images: ['https://images.unsplash.com/photo-1546868871-7041f2a55e12?auto=format&fit=crop&q=80&w=800']
                        }
                    ]
                }
            },
            { upsert: true }
        );
        console.log('Sample product seeded: ElevateX Signature Smartwatch');

        process.exit(0);
    } catch (error) {
        console.error('Error seeding DB:', error);
        process.exit(1);
    }
}

seed();
