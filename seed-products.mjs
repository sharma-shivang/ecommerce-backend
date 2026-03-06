import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/elevateX';

const sampleProducts = [
    {
        title: 'Premium Leather Handbag',
        description: 'Handcrafted Italian leather handbag with gold hardware. Features multiple compartments and a detachable strap. Perfect for everyday luxury.',
        price: 899.99,
        stock: 15,
        category: 'Fashion',
        images: ['https://images.unsplash.com/photo-1548036328-c9fa89d128fa?auto=format&fit=crop&q=80&w=800'],
        rating: 4.8,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Wireless Noise-Cancelling Headphones',
        description: 'Premium over-ear headphones with 40-hour battery life, active noise cancellation, and studio-quality sound. Foldable design for easy travel.',
        price: 349.99,
        stock: 30,
        category: 'Electronics',
        images: ['https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&q=80&w=800'],
        rating: 4.9,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Scented Soy Candle Set',
        description: 'Set of 3 hand-poured soy wax candles in glass vessels. Scents include Cedarwood & Sage, Vanilla Bloom, and Ocean Breeze. Burns for 60+ hours each.',
        price: 79.99,
        stock: 50,
        category: 'Home',
        images: ['https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&q=80&w=800'],
        rating: 4.7,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Minimalist Mechanical Watch',
        description: 'Swiss-inspired mechanical movement with a sapphire crystal glass face and genuine leather strap. Water-resistant to 50m. Day-date display.',
        price: 1299.99,
        stock: 8,
        category: 'Accessories',
        images: ['https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=800'],
        rating: 4.6,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: "Men's Merino Wool Sweater",
        description: 'Ultra-soft 100% Merino wool crewneck sweater. Temperature-regulating for year-round wear. Timeless design in a range of classic colorways.',
        price: 189.99,
        stock: 25,
        category: 'Clothing',
        images: ['https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?auto=format&fit=crop&q=80&w=800'],
        rating: 4.5,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
    {
        title: 'Cold Brew Coffee Maker',
        description: 'Premium stainless steel cold brew coffee maker with a 1L capacity and fine mesh filter. Brews smooth, low-acid coffee concentrate in 12-24 hours.',
        price: 59.99,
        stock: 40,
        category: 'Home',
        images: ['https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?auto=format&fit=crop&q=80&w=800'],
        rating: 4.4,
        createdAt: new Date(),
        updatedAt: new Date(),
    },
];

const client = new MongoClient(MONGODB_URI);

try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const collection = db.collection('products');

    const result = await collection.insertMany(sampleProducts);
    console.log(`✅ Inserted ${result.insertedCount} sample products successfully!`);

    const products = await collection.find({}, { projection: { title: 1, price: 1, category: 1 } }).toArray();
    console.log('\n📦 Current products in database:');
    products.forEach(p => console.log(`  - ${p.title} ($${p.price}) [${p.category}]`));

} catch (err) {
    console.error('❌ Error:', err.message);
} finally {
    await client.close();
}
