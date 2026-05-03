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
    <div
      className="hidden md:grid h-[68px] px-8 xl:px-12 bg-white border-b border-[#d8d2c8] max-w-[1440px] mx-auto w-full"
      style={{ gridTemplateColumns: '1fr auto 1fr' }}
    >
      {/* Left — Nav */}
      <div className="flex items-center">
        <DesktopNav
          activeMega={activeMega}
          onMegaEnter={onMegaEnter}
          onMegaLeave={onMegaLeave}
        />
      </div>

      {/* Center — Logo */}
      <div className="flex items-center justify-center">
        <Logo size="desktop" />
      </div>

      {/* Right — Actions */}
      <div className="flex items-center">
        <ActionsRight onSearchOpen={onSearchOpen} onCartOpen={onCartOpen} />
      </div>
    </div>
  );
}
