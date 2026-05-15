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
        <h3 className="size-guide-heading mb-4">
          {guide.type === 'clothing'
            ? 'Clothing'
            : guide.type === 'shoes'
              ? 'Shoes'
              : 'Accessories'}{' '}
          Size Chart
        </h3>
        <table className="size-guide-table">
          <thead className="size-guide-table-head bg-stone-50 border-b border-stone-100">
            <tr>
              <th className="size-guide-table-heading py-3">Size</th>
              {guide.measurements[0]?.chest && (
                <th className="size-guide-table-heading py-3">Chest</th>
              )}
              {guide.measurements[0]?.waist && (
                <th className="size-guide-table-heading py-3">Waist</th>
              )}
              {guide.measurements[0]?.hips && (
                <th className="size-guide-table-heading py-3">Hips</th>
              )}
              {guide.measurements[0]?.length && (
                <th className="size-guide-table-heading py-3">Length</th>
              )}
            </tr>
          </thead>
          <tbody className="size-guide-table-body divide-y divide-stone-100">
            {guide.measurements.map((m: SizeMeasurement, i: number) => (
              <tr key={i}>
                <td className="size-guide-table-heading py-3">{m.size}</td>
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
          className="size-guide-close absolute right-4 top-4 transition-colors"
          aria-label="Close size guide"
        >
          <X size={24} aria-hidden="true" />
        </button>

        <h2
          id="size-guide-title"
          className="size-guide-title mb-2 text-center"
        >
          Size Guide
        </h2>
        <p className="size-guide-subtitle mb-8 text-center">
          Measurements in inches
        </p>

        <div className="space-y-8">
          {/* Product-specific size chart — string or structured */}
          {sizeGuide && typeof sizeGuide === 'string' ? (
            <div className="prose prose-stone prose-sm max-w-none mb-6 border-b border-stone-100 pb-6">
              <h3 className="size-guide-heading mb-4">
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
            <h3 className="size-guide-heading mb-4">
              Womenswear
            </h3>
            <table className="size-guide-table">
              <thead className="size-guide-table-head bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="size-guide-table-heading py-3">Size</th>
                  <th className="size-guide-table-heading py-3">US</th>
                  <th className="size-guide-table-heading py-3">UK</th>
                  <th className="size-guide-table-heading py-3">IT</th>
                  <th className="size-guide-table-heading py-3">Bust (in)</th>
                  <th className="size-guide-table-heading py-3">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="size-guide-table-body divide-y divide-stone-100">
                <tr>
                  <td className="size-guide-table-heading py-3">XS</td>
                  <td>0-2</td>
                  <td>4-6</td>
                  <td>36-38</td>
                  <td>32-33</td>
                  <td>24-25</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">S</td>
                  <td>4-6</td>
                  <td>8-10</td>
                  <td>40-42</td>
                  <td>34-35</td>
                  <td>26-27</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">M</td>
                  <td>8-10</td>
                  <td>12-14</td>
                  <td>44-46</td>
                  <td>36-37</td>
                  <td>28-29</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">L</td>
                  <td>12-14</td>
                  <td>16-18</td>
                  <td>48-50</td>
                  <td>38-40</td>
                  <td>30-32</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">XL</td>
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
            <h3 className="size-guide-heading mb-4">
              Menswear
            </h3>
            <table className="size-guide-table">
              <thead className="size-guide-table-head bg-stone-50 border-b border-stone-100">
                <tr>
                  <th className="size-guide-table-heading py-3">Size</th>
                  <th className="size-guide-table-heading py-3">US</th>
                  <th className="size-guide-table-heading py-3">UK</th>
                  <th className="size-guide-table-heading py-3">IT</th>
                  <th className="size-guide-table-heading py-3">Chest (in)</th>
                  <th className="size-guide-table-heading py-3">Waist (in)</th>
                </tr>
              </thead>
              <tbody className="size-guide-table-body divide-y divide-stone-100">
                <tr>
                  <td className="size-guide-table-heading py-3">S</td>
                  <td>34-36</td>
                  <td>34-36</td>
                  <td>44-46</td>
                  <td>34-36</td>
                  <td>28-30</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">M</td>
                  <td>38-40</td>
                  <td>38-40</td>
                  <td>48-50</td>
                  <td>38-40</td>
                  <td>32-34</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">L</td>
                  <td>42-44</td>
                  <td>42-44</td>
                  <td>52-54</td>
                  <td>42-44</td>
                  <td>36-38</td>
                </tr>
                <tr>
                  <td className="size-guide-table-heading py-3">XL</td>
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
            <h3 className="size-guide-info-title mb-4">How to Measure</h3>
            <div className="size-guide-copy grid gap-4 md:grid-cols-3">
              <div>
                <p className="size-guide-measure-title mb-1">Bust</p>
                <p>
                  Measure around the fullest part of your bust, keeping the tape
                  horizontal.
                </p>
              </div>
              <div>
                <p className="size-guide-measure-title mb-1">Waist</p>
                <p>
                  Measure around your natural waistline, keeping the tape
                  comfortably loose.
                </p>
              </div>
              <div>
                <p className="size-guide-measure-title mb-1">Hip</p>
                <p>
                  Measure around the fullest part of your hips, about 8&quot;
                  below your waistline.
                </p>
              </div>
            </div>
          </div>

          {/* Fit Advice */}
          <div className="bg-stone-50 p-6">
            <h3 className="size-guide-info-title mb-2">Fit Advice</h3>
            <p className="size-guide-copy">
              Our garments are cut for a relaxed, contemporary fit. If you are
              between sizes, we recommend sizing down for a closer fit or sizing
              up for a more oversized silhouette. For detailed measurements of a
              specific item, please contact support@kvastram.com or use the
              chat widget.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}


