import 'dotenv/config';
import { db } from '../src/db';
import {
  categories,
  products,
  product_variants,
  product_categories,
  product_collections,
  collection_products,
  product_images,
  tags,
  product_tags,
  settings,
  money_amounts,
} from '../src/db/schema';
import { eq, sql } from 'drizzle-orm';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';
import { ProductMutationService } from '../src/services/product/product-mutation-service';

const uuidv4 = () => crypto.randomUUID();

function toHandle(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

async function seed() {
  console.log('--- Seeding Kanthaprint Catalog ---');

  // Clear existing catalog data using TRUNCATE CASCADE to avoid foreign key constraint violations
  // (e.g. from cart_items, order_items, reviews that might reference existing products)
  await db.execute(sql`TRUNCATE TABLE products CASCADE`);
  await db.execute(sql`TRUNCATE TABLE product_collections CASCADE`);
  await db.execute(sql`TRUNCATE TABLE tags CASCADE`);

  console.log('Cleared existing catalog data.');

  // Load JSON
  // We import directly so esbuild bundles the JSON data into the script
  const categoriesData = require('./seed-data.json');

  // Create Collections
  const collectionsToCreate = [
    { title: 'Best Sellers', handle: 'best-sellers', homepage_section: 'best-sellers', status: 'active', display_order: 1 },
    { title: 'New Arrivals', handle: 'new-arrivals', homepage_section: 'new-arrivals', status: 'active', display_order: 2 },
    { title: 'Sale', handle: 'sale', homepage_section: 'sale', status: 'active', display_order: 3 },
    { title: 'Trending', handle: 'trending', homepage_section: 'trending', status: 'active', display_order: 4 },
  ];

  const collectionIds: Record<string, string> = {};
  for (const coll of collectionsToCreate) {
    const id = uuidv4();
    await db.insert(product_collections).values({
      id,
      ...coll,
    });
    collectionIds[coll.handle] = id;
    console.log(`Created collection: ${coll.title}`);
  }

  // Create Categories
  const categoryIds: Record<string, string> = {};
  let catDisplayOrder = 1;
  for (const catData of categoriesData) {
    const id = uuidv4();
    const handle = toHandle(catData.name);
    // Use the first product's image as the category image
    const firstImg = catData.products[0]?.image;
    
    await db.insert(categories).values({
      id,
      name: catData.name,
      slug: handle,
      is_active: true,
      display_order: catDisplayOrder++,
      image: firstImg ? `/uploads/real_products/${firstImg}` : null,
    });
    categoryIds[catData.name] = id;
    console.log(`Created category: ${catData.name}`);
  }

  const mutationService = new ProductMutationService();

  for (const catData of categoriesData) {
    const categoryId = categoryIds[catData.name];
    
    for (const prod of catData.products) {
      const handle = toHandle(prod.title);
      const imgPath = `/uploads/real_products/${prod.image}`;

      try {
        const createdProduct = await mutationService.create({
          title: prod.title,
          handle: handle,
          description: prod.description,
          status: 'published',
          inventory_quantity: 10,
          seo_title: prod.meta_title,
          seo_description: prod.meta_description,
          thumbnail: imgPath,
          category_ids: [categoryId],
          prices: [
            {
              amount: 500000, // 5000 INR
              currency_code: 'inr'
            }
          ],
          images: [
            {
              url: imgPath,
              is_thumbnail: true,
              position: 0
            }
          ]
        });

        // Add to all 4 collections
        for (const collId of Object.values(collectionIds)) {
          await db.insert(collection_products).values({
            product_id: createdProduct.id,
            collection_id: collId
          });
        }

        console.log(`Created product: ${prod.title}`);
      } catch (err) {
        console.error(`Failed to create product ${prod.title}:`, err);
      }
    }
  }

  console.log('--- Seeding complete! ---');
}

seed()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  });
