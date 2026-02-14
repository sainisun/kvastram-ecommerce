
import Link from 'next/link';
import { Facebook, Instagram, Twitter } from 'lucide-react';

export function Footer() {
    return (
        <footer className="bg-black text-white py-16">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12">
                    {/* Brand */}
                    <div className="space-y-4">
                        <h3 className="text-2xl font-bold tracking-tighter">KVASTRAM</h3>
                        <p className="text-stone-400 text-sm leading-relaxed">
                            Connecting global citizens with the finest artisanal craftsmanship from India and beyond.
                        </p>
                    </div>

                    {/* Shop */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Shop</h4>
                        <ul className="space-y-2 text-sm text-stone-400">
                            <li><Link href="/products" className="hover:text-white transition-colors">New Arrivals</Link></li>
                            <li><Link href="/products" className="hover:text-white transition-colors">Best Sellers</Link></li>
                            <li><Link href="/collections" className="hover:text-white transition-colors">Collections</Link></li>
                            <li><Link href="/products" className="hover:text-white transition-colors">Accessories</Link></li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Support</h4>
                        <ul className="space-y-2 text-sm text-stone-400">
                            <li><Link href="/track" className="hover:text-white transition-colors">Track Order</Link></li>
                            <li><Link href="/stores" className="hover:text-white transition-colors">Store Locator</Link></li>
                            <li><Link href="/pages/contact" className="hover:text-white transition-colors">Contact Us</Link></li>
                            <li><Link href="/pages/shipping-returns" className="hover:text-white transition-colors">Shipping & Returns</Link></li>
                            <li><Link href="/pages/faq" className="hover:text-white transition-colors">FAQ</Link></li>
                            <li><Link href="/pages/privacy-policy" className="hover:text-white transition-colors">Privacy Policy</Link></li>
                            <li><Link href="/pages/terms-of-service" className="hover:text-white transition-colors">Terms of Service</Link></li>
                            <li><Link href="/wholesale" className="hover:text-white transition-colors font-medium text-amber-400 hover:text-amber-300">Wholesale / Bulk Orders</Link></li>
                        </ul>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="text-lg font-semibold mb-4">Follow Us</h4>
                        <div className="flex gap-4">
                            <a href="#" className="text-stone-400 hover:text-white transition-colors"><Instagram size={20} /></a>
                            <a href="#" className="text-stone-400 hover:text-white transition-colors"><Twitter size={20} /></a>
                            <a href="#" className="text-stone-400 hover:text-white transition-colors"><Facebook size={20} /></a>
                        </div>
                    </div>
                </div>

                <div className="border-t border-stone-800 mt-16 pt-8 text-center text-sm text-stone-500">
                    <p>&copy; {new Date().getFullYear()} Kvastram. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
}
