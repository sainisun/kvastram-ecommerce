import { createServer } from 'node:http';

const port = Number.parseInt(process.env.MOCK_API_PORT || '4000', 10);
const image = 'https://res.cloudinary.com/demo/image/upload/sample.jpg';
const video = 'https://res.cloudinary.com/demo/video/upload/dog.mp4';

function product(id, title) {
  return {
    id,
    title,
    handle: id,
    status: 'published',
    thumbnail: image,
    images: [{ id: `${id}-image`, url: image }],
    variants: [
      {
        id: `${id}-variant`,
        inventory_quantity: 10,
        prices: [{ amount: 599900, currency_code: 'inr' }],
      },
    ],
    collection: { id: 'collection-1', title: 'Odhvica Edit', handle: 'edit' },
  };
}

const bestSellers = [
  product('best-1', 'Indigo Kantha Jacket'),
  product('best-2', 'Hand Block Printed Dress'),
  product('best-3', 'Quilted Cotton Tote'),
  product('best-4', 'Reversible Artisan Coat'),
];

const homepage = {
  generated_at: '2026-06-21T00:00:00.000Z',
  status: Object.fromEntries(
    [
      'categoryCircles',
      'hero',
      'featuredCategories',
      'bestSellers',
      'collectionSlider',
      'collections',
      'watchShop',
      'brandStory',
      'social',
      'newsletter',
    ].map((key) => [key, { status: 'ready', count: 4 }])
  ),
  category_circles: Array.from({ length: 6 }, (_, index) => ({
    id: `circle-${index + 1}`,
    label: ['Jackets', 'Dresses', 'Bags', 'Quilts', 'Sarees', 'Gifts'][index],
    image_url: image,
    link_url: `/categories/category-${index + 1}`,
    is_active: true,
    sort_order: index,
  })),
  hero: Array.from({ length: 4 }, (_, index) => ({
    id: `hero-${index + 1}`,
    image_url: image,
    mobile_image_url: image,
    title: ['Made slowly, worn often', 'Jaipur in every stitch', 'The art of layering', 'Gifts with a story'][index],
    button_text: 'Shop Now',
    button_link: '/products',
  })),
  featured_categories: Array.from({ length: 4 }, (_, index) => ({
    id: `featured-${index + 1}`,
    name: ['Jackets', 'Dresses', 'Bags', 'Home'][index],
    image_url: image,
    link_url: `/categories/featured-${index + 1}`,
    is_active: true,
    sort_order: index,
  })),
  best_sellers: bestSellers,
  collection_slider: [
    {
      id: 'slider-1',
      title: 'Travel Edit',
      handle: 'travel-edit',
      description: 'Effortless styles for the journey ahead.',
      image,
      products: [product('travel-1', 'Travel Set')],
    },
    {
      id: 'slider-2',
      title: 'One Of Kind',
      handle: 'one-of-a-kind',
      description: 'Artisanal unique pieces.',
      image,
      products: [product('unique-1', 'One of a Kind Scarf')],
    },
    {
      id: 'slider-3',
      title: 'Chic Layers',
      handle: 'chic-layers',
      description: 'Layering essentials for any season.',
      image,
      products: [product('layers-1', 'Artisan Coat')],
    },
    {
      id: 'slider-4',
      title: 'Jaipur Stories',
      handle: 'jaipur-stories',
      description: 'Vibrant hand-block prints.',
      image,
      products: [product('jaipur-1', 'Block Print Dress')],
    },
  ],
  collections: [
    {
      id: 'campaign-1',
      title: 'The Indigo Edit',
      handle: 'indigo-edit',
      description: 'A study in hand stitching and deep natural colour.',
      image,
      products: [
        product('campaign-1-product-1', 'Indigo Wrap'),
        product('campaign-1-product-2', 'Kantha Scarf'),
        product('campaign-1-product-3', 'Quilted Vest'),
      ],
    },
    {
      id: 'campaign-2',
      title: 'Summer in Jaipur',
      handle: 'summer-jaipur',
      description: 'Breathable cotton and hand-blocked colour.',
      image,
      products: [
        product('campaign-2-product-1', 'Cotton Kurta'),
        product('campaign-2-product-2', 'Block Print Dress'),
        product('campaign-2-product-3', 'Summer Stole'),
      ],
    },
  ],
  watch_shop: [
    {
      id: 'reel-1',
      video_url: video,
      thumbnail_url: image,
      sort_order: 0,
      product: product('watch-product-1', 'Kantha Jacket in Motion'),
    },
  ],
  brand_story: {
    title: 'Preserving craft, one thread at a time',
    content: 'Odhvica connects Jaipur-rooted workmanship with considered modern wardrobes.',
    image_url: image,
  },
  social: Array.from({ length: 8 }, (_, index) => ({
    id: `social-${index + 1}`,
    image_url: image,
    alt_text: `Odhvica community look ${index + 1}`,
    caption: 'Handmade textiles in everyday life.',
    destination_url: 'https://instagram.com/odhvica',
    sort_order: index,
  })),
  newsletter: {
    title: 'Join The Odhvica Circle',
    subtitle: 'Craft stories, considered launches, and notes from Jaipur.',
  },
};

const server = createServer((request, response) => {
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Content-Type', 'application/json; charset=utf-8');

  if (request.method === 'OPTIONS') {
    response.statusCode = 204;
    response.end();
    return;
  }

  if (request.url === '/health') {
    response.end(JSON.stringify({ status: 'healthy', service: 'e2e-mock-api' }));
    return;
  }

  if (request.url === '/auth/csrf') {
    response.end(JSON.stringify({ csrf_token: 'e2e-csrf-token' }));
    return;
  }

  if (request.url === '/homepage') {
    response.end(JSON.stringify(homepage));
    return;
  }

  response.end(JSON.stringify({}));
});

server.listen(port, '127.0.0.1', () => {
  console.log(`E2E mock API listening on http://127.0.0.1:${port}`);
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => {
    server.close(() => process.exit(0));
  });
}
