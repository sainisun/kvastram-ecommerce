export type ProductDiscoveryInput = {
  title?: string | null;
  subtitle?: string | null;
  description?: string | null;
  handle?: string | null;
  material?: string | null;
  size_guide?: string | null;
  care_instructions?: string | null;
  origin_country?: string | null;
  seo_title?: string | null;
  seo_description?: string | null;
};

export type InferredProductAttribute = { attribute: string; slug: string; pattern: RegExp };

export function buildProductSeoTitle(data: ProductDiscoveryInput) {
  const raw = (data.seo_title || data.title || '').trim();
  if (!raw) return null;
  const branded = raw.toLowerCase().includes('odhvica') ? raw : `${raw} | Odhvica`;
  return branded.slice(0, 70);
}

export function buildProductMetaDescription(data: ProductDiscoveryInput) {
  const explicit = data.seo_description?.trim();
  if (explicit) return explicit.slice(0, 170);
  const text = [data.title, data.subtitle, data.material, data.description]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
  return text ? text.slice(0, 165) : null;
}

export function buildProductDiscoveryDocument(data: ProductDiscoveryInput) {
  return [
    data.title,
    data.subtitle,
    data.description,
    data.material,
    data.size_guide,
    data.care_instructions,
    data.origin_country === 'IN' ? 'India Jaipur artisan handmade slow fashion' : '',
  ]
    .filter(Boolean)
    .join(' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function inferProductText(data: ProductDiscoveryInput) {
  return [data.title, data.subtitle, data.description, data.handle, data.material]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

const attributeRules: InferredProductAttribute[] = [
  { attribute: 'fabric', slug: 'cotton', pattern: /(cotton|mulmul|voile)/ },
  { attribute: 'fabric', slug: 'velvet', pattern: /velvet/ },
  { attribute: 'technique', slug: 'block-print', pattern: /(block print|block-print|bagru|sanganeri|rajasthani print)/ },
  { attribute: 'technique', slug: 'kantha', pattern: /kantha/ },
  { attribute: 'technique', slug: 'quilted', pattern: /(quilt|quilted)/ },
  { attribute: 'technique', slug: 'embroidery', pattern: /(embroider|embroidery)/ },
  { attribute: 'technique', slug: 'handmade', pattern: /(handmade|hand made|handcrafted|hand crafted|artisan)/ },
  { attribute: 'occasion', slug: 'gift', pattern: /(gift for her|gift for women|gift)/ },
  { attribute: 'occasion', slug: 'travel', pattern: /(travel|toiletry|cosmetic|pouch|vacation)/ },
  { attribute: 'occasion', slug: 'shopping', pattern: /(shopping|shopper|market bag|tote)/ },
  { attribute: 'occasion', slug: 'wedding', pattern: /(wedding|bridal)/ },
  { attribute: 'occasion', slug: 'festive', pattern: /(festival|festive)/ },
  { attribute: 'style', slug: 'boho', pattern: /(boho|bohemian)/ },
  { attribute: 'style', slug: 'ethnic', pattern: /(ethnic|indian|rajasthani|jaipur)/ },
  { attribute: 'style', slug: 'kimono', pattern: /kimono/ },
  { attribute: 'style', slug: 'jacket', pattern: /(jacket|coat)/ },
  { attribute: 'style', slug: 'tote-bag', pattern: /(tote|shoulder bag|shopper|market bag)/ },
  { attribute: 'style', slug: 'toiletry-bag', pattern: /(toiletry|cosmetic|makeup|pouch)/ },
  { attribute: 'pattern', slug: 'floral', pattern: /(floral|flower)/ },
  { attribute: 'pattern', slug: 'fruit-print', pattern: /fruit/ },
  { attribute: 'pattern', slug: 'patchwork', pattern: /(patchwork|patch work)/ },
  { attribute: 'pattern', slug: 'block-print', pattern: /(block print|block-print)/ },
  { attribute: 'color', slug: 'blue', pattern: /(blue|sky blue)/ },
  { attribute: 'color', slug: 'green', pattern: /green/ },
  { attribute: 'color', slug: 'red', pattern: /red/ },
  { attribute: 'color', slug: 'orange', pattern: /orange/ },
  { attribute: 'color', slug: 'white', pattern: /(white|ivory)/ },
  { attribute: 'color', slug: 'yellow', pattern: /(yellow|mustard)/ },
  { attribute: 'color', slug: 'multicolor', pattern: /(multicolor|multi color)/ },
  { attribute: 'region', slug: 'jaipur', pattern: /(jaipur|sanganer)/ },
  { attribute: 'region', slug: 'rajasthan', pattern: /(rajasthan|rajasthani)/ },
  { attribute: 'region', slug: 'india', pattern: /(india|indian|made in india)/ },
  { attribute: 'artisan_type', slug: 'jaipur-artisan', pattern: /(jaipur artisan|jaipur|artisan)/ },
  { attribute: 'artisan_type', slug: 'block-printer', pattern: /(block print|block-printer|block printer)/ },
  { attribute: 'artisan_type', slug: 'hand-quilter', pattern: /(kantha|quilt|quilted)/ },
];

export function inferProductAttributeSlugs(data: ProductDiscoveryInput) {
  const text = inferProductText(data);
  return attributeRules.filter((rule) => rule.pattern.test(text));
}

export function inferProductSemanticEntities(data: ProductDiscoveryInput) {
  const text = inferProductText(data);
  const entities = new Set(['Odhvica', 'handcrafted', 'slow fashion']);
  if (/(jaipur|rajasthan|rajasthani)/.test(text)) entities.add('Jaipur');
  if (/block print|bagru|sanganeri/.test(text)) entities.add('block print');
  if (/kantha/.test(text)) entities.add('Kantha');
  if (/cotton/.test(text)) entities.add('cotton');
  if (/boho|bohemian/.test(text)) entities.add('boho');
  return Array.from(entities);
}

export function inferProductSearchIntents(data: ProductDiscoveryInput) {
  const text = inferProductText(data);
  const intents = new Set(['buy']);
  if (/gift/.test(text)) intents.add('gift');
  if (/travel|toiletry|pouch/.test(text)) intents.add('travel');
  if (/wedding|bridal|festive|festival/.test(text)) intents.add('occasion');
  if (/care|wash/.test(text)) intents.add('care');
  return Array.from(intents);
}
