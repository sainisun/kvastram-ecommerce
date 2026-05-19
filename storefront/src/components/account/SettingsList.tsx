'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, Globe, Bell, LogOut, ChevronRight, MessageCircle } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useShop } from '@/context/shop-context';
import { Button } from '@/components/ui/Button';

export function SettingsList() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { currentRegion, setRegion, regions } = useShop();

  const handleRegionClick = () => {
    if (regions.length === 0) return;

    const currentIndex = regions.findIndex((region) => region.id === currentRegion?.id);
    const nextRegion = regions[(currentIndex + 1) % regions.length];
    if (nextRegion) {
      setRegion(nextRegion);
    }
  };

  const menuItems = [
    {
      href: '/account/profile',
      icon: User,
      label: 'Edit Profile',
      active: pathname === '/account/profile',
    },
    {
      href: '/account/addresses',
      icon: MapPin,
      label: 'Saved Addresses',
      active: pathname === '/account/addresses',
    },
    {
      href: '/account/messages',
      icon: MessageCircle,
      label: 'Messages',
      active: pathname.startsWith('/account/messages'),
    },
    {
      href: '#',
      icon: Globe,
      label: currentRegion ? `Region: ${currentRegion.name}` : 'Select Region',
      active: false,
      onClick: handleRegionClick,
    },
    {
      href: '/account/notifications',
      icon: Bell,
      label: 'Notifications',
      active: pathname === '/account/notifications',
    },
  ];

  return (
    <div className="bg-[var(--ds-surface-paper)]">
      <div className="p-4">
        <h2 className="text-body-xs type-bold  tracking-token-wider text-[var(--ds-text-muted)] mb-3">
          Account Settings
        </h2>
      </div>

      <div className="border-t border-[var(--ds-border-subtle)]">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const content = (
            <div
              key={item.label}
              className={`flex items-center justify-between p-4 border-b border-[var(--ds-border-subtle)] last:border-b-0 ${
                item.active ? 'bg-[var(--ds-surface-parchment)]' : 'hover:bg-[var(--ds-surface-parchment)]'
              } transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-[var(--ds-text-muted)]" />
                <span className="text-body-sm type-medium text-[var(--ds-text-secondary)]">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <ChevronRight size={16} className="text-[var(--ds-text-muted)]" />
              </div>
            </div>
          );

          if (item.href === '#') {
            return (
              <button key={item.label} type="button" onClick={item.onClick} className="block w-full text-left">
                {content}
              </button>
            );
          }

          return (
            <Link key={item.label} href={item.href}>
              {content}
            </Link>
          );
        })}
      </div>

      <div className="p-4 mt-2">
        <Button
          type="button"
          onClick={logout}
          variant="ghost"
          size="md"
          fullWidth
          className="justify-between border border-[var(--ds-danger)] bg-[var(--ds-danger-bg)] p-4 normal-case hover:bg-[var(--ds-danger-bg)]"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-[var(--ds-danger)]" />
            <span className="text-body-sm type-medium text-[var(--ds-danger)]">Sign Out</span>
          </div>
          <ChevronRight size={16} className="text-[var(--ds-danger)]" />
        </Button>
      </div>
    </div>
  );
}
