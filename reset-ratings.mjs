import { MongoClient, ObjectId } from 'mongodb';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/elevateX';
const client = new MongoClient(MONGODB_URI);

await client.connect();
const db = client.db();

// 1. Reset all product ratings to 0
const { modifiedCount } = await db.collection('products').updateMany({}, { $set: { rating: 0 } });
console.log(`✅ Reset ${modifiedCount} product ratings to 0`);

// 2. Recalculate from approved reviews
const pipeline = [
    { $match: { status: 'approved' } },
    { $group: { _id: '$product', avg: { $avg: '$rating' }, count: { $sum: 1 } } },
];

const results = await db.collection('reviews').aggregate(pipeline).toArray();
console.log(`\n🔄 Recalculating ratings for ${results.length} products with approved reviews:`);

for (const r of results) {
    const rounded = Math.round(r.avg * 10) / 10;
    await db.collection('products').updateOne(
        { _id: r._id },
        { $set: { rating: rounded } }
    );
    const product = await db.collection('products').findOne({ _id: r._id }, { projection: { title: 1 } });
    console.log(`  ${product?.title}: ${rounded} (${r.count} review${r.count !== 1 ? 's' : ''})`);
}

// 3. Show final state
const allProducts = await db.collection('products').find({}).project({ title: 1, rating: 1 }).toArray();
console.log('\n📦 Final product ratings:');
allProducts.forEach(p => console.log(`  [${p.rating}⭐] ${p.title}`));

await client.close();
console.log('\nDone.');
