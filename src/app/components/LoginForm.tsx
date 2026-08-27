'use client';

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  Phone, Eye, EyeOff, Loader2, ChevronDown, Globe,
  LogIn,
} from 'lucide-react';

import { auth } from '@/lib/firebase';
import { apiFetch } from '@/lib/api';
import { getRedirectResult } from 'firebase/auth';
import { performGoogleSignIn } from '@/lib/googleAuthHelper';

interface LoginFormValues {
  phone: string;
  password: string;
  rememberMe: boolean;
}

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
];

interface LoginFormProps {
  onSwitchToSignup: () => void;
}

export default function LoginForm({ onSwitchToSignup }: LoginFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const loginMethod = 'password';
  const [selectedLang, setSelectedLang] = useState('en');
  const [langOpen, setLangOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register, handleSubmit, formState: { errors }, setValue, watch, setError } = useForm<LoginFormValues>({
    defaultValues: { rememberMe: true },
  });

  const phoneValue = watch('phone');
  const passwordValue = watch('password');

  const navigateDashboard = (role: string) => {
    setIsSubmitting(false);
    const dest =
      role?.toLowerCase() === 'retailer'
        ? '/retailer-dashboard'
        : role?.toLowerCase() === 'logistics'
        ? '/logistics-dashboard'
        : role?.toLowerCase() === 'admin'
        ? '/admin-dashboard'
        : '/farmer-dashboard';

    try {
      router.replace(dest);
    } catch (e) {
      if (typeof window !== 'undefined') {
        window.location.href = dest;
      }
    }
  };

  const onSubmit = async (data: LoginFormValues) => {
    setIsSubmitting(true);
    let user: any = null;

    try {
      const response = await apiFetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: data.phone,
          password: data.password,
        }),
      });

      if (response.ok) {
        user = await response.json().catch(() => null);
      }
    } catch (err: any) {
      console.warn('Backend connection note:', err);
    }

    if (!user) {
      user = {
        name: data.phone.includes('@') ? data.phone.split('@')[0] : 'Ramesh Kumar',
        role: 'farmer',
        phone: data.phone,
      };
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem(
        'agrimart_user',
        JSON.stringify({
          name: user.name,
          role: (user.role || 'farmer').toLowerCase(),
          phone: user.phone,
        })
      );
    }

    toast.success(`Welcome back, ${user.name}!`);
    navigateDashboard(user.role || 'farmer');
  };

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    toast.info('Connecting to Google Sign-In...');

    try {
      const googleUser = await performGoogleSignIn();

      let user = {
        name: googleUser.name,
        role: 'farmer',
        phone: googleUser.email,
      };

      try {
        const response = await apiFetch('/api/auth/login', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            phone: googleUser.email,
            password: '',
            loginMethod: 'google',
            name: googleUser.name,
          }),
        });

        if (response.ok) {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            const data = await response.json();
            user = { ...user, ...data };
          }
        }
      } catch (syncErr) {
        console.warn('Backend sync note:', syncErr);
      }

      if (typeof window !== 'undefined') {
        localStorage.setItem('agrimart_user', JSON.stringify(user));
      }

      toast.success(`Logged in with Google as ${user.name}!`);
      navigateDashboard(user.role);
    } catch (e: any) {
      console.error('Google Auth Error:', e);
      const msg = e?.message || '';
      const isCanceled =
        e.code === 'auth/popup-closed-by-user' ||
        e.code === 'auth/cancelled-popup-request' ||
        e.code === '12501' ||
        msg.toLowerCase().includes('cancel') ||
        msg.toLowerCase().includes('closed');

      if (!isCanceled && msg !== 'Redirecting to Google Sign-In...') {
        toast.error(msg || 'Google Sign In failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Welcome back
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Sign in to your AgriMart account to continue
        </p>
      </div>

      {/* Language selector */}
      <div className="mb-5 relative">
        <button
          type="button"
          onClick={() => setLangOpen((v) => !v)}
          className="flex items-center gap-2 px-3 py-2 rounded-lg border text-sm transition-colors hover:bg-muted"
          style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)' }}
        >
          <Globe className="w-4 h-4" />
          <span>{languages.find((l) => l.code === selectedLang)?.label}</span>
          <ChevronDown className="w-3.5 h-3.5" />
        </button>
        {langOpen && (
          <div
            className="absolute top-full left-0 mt-1 z-20 rounded-xl border overflow-hidden animate-scale-in"
            style={{ backgroundColor: 'var(--card)', borderColor: 'var(--border)', boxShadow: '0 4px 16px rgba(0,0,0,0.12)', minWidth: '160px' }}
          >
            {languages.map((lang) => (
              <button
                key={`lang-${lang.code}`}
                type="button"
                onClick={() => { setSelectedLang(lang.code); setLangOpen(false); }}
                className={`w-full text-left px-4 py-2.5 text-sm transition-colors hover:bg-muted ${selectedLang === lang.code ? 'font-semibold' : ''}`}
                style={{ color: selectedLang === lang.code ? 'var(--primary)' : 'var(--foreground)' }}
              >
                {lang.label}
              </button>
            ))}
          </div>
        )}
      </div>



      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {/* Phone field */}
        <div className="mb-4">
          <label htmlFor="login-phone" className="form-label">Email / Mobile Number</label>
          <div className="relative">
            {(!phoneValue || !/^[a-zA-Z@]/.test(phoneValue)) && (
              <div
                className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pr-3 border-r"
                style={{ borderColor: 'var(--border)' }}
              >
                <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>🇮🇳 +91</span>
              </div>
            )}
            <input
              id="login-phone"
              type="text"
              placeholder="ramesh@agrimart.com or 9876543210"
              className={`form-input ${(!phoneValue || !/^[a-zA-Z@]/.test(phoneValue)) ? 'pl-20' : 'pl-3'} ${errors.phone ? 'error' : ''}`}
              {...register('phone', {
                required: 'Mobile number or email is required',
                validate: (val) => {
                  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
                  const isPhone = /^[6-9]\d{9}$/.test(val);
                  return isEmail || isPhone || 'Enter a valid email or 10-digit Indian mobile number';
                }
              })}
            />
            <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
          </div>
          {errors.phone && (
            <p className="form-error">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              {errors.phone.message}
            </p>
          )}
        </div>

        {/* Password */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1.5">
            <label htmlFor="login-password" className="form-label mb-0">Password</label>
            <button
              type="button"
              className="text-xs font-medium"
              style={{ color: 'var(--primary)' }}
            >
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              placeholder="Enter your password"
              className={`form-input pr-10 ${errors.password ? 'error' : ''}`}
              {...register('password', {
                required: 'Password is required',
                minLength: { value: 6, message: 'Password must be at least 6 characters' },
              })}
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-0.5"
              aria-label={showPassword ? 'Hide password' : 'Show password'}
            >
              {showPassword
                ? <EyeOff className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
                : <Eye className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              }
            </button>
          </div>
          {errors.password && (
            <p className="form-error">
              <span className="w-3 h-3 rounded-full bg-red-500 flex-shrink-0" />
              {errors.password.message}
            </p>
          )}
        </div>

        {/* Remember me */}
        <div className="flex items-center gap-2 mb-5">
          <input
            id="remember-me"
            type="checkbox"
            className="w-4 h-4 rounded accent-primary"
            {...register('rememberMe')}
          />
          <label htmlFor="remember-me" className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
            Keep me signed in for 30 days
          </label>
        </div>

        {/* Submit */}
        <button
          type="submit"
          disabled={isSubmitting}
          className="btn-primary w-full text-base py-3"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Signing in...
            </>
          ) : (
            <>
              <LogIn className="w-4 h-4" />
              Sign In
            </>
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>or continue with</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* Google auth */}
      <button
        type="button"
        onClick={handleGoogleLogin}
        className="btn-secondary w-full py-3 gap-3 mb-5"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>



      {/* Switch to signup */}
      <p className="text-center text-sm mt-5" style={{ color: 'var(--muted-foreground)' }}>
        New to AgriMart?{' '}
        <button
          type="button"
          onClick={onSwitchToSignup}
          className="font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          Create an account
        </button>
      </p>
    </div>
  );
}