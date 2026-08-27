'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import AppLogo from './ui/AppLogo';
import {
  LayoutDashboard,
  Sprout,
  ShoppingCart,
  TrendingUp,
  Zap,
  QrCode,
  Mic,
  CreditCard,
  Leaf,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  Bell,
  LogOut,
  BarChart3,
  Sparkles,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';
import { toast } from 'sonner';


import EditProfileModal from './EditProfileModal';
import { subscribeToUserProfile } from '@/lib/realtime';

interface SidebarProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: React.ElementType;
  badge?: number;
  badgeType?: 'alert' | 'info';
}

interface NavGroup {
  id: string;
  label: string;
  items: NavItem[];
}

const navGroups: NavGroup[] = [
  {
    id: 'group-main',
    label: 'Overview',
    items: [
      { id: 'nav-dashboard', label: 'Kisan Dashboard', href: '/farmer-dashboard', icon: LayoutDashboard },
      { id: 'nav-analytics', label: 'Analytics', href: '/farmer-dashboard/analytics', icon: BarChart3 },
    ],
  },
  {
    id: 'group-market',
    label: 'Marketplace',
    items: [
      { id: 'nav-listings', label: 'Produce Listings', href: '/produce-listing-page', icon: Sprout, badge: 3, badgeType: 'info' },
      { id: 'nav-orders', label: 'My Orders', href: '/produce-listing-page/orders', icon: ShoppingCart, badge: 2, badgeType: 'alert' },
      { id: 'nav-demand', label: 'Demand Futures', href: '/produce-listing-page/demand', icon: TrendingUp },
      { id: 'nav-surplus', label: 'Flash Market', href: '/produce-listing-page/flash', icon: Zap, badge: 1, badgeType: 'alert' },
    ],
  },
  {
    id: 'group-trust',
    label: 'Trust & Finance',
    items: [
      { id: 'nav-trace', label: 'Traceability', href: '/produce-listing-page/trace', icon: QrCode },
      { id: 'nav-finance', label: 'Micro-Finance', href: '/farmer-dashboard/finance', icon: CreditCard },
      { id: 'nav-carbon', label: 'Carbon Credits', href: '/farmer-dashboard/carbon', icon: Leaf },
    ],
  },
  {
    id: 'group-tools',
    label: 'Tools',
    items: [
      { id: 'nav-voice', label: 'Voice Assistant', href: '/farmer-dashboard/voice', icon: Mic },
      { id: 'nav-cooperative', label: 'Cooperative', href: '/farmer-dashboard/cooperative', icon: Users },
    ],
  },
];

export default function Sidebar({ collapsed, onToggleCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname === href || pathname.startsWith(href);
  };

  return (
    <>
      {/* Desktop sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex-col border-r hidden lg:flex sidebar-transition overflow-hidden`}
        style={{
          width: collapsed ? '64px' : '240px',
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          boxShadow: '2px 0 8px rgba(0,0,0,0.04)',
        }}
      >
        <SidebarContent
          collapsed={collapsed}
          onToggleCollapse={onToggleCollapse}
          isActive={isActive}
          onItemClick={() => {}}
        />
      </aside>

      {/* Mobile sidebar */}
      <aside
        className={`fixed left-0 top-0 h-full z-50 flex flex-col border-r lg:hidden transition-transform duration-300 ease-in-out`}
        style={{
          width: '240px',
          backgroundColor: 'var(--card)',
          borderColor: 'var(--border)',
          transform: mobileOpen ? 'translateX(0)' : 'translateX(-100%)',
          boxShadow: '4px 0 16px rgba(0,0,0,0.12)',
        }}
      >
        <SidebarContent
          collapsed={false}
          onToggleCollapse={() => {}}
          isActive={isActive}
          onItemClick={onMobileClose}
          showMobileClose
          onMobileClose={onMobileClose}
        />
      </aside>
    </>
  );
}

interface SidebarContentProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  isActive: (href: string) => boolean;
  onItemClick: () => void;
  showMobileClose?: boolean;
  onMobileClose?: () => void;
}

