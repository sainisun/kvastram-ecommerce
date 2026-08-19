import { Logo } from './Logo';
import { DesktopNav } from './DesktopNav';
import { ActionsRight } from './ActionsRight';

interface HeaderMainProps {
  activeMega: string | null;
  onMegaEnter: (label: string) => void;
  onMegaLeave: () => void;
  onSearchOpen: () => void;
  onCartOpen: () => void;
  isTransparent?: boolean;
}

export function HeaderMain({
  activeMega,
  onMegaEnter,
  onMegaLeave,
  onSearchOpen,
  onCartOpen,
  isTransparent = false,
}: HeaderMainProps) {
  const containerCls = isTransparent
    ? 'relative hidden w-full h-[70px] grid-cols-3 items-center bg-transparent border-b border-transparent transition-all duration-300 md:grid px-6 xl:px-8'
    : 'relative hidden w-full h-[78px] grid-cols-3 items-center bg-[rgba(var(--ds-surface-paper-rgb),0.94)] backdrop-blur-xl border-b border-[rgba(var(--ds-ink-rgb),0.12)] shadow-[0_1px_0_rgba(var(--ds-ink-rgb),0.04)] transition-[background-color,box-shadow,transform] duration-[var(--ds-transition-normal)] md:grid px-5 md:px-8 xl:px-12';

  return (
    <div className={containerCls}>
      <div className="flex items-center justify-start min-w-0">
        <DesktopNav
          activeMega={activeMega}
          onMegaEnter={onMegaEnter}
          onMegaLeave={onMegaLeave}
          isTransparent={isTransparent}
        />
      </div>

      <div className="flex items-center justify-center">
        <Logo size="desktop" isTransparent={isTransparent} />
      </div>

      <div className="flex items-center justify-end">
        <ActionsRight onSearchOpen={onSearchOpen} onCartOpen={onCartOpen} isTransparent={isTransparent} />
      </div>
    </div>
  );
}
