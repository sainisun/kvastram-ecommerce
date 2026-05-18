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
    if (regions.length > 0 && !currentRegion) {
      setRegion(regions[0]);
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
      href: '#',
      icon: Bell,
      label: 'Notifications',
      active: false,
      badge: 'Coming Soon',
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
                {item.badge && (
                  <span className="text-body-xs bg-[var(--ds-surface-warm)] text-[var(--ds-text-secondary)] px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-[var(--ds-text-muted)]" />
              </div>
            </div>
          );

          if (item.href === '#') {
            return (
              <div key={item.label} onClick={item.onClick}>
                {content}
              </div>
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