function SidebarContent({
  collapsed,
  onToggleCollapse,
  isActive,
  onItemClick,
  showMobileClose,
  onMobileClose,
}: SidebarContentProps) {
  const [userInfo, setUserInfo] = React.useState<any | null>(null);
  const [demoMode, setDemoMode] = React.useState(true);
  const [isEditProfileOpen, setIsEditProfileOpen] = React.useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agrimart_user');
      let phone = '9876543210';
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          setUserInfo(parsed);
          if (parsed.phone) phone = parsed.phone;
        } catch (e) {}
      }
      const isDemo = localStorage.getItem('agrimart_demo_mode') !== 'false';
      setDemoMode(isDemo);

      const handleUserUpdate = (e: any) => {
        if (e.detail) setUserInfo(e.detail);
      };
      window.addEventListener('agrimart_user_update', handleUserUpdate);

      let unsubProfile: (() => void) | undefined;
      try {
        unsubProfile = subscribeToUserProfile(phone, (updated) => {
          setUserInfo(updated);
        });
      } catch (e) {}

      return () => {
        window.removeEventListener('agrimart_user_update', handleUserUpdate);
        if (typeof unsubProfile === 'function') {
          unsubProfile();
        }
      };
    }
  }, []);

  const toggleDemoMode = () => {
    const nextValue = !demoMode;
    setDemoMode(nextValue);
    if (typeof window !== 'undefined') {
      localStorage.setItem('agrimart_demo_mode', String(nextValue));
      window.dispatchEvent(new Event('agrimart_demo_mode_change'));
    }
    toast.success(nextValue ? 'Demo Mode enabled (Sample data visible)' : 'Demo Mode disabled (Sample data hidden)');
  };

  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const isRetailer = userInfo?.role === 'retailer';
  const isLogistics = userInfo?.role === 'logistics';
  const dashboardHref = isRetailer
    ? '/retailer-dashboard'
    : isLogistics
      ? '/logistics-dashboard'
      : '/farmer-dashboard';
  const dashboardLabel = isRetailer
    ? 'Retailer Dashboard'
    : isLogistics
      ? 'Logistics Dashboard'
      : 'Kisan Dashboard';
 
  const userInitials = userInfo ? getInitials(userInfo.name) : 'RK';
  const userName = userInfo ? userInfo.name : 'Ramesh Kumar';
  const userSub = userInfo?.role === 'retailer'
    ? 'Verified Retailer · 4.9★'
    : userInfo?.role === 'logistics'
      ? 'Verified Logistics · 4.9★'
      : userInfo?.role === 'admin'
        ? 'Administrator'
        : 'Verified Farmer · 4.8★';
  const chipBg = isRetailer
    ? 'var(--info-bg)'
    : isLogistics
      ? 'rgba(124, 58, 237, 0.1)' // Logistics accent color
      : 'var(--success-bg)';
  const chipText = isRetailer
    ? 'var(--info)'
    : isLogistics
      ? '#7c3aed' // Logistics accent text color
      : 'var(--success)';

  const dynamicNavGroups = [
    {
      id: 'group-main',
      label: 'Overview',
      items: [
        { id: 'nav-dashboard', label: dashboardLabel, href: dashboardHref, icon: LayoutDashboard },
        { id: 'nav-analytics', label: 'Analytics', href: `${dashboardHref}/analytics`, icon: BarChart3 },
      ],
    },
    {
      id: 'group-market',
      label: 'Marketplace',
      items: [
        { id: 'nav-listings', label: 'Produce Listings', href: '/produce-listing-page', icon: Sprout, badge: 3, badgeType: 'info' },
        { id: 'nav-orders', label: 'My Orders', href: '/produce-listing-page/orders', icon: ShoppingCart, badge: 2, badgeType: 'alert' },
        { id: 'nav-demand', label: 'Demand Futures', href: '/produce-listing-page/demand', icon: TrendingUp },
        { id: 'nav-surplus', label: 'Flash Market', href: '/produce-listing-page/flash', icon: Zap, badge: 1, badgeType: 'alert' },
      ],
    },
    {
      id: 'group-trust',
      label: 'Trust & Finance',
      items: [
        { id: 'nav-trace', label: 'Traceability', href: '/produce-listing-page/trace', icon: QrCode },
        { id: 'nav-finance', label: 'Micro-Finance', href: '/farmer-dashboard/finance', icon: CreditCard },
        { id: 'nav-carbon', label: 'Carbon Credits', href: '/farmer-dashboard/carbon', icon: Leaf },
      ],
    },
    {
      id: 'group-tools',
      label: 'Tools',
      items: [
        { id: 'nav-voice', label: 'Voice Assistant', href: '/farmer-dashboard/voice', icon: Mic },
        { id: 'nav-cooperative', label: 'Cooperative', href: '/farmer-dashboard/cooperative', icon: Users },
      ],
    },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Edit Profile Modal */}
      <EditProfileModal
        open={isEditProfileOpen}
        onClose={() => setIsEditProfileOpen(false)}
        currentUser={userInfo}
        onProfileUpdated={(updated) => setUserInfo(updated)}
      />

      {/* Logo */}
      <div
        className="flex items-center justify-between px-4 border-b"
        style={{ height: '64px', borderColor: 'var(--border)', minHeight: '64px' }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2 overflow-hidden">
            <AppLogo size={32} />
            <span className="font-display font-semibold text-base truncate" style={{ color: 'var(--primary)' }}>
              AgriMart
            </span>
          </div>
        )}
        {collapsed && (
          <div className="mx-auto">
            <AppLogo size={32} />
          </div>
        )}
        {showMobileClose ? (
          <button
            onClick={onMobileClose}
            className="p-1.5 rounded-lg hover:bg-muted transition-colors ml-auto"
            aria-label="Close sidebar"
          >
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        ) : (
          <button
            onClick={onToggleCollapse}
            className={`p-1.5 rounded-lg hover:bg-muted transition-colors ${collapsed ? 'mx-auto' : ''}`}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            style={{ display: collapsed ? 'none' : 'block' }}
          >
            <ChevronLeft className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </button>
        )}
      </div>

      {/* Collapsed toggle button */}
      {collapsed && !showMobileClose && (
        <button
          onClick={onToggleCollapse}
          className="mx-auto mt-2 p-1.5 rounded-lg hover:bg-muted transition-colors"
          aria-label="Expand sidebar"
        >
          <ChevronRight className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
        </button>
      )}

      {/* Dynamic profile chip (Click to Edit Profile & Photo) */}
      {!collapsed && (
        <div
          onClick={() => setIsEditProfileOpen(true)}
          className="mx-3 mt-3 mb-1 p-3 rounded-xl flex items-center gap-3 cursor-pointer transition-all hover:shadow-xs active:scale-[0.99] group relative"
          style={{ backgroundColor: chipBg }}
          title="Click to Edit Profile & Photo"
        >
          <div className="relative flex-shrink-0">
            {userInfo?.profileImage ? (
              <img
                src={userInfo.profileImage}
                alt={userName}
                className="w-9 h-9 rounded-full object-cover border shadow-xs"
                style={{ borderColor: 'var(--primary)' }}
              />
            ) : (
              <div
                className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shadow-xs"
                style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
              >
                {userInitials}
              </div>
            )}
            <span
              className="absolute -bottom-1 -right-1 p-0.5 rounded-full shadow-xs bg-card text-primary border border-border"
              title="Edit Photo"
            >
              <Sparkles className="w-2.5 h-2.5" />
            </span>
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center justify-between">
              <p className="text-sm font-semibold truncate group-hover:text-primary transition-colors" style={{ color: 'var(--foreground)' }}>
                {userName}
              </p>
              <ChevronRight className="w-3.5 h-3.5 text-muted-foreground group-hover:text-primary transition-colors opacity-70 group-hover:opacity-100" />
            </div>
            <p className="text-xs truncate font-medium" style={{ color: chipText }}>
              {userSub}
            </p>
          </div>
        </div>
      )}

      {/* Collapsed Avatar Button */}
      {collapsed && (
        <button
          onClick={() => setIsEditProfileOpen(true)}
          className="mx-auto mt-3 p-1 rounded-full hover:ring-2 hover:ring-primary/50 transition-all"
          title={`Edit Profile (${userName})`}
        >
          {userInfo?.profileImage ? (
            <img
              src={userInfo.profileImage}
              alt={userName}
              className="w-8 h-8 rounded-full object-cover border"
              style={{ borderColor: 'var(--primary)' }}
            />
          ) : (
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {userInitials}
            </div>
          )}
        </button>
      )}

      {/* Nav groups */}
      <nav className="flex-1 overflow-y-auto py-2 scrollbar-hide">
        {dynamicNavGroups.map((group) => (
          <div key={group.id} className="mb-1">
            {!collapsed && (
              <p
                className="px-4 py-1.5 text-2xs font-semibold uppercase tracking-widest"
                style={{ color: 'var(--muted-foreground)', letterSpacing: '0.1em' }}
              >
                {group.label}
              </p>
            )}
            {group.items.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href);
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  prefetch={true}
                  onClick={onItemClick}
                  className={`flex items-center gap-3 mx-2 mb-0.5 rounded-lg transition-all duration-150 group relative
                    ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}
                    ${active
                      ? 'bg-primary/10 text-primary' :'hover:bg-muted text-muted-foreground hover:text-foreground'
                    }`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon
                    className={`flex-shrink-0 transition-colors ${collapsed ? 'w-5 h-5' : 'w-4 h-4'}`}
                    strokeWidth={active ? 2.5 : 1.8}
                  />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium flex-1 truncate">{item.label}</span>
                      {item.badge !== undefined && (
                        <span
                          className="text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                          style={{
                            backgroundColor: item.badgeType === 'alert' ? 'var(--danger-bg)' : 'var(--info-bg)',
                            color: item.badgeType === 'alert' ? 'var(--danger)' : 'var(--info)',
                          }}
                        >
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                  {/* Collapsed badge dot */}
                  {collapsed && item.badge !== undefined && (
                    <span
                      className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full"
                      style={{ backgroundColor: item.badgeType === 'alert' ? 'var(--danger)' : 'var(--info)' }}
                    />
                  )}
                </Link>
              );
            })}
            {!collapsed && <div className="mx-3 mt-1 mb-2 h-px" style={{ backgroundColor: 'var(--border)' }} />}
          </div>
        ))}
      </nav>

      {/* Bottom actions */}
      <div className="border-t pb-2 pt-2" style={{ borderColor: 'var(--border)' }}>
        <button
          onClick={toggleDemoMode}
          className={`w-[calc(100%-16px)] flex items-center gap-3 mx-2 mb-0.5 rounded-lg transition-colors hover:bg-muted py-2.5 text-left
            ${collapsed ? 'justify-center px-0' : 'px-3'}`}
          title={collapsed ? (demoMode ? 'Demo Mode: ON' : 'Demo Mode: OFF') : undefined}
        >
          <Sparkles className={`w-4 h-4 flex-shrink-0 transition-colors ${demoMode ? 'text-amber-500 animate-pulse' : 'text-muted-foreground'}`} />
          {!collapsed && (
            <div className="flex-1 flex items-center justify-between text-left">
              <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Demo Mode</span>
              <div
                className="w-8 h-4 rounded-full p-0.5 transition-colors duration-200 flex items-center"
                style={{ backgroundColor: demoMode ? 'var(--primary)' : 'var(--border)' }}
              >
                <div
                  className="w-3 h-3 rounded-full bg-white transition-transform duration-200"
                  style={{ transform: demoMode ? 'translateX(14px)' : 'translateX(0px)' }}
                />
              </div>
            </div>
          )}
        </button>
        <Link
          href={`${dashboardHref}`}
          className={`flex items-center gap-3 mx-2 mb-0.5 rounded-lg transition-colors hover:bg-muted
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}
          title={collapsed ? 'Notifications' : undefined}
        >
          <Bell className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
          {!collapsed && <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Notifications</span>}
        </Link>
        <button
          onClick={() => setIsEditProfileOpen(true)}
          className={`w-[calc(100%-16px)] flex items-center gap-3 mx-2 mb-0.5 rounded-lg transition-colors hover:bg-muted text-left
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}
          title={collapsed ? 'Edit Profile & Settings' : undefined}
        >
          <Settings className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--muted-foreground)' }} />
          {!collapsed && <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>Profile Settings</span>}
        </button>
        <Link
          href="/"
          onClick={() => {
            if (typeof window !== 'undefined') {
              localStorage.removeItem('agrimart_user');
            }
          }}
          className={`flex items-center gap-3 mx-2 rounded-lg transition-colors hover:bg-danger/10
            ${collapsed ? 'justify-center px-0 py-3' : 'px-3 py-2.5'}`}
          title={collapsed ? 'Sign Out' : undefined}
        >
          <LogOut className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--danger)' }} />
          {!collapsed && <span className="text-sm font-medium" style={{ color: 'var(--danger)' }}>Sign Out</span>}
        </Link>
      </div>
    </div>
  );
}