'use client';

import React, { memo } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Store, ShoppingBag, Menu } from 'lucide-react';

interface MobileBottomNavProps {
  onOpenMenu: () => void;
  userRole?: string;
}

const MobileBottomNav = memo(function MobileBottomNav({ onOpenMenu, userRole = 'farmer' }: MobileBottomNavProps) {
  const pathname = usePathname();

  const getDashboardHref = () => {
    if (userRole === 'retailer') return '/retailer-dashboard';
    if (userRole === 'logistics') return '/logistics-dashboard';
    return '/farmer-dashboard';
  };

  const dashboardHref = getDashboardHref();
  const isDashboardActive = pathname === '/farmer-dashboard' || pathname === '/retailer-dashboard' || pathname === '/logistics-dashboard';
  const isMarketActive = pathname === '/produce-listing-page' || pathname === '/produce-listing-page/flash';
  const isOrdersActive = pathname === '/produce-listing-page/orders';

  const navItems = [
    {
      id: 'home',
      label: 'Home',
      href: dashboardHref,
      icon: LayoutDashboard,
      active: isDashboardActive,
    },
    {
      id: 'market',
      label: 'Market',
      href: '/produce-listing-page',
      icon: Store,
      active: isMarketActive,
    },
    {
      id: 'orders',
      label: 'Orders',
      href: '/produce-listing-page/orders',
      icon: ShoppingBag,
      active: isOrdersActive,
    },
  ];

  return (
    <nav
      className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-card/95 backdrop-blur-lg border-t safe-area-pb shadow-lg"
      style={{
        borderColor: 'var(--border)',
        backgroundColor: 'rgba(255, 255, 255, 0.96)',
      }}
      aria-label="Mobile Bottom Navigation"
    >
      <div className="flex items-center justify-around h-16 px-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.id}
              href={item.href}
              prefetch={true}
              className={`flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl transition-all duration-200 active:scale-95 ${
                item.active ? 'text-primary font-bold' : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                color: item.active ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              <div
                className={`relative p-1 rounded-xl transition-all duration-200 ${
                  item.active ? 'bg-primary/10' : ''
                }`}
                style={{
                  backgroundColor: item.active ? 'var(--success-bg)' : 'transparent',
                }}
              >
                <Icon className={`w-5 h-5 transition-transform ${item.active ? 'scale-110' : ''}`} />
                {item.active && (
                  <span
                    className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full"
                    style={{ backgroundColor: 'var(--primary)' }}
                  />
                )}
              </div>
              <span className="text-[11px] mt-0.5 tracking-tight font-medium">
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* More Menu Trigger */}
        <button
          onClick={onOpenMenu}
          className="flex flex-col items-center justify-center flex-1 py-1 px-2 rounded-xl text-muted-foreground hover:text-foreground transition-all duration-200 active:scale-95"
          style={{ color: 'var(--muted-foreground)' }}
          aria-label="Open More Features Menu"
        >
          <div className="p-1 rounded-xl">
            <Menu className="w-5 h-5" />
          </div>
          <span className="text-[11px] mt-0.5 tracking-tight font-medium">
            More
          </span>
        </button>
      </div>
    </nav>
  );
});

MobileBottomNav.displayName = 'MobileBottomNav';
export default MobileBottomNav;
