
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export default function CollectionsPage() {
    const collections = [
        {
            title: "The Kashmir Edit",
            description: "Hand-spun Pashmina and intricate embroidery from the valleys of North India.",
            image: "/collection-kashmir.jpg", // Placeholder
            handle: "kashmir"
        },
        {
            title: "Italian Leather",
            description: "Vegetable tanned masterpieces from the tanneries of Tuscany.",
            image: "/collection-leather.jpg", // Placeholder
            handle: "leather"
        },
        {
            title: "Royal Silk",
            description: "Banarasi and Kanjeevaram silks fit for royalty.",
            image: "/collection-silk.jpg", // Placeholder
            handle: "silk"
        }
    ];

    return (
        <div className="min-h-screen bg-white pt-20">
            <div className="bg-stone-50 py-16 px-4 sm:px-6 lg:px-8 border-b border-stone-100 mb-12">
                <div className="max-w-7xl mx-auto text-center space-y-4">
                    <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">Curated Series</span>
                    <h1 className="text-4xl md:text-5xl font-serif text-stone-900">Collections</h1>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-6 pb-24 space-y-24">
                {collections.map((col, idx) => (
                    <div key={col.handle} className={`flex flex-col md:flex-row gap-12 items-center ${idx % 2 === 1 ? 'md:flex-row-reverse' : ''}`}>
                        <div className="w-full md:w-1/2 aspect-[4/3] bg-stone-100 relative group overflow-hidden cursor-pointer">
                            <div className="absolute inset-0 bg-stone-200 group-hover:scale-105 transition-transform duration-700"></div>
                            {/* Placeholder for Collection Image */}
                            <div className="absolute inset-0 flex items-center justify-center text-stone-400 font-serif italic text-xl">
                                {col.title} Image
                            </div>
                        </div>
                        <div className="w-full md:w-1/2 space-y-6 text-center md:text-left">
                            <span className="text-xs md:text-sm font-bold tracking-[0.2em] text-stone-400 uppercase">0{idx + 1}</span>
                            <h2 className="text-4xl font-serif text-stone-900">{col.title}</h2>
                            <p className="text-lg text-stone-600 font-light leading-relaxed max-w-md mx-auto md:mx-0">
                                {col.description}
                            </p>
                            <div className="pt-4">
                                <Link href={`/products?collection=${col.handle}`} className="inline-flex items-center gap-2 text-stone-900 border-b border-stone-900 pb-1 hover:text-stone-600 hover:border-stone-600 transition-colors">
                                    Explore Collection <ArrowRight size={16} />
                                </Link>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}
