'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Camera,
  Upload,
  Trash2,
  User,
  Phone,
  Mail,
  Building,
  MapPin,
  Globe,
  Loader2,
  Save,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { toast } from 'sonner';
import Modal from '@/components/ui/Modal';
import { apiFetch } from '@/lib/api';
import { updateUserProfileRealtime, UserProfile } from '@/lib/realtime';

interface EditProfileModalProps {
  open: boolean;
  onClose: () => void;
  currentUser?: any;
  onProfileUpdated?: (user: any) => void;
}

const INDIAN_STATES = [
  'Andhra Pradesh',
  'Bihar',
  'Gujarat',
  'Haryana',
  'Himachal Pradesh',
  'Karnataka',
  'Kerala',
  'Madhya Pradesh',
  'Maharashtra',
  'Odisha',
  'Punjab',
  'Rajasthan',
  'Tamil Nadu',
  'Telangana',
  'Uttar Pradesh',
  'West Bengal'
];

const LANGUAGES = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी (Hindi)' },
  { code: 'mr', label: 'मराठी (Marathi)' },
  { code: 'te', label: 'తెలుగు (Telugu)' },
  { code: 'ta', label: 'தமிழ் (Tamil)' }
];

export default function EditProfileModal({
  open,
  onClose,
  currentUser,
  onProfileUpdated
}: EditProfileModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('farmer');
  const [state, setState] = useState('Maharashtra');
  const [region, setRegion] = useState('Nashik');
  const [farmName, setFarmName] = useState('');
  const [language, setLanguage] = useState('en');
  const [profileImage, setProfileImage] = useState<string>('');
  const [imagePreview, setImagePreview] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) {
      let user = currentUser;
      if (!user) {
        const stored = localStorage.getItem('agrimart_user');
        if (stored) {
          try {
            user = JSON.parse(stored);
          } catch (e) {}
        }
      }

      if (user) {
        setName(user.name || 'Ramesh Kumar');
        setEmail(user.email || '');
        setPhone(user.phone || '9876543210');
        setRole(user.role || 'farmer');
        setState(user.state || 'Maharashtra');
        setRegion(user.region || 'Nashik');
        setFarmName(user.farmName || (user.role === 'retailer' ? `${user.name} Procurement` : `${user.name} Farm`));
        setLanguage(user.language || 'en');
        const img = user.profileImage || '';
        setProfileImage(img);
        setImagePreview(img);
      }
      setErrors({});
    }
  }, [open, currentUser]);

  const handleImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      toast.error('Please select a valid image file (PNG, JPG, WebP).');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be less than 10 MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        // Optimize & compress image with canvas
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;
        const maxDimension = 600;

        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL('image/jpeg', 0.85);
          setImagePreview(compressedDataUrl);
          setProfileImage(compressedDataUrl);
          toast.success('Profile photo selected.');
        }
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleImageFile(file);
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!name.trim() || name.trim().length < 2) {
      errs.name = 'Full name must be at least 2 characters';
    }
    if (email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address';
    }
    if (!region.trim()) {
      errs.region = 'District/Region is required';
    }
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    setIsSaving(true);
    try {
      const payload = {
        phone: phone || '9876543210',
        name: name.trim(),
        email: email.trim() || null,
        role,
        state,
        region: region.trim(),
        farmName: farmName.trim() || `${name.trim()} Farm`,
        language,
        profileImage
      };

      // 1. Update Backend Database
      const res = await apiFetch('/api/auth/profile', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to update profile');
      }

      const updatedData = (await res.json()).user || payload;

      // 2. Real-time optimistic Firestore sync
      await updateUserProfileRealtime(payload.phone, updatedData);

      // 3. Update localStorage and notify components
      localStorage.setItem('agrimart_user', JSON.stringify(updatedData));
      window.dispatchEvent(new CustomEvent('agrimart_user_update', { detail: updatedData }));

      if (onProfileUpdated) {
        onProfileUpdated(updatedData);
      }

      toast.success('Profile updated successfully!');
      onClose();
    } catch (err: any) {
      console.error('Error saving profile:', err);
      toast.error(err.message || 'Error updating profile');
    } finally {
      setIsSaving(false);
    }
  };

  const getInitials = (n: string) => {
    return (n || 'RK')
      .split(' ')
      .map((part) => part[0] || '')
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  return (
    <Modal open={open} onClose={onClose} title="Edit Profile" size="md">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Profile Image Avatar Section */}
        <div className="flex flex-col items-center justify-center pt-1 pb-3 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="relative group">
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="Profile Preview"
                className="w-24 h-24 rounded-full object-cover border-2 shadow-md transition-transform group-hover:scale-105"
                style={{ borderColor: 'var(--primary)' }}
              />
            ) : (
              <div
                className="w-24 h-24 rounded-full flex items-center justify-center text-2xl font-bold border-2 shadow-md"
                style={{
                  backgroundColor: 'var(--primary)',
                  color: 'var(--primary-foreground)',
                  borderColor: 'var(--primary)'
                }}
              >
                {getInitials(name)}
              </div>
            )}

            {/* Quick Change Badge */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="absolute bottom-0 right-0 p-2 rounded-full shadow-md text-white transition-transform hover:scale-110 active:scale-95"
              style={{ backgroundColor: 'var(--primary)' }}
              title="Change Profile Photo"
            >
              <Camera className="w-4 h-4" />
            </button>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 mt-3">
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileChange}
              accept="image/*"
              className="hidden"
            />
            <input
              type="file"
              ref={cameraInputRef}
              onChange={handleFileChange}
              accept="image/*"
              capture="environment"
              className="hidden"
            />

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:bg-muted"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <Upload className="w-3.5 h-3.5 text-primary" />
              Upload Image
            </button>

            <button
              type="button"
              onClick={() => cameraInputRef.current?.click()}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:bg-muted sm:hidden"
              style={{ borderColor: 'var(--border)', color: 'var(--foreground)' }}
            >
              <Camera className="w-3.5 h-3.5 text-primary" />
              Camera
            </button>

            {imagePreview && (
              <button
                type="button"
                onClick={() => {
                  setImagePreview('');
                  setProfileImage('');
                  if (fileInputRef.current) fileInputRef.current.value = '';
                  if (cameraInputRef.current) cameraInputRef.current.value = '';
                  toast.info('Profile photo removed.');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg border transition-colors hover:bg-danger/10 text-danger"
                style={{ borderColor: 'var(--border)' }}
              >
                <Trash2 className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          <p className="text-2xs mt-1.5" style={{ color: 'var(--muted-foreground)' }}>
            JPG, PNG, or WebP up to 10MB · Automatically synced across Web & Mobile
          </p>
        </div>

        {/* Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Full Name */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              Full Name *
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Ramesh Kumar"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.name ? 'border-danger' : 'border-border'
                }`}
              />
            </div>
            {errors.name && <p className="text-2xs text-danger mt-1">{errors.name}</p>}
          </div>

          {/* Registered Phone */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              Registered Mobile (ID)
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={phone}
                disabled
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-muted/60 text-muted-foreground cursor-not-allowed font-mono"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
          {/* Email Address */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              Email Address
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="ramesh@agrimart.com"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.email ? 'border-danger' : 'border-border'
                }`}
              />
            </div>
            {errors.email && <p className="text-2xs text-danger mt-1">{errors.email}</p>}
          </div>

          {/* Farm / Business Name */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              {role === 'retailer' ? 'Procurement Business Name' : role === 'logistics' ? 'Fleet / Logistics Name' : 'Farm Name'}
            </label>
            <div className="relative">
              <Building className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={farmName}
                onChange={(e) => setFarmName(e.target.value)}
                placeholder={role === 'retailer' ? 'e.g. Priya Merchants Wholesale' : 'e.g. Ramesh Kumar Organic Farm'}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
              />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
          {/* State */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              State
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {INDIAN_STATES.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>

          {/* District / Region */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              District / Region *
            </label>
            <div className="relative">
              <MapPin className="absolute left-3 top-2.5 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
                placeholder="e.g. Nashik"
                className={`w-full pl-9 pr-3 py-2 text-sm rounded-xl border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                  errors.region ? 'border-danger' : 'border-border'
                }`}
              />
            </div>
            {errors.region && <p className="text-2xs text-danger mt-1">{errors.region}</p>}
          </div>

          {/* Language */}
          <div>
            <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--foreground)' }}>
              Preferred Language
            </label>
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-xl border border-border bg-card text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
            >
              {LANGUAGES.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.label}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Modal Actions */}
        <div className="flex items-center justify-end gap-2.5 pt-3 border-t" style={{ borderColor: 'var(--border)' }}>
          <button
            type="button"
            onClick={onClose}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl border text-sm font-semibold transition-colors hover:bg-muted text-foreground"
            style={{ borderColor: 'var(--border)' }}
          >
            Cancel
          </button>

          <button
            type="submit"
            disabled={isSaving}
            className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90 active:scale-95 disabled:opacity-50"
            style={{ backgroundColor: 'var(--primary)' }}
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </Modal>
  );
}
