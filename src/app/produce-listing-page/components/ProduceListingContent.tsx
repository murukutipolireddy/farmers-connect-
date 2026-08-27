'use client';

import React, { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import dynamic from 'next/dynamic';
import { Search, SlidersHorizontal, Grid3X3, List, Plus, ChevronDown, X, Sprout, Zap, QrCode, Users, RefreshCw, Filter, ShoppingCart, Eye } from 'lucide-react';
import { toast } from 'sonner';
import GradeBadge from '@/components/ui/GradeBadge';

import ProduceCard from './ProduceCard';
import ProduceListRow from './ProduceListRow';
import { apiFetch } from '@/lib/api';
import { allListings } from './produceData';
import { INITIAL_LISTINGS } from '@/lib/initialData';
import { subscribeToListings } from '@/lib/realtime';

const CreateListingModal = dynamic(() => import('./CreateListingModal'), { ssr: false });

const cropTypes = [
  'Tomato', 'Potato', 'Onion', 'Cauliflower', 'Spinach',
  'Brinjal', 'Okra', 'Bitter Gourd', 'Capsicum', 'Carrot',
  'Cabbage', 'Pumpkin', 'Ridge Gourd', 'Green Chilli',
];

const regions = [
  'All India', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
  'Andhra Pradesh', 'Uttar Pradesh', 'Punjab', 'Gujarat',
];

type SortKey = 'newest' | 'price-asc' | 'price-desc' | 'grade' | 'freshness' | 'qty-desc';

const sortOptions: { value: SortKey; label: string }[] = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'grade', label: 'Best Grade First' },
  { value: 'freshness', label: 'Freshness Score' },
  { value: 'qty-desc', label: 'Largest Quantity' },
];

