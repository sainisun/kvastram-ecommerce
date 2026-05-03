export default function FAQPage() {
  return (
    <div className="min-h-screen bg-white py-12 md:py-16 lg:py-24">
      <div className="mx-auto max-w-3xl px-6 md:px-12 lg:px-20">
        <h1 className="text-display-xl font-serif text-stone-900 mb-12 text-center">
          Frequently Asked Questions
        </h1>

        <div className="space-y-8 divide-y divide-stone-100">
          <div className="pt-8">
            <h3 className="type-bold text-body-xl text-stone-900 mb-3">
              Do you ship internationally?
            </h3>
            <p className="text-stone-600 leading-token-relaxed type-light">
              Yes, we ship to over 150 countries. We use premium carriers like
              DHL and FedEx to ensure your Kvastram pieces arrive safely and
              quickly. All international taxes and duties are calculated at
              checkout, so there are no surprises upon delivery.
            </p>
          </div>

          <div className="pt-8">
            <h3 className="type-bold text-body-xl text-stone-900 mb-3">
              How do I care for my Pashmina?
            </h3>
            <p className="text-stone-600 leading-token-relaxed type-light">
              Authentic Pashmina is delicate. We recommend dry cleaning only. If
              you must wash at home, use cold water, a gentle wool cleanser, and
              never wring the fabric. Lay flat to dry away from direct sunlight.
            </p>
          </div>

          <div className="pt-8">
            <h3 className="type-bold text-body-xl text-stone-900 mb-3">
              What is your return policy?
            </h3>
            <p className="text-stone-600 leading-token-relaxed type-light">
              We accept returns within 14 days of delivery for a full refund.
              Items must be unworn, in original packaging, and with all tags
              attached. Custom or personalized items are final sale.
            </p>
          </div>

          <div className="pt-8">
            <h3 className="type-bold text-body-xl text-stone-900 mb-3">
              Are your leather products ethical?
            </h3>
            <p className="text-stone-600 leading-token-relaxed type-light">
              Absolutely. We use vegetable-tanned leather which avoids harmful
              chemicals like chromium. Our leather is a byproduct of the food
              industry, and we ensure zero waste in our production process.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

