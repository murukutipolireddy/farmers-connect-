'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar';
import MobileBottomNav from './MobileBottomNav';
import EditProfileModal from './EditProfileModal';
import AppLogo from './ui/AppLogo';
import { Menu, ArrowLeft, Bell } from 'lucide-react';
import { subscribeToUserProfile } from '@/lib/realtime';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const pathname = usePathname();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [userInfo, setUserInfo] = useState<any | null>(null);
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);

  useEffect(() => {
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

  const getInitials = (name: string) => {
    return (name || '')
      .split(' ')
      .map((n) => n[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const userInitials = userInfo ? getInitials(userInfo.name) : 'RK';
  const isRetailer = userInfo?.role === 'retailer';
  const isLogistics = userInfo?.role === 'logistics';

  const getDashboardHref = () => {
    if (isRetailer) return '/retailer-dashboard';
    if (isLogistics) return '/logistics-dashboard';
    return '/farmer-dashboard';
  };

  const dashboardHref = getDashboardHref();
  const isRootDashboard = pathname === '/farmer-dashboard' || pathname === '/retailer-dashboard' || pathname === '/logistics-dashboard';

  // Contextual page titles for mobile top bar
  const getPageTitle = () => {
    if (pathname.includes('/produce-listing-page/orders')) return 'My Orders';
    if (pathname.includes('/produce-listing-page/flash')) return 'Flash Surplus Market';
    if (pathname.includes('/produce-listing-page/demand')) return 'Demand Forecasting';
    if (pathname.includes('/produce-listing-page/trace')) return 'Batch Traceability';
    if (pathname.includes('/produce-listing-page')) return 'Produce Marketplace';
    if (pathname.includes('/farmer-dashboard/analytics')) return 'Performance Analytics';
    if (pathname.includes('/farmer-dashboard/finance')) return 'Micro-Finance & Credit';
    if (pathname.includes('/farmer-dashboard/carbon')) return 'Carbon Credits & Eco';
    if (pathname.includes('/farmer-dashboard/voice')) return 'Voice Assistant (Kisan AI)';
    if (pathname.includes('/farmer-dashboard/cooperative')) return 'FPO Cooperative Pools';
    if (isRetailer) return 'Retailer Hub';
    if (isLogistics) return 'Logistics Hub';
    return 'Kisan Dashboard';
  };

  return (
    <div className="flex min-h-screen" style={{ backgroundColor: 'var(--background)' }}>
      {/* Mobile drawer overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/60 lg:hidden animate-fade-in backdrop-blur-xs"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* Sidebar (Desktop sticky, Mobile drawer) */}
      <Sidebar
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed((v) => !v)}
        mobileOpen={mobileSidebarOpen}
        onMobileClose={() => setMobileSidebarOpen(false)}
      />

      {/* Main content wrapper with mobile responsive padding and margins */}
      <div
        className={`flex-1 flex flex-col min-w-0 transition-all duration-300 ml-0 ${
          sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-60'
        }`}
      >
        {/* Mobile top app bar */}
        <header
          className="lg:hidden flex items-center justify-between px-3.5 h-14 border-b sticky top-0 z-30 bg-card/95 backdrop-blur-md safe-area-pt shadow-xs"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          <div className="flex items-center gap-2.5 min-w-0">
            {!isRootDashboard ? (
              <Link
                href={dashboardHref}
                className="p-2 -ml-1 rounded-xl hover:bg-muted active:scale-95 transition-colors"
                aria-label="Back to Dashboard"
              >
                <ArrowLeft className="w-5 h-5 text-foreground" />
              </Link>
            ) : (
              <button
                onClick={() => setMobileSidebarOpen(true)}
                className="p-2 -ml-1 rounded-xl hover:bg-muted active:scale-95 transition-colors"
                aria-label="Open navigation menu"
              >
                <Menu className="w-5 h-5 text-foreground" />
              </button>
            )}

            <div className="flex items-center gap-2 truncate">
              {isRootDashboard && <AppLogo size={24} />}
              <span className="font-display font-bold text-base text-foreground truncate">
                {getPageTitle()}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span
              className="text-2xs font-semibold px-2 py-0.5 rounded-full capitalize"
              style={{
                backgroundColor: isRetailer
                  ? 'var(--info-bg)'
                  : isLogistics
                  ? 'var(--warning-bg)'
                  : 'var(--success-bg)',
                color: isRetailer
                  ? 'var(--info)'
                  : isLogistics
                  ? 'var(--warning)'
                  : 'var(--success)',
              }}
            >
              {userInfo?.role || 'Farmer'}
            </span>

            {/* Mobile Profile Photo / Edit Trigger */}
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="relative p-0.5 rounded-full hover:ring-2 hover:ring-primary/50 transition-all cursor-pointer active:scale-95"
              aria-label="Edit Profile"
              title="Edit Profile & Photo"
            >
              {userInfo?.profileImage ? (
                <img
                  src={userInfo.profileImage}
                  alt={userInfo?.name || 'User'}
                  className="w-8 h-8 rounded-full object-cover border shadow-xs"
                  style={{ borderColor: 'var(--primary)' }}
                />
              ) : (
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold text-primary-foreground shadow-xs"
                  style={{ backgroundColor: 'var(--primary)' }}
                >
                  {userInitials}
                </div>
              )}
            </button>
          </div>
        </header>

        {/* Edit Profile Modal for Mobile & Global Views */}
        <EditProfileModal
          open={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          currentUser={userInfo}
          onProfileUpdated={(updated) => setUserInfo(updated)}
        />

        {/* Page content with bottom padding on mobile for MobileBottomNav */}
        <main className="flex-1 overflow-auto pb-20 lg:pb-0">
          {children}
        </main>

        {/* Mobile Persistent Bottom Navigation */}
        <MobileBottomNav
          onOpenMenu={() => setMobileSidebarOpen(true)}
          userRole={userInfo?.role || 'farmer'}
        />
      </div>
    </div>
  );
}