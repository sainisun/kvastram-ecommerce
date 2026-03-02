'use client';

import { X } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SizeGuide as SizeGuideType, SizeMeasurement } from '@/types';

interface SizeGuideProps {
  isOpen: boolean;
  onClose: () => void;
  sizeGuide?: SizeGuideType | string;
}

export function SizeGuide({ isOpen, onClose, sizeGuide }: SizeGuideProps) {
  if (!isOpen) return null;

  const renderCustomSizeChart = (guide: SizeGuideType) => {
    return (
      <div>
        <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">
          {guide.type === 'clothing'
            ? 'Clothing'
            : guide.type === 'shoes'
              ? 'Shoes'
              : 'Accessories'}{' '}
          Size Chart
        </h3>
        <table className="w-full text-sm text-center">
          <thead className="bg-stone-50 text-stone-900 border-b border-stone-100">
            <tr>
              <th className="py-3 font-medium">Size</th>
              {guide.measurements[0]?.chest && (
                <th className="py-3 font-medium">Chest</th>
              )}
              {guide.measurements[0]?.waist && (
                <th className="py-3 font-medium">Waist</th>
              )}
              {guide.measurements[0]?.hips && (
                <th className="py-3 font-medium">Hips</th>
              )}
              {guide.measurements[0]?.length && (
                <th className="py-3 font-medium">Length</th>
              )}
            </tr>
          </thead>
          <tbody className="divide-y divide-stone-100 text-stone-600">
            {guide.measurements.map((m: SizeMeasurement, i: number) => (
              <tr key={i}>
                <td className="py-3 font-medium">{m.size}</td>
                {m.chest && <td>{m.chest}</td>}
                {m.waist && <td>{m.waist}</td>}
                {m.hips && <td>{m.hips}</td>}
                {m.length && <td>{m.length}</td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="size-guide-title"
    >
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div className="relative bg-white w-full max-w-2xl p-8 max-h-[80vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-stone-400 hover:text-black transition-colors"
          aria-label="Close size guide"
        >
          <X size={24} aria-hidden="true" />
        </button>

        <h2
          id="size-guide-title"
          className="text-3xl font-serif text-stone-900 mb-2 text-center"
        >
          Size Guide
        </h2>
        <p className="text-stone-500 text-center mb-8 font-light">
          Measurements in inches
        </p>

        <div className="space-y-8">
          {/* Product-specific size chart — string or structured */}
          {sizeGuide && typeof sizeGuide === 'string' ? (
            <div className="prose prose-stone prose-sm max-w-none mb-6 border-b border-stone-100 pb-6">
              <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">
                Product Size Guide
              </h3>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {sizeGuide}
              </ReactMarkdown>
            </div>
          ) : sizeGuide && typeof sizeGuide === 'object' ? (
            renderCustomSizeChart(sizeGuide)
          ) : null}

          {/* Womenswear Size Chart */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">
              Womenswear
            </h3>
            <table className="w-full text-sm text-center">
              <thead className="bg-stone-50 text-stone-900 border-b border-stone-100">
                <tr>
                  <th className="py-3 font-medium">Size</th>
                  <th className="py-3 font-medium">US</th>
                  <th className="py-3 font-medium">UK</th>
                  <th className="py-3 font-medium">IT</th>
                  <th className="py-3 font-medium">Bust (in)</th>
                  <th className="py-3 font-medium">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-600">
                <tr>
                  <td className="py-3 font-medium">XS</td>
                  <td>0-2</td>
                  <td>4-6</td>
                  <td>36-38</td>
                  <td>32-33</td>
                  <td>24-25</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">S</td>
                  <td>4-6</td>
                  <td>8-10</td>
                  <td>40-42</td>
                  <td>34-35</td>
                  <td>26-27</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">M</td>
                  <td>8-10</td>
                  <td>12-14</td>
                  <td>44-46</td>
                  <td>36-37</td>
                  <td>28-29</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">L</td>
                  <td>12-14</td>
                  <td>16-18</td>
                  <td>48-50</td>
                  <td>38-40</td>
                  <td>30-32</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">XL</td>
                  <td>16-18</td>
                  <td>20-22</td>
                  <td>52-54</td>
                  <td>42-44</td>
                  <td>34-36</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Menswear Size Chart */}
          <div>
            <h3 className="text-sm font-bold uppercase tracking-widest text-stone-900 mb-4">
              Menswear
            </h3>
            <table className="w-full text-sm text-center">
              <thead className="bg-stone-50 text-stone-900 border-b border-stone-100">
                <tr>
                  <th className="py-3 font-medium">Size</th>
                  <th className="py-3 font-medium">US</th>
                  <th className="py-3 font-medium">UK</th>
                  <th className="py-3 font-medium">IT</th>
                  <th className="py-3 font-medium">Chest (in)</th>
                  <th className="py-3 font-medium">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100 text-stone-600">
                <tr>
                  <td className="py-3 font-medium">S</td>
                  <td>34-36</td>
                  <td>34-36</td>
                  <td>44-46</td>
                  <td>34-36</td>
                  <td>28-30</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">M</td>
                  <td>38-40</td>
                  <td>38-40</td>
                  <td>48-50</td>
                  <td>38-40</td>
                  <td>32-34</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">L</td>
                  <td>42-44</td>
                  <td>42-44</td>
                  <td>52-54</td>
                  <td>42-44</td>
                  <td>36-38</td>
                </tr>
                <tr>
                  <td className="py-3 font-medium">XL</td>
                  <td>46-48</td>
                  <td>46-48</td>
                  <td>56-58</td>
                  <td>46-48</td>
                  <td>40-42</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* How to Measure */}
          <div className="bg-stone-50 p-6">
            <h3 className="font-serif text-lg mb-4">How to Measure</h3>
            <div className="grid md:grid-cols-3 gap-4 text-sm text-stone-600">
              <div>
                <p className="font-bold text-stone-900 mb-1">Bust</p>
                <p>
                  Measure around the fullest part of your bust, keeping the tape
                  horizontal.
                </p>
              </div>
              <div>
                <p className="font-bold text-stone-900 mb-1">Waist</p>
                <p>
                  Measure around your natural waistline, keeping the tape
                  comfortably loose.
                </p>
              </div>
              <div>
                <p className="font-bold text-stone-900 mb-1">Hip</p>
                <p>
                  Measure around the fullest part of your hips, about 8&quot;
                  below your waistline.
                </p>
              </div>
            </div>
          </div>

          {/* Fit Advice */}
          <div className="bg-stone-50 p-6">
            <h3 className="font-serif text-lg mb-2">Fit Advice</h3>
            <p className="text-sm text-stone-600 leading-relaxed">
              Our garments are cut for a relaxed, contemporary fit. If you are
              between sizes, we recommend sizing down for a closer fit or sizing
              up for a more oversized silhouette. For detailed measurements of a
              specific item, please contact our concierge at
              concierge@kvastram.com or use the chat widget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