export default function ProduceListingContent() {
  const [activeTab, setActiveTab] = useState<'sell' | 'buy'>('sell');
  const [listings, setListings] = useState<any[]>(() => INITIAL_LISTINGS.filter(l => !l.isBuyRequest));
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const deferredSearchQuery = useDeferredValue(searchQuery);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [userRole, setUserRole] = useState<'farmer' | 'retailer'>('farmer');
  const [userPhone, setUserPhone] = useState('');
  const [userName, setUserName] = useState('');
  const [demoMode, setDemoMode] = useState(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      const handleDemoToggle = () => {
        setDemoMode(localStorage.getItem('agrimart_demo_mode') !== 'false');
      };
      window.addEventListener('agrimart_demo_mode_change', handleDemoToggle);
      return () => window.removeEventListener('agrimart_demo_mode_change', handleDemoToggle);
    }
  }, []);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('agrimart_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          setUserRole(user.role === 'retailer' ? 'retailer' : 'farmer');
          setUserPhone(user.phone);
          setUserName(user.name);
        } catch (e) {}
      }
    }
  }, []);

  // Real-Time Firebase Firestore Subscription
  useEffect(() => {
    setIsLoading(true);
    const isBuyRequest = activeTab === 'buy';

    const unsubscribe = subscribeToListings(
      { isBuyRequest },
      (updatedListings) => {
        if (updatedListings && updatedListings.length > 0) {
          setListings(updatedListings);
        } else {
          setListings(INITIAL_LISTINGS.filter(l => activeTab === 'buy' ? !!l.isBuyRequest : !l.isBuyRequest));
        }
        setIsLoading(false);
      },
      (err) => {
        console.warn('Real-time listings listener error:', err);
        setIsLoading(false);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [activeTab]);

  const handlePlaceOrder = async (listingId: string, quantity: number, cropType: string) => {
    try {
      const buyerPhone = userPhone || (userRole === 'retailer' ? '9823456780' : '9876543210');

      const response = await apiFetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId, qty: quantity, buyerPhone }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to place order');
      }

      toast.success(
        activeTab === 'buy'
          ? `Successfully fulfilled request for ${cropType}!`
          : `Successfully placed order for ${cropType}!`
      );
    } catch (err: any) {
      toast.error(err.message || 'Order failed');
    }
  };

  const [detailsModalListing, setDetailsModalListing] = useState<any | null>(null);
  const [orderModalListing, setOrderModalListing] = useState<any | null>(null);
  const [orderModalQty, setOrderModalQty] = useState<number>(100);
  const [isOrdering, setIsOrdering] = useState(false);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [filterPanelOpen, setFilterPanelOpen] = useState(true);
  const [sortBy, setSortBy] = useState<SortKey>('newest');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [sortDropdownOpen, setSortDropdownOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 24;

  // Filters
  const [selectedCrops, setSelectedCrops] = useState<string[]>([]);
  const [selectedGrades, setSelectedGrades] = useState<string[]>([]);
  const [selectedRegion, setSelectedRegion] = useState('All India');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 200]);
  const [minFreshness, setMinFreshness] = useState(0);
  const [showCoopOnly, setShowCoopOnly] = useState(false);
  const [showBlockchainOnly, setShowBlockchainOnly] = useState(false);
  const [showFlashOnly, setShowFlashOnly] = useState(false);

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, selectedCrops, selectedGrades, selectedRegion, priceRange, minFreshness, showCoopOnly, showBlockchainOnly, showFlashOnly, sortBy]);

  // Dynamic Crop Types and Regions derived from both defaults and live listings
  const dynamicCropTypes = useMemo(() => {
    const defaultList = [
      'Tomato', 'Potato', 'Onion', 'Cauliflower', 'Spinach',
      'Brinjal', 'Okra', 'Bitter Gourd', 'Capsicum', 'Carrot',
      'Cabbage', 'Pumpkin', 'Ridge Gourd', 'Green Chilli',
    ];
    const set = new Set([...defaultList, ...(listings || []).map((l) => l?.cropType).filter(Boolean)]);
    return Array.from(set);
  }, [listings]);

  const dynamicRegions = useMemo(() => {
    const defaultList = [
      'All India', 'Maharashtra', 'Karnataka', 'Tamil Nadu',
      'Andhra Pradesh', 'Uttar Pradesh', 'Punjab', 'Gujarat',
    ];
    const set = new Set([
      'All India',
      ...defaultList.filter((r) => r !== 'All India'),
      ...(listings || []).map((l) => l?.region).filter(Boolean),
      ...(listings || []).map((l) => l?.state).filter(Boolean),
    ]);
    return Array.from(set);
  }, [listings]);

  const handleOrderClick = useCallback((listing: any) => {
    setOrderModalListing(listing);
    setOrderModalQty(listing.minOrderKg || 100);
  }, []);

  const handleDetailsClick = useCallback((listing: any) => {
    setDetailsModalListing(listing);
  }, []);

  const handleConfirmOrder = async () => {
    if (!orderModalListing) return;
    const minQty = orderModalListing.minOrderKg || 100;
    const maxQty = orderModalListing.quantityKg;

    if (orderModalQty < minQty || orderModalQty > maxQty) {
      toast.error(`Please enter a quantity between ${minQty} and ${maxQty} kg`);
      return;
    }

    try {
      setIsOrdering(true);
      await handlePlaceOrder(orderModalListing.id, orderModalQty, orderModalListing.cropType);
      setOrderModalListing(null);
    } catch (e) {
      // error handled in handlePlaceOrder
    } finally {
      setIsOrdering(false);
    }
  };

  const toggleCrop = useCallback((crop: string) => {
    setSelectedCrops((prev) =>
      prev.includes(crop) ? prev.filter((c) => c !== crop) : [...prev, crop]
    );
  }, []);

  const toggleGrade = useCallback((grade: string) => {
    setSelectedGrades((prev) =>
      prev.includes(grade) ? prev.filter((g) => g !== grade) : [...prev, grade]
    );
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCrops([]);
    setSelectedGrades([]);
    setSelectedRegion('All India');
    setPriceRange([0, 200]);
    setMinFreshness(0);
    setShowCoopOnly(false);
    setShowBlockchainOnly(false);
    setShowFlashOnly(false);
    setSearchQuery('');
  }, []);

  const activeFilterCount =
    (selectedCrops?.length || 0) +
    (selectedGrades?.length || 0) +
    (selectedRegion !== 'All India' ? 1 : 0) +
    (priceRange && (priceRange[0] > 0 || priceRange[1] < 200) ? 1 : 0) +
    (minFreshness > 0 ? 1 : 0) +
    (showCoopOnly ? 1 : 0) +
    (showBlockchainOnly ? 1 : 0) +
    (showFlashOnly ? 1 : 0);

  const filtered = useMemo(() => {
    let result = Array.isArray(listings) ? [...listings] : [];

    if (deferredSearchQuery) {
      const q = deferredSearchQuery.toLowerCase().trim();
      result = result.filter(
        (l) =>
          (l.cropType && l.cropType.toLowerCase().includes(q)) ||
          (l.variety && l.variety.toLowerCase().includes(q)) ||
          (l.farmName && l.farmName.toLowerCase().includes(q)) ||
          (l.farmerName && l.farmerName.toLowerCase().includes(q)) ||
          (l.region && l.region.toLowerCase().includes(q)) ||
          (l.state && l.state.toLowerCase().includes(q))
      );
    }

    if (selectedCrops?.length) result = result.filter((l) => selectedCrops.includes(l.cropType));
    if (selectedGrades?.length) result = result.filter((l) => selectedGrades.includes(l.grade));
    if (selectedRegion !== 'All India') {
      result = result.filter((l) => l.region === selectedRegion || l.state === selectedRegion);
    }
    result = result.filter((l) => (l.pricePerKg || 0) >= (priceRange?.[0] ?? 0) && (l.pricePerKg || 0) <= (priceRange?.[1] ?? 200));
    if (minFreshness > 0) result = result.filter((l) => (l.freshnessScore || 0) >= minFreshness);
    if (showCoopOnly) result = result.filter((l) => !!l.isCooperative);
    if (showBlockchainOnly) result = result.filter((l) => !!l.hasBlockchain);
    if (showFlashOnly) result = result.filter((l) => !!l.isFlashSale);

    // Sort
    result.sort((a, b) => {
      switch (sortBy) {
        case 'price-asc': return (a.pricePerKg || 0) - (b.pricePerKg || 0);
        case 'price-desc': return (b.pricePerKg || 0) - (a.pricePerKg || 0);
        case 'grade': return (a.grade || '').localeCompare(b.grade || '');
        case 'freshness': return (b.freshnessScore || 0) - (a.freshnessScore || 0);
        case 'qty-desc': return (b.quantityKg || 0) - (a.quantityKg || 0);
        default: {
          const timeA = typeof a.listedAt === 'number' ? (a.listedAt < 1e11 ? a.listedAt * 1000 : a.listedAt) : (a.id ? Number(a.id.replace('listing-', '')) || 0 : 0);
          const timeB = typeof b.listedAt === 'number' ? (b.listedAt < 1e11 ? b.listedAt * 1000 : b.listedAt) : (b.id ? Number(b.id.replace('listing-', '')) || 0 : 0);
          return timeB - timeA;
        }
      }
    });

    return result;
  }, [
    deferredSearchQuery, selectedCrops, selectedGrades, selectedRegion,
    priceRange, minFreshness, showCoopOnly, showBlockchainOnly, showFlashOnly, sortBy,
    listings, demoMode,
  ]);

  const renderFilterContent = () => (
    <div className="p-4 min-w-[256px]">
      {/* Filter header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4" style={{ color: 'var(--primary)' }} />
          <span className="font-semibold text-sm" style={{ color: 'var(--foreground)' }}>Filters</span>
          {activeFilterCount > 0 && (
            <span
              className="text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
              style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
            >
              {activeFilterCount}
            </span>
          )}
        </div>
        {activeFilterCount > 0 && (
          <button
            onClick={clearAllFilters}
            className="text-xs font-medium flex items-center gap-1"
            style={{ color: 'var(--accent)' }}
          >
            <X className="w-3 h-3" /> Clear all
          </button>
        )}
      </div>

      {/* Crop Type */}
      <FilterSection title="Crop Type">
        <div className="space-y-1.5 max-h-48 overflow-y-auto scrollbar-hide">
          {dynamicCropTypes.map((crop) => (
            <label
              key={`filter-crop-${crop}`}
              className="flex items-center gap-2 cursor-pointer group"
            >
              <input
                type="checkbox"
                checked={selectedCrops.includes(crop)}
                onChange={() => toggleCrop(crop)}
                className="w-3.5 h-3.5 rounded accent-primary"
              />
              <span className="text-sm group-hover:text-foreground transition-colors" style={{ color: 'var(--muted-foreground)' }}>
                {crop}
              </span>
              <span
                className="ml-auto text-2xs tabular-nums"
                style={{ color: 'var(--muted-foreground)' }}
              >
                {(listings || []).filter((l) => l?.cropType?.toLowerCase() === crop?.toLowerCase()).length}
              </span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* AI Grade */}
      <FilterSection title="AI Quality Grade">
        <div className="flex flex-wrap gap-2">
          {(['A', 'B', 'C', 'D'] as const).map((grade) => (
            <button
              key={`filter-grade-${grade}`}
              onClick={() => toggleGrade(grade)}
              className={`transition-all duration-150 rounded-full border ${
                selectedGrades.includes(grade)
                  ? 'border-transparent scale-105' : 'border-border bg-card hover:border-muted-foreground'
              }`}
            >
              <GradeBadge
                grade={grade}
                size={selectedGrades.includes(grade) ? 'md' : 'sm'}
              />
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Region */}
      <FilterSection title="Region">
        <div className="relative">
          <select
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="form-input text-sm appearance-none pr-8"
          >
            {dynamicRegions.map((r) => (
              <option key={`filter-region-${r}`} value={r}>{r}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
        </div>
      </FilterSection>

      {/* Price range */}
      <FilterSection title={`Price Range: ₹${priceRange[0]}–₹${priceRange[1]}/kg`}>
        <div className="space-y-2">
          <input
            type="range"
            min={0}
            max={200}
            step={5}
            value={priceRange[1]}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-primary"
          />
          <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
            <span>₹0</span><span>₹200/kg</span>
          </div>
        </div>
      </FilterSection>

      {/* Freshness score */}
      <FilterSection title={`Min Freshness: ${minFreshness}%`}>
        <input
          type="range"
          min={0}
          max={100}
          step={5}
          value={minFreshness}
          onChange={(e) => setMinFreshness(Number(e.target.value))}
          className="w-full accent-primary"
        />
        <div className="flex justify-between text-xs" style={{ color: 'var(--muted-foreground)' }}>
          <span>Any</span><span>100%</span>
        </div>
      </FilterSection>

      {/* Special filters */}
      <FilterSection title="Special Filters">
        <div className="space-y-2">
          {[
            { label: 'Cooperative Pool', value: showCoopOnly, setter: setShowCoopOnly, icon: Users },
            { label: 'Blockchain Verified', value: showBlockchainOnly, setter: setShowBlockchainOnly, icon: QrCode },
            { label: 'Flash Sale Only', value: showFlashOnly, setter: setShowFlashOnly, icon: Zap },
          ].map((f) => (
            <label key={`special-${f.label}`} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={f.value}
                onChange={(e) => f.setter(e.target.checked)}
                className="w-3.5 h-3.5 rounded accent-primary"
              />
              <f.icon className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
              <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>{f.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>
    </div>
  );

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-full">
      {/* Desktop Filter Panel */}
      <aside
        className={`hidden lg:block flex-shrink-0 border-r overflow-y-auto transition-all duration-300 ${
          filterPanelOpen ? 'w-64 xl:w-72' : 'w-0 overflow-hidden border-r-0'
        }`}
        style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
      >
        {renderFilterContent()}
      </aside>

      {/* Mobile Filter Drawer */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMobileFilterOpen(false)}
          />
          <div
            className="relative z-50 w-4/5 max-w-sm h-full bg-card shadow-2xl flex flex-col animate-slide-up safe-area-pt safe-area-pb"
            style={{ backgroundColor: 'var(--card)' }}
          >
            <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: 'var(--border)' }}>
              <span className="font-display font-bold text-base text-foreground">Filter Produce</span>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="p-1.5 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              {renderFilterContent()}
            </div>
            <div className="p-4 border-t" style={{ borderColor: 'var(--border)' }}>
              <button
                onClick={() => setMobileFilterOpen(false)}
                className="w-full btn-primary py-2.5"
              >
                Apply Filters ({filtered.length} Results)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="sticky top-0 z-20 border-b"
          style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)' }}
        >
          {/* Tabs */}
          <div className="flex border-b px-3 sm:px-6 overflow-x-auto scrollbar-hide" style={{ borderColor: 'var(--border)' }}>
            <button
              onClick={() => setActiveTab('sell')}
              className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === 'sell'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                borderBottomColor: activeTab === 'sell' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'sell' ? 'var(--primary)' : 'var(--muted-foreground)'
              }}
            >
              Crop Harvests (Kisan Sell)
              {activeTab === 'sell' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" style={{ backgroundColor: 'var(--primary)' }} />
              )}
            </button>
            <button
              onClick={() => setActiveTab('buy')}
              className={`px-3 sm:px-5 py-3 text-xs sm:text-sm font-semibold border-b-2 transition-all whitespace-nowrap relative ${
                activeTab === 'buy'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
              style={{
                borderBottomColor: activeTab === 'buy' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'buy' ? 'var(--primary)' : 'var(--muted-foreground)'
              }}
            >
              Procurement (Retailer Buy)
              {activeTab === 'buy' && (
                <span className="absolute bottom-0 left-0 right-0 h-0.5 rounded-t-full bg-primary" style={{ backgroundColor: 'var(--primary)' }} />
              )}
            </button>
          </div>

          {/* Listing Toolbar */}
          <div className="flex items-center gap-2 sm:gap-3 px-3 sm:px-6 py-2.5 sm:py-3 flex-wrap">
            {/* Filter toggle */}
            <button
              onClick={() => {
                if (typeof window !== 'undefined' && window.innerWidth < 1024) {
                  setMobileFilterOpen(true);
                } else {
                  setFilterPanelOpen((v) => !v);
                }
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium transition-colors border-border hover:bg-muted"
              style={{
                borderColor: activeFilterCount > 0 ? 'var(--primary)' : 'var(--border)',
                backgroundColor: activeFilterCount > 0 ? 'var(--success-bg)' : 'transparent',
                color: activeFilterCount > 0 ? 'var(--primary)' : 'var(--muted-foreground)',
              }}
            >
              <SlidersHorizontal className="w-4 h-4" />
              <span>Filters</span>
              {activeFilterCount > 0 && (
                <span
                  className="text-2xs font-bold px-1.5 py-0.5 rounded-full tabular-nums"
                  style={{ backgroundColor: 'var(--primary)', color: 'var(--primary-foreground)' }}
                >
                  {activeFilterCount}
                </span>
              )}
            </button>

            {/* Search */}
            <div className="flex-1 relative min-w-[140px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              <input
                type="search"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search crops, variety..."
                className="form-input pl-9 text-xs sm:text-sm py-2"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2"
                >
                  <X className="w-3.5 h-3.5" style={{ color: 'var(--muted-foreground)' }} />
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="relative">
              <button
                onClick={() => setSortDropdownOpen((v) => !v)}
                className="flex items-center gap-1.5 px-2.5 sm:px-3 py-2 rounded-lg border text-xs sm:text-sm font-medium hover:bg-muted transition-colors"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
              >
                <span className="hidden sm:inline">{sortOptions.find((s) => s.value === sortBy)?.label}</span>
                <span className="sm:hidden">Sort</span>
                <ChevronDown className="w-3.5 h-3.5" />
              </button>
              {sortDropdownOpen && (
                <div
                  className="absolute right-0 top-full mt-1 z-30 rounded-xl border overflow-hidden animate-scale-in"
                  style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '180px' }}
                >
                  {sortOptions.map((opt) => (
                    <button
                      key={`sort-${opt.value}`}
                      onClick={() => { setSortBy(opt.value); setSortDropdownOpen(false); }}
                      className={`w-full text-left px-4 py-2.5 text-xs sm:text-sm transition-colors hover:bg-muted ${sortBy === opt.value ? 'font-semibold' : ''}`}
                      style={{ color: sortBy === opt.value ? 'var(--primary)' : 'var(--foreground)' }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* View toggle */}
            <div className="hidden sm:flex rounded-lg overflow-hidden border" style={{ borderColor: 'var(--border)' }}>
              {(['grid', 'list'] as const).map((mode) => (
                <button
                  key={`view-${mode}`}
                  onClick={() => setViewMode(mode)}
                  className="p-2 transition-colors"
                  style={{
                    backgroundColor: viewMode === mode ? 'var(--primary)' : 'transparent',
                    color: viewMode === mode ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                  }}
                  title={`${mode} view`}
                >
                  {mode === 'grid' ? <Grid3X3 className="w-4 h-4" /> : <List className="w-4 h-4" />}
                </button>
              ))}
            </div>

            {/* New listing button */}
            {((activeTab === 'sell' && userRole === 'farmer') ||
              (activeTab === 'buy' && userRole === 'retailer')) && (
              <button
                onClick={() => setCreateModalOpen(true)}
                className="btn-primary text-xs sm:text-sm py-2 px-3 flex-shrink-0 animate-scale-in"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {activeTab === 'buy' ? 'New Sourcing Request' : 'New Listing'}
                </span>
                <span className="sm:hidden">
                  {activeTab === 'buy' ? 'Request' : 'Post'}
                </span>
              </button>
            )}
          </div>
        </div>

        {/* Active filter chips */}
        {activeFilterCount > 0 && (
          <div className="flex flex-wrap gap-1.5 sm:gap-2 px-3 sm:px-6 py-2 border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
            {selectedCrops.map((crop) => (
              <FilterChip key={`chip-crop-${crop}`} label={crop} onRemove={() => toggleCrop(crop)} />
            ))}
            {selectedGrades.map((grade) => (
              <FilterChip key={`chip-grade-${grade}`} label={`Grade ${grade}`} onRemove={() => toggleGrade(grade)} />
            ))}
            {selectedRegion !== 'All India' && (
              <FilterChip label={selectedRegion} onRemove={() => setSelectedRegion('All India')} />
            )}
            {showCoopOnly && <FilterChip label="Cooperative" onRemove={() => setShowCoopOnly(false)} />}
            {showBlockchainOnly && <FilterChip label="Blockchain Verified" onRemove={() => setShowBlockchainOnly(false)} />}
            {showFlashOnly && <FilterChip label="Flash Sale" onRemove={() => setShowFlashOnly(false)} />}
          </div>
        )}

        {/* Listings */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 xl:p-6">
          {filtered.length === 0 ? (
            <EmptyListings onClear={clearAllFilters} />
          ) : viewMode === 'list' ? (
            <div className="overflow-x-auto rounded-xl border bg-card shadow-sm" style={{ borderColor: 'var(--border)' }}>
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b bg-secondary/50" style={{ borderColor: 'var(--border)' }}>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Crop / Variety</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Farm / Farmer</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Grade</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Quantity</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Price</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Harvest Date</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Freshness</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Location</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 font-semibold text-muted-foreground text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((listing) => (
                    <ProduceListRow
                      key={listing.id}
                      listing={listing}
                      onOrder={() => handleOrderClick(listing)}
                      onDetails={() => handleDetailsClick(listing)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 gap-3 sm:gap-4">
              {filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((listing) => (
                <ProduceCard
                  key={listing.id}
                  listing={listing}
                  onOrder={() => handleOrderClick(listing)}
                  onDetails={() => handleDetailsClick(listing)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Mobile Floating Action Button (FAB) */}
        {((activeTab === 'sell' && userRole === 'farmer') ||
          (activeTab === 'buy' && userRole === 'retailer')) && (
          <button
            onClick={() => setCreateModalOpen(true)}
            className="lg:hidden fixed bottom-20 right-4 z-30 p-3.5 rounded-full shadow-lg flex items-center justify-center transition-all duration-200 active:scale-95"
            style={{
              backgroundColor: 'var(--primary)',
              color: 'var(--primary-foreground)',
              boxShadow: '0 4px 20px rgba(26, 107, 58, 0.4)',
            }}
            aria-label={activeTab === 'buy' ? 'New Sourcing Request' : 'New Produce Listing'}
          >
            <Plus className="w-6 h-6" />
          </button>
        )}

        {/* Pagination */}
        {filtered.length > 0 && (
          <div
            className="flex items-center justify-between px-3 sm:px-6 py-3 border-t text-xs sm:text-sm"
            style={{ borderColor: 'var(--border)', backgroundColor: 'var(--card)' }}
          >
            <span className="tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
              Showing {Math.min(filtered.length, (currentPage - 1) * PAGE_SIZE + 1)}–{Math.min(filtered.length, currentPage * PAGE_SIZE)} of {filtered.length}
            </span>
            {Math.ceil(filtered.length / PAGE_SIZE) > 1 && (
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(filtered.length / PAGE_SIZE) }).map((_, idx) => {
                  const pageNum = idx + 1;
                  return (
                    <button
                      key={`page-${pageNum}`}
                      onClick={() => setCurrentPage(pageNum)}
                      className={`w-7 h-7 sm:w-8 sm:h-8 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
                        currentPage === pageNum ? 'text-primary-foreground font-bold shadow-xs' : 'hover:bg-muted'
                      }`}
                      style={{
                        backgroundColor: currentPage === pageNum ? 'var(--primary)' : 'transparent',
                        color: currentPage === pageNum ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                      }}
                    >
                      {pageNum}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Touch-Friendly Order Modal */}
      {orderModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => !isOrdering && setOrderModalListing(null)}
          />
          <div
            className="relative z-50 w-full max-w-md bg-card rounded-2xl border shadow-2xl p-5 sm:p-6 animate-scale-in"
            style={{ borderColor: 'var(--border)' }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <span className="text-2xs font-bold px-2 py-0.5 rounded-full uppercase bg-success-bg text-success">
                  Grade {orderModalListing.grade}
                </span>
                <h3 className="font-display font-bold text-lg text-foreground mt-1">
                  {activeTab === 'buy' ? 'Fulfill Sourcing Request' : 'Place Purchase Order'}
                </h3>
                <p className="text-xs text-muted-foreground">
                  {orderModalListing.cropType} ({orderModalListing.variety}) · {orderModalListing.farmName}
                </p>
              </div>
              <button
                onClick={() => setOrderModalListing(null)}
                disabled={isOrdering}
                className="p-1 rounded-lg hover:bg-muted"
              >
                <X className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>

            <div className="space-y-4 my-4">
              <div className="p-3.5 rounded-xl border bg-secondary flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Available Batch:</span>
                <span className="font-bold text-foreground">{orderModalListing.quantityKg} kg</span>
              </div>

              <div className="p-3.5 rounded-xl border bg-secondary flex justify-between items-center text-xs">
                <span className="text-muted-foreground">Unit Price:</span>
                <span className="font-bold text-primary text-sm">₹{orderModalListing.pricePerKg} / kg</span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-foreground mb-1.5">
                  Quantity to {activeTab === 'buy' ? 'Supply' : 'Buy'} (kg)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOrderModalQty((q) => Math.max((orderModalListing.minOrderKg || 100), q - 50))}
                    className="w-10 h-10 rounded-xl border font-bold text-lg flex items-center justify-center hover:bg-muted active:scale-95"
                  >
                    -
                  </button>
                  <input
                    type="number"
                    min={orderModalListing.minOrderKg || 100}
                    max={orderModalListing.quantityKg}
                    step={10}
                    value={orderModalQty}
                    onChange={(e) => setOrderModalQty(Number(e.target.value))}
                    className="form-input text-center font-bold text-base flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => setOrderModalQty((q) => Math.min(orderModalListing.quantityKg, q + 50))}
                    className="w-10 h-10 rounded-xl border font-bold text-lg flex items-center justify-center hover:bg-muted active:scale-95"
                  >
                    +
                  </button>
                </div>
                <p className="text-2xs text-muted-foreground mt-1">
                  Min order: {orderModalListing.minOrderKg || 100} kg · Max: {orderModalListing.quantityKg} kg
                </p>
              </div>

              <div className="p-4 rounded-xl border bg-primary/5 flex justify-between items-center">
                <span className="text-xs font-bold text-foreground">Estimated Total:</span>
                <span className="font-display font-extrabold text-lg text-primary">
                  ₹{(orderModalQty * (orderModalListing.pricePerKg || 0)).toLocaleString('en-IN')}
                </span>
              </div>
            </div>

            <div className="flex gap-3 mt-5">
              <button
                type="button"
                onClick={() => setOrderModalListing(null)}
                disabled={isOrdering}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-xs text-muted-foreground hover:bg-muted"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmOrder}
                disabled={isOrdering}
                className="flex-1 btn-primary py-2.5 text-xs font-bold shadow-md"
              >
                {isOrdering ? 'Processing...' : 'Confirm & Proceed'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Produce Details Modal */}
      {detailsModalListing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setDetailsModalListing(null)}
          />
          <div
            className="relative z-50 w-full max-w-lg bg-card rounded-2xl border shadow-2xl overflow-hidden animate-scale-in max-h-[90vh] flex flex-col"
            style={{ borderColor: 'var(--border)' }}
          >
            {/* Header Image */}
            <div className="relative h-48 w-full overflow-hidden bg-muted flex-shrink-0">
              <img
                src={detailsModalListing.imageUrl || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b'}
                alt={detailsModalListing.cropType}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
              <button
                type="button"
                onClick={() => setDetailsModalListing(null)}
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
              <div className="absolute bottom-3 left-4 right-4 flex justify-between items-end">
                <div>
                  <div className="flex items-center gap-2">
                    <GradeBadge grade={detailsModalListing.grade} size="sm" />
                    {detailsModalListing.hasBlockchain && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-2xs font-semibold bg-white/90 text-primary">
                        <QrCode className="w-2.5 h-2.5" /> Blockchain Verified
                      </span>
                    )}
                  </div>
                  <h3 className="font-display font-bold text-xl text-white mt-1">
                    {detailsModalListing.cropType}
                  </h3>
                  <p className="text-xs text-white/80">{detailsModalListing.variety}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold text-white tabular-nums">
                    ₹{detailsModalListing.pricePerKg}
                  </span>
                  <span className="text-xs text-white/80 block">per kg</span>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-5 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl border bg-secondary/50">
                  <span className="text-2xs text-muted-foreground block">Available Stock:</span>
                  <span className="font-bold text-foreground text-sm">{(detailsModalListing.quantityKg || 0).toLocaleString('en-IN')} kg</span>
                </div>
                <div className="p-3 rounded-xl border bg-secondary/50">
                  <span className="text-2xs text-muted-foreground block">Min. Order:</span>
                  <span className="font-bold text-foreground text-sm">{detailsModalListing.minOrderKg || 50} kg</span>
                </div>
                <div className="p-3 rounded-xl border bg-secondary/50">
                  <span className="text-2xs text-muted-foreground block">Freshness Score:</span>
                  <span className="font-bold text-success text-sm">{detailsModalListing.freshnessScore || 90}% Fresh</span>
                </div>
              </div>

              {/* Farm Details */}
              <div className="p-3.5 rounded-xl border bg-secondary flex items-center justify-between">
                <div>
                  <span className="text-2xs text-muted-foreground block">Producer / Farm Origin:</span>
                  <p className="font-bold text-foreground text-sm mt-0.5">{detailsModalListing.farmName || detailsModalListing.farmerName}</p>
                  <p className="text-xs text-muted-foreground">{detailsModalListing.region}, {detailsModalListing.state}</p>
                </div>
                <div className="text-right">
                  <span className="text-2xs text-muted-foreground block">Harvest Date:</span>
                  <span className="font-semibold text-foreground">{detailsModalListing.harvestDate || 'Fresh'}</span>
                </div>
              </div>

              {/* Certifications */}
              {Array.isArray(detailsModalListing.certifications) && detailsModalListing.certifications.length > 0 && (
                <div>
                  <span className="text-2xs font-semibold text-muted-foreground uppercase block mb-1.5">Certifications & Quality Checks</span>
                  <div className="flex flex-wrap gap-1.5">
                    {detailsModalListing.certifications.map((cert: string) => (
                      <span key={`modal-cert-${cert}`} className="px-2 py-1 rounded-lg border bg-card text-foreground font-medium text-2xs">
                        ✓ {cert}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div className="p-4 border-t flex gap-3 bg-card" style={{ borderColor: 'var(--border)' }}>
              <button
                type="button"
                onClick={() => setDetailsModalListing(null)}
                className="flex-1 py-2.5 rounded-xl border font-semibold text-xs text-muted-foreground hover:bg-muted"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  const targetListing = detailsModalListing;
                  setDetailsModalListing(null);
                  handleOrderClick(targetListing);
                }}
                className="flex-1 btn-primary py-2.5 text-xs font-bold shadow-md flex items-center justify-center gap-1.5"
              >
                {!detailsModalListing.isBuyRequest && <ShoppingCart className="w-4 h-4" />}
                {detailsModalListing.isBuyRequest ? 'Fulfill Sourcing Request' : 'Order Now'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create listing modal */}
      <CreateListingModal
        open={createModalOpen}
        onClose={() => setCreateModalOpen(false)}
        isBuyRequest={activeTab === 'buy'}
      />
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(true);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full mb-2 group"
      >
        <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)', letterSpacing: '0.08em' }}>
          {title}
        </span>
        <ChevronDown
          className={`w-3.5 h-3.5 transition-transform ${open ? '' : '-rotate-90'}`}
          style={{ color: 'var(--muted-foreground)' }}
        />
      </button>
      {open && <div>{children}</div>}
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium"
      style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}
    >
      {label}
      <button onClick={onRemove} className="hover:opacity-70 transition-opacity">
        <X className="w-3 h-3" />
      </button>
    </span>
  );
}

function EmptyListings({ onClear }: { onClear: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <div
        className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
        style={{ backgroundColor: 'var(--secondary)' }}
      >
        <Sprout className="w-8 h-8" style={{ color: 'var(--muted-foreground)' }} />
      </div>
      <h3 className="font-display text-lg font-semibold mb-2" style={{ color: 'var(--foreground)' }}>
        No produce listings found
      </h3>
      <p className="text-sm mb-5 max-w-xs" style={{ color: 'var(--muted-foreground)' }}>
        No listings match your current filters. Try adjusting crop type, grade, or region to find available produce.
      </p>
      <button onClick={onClear} className="btn-primary gap-2">
        <RefreshCw className="w-4 h-4" />
        Clear All Filters
      </button>
    </div>
  );
}