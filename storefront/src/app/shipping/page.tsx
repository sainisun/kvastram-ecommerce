
import { Globe, Clock } from 'lucide-react';

export default function ShippingPage() {
    return (
        <div className="bg-white min-h-screen pt-24 pb-20">
            <div className="max-w-4xl mx-auto px-6">

                <div className="text-center mb-16 space-y-4">
                    <span className="text-xs font-bold tracking-[0.2em] text-stone-500 uppercase">Global Fulfillment</span>
                    <h1 className="text-4xl font-serif text-stone-900">Shipping & Delivery</h1>
                </div>

                <div className="grid md:grid-cols-2 gap-8 mb-16">
                    <div className="bg-stone-50 p-8 space-y-4">
                        <Globe className="text-stone-900" size={32} />
                        <h3 className="font-bold text-lg text-stone-900">International Shipping</h3>
                        <p className="text-stone-600 font-light text-sm leading-relaxed">
                            We ship to over 150 countries via DHL Express and FedEx International Priority.
                            All shipments are fully insured and trackable.
                        </p>
                    </div>
                    <div className="bg-stone-50 p-8 space-y-4">
                        <Clock className="text-stone-900" size={32} />
                        <h3 className="font-bold text-lg text-stone-900">Delivery Times</h3>
                        <p className="text-stone-600 font-light text-sm leading-relaxed">
                            <strong>North America:</strong> 3-5 business days<br />
                            <strong>Europe:</strong> 3-5 business days<br />
                            <strong>Middle East / Asia:</strong> 2-4 business days<br />
                            <strong>Australia:</strong> 4-6 business days
                        </p>
                    </div>
                </div>

                <div className="prose prose-stone max-w-none">
                    <h3>Duties & Taxes</h3>
                    <p>
                        For most destinations including the USA, UK, EU, Canada, and Australia, we ship on a
                        DDP (Delivery Duty Paid) basis. This means all import taxes and duties are included in the
                        final price you see at checkout. You will not pay anything extra upon delivery.
                    </p>

                    <h3>Processing Time</h3>
                    <p>
                        In-stock items are processed within 24 hours. Made-to-order or personalized items (like Monogrammed Leather)
                        may take an additional 3-5 business days. You will receive an email with tracking details as soon as your order ships.
                    </p>

                    <h3>Returns</h3>
                    <p>
                        We offer complimentary returns worldwide within 14 days of delivery. A pre-paid return label will be included
                        in your package.
                    </p>
                </div>

            </div>
        </div>
    );
}
