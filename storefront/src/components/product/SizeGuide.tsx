
'use client';

import { X } from 'lucide-react';

interface SizeGuideProps {
    isOpen: boolean;
    onClose: () => void;
}

export function SizeGuide({ isOpen, onClose }: SizeGuideProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-labelledby="size-guide-title">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
            <div className="relative bg-white w-full max-w-2xl p-8 max-h-[80vh] overflow-y-auto">
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 text-stone-400 hover:text-black transition-colors"
                    aria-label="Close size guide"
                >
                    <X size={24} aria-hidden="true" />
                </button>

                <h2 id="size-guide-title" className="text-3xl font-serif text-stone-900 mb-2 text-center">Size Guide</h2>
                <p className="text-stone-500 text-center mb-8 font-light">Measurements in inches</p>

                <div className="space-y-8">
                    {/* Apparel Table */}
                    <div>
                        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">Womenswear</h3>
                        <table className="w-full text-sm text-center">
                            <thead className="bg-stone-50 text-stone-900 border-b border-stone-100">
                                <tr>
                                    <th className="py-3 font-medium">Size</th>
                                    <th className="py-3 font-medium">US</th>
                                    <th className="py-3 font-medium">UK</th>
                                    <th className="py-3 font-medium">IT</th>
                                    <th className="py-3 font-medium">Bust</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-stone-100 text-stone-600">
                                <tr><td className="py-3">XS</td><td>0-2</td><td>4-6</td><td>36-38</td><td>32-33</td></tr>
                                <tr><td className="py-3">S</td><td>4-6</td><td>8-10</td><td>40-42</td><td>34-35</td></tr>
                                <tr><td className="py-3">M</td><td>8-10</td><td>12-14</td><td>44-46</td><td>36-37</td></tr>
                                <tr><td className="py-3">L</td><td>12-14</td><td>16-18</td><td>48-50</td><td>38-40</td></tr>
                            </tbody>
                        </table>
                    </div>

                    <div className="bg-stone-50 p-6">
                        <h3 className="font-serif text-lg mb-2">Fit Advice</h3>
                        <p className="text-sm text-stone-600 leading-relaxed">
                            Our garments are cut for a relaxed, contemporary fit. If you are between sizes, we recommend sizing down for a closer fit or sizing up for a more oversized silhouette.
                            For detailed measurements of a specific item, please contact our concierge.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
