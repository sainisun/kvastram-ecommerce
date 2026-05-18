import Link from 'next/link';
import {
  Layers,
  FileText,
  MessageSquare,
  Clapperboard,
  LayoutGrid,
  Sparkles,
} from 'lucide-react';

export default function ContentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Content Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/content/homepage-banners"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Layers className="mb-4 text-blue-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Homepage Banners</h2>
          <p className="text-gray-500">
            Manage the homepage hero/banner slider shown on the storefront.
          </p>
        </Link>
        <Link
          href="/dashboard/content/category-circles"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <LayoutGrid className="mb-4 text-violet-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Category Circles</h2>
          <p className="text-gray-500">
            Manage the circular quick-link row shown under category banners.
          </p>
        </Link>
        <Link
          href="/dashboard/content/homepage-categories"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <LayoutGrid className="mb-4 text-emerald-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Homepage Categories</h2>
          <p className="text-gray-500">
            Manage the homepage category cards shown below the hero.
          </p>
        </Link>
        <Link
          href="/dashboard/content/featured-products"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Sparkles className="mb-4 text-amber-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Spotlight Products</h2>
          <p className="text-gray-500">
            Manage injected mobile spotlight cards between product rows.
          </p>
        </Link>
        <Link
          href="/dashboard/content/hero-banners"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Layers className="mb-4 text-blue-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Hero Banners</h2>
          <p className="text-gray-500">
            Manage admin-controlled homepage hero slider banners.
          </p>
        </Link>
        <Link
          href="/dashboard/content/trending-reels"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Clapperboard className="mb-4 text-rose-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Trending Reels</h2>
          <p className="text-gray-500">
            Manage vertical video cards shown below the hero banner.
          </p>
        </Link>
        <Link
          href="/dashboard/content/reel-collections"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Layers className="mb-4 text-indigo-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Reel Collections</h2>
          <p className="text-gray-500">
            Manage reels page hero carousel slides and collection filters.
          </p>
        </Link>
        <Link
          href="/dashboard/content/posts"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <FileText className="mb-4 text-green-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Blog Posts</h2>
          <p className="text-gray-500">
            Write articles, news, and SEO content.
          </p>
        </Link>
        <Link
          href="/dashboard/content/pages"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <FileText className="mb-4 text-purple-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Legal Pages</h2>
          <p className="text-gray-500">Terms, Privacy, About Us pages.</p>
        </Link>
        <Link
          href="/dashboard/content/testimonials"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <MessageSquare className="mb-4 text-orange-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Testimonials</h2>
          <p className="text-gray-500">Manage customer reviews and feedback.</p>
        </Link>
      </div>
    </div>
  );
}
