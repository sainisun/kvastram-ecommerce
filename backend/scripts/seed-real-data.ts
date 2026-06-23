import 'dotenv/config';
import { db } from '../src/db/client';
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
  category_circles,
  homepage_merchandising_slots,
  hero_banners,
  homepage_social_posts,
  homepage_categories,
  featured_products,
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
  console.log('--- Seeding Kanthaprint Catalog & Homepage ---');

  // Truncate safely
  await db.execute(sql`TRUNCATE TABLE products CASCADE`);
  await db.execute(sql`TRUNCATE TABLE product_collections CASCADE`);
  await db.execute(sql`TRUNCATE TABLE categories CASCADE`);
  await db.execute(sql`TRUNCATE TABLE tags CASCADE`);
  await db.execute(sql`TRUNCATE TABLE category_circles CASCADE`);
  await db.execute(sql`TRUNCATE TABLE homepage_merchandising_slots CASCADE`);
  await db.execute(sql`TRUNCATE TABLE hero_banners CASCADE`);
  await db.execute(sql`TRUNCATE TABLE homepage_social_posts CASCADE`);
  await db.execute(sql`TRUNCATE TABLE homepage_categories CASCADE`);
  await db.execute(sql`TRUNCATE TABLE featured_products CASCADE`);

  console.log('Cleared existing catalog data.');

  const categoriesData = require('./seed-data.json');

  // 1. Create 6 Collections
  const collectionsToCreate = [
    { title: 'Best Sellers', handle: 'best-sellers', image: 'collection_best_sellers_1782214309551.png', homepage_section: 'collections' },
    { title: 'New Arrivals', handle: 'new-arrivals', image: 'collection_new_arrivals_1782214328383.png', homepage_section: 'collection_slider' },
    { title: 'Trending', handle: 'trending', image: 'collection_trending_1782214338591.png', homepage_section: 'collections' },
    { title: 'Sale', handle: 'sale', image: 'collection_sale_1782214349010.png', homepage_section: 'collection_slider' },
    { title: 'Editors Picks', handle: 'editors-picks', image: 'collection_best_sellers_1782214309551.png', homepage_section: 'collections' }, // placeholder fallback
    { title: 'Essentials', handle: 'essentials', image: 'collection_new_arrivals_1782214328383.png', homepage_section: 'collection_slider' }, // placeholder fallback
  ];

  const collectionIds: Record<string, string> = {};
  let collDisplayOrder = 1;
  for (const coll of collectionsToCreate) {
    const id = uuidv4();
    await db.insert(product_collections).values({
      id,
      title: coll.title,
      handle: coll.handle,
      status: 'active',
      display_order: collDisplayOrder++,
      cover_image_url: `/uploads/real_products/${coll.image}`,
      image: `/uploads/real_products/${coll.image}`,
      homepage_section: coll.homepage_section
    });
    collectionIds[coll.handle] = id;
    console.log(`Created collection: ${coll.title}`);

    // Create homepage merchandising slot for the collection
    await db.insert(homepage_merchandising_slots).values({
      id: uuidv4(),
      slot_key: 'collectionSlider',
      title: coll.title,
      eyebrow: 'Curated',
      image_url: `/uploads/real_products/${coll.image}`,
      link_url: `/collections/${coll.handle}`,
      linked_collection_id: id,
      sort_order: collDisplayOrder,
      is_active: true
    });
  }

  // 2. Create 6 Categories & Category Circles
  const categoryIds: Record<string, string> = {};
  const catImages: Record<string, string> = {
    'New Kantha Short Kimono': 'category_kimono_short_1782214222197.png',
    'Vintage Kantha Jacket': 'category_kantha_jacket_1782214241861.png',
    'Velvet Suzani Jacket': 'category_velvet_suzani_1782214251502.png',
    'Velvet Long Kimono': 'category_velvet_kimono_1782214262711.png',
    'Tote Bags': 'category_tote_bags_1782214289913.png',
    'Gown & Dress': 'category_gown_dress_1782214299602.png',
  };

  let catDisplayOrder = 1;
  for (const catData of categoriesData) {
    const id = uuidv4();
    const handle = toHandle(catData.name);
    const catImage = catImages[catData.name] || catData.products[0]?.image;
    const finalImageUrl = catImage.startsWith('category') ? `/uploads/real_products/${catImage}` : `/uploads/real_products/${catImage}`;
    
    await db.insert(categories).values({
      id,
      name: catData.name,
      slug: handle,
      is_active: true,
      display_order: catDisplayOrder,
      image: finalImageUrl,
    });
    categoryIds[catData.name] = id;
    console.log(`Created category: ${catData.name}`);

    // Create Category Circle for homepage
    await db.insert(category_circles).values({
      id: uuidv4(),
      category_id: id,
      label: catData.name,
      image_url: finalImageUrl,
      link_url: `/categories/${handle}`,
      sort_order: catDisplayOrder,
      is_active: true
    });
    
    // Create Featured Category for homepage (first 4)
    if (catDisplayOrder <= 4) {
      await db.insert(homepage_categories).values({
        id: uuidv4(),
        category_id: id,
        title: catData.name,
        subtitle: 'Shop the look',
        image_url: finalImageUrl,
        link_url: `/categories/${handle}`,
        sort_order: catDisplayOrder,
        is_active: true
      });
    }

    catDisplayOrder++;
  }

  // 3. Seed Hero Banner
  await db.insert(hero_banners).values({
    id: uuidv4(),
    title: 'The Artisan Collection',
    subtitle: 'Handcrafted luxury from Jaipur',
    button_text: 'Shop Now',
    button_link: '/collections/new-arrivals',
    image_url: '/uploads/real_products/collection_best_sellers_1782214309551.png',
    mobile_image_url: '/uploads/real_products/collection_best_sellers_1782214309551.png',
    sort_order: 1,
    is_active: true
  });

  // 4. Seed Social Posts
  for (let i = 1; i <= 4; i++) {
    await db.insert(homepage_social_posts).values({
      id: uuidv4(),
      image_url: `/uploads/real_products/category_tote_bags_1782214289913.png`,
      alt_text: 'Social Post',
      caption: 'Handcrafted luxury',
      destination_url: 'https://instagram.com/kvastram',
      sort_order: i,
      is_active: true
    });
  }

  // 5. Create Products & assign
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

        // Add to collections randomly, but always to 2 collections
        // For simplicity, add the first product of every category to best-sellers and new-arrivals
        const isBestSeller = prod.index <= 2;
        const isNewArrival = prod.index >= 4;

        if (isBestSeller) {
          await db.insert(collection_products).values({ product_id: createdProduct.id, collection_id: collectionIds['best-sellers'] });
          // Also insert into featured_products for bestsellers section
          await db.insert(featured_products).values({
            id: uuidv4(),
            section_key: 'bestsellers',
            product_id: createdProduct.id,
            sort_order: prod.index,
            is_active: true
          });
        }
        if (isNewArrival) {
          await db.insert(collection_products).values({ product_id: createdProduct.id, collection_id: collectionIds['new-arrivals'] });
        }
        // Always add to Trending
        await db.insert(collection_products).values({ product_id: createdProduct.id, collection_id: collectionIds['trending'] });

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
