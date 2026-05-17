import Link from 'next/link';

interface SubItem {
  label: string;
  href: string;
}

interface SubSection {
  label: string;
  items: SubItem[];
}

interface DrawerSubSectionProps {
  sections: SubSection[];
  viewAllLabel: string;
  viewAllHref: string;
  onClose: () => void;
}

export function DrawerSubSection({ sections, viewAllLabel, viewAllHref, onClose }: DrawerSubSectionProps) {
  return (
    <div className="bg-[var(--ds-surface-parchment)]">
      {sections.map((section) => (
        <div key={section.label}>
          <p className="font-body text-[9px] font-medium tracking-[0.14em] uppercase text-[var(--ds-text-disabled)] px-4 pt-3.5 pb-1.5">
            {section.label}
          </p>
          {section.items.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className="flex items-center gap-2 px-4 py-2.5 font-display text-[14px] text-[var(--ds-text-primary)] hover:bg-[var(--ds-surface-parchment-2)] transition-colors"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[var(--ds-accent-primary)] shrink-0" />
              {item.label}
            </Link>
          ))}
        </div>
      ))}
      <Link
        href={viewAllHref}
        onClick={onClose}
        className="flex items-center px-4 py-3 font-body text-[12px] uppercase tracking-[0.06em] text-[var(--ds-accent-primary)] font-medium"
      >
        {viewAllLabel} →
      </Link>
    </div>
  );
}
