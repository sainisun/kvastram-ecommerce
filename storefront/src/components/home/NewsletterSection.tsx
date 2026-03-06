import NewsletterForm from '@/components/NewsletterForm';

interface NewsletterSectionProps {
  newsletterTitle?: string;
  newsletterSubtitle?: string;
}

export function NewsletterSection({
  newsletterTitle,
  newsletterSubtitle,
}: NewsletterSectionProps) {
  return (
    <section className="newsletter-prem">
      <p className="newsletter-eyebrow-prem">Join the Inner Circle</p>
      <h2 className="newsletter-title-prem">
        {newsletterTitle || (
          <>
            Be First <em>to Know</em>
          </>
        )}
      </h2>
      <p className="newsletter-sub-prem">
        {newsletterSubtitle ||
          'Exclusive offers, new artisan collections, early access to limited pieces. No spam — ever.'}
      </p>
      <div className="newsletter-form-prem">
        <NewsletterForm />
      </div>
      <p className="newsletter-note-prem">
        15,000+ subscribers · Unsubscribe anytime
      </p>
    </section>
  );
}