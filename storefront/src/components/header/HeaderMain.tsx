import { Logo } from './Logo';
import { DesktopNav } from './DesktopNav';
import { ActionsRight } from './ActionsRight';

interface HeaderMainProps {
  activeMega: string | null;
  onMegaEnter: (label: string) => void;
  onMegaLeave: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
}

export function HeaderMain({
  activeMega,
  onMegaEnter,
  onMegaLeave,
  onSearchOpen,
  onCartOpen,
}: HeaderMainProps) {
  return (
    <div className="kv-page-frame relative mx-auto mt-3 hidden h-[74px] w-full max-w-[1440px] grid-cols-[minmax(170px,0.7fr)_minmax(420px,1.8fr)_minmax(170px,0.7fr)] items-center rounded-[999px] border border-[var(--ds-border-subtle)] bg-[var(--ds-surface-parchment)] px-7 shadow-[0_18px_40px_rgba(var(--ds-ink-rgb),0.10)] md:grid xl:px-10">
      <div className="flex items-center justify-start">
        <Logo size="desktop" />
      </div>

      <div className="flex min-w-0 items-center justify-center">
        <DesktopNav
          activeMega={activeMega}
          onMegaEnter={onMegaEnter}
          onMegaLeave={onMegaLeave}
        />
      </div>

      <div className="flex items-center justify-end">
        <ActionsRight onSearchOpen={onSearchOpen} onCartOpen={onCartOpen} />
      </div>
    </div>
  );
}
