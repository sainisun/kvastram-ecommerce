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
    <div className="hidden md:flex relative items-center h-[68px] px-8 xl:px-12 bg-white border-b border-[#d8d2c8] w-full">
      {/* Left — Nav (takes natural width) */}
      <DesktopNav
        activeMega={activeMega}
        onMegaEnter={onMegaEnter}
        onMegaLeave={onMegaLeave}
      />

      {/* Center — Logo (absolutely centered, independent of nav/icon widths) */}
      <div className="absolute left-1/2 -translate-x-1/2">
        <Logo size="desktop" />
      </div>

      {/* Right — Actions (pushed to right edge) */}
      <div className="ml-auto">
        <ActionsRight onSearchOpen={onSearchOpen} onCartOpen={onCartOpen} />
      </div>
    </div>
  );
}
