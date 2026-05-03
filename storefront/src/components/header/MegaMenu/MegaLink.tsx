import Link from 'next/link';
import styles from '../header.module.css';

interface MegaLinkProps {
  label: string;
  href: string;
  isNew?: boolean;
  onClick?: () => void;
}

export function MegaLink({ label, href, isNew, onClick }: MegaLinkProps) {
  return (
    <Link href={href} className={styles.mmLink} onClick={onClick}>
      {label}
      {isNew && (
        <span className="text-[9px] font-medium tracking-[0.08em] uppercase text-white bg-[#c94e2a] px-1.5 py-px rounded-sm leading-none">
          New
        </span>
      )}
    </Link>
  );
}
