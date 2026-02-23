'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { User, MapPin, Globe, Bell, LogOut, ChevronRight } from 'lucide-react';
import { useAuth } from '@/context/auth-context';
import { useShop } from '@/context/shop-context';

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
    <div className="bg-white">
      <div className="p-4">
        <h2 className="text-xs font-bold uppercase tracking-widest text-stone-500 mb-3">
          Account Settings
        </h2>
      </div>

      <div className="border-t border-stone-100">
        {menuItems.map((item, index) => {
          const Icon = item.icon;
          const content = (
            <div
              key={item.label}
              className={`flex items-center justify-between p-4 border-b border-stone-100 last:border-b-0 ${
                item.active ? 'bg-stone-50' : 'hover:bg-stone-50'
              } transition-colors cursor-pointer`}
            >
              <div className="flex items-center gap-3">
                <Icon size={18} className="text-stone-500" />
                <span className="text-sm font-medium text-stone-700">
                  {item.label}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {item.badge && (
                  <span className="text-[10px] bg-stone-200 text-stone-600 px-2 py-0.5 rounded">
                    {item.badge}
                  </span>
                )}
                <ChevronRight size={16} className="text-stone-400" />
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
        <button
          onClick={logout}
          className="flex items-center justify-between w-full p-4 border border-red-200 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <div className="flex items-center gap-3">
            <LogOut size={18} className="text-red-600" />
            <span className="text-sm font-medium text-red-700">Sign Out</span>
          </div>
          <ChevronRight size={16} className="text-red-400" />
        </button>
      </div>
    </div>
  );
}
