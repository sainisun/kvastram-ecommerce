import { revalidatePath, revalidateTag } from 'next/cache';
import { NextRequest, NextResponse } from 'next/server';

interface RevalidateRequestBody {
  secret?: string;
  productId?: string;
  handle?: string;
  paths?: string[];
  tags?: string[];
}

export async function POST(request: NextRequest) {
  const configuredSecret = process.env.REVALIDATE_SECRET;

  if (!configuredSecret) {
    return NextResponse.json(
      { ok: false, error: 'Revalidation secret is not configured.' },
      { status: 503 }
    );
  }

  let body: RevalidateRequestBody;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: 'Invalid JSON body.' },
      { status: 400 }
    );
  }

  if (body.secret !== configuredSecret) {
    return NextResponse.json(
      { ok: false, error: 'Invalid revalidation secret.' },
      { status: 401 }
    );
  }

  const tags = new Set(body.tags || []);
  const paths = new Set(body.paths || []);

  tags.add('products');
  paths.add('/');
  paths.add('/products');

  if (body.productId) {
    tags.add(`product-${body.productId}`);
  }

  if (body.handle) {
    tags.add(`product-${body.handle}`);
    paths.add(`/products/${body.handle}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  tags.forEach((tag) => (revalidateTag as any)(tag));
  paths.forEach((path) => revalidatePath(path, 'page'));

  return NextResponse.json({
    ok: true,
    revalidated: {
      tags: Array.from(tags),
      paths: Array.from(paths),
    },
  });
}
