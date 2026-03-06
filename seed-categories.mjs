import { MongoClient } from 'mongodb';

const MONGODB_URI = 'mongodb://127.0.0.1:27017/elevateX';
const client = new MongoClient(MONGODB_URI);

function slugify(name) {
    return name.toLowerCase().trim()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-');
}

await client.connect();
const db = client.db();

// Pull distinct category strings from existing products
const products = await db.collection('products').find({}, { projection: { category: 1 } }).toArray();
const uniqueNames = [...new Set(products.map(p => p.category).filter(Boolean))];

console.log('Found product categories:', uniqueNames);

// Build category docs
const categories = uniqueNames.map((name, idx) => ({
    name,
    slug: slugify(name),
    description: '',
    image: '',
    displayOrder: idx,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
}));

// Also add any extras not coming from products
const extraCategories = ['Jewelry', 'Sports', 'Beauty', 'Books'].map((name, idx) => ({
    name,
    slug: slugify(name),
    description: '',
    image: '',
    displayOrder: uniqueNames.length + idx,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
})).filter(c => !uniqueNames.map(n => n.toLowerCase()).includes(c.name.toLowerCase()));

const allCats = [...categories, ...extraCategories];

// Upsert by slug
for (const cat of allCats) {
    await db.collection('categories').updateOne(
        { slug: cat.slug },
        { $setOnInsert: cat },
        { upsert: true }
    );
}

const inserted = await db.collection('categories').find({}).sort({ displayOrder: 1 }).toArray();
console.log(`\n✅ Categories in DB (${inserted.length}):`);
inserted.forEach(c => console.log(`  [${c.displayOrder}] ${c.name} (${c.slug}) – ${c.isActive ? 'active' : 'hidden'}`));

await client.close();
