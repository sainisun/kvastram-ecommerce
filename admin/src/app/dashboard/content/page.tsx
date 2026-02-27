import Link from 'next/link';
import { Layers, FileText, MessageSquare, Link as LinkIcon } from 'lucide-react';

export default function ContentDashboard() {
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-6">Content Management</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link
          href="/dashboard/content/banners"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <Layers className="mb-4 text-blue-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Banners & Sliders</h2>
          <p className="text-gray-500">
            Manage homepage hero sliders and promotional banners.
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
        <Link
          href="/dashboard/content/footer-links"
          className="block p-6 bg-white rounded-xl border hover:border-blue-500 transition shadow-sm"
        >
          <LinkIcon className="mb-4 text-amber-600" size={32} />
          <h2 className="text-xl font-bold mb-2">Footer PDF Links</h2>
          <p className="text-gray-500">Manage wholesale footer PDF links and resources.</p>
        </Link>
      </div>
    </div>
  );
}
