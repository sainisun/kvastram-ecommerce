import Link from 'next/link';
import OptimizedImage from '@/components/ui/OptimizedImage';

interface EditorialSectionProps {
  brandStoryImage?: string;
  brandStoryContent?: string;
}

export function EditorialSection({
  brandStoryImage,
  brandStoryContent,
}: EditorialSectionProps) {
  return (
    <div className="editorial-prem reveal">
      <div className="editorial-img-prem">
        <OptimizedImage
          src={brandStoryImage || '/images/home/atelier-story.jpg'}
          alt="Kvastram Artisan Workshop"
          fill
          className="object-cover"
        />
      </div>
      <div className="editorial-content-prem">
        <p className="editorial-eyebrow-prem">Our Heritage</p>
        <h2 className="editorial-title-prem">
          Crafted with
          <br />
          Soul & <em>Purpose</em>
        </h2>
        <p className="editorial-body-prem">
          {brandStoryContent ||
            'Every Kvastram piece begins its journey in the workshops of master artisans in Varanasi, India. Our artisans have inherited skills passed down through generations, creating garments that are not just clothing, but heirlooms.'}
        </p>
        <Link href="/about" className="btn-outline-prem">
          Meet Our Artisans
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </div>
  );
}