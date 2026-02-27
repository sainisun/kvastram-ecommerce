import Link from 'next/link';
import { Home, Search, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-stone-50 px-4">
      <div className="text-center max-w-lg">
        <h1 className="text-8xl font-serif text-stone-900 mb-4">404</h1>
        <h2 className="text-2xl font-serif text-stone-700 mb-4">
          Page Not Found
        </h2>
        <p className="text-stone-600 mb-8 leading-relaxed">
          Sorry, the page you are looking for does not exist. It might have been
          moved or deleted.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/"
            className="bg-stone-900 text-white px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-800 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Home size={16} />
            Go Home
          </Link>
          <Link
            href="/search"
            className="border border-stone-900 text-stone-900 px-8 py-3 text-sm font-bold uppercase tracking-widest hover:bg-stone-100 transition-colors inline-flex items-center justify-center gap-2"
          >
            <Search size={16} />
            Search
          </Link>
        </div>
        <div className="mt-8">
          <Link
            href="/"
            className="text-stone-500 hover:text-stone-700 inline-flex items-center gap-2 text-sm"
          >
            <ArrowLeft size={16} />
            Or go back to homepage
          </Link>
        </div>
      </div>
    </div>
  );
}
