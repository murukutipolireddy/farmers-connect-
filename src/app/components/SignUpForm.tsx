'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { apiFetch } from '@/lib/api';
import { auth } from '@/lib/firebase';
import { GoogleAuthProvider, signInWithPopup, signInWithRedirect } from 'firebase/auth';
import { performGoogleSignIn } from '@/lib/googleAuthHelper';
import {
  Phone, Eye, EyeOff, Loader2, ChevronDown, Sprout,
  Store, Truck, ShieldCheck, UserCheck, MapPin,
} from 'lucide-react';
import Icon from '@/components/ui/AppIcon';


interface SignUpFormValues {
  name: string;
  phone: string;
  email: string;
  password: string;
  confirmPassword: string;
  role: 'farmer' | 'retailer' | 'logistics';
  state: string;
  language: string;
  termsAccepted: boolean;
}

const roles = [
  { id: 'farmer', label: 'Kisan (Farmer)', sublabel: 'List produce, accept orders', icon: Sprout, color: 'var(--success)' },
  { id: 'retailer', label: 'Retailer / Buyer', sublabel: 'Source produce, manage orders', icon: Store, color: 'var(--info)' },
  { id: 'logistics', label: 'Logistics Partner', sublabel: 'Manage pickups & deliveries', icon: Truck, color: 'var(--accent)' },
] as const;

const indianStates = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const languages = [
  { code: 'en', label: 'English' },
  { code: 'hi', label: 'हिंदी' },
  { code: 'ta', label: 'தமிழ்' },
  { code: 'te', label: 'తెలుగు' },
  { code: 'kn', label: 'ಕನ್ನಡ' },
  { code: 'bn', label: 'বাংলা' },
  { code: 'mr', label: 'मराठी' },
];

interface SignUpFormProps {
  onSwitchToLogin: () => void;
}

export default function SignUpForm({ onSwitchToLogin }: SignUpFormProps) {
  const router = useRouter();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    trigger,
  } = useForm<SignUpFormValues>({
    defaultValues: { role: 'farmer', language: 'en' },
  });

  const selectedRole = watch('role');
  const passwordValue = watch('password');

  const handleGoogleSignUp = async () => {
    setIsSubmitting(true);
    toast.info('Connecting to Google Sign-In...');

    try {
      const googleUser = await performGoogleSignIn();

      let user = {
        name: googleUser.name,
        role: selectedRole || 'farmer',
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

      toast.success(`Account created with Google as ${user.name}!`);

      setIsSubmitting(false);
      const dest =
        user?.role?.toLowerCase() === 'retailer'
          ? '/retailer-dashboard'
          : user?.role?.toLowerCase() === 'logistics'
          ? '/logistics-dashboard'
          : user?.role?.toLowerCase() === 'admin'
          ? '/admin-dashboard'
          : '/farmer-dashboard';

      try {
        router.replace(dest);
      } catch (e) {
        if (typeof window !== 'undefined') {
          window.location.href = dest;
        }
      }
    } catch (e: any) {
      console.error('Google Sign Up Error:', e);
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

  const handleNextStep = async () => {
    const valid = await trigger(['name', 'phone', 'email', 'role', 'state']);
    if (valid) setStep(2);
  };

  const onSubmit = async (data: SignUpFormValues) => {
    setIsSubmitting(true);
    try {
      const response = await apiFetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: data.name,
          phone: data.phone,
          email: data.email,
          password: data.password,
          role: data.role.toLowerCase(),
          state: data.state,
          language: data.language,
        }),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to create account');
      }

      const user = await response.json();
      setIsSubmitting(false);

      toast.success(`Account created successfully! Please sign in with your phone or email to continue.`);
      onSwitchToLogin();
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err.message || 'Registration failed');
    }
  };

  return (
    <div className="animate-slide-up">
      <div className="mb-6">
        <h2 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          Join AgriMart
        </h2>
        <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
          Create your account and start trading directly
        </p>
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-6">
        {[1, 2].map((s) => (
          <React.Fragment key={`step-${s}`}>
            <div className="flex items-center gap-1.5">
              <div
                className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-colors"
                style={{
                  backgroundColor: step >= s ? 'var(--primary)' : 'var(--muted)',
                  color: step >= s ? 'var(--primary-foreground)' : 'var(--muted-foreground)',
                }}
              >
                {step > s ? '✓' : s}
              </div>
              <span
                className="text-xs font-medium"
                style={{ color: step === s ? 'var(--foreground)' : 'var(--muted-foreground)' }}
              >
                {s === 1 ? 'Basic Info' : 'Security'}
              </span>
            </div>
            {s < 2 && (
              <div
                className="flex-1 h-0.5 rounded-full transition-colors"
                style={{ backgroundColor: step > s ? 'var(--primary)' : 'var(--border)' }}
              />
            )}
          </React.Fragment>
        ))}
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        {step === 1 && (
          <div className="space-y-4 animate-slide-up">
            {/* Role selector */}
            <div>
              <label className="form-label">I am a</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map((role) => {
                  const Icon = role.icon;
                  const active = selectedRole === role.id;
                  return (
                    <button
                      key={`role-${role.id}`}
                      type="button"
                      onClick={() => setValue('role', role.id)}
                      className={`p-3 rounded-xl border-2 text-left transition-all duration-150 ${
                        active ? 'border-primary' : 'border-border hover:border-muted-foreground'
                      }`}
                      style={{
                        borderColor: active ? 'var(--primary)' : 'var(--border)',
                        backgroundColor: active ? 'var(--success-bg)' : 'var(--card)',
                      }}
                    >
                      <Icon
                        className="w-5 h-5 mb-1.5"
                        style={{ color: active ? 'var(--primary)' : 'var(--muted-foreground)' }}
                      />
                      <p className="text-xs font-semibold leading-tight" style={{ color: active ? 'var(--primary)' : 'var(--foreground)' }}>
                        {role.label}
                      </p>
                      <p className="text-2xs mt-0.5 leading-tight" style={{ color: 'var(--muted-foreground)' }}>
                        {role.sublabel}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Name */}
            <div>
              <label htmlFor="signup-name" className="form-label">Full Name</label>
              <input
                id="signup-name"
                type="text"
                placeholder="Ramesh Kumar"
                className={`form-input ${errors.name ? 'error' : ''}`}
                {...register('name', {
                  required: 'Full name is required',
                  minLength: { value: 2, message: 'Name must be at least 2 characters' },
                })}
              />
              {errors.name && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.name.message}</p>}
            </div>

            {/* Email Address */}
            <div>
              <label htmlFor="signup-email" className="form-label">Email Address</label>
              <input
                id="signup-email"
                type="email"
                placeholder="ramesh@agrimart.com"
                className={`form-input ${errors.email ? 'error' : ''}`}
                {...register('email', {
                  required: 'Email address is required',
                  pattern: {
                    value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                    message: 'Enter a valid email address',
                  },
                })}
              />
              {errors.email && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.email.message}</p>}
            </div>

            {/* Phone */}
            <div>
              <label htmlFor="signup-phone" className="form-label">Mobile Number</label>
              <div className="relative">
                <div
                  className="absolute left-3 top-1/2 -translate-y-1/2 flex items-center gap-1.5 pr-3 border-r"
                  style={{ borderColor: 'var(--border)' }}
                >
                  <span className="text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>🇮🇳 +91</span>
                </div>
                <input
                  id="signup-phone"
                  type="tel"
                  maxLength={10}
                  placeholder="9876543210"
                  className={`form-input pl-20 ${errors.phone ? 'error' : ''}`}
                  {...register('phone', {
                    required: 'Mobile number is required',
                    pattern: { value: /^[6-9]\d{9}$/, message: 'Enter a valid 10-digit Indian mobile number' },
                  })}
                />
                <Phone className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              {errors.phone && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.phone.message}</p>}
            </div>

            {/* State + Language */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label htmlFor="signup-state" className="form-label">State</label>
                <div className="relative">
                  <select
                    id="signup-state"
                    className={`form-input appearance-none pr-8 ${errors.state ? 'error' : ''}`}
                    {...register('state', { required: 'Please select your state' })}
                  >
                    <option value="">Select state</option>
                    {indianStates.map((s) => (
                      <option key={`state-${s}`} value={s}>{s}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                </div>
                {errors.state && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.state.message}</p>}
              </div>
              <div>
                <label htmlFor="signup-language" className="form-label">Language</label>
                <div className="relative">
                  <select
                    id="signup-language"
                    className="form-input appearance-none pr-8"
                    {...register('language')}
                  >
                    {languages.map((l) => (
                      <option key={`lang-${l.code}`} value={l.code}>{l.label}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={handleNextStep}
              className="btn-primary w-full py-3"
            >
              Continue to Security Setup
            </button>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4 animate-slide-up">
            {/* KYC info */}
            {selectedRole === 'farmer' && (
              <div
                className="p-3 rounded-xl flex items-start gap-3"
                style={{ backgroundColor: 'var(--info-bg)' }}
              >
                <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--info)' }}>Aadhaar KYC Required</p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--info)' }}>
                    After registration, complete Aadhaar verification to activate your seller account and receive payments via UPI.
                  </p>
                </div>
              </div>
            )}

            {/* Password */}
            <div>
              <label htmlFor="signup-password" className="form-label">Create Password</label>
              <p className="form-helper mb-1.5">Min. 8 characters with uppercase, number & special character</p>
              <div className="relative">
                <input
                  id="signup-password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Kisan@2026"
                  className={`form-input pr-10 ${errors.password ? 'error' : ''}`}
                  {...register('password', {
                    required: 'Password is required',
                    minLength: { value: 8, message: 'Minimum 8 characters required' },
                    pattern: {
                      value: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])/,
                      message: 'Must include uppercase, number, and special character',
                    },
                  })}
                />
                <button type="button" onClick={() => setShowPassword((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showPassword ? <EyeOff className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />}
                </button>
              </div>
              {errors.password && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.password.message}</p>}
            </div>

            {/* Confirm password */}
            <div>
              <label htmlFor="signup-confirm" className="form-label">Confirm Password</label>
              <div className="relative">
                <input
                  id="signup-confirm"
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Re-enter password"
                  className={`form-input pr-10 ${errors.confirmPassword ? 'error' : ''}`}
                  {...register('confirmPassword', {
                    required: 'Please confirm your password',
                    validate: (val) => val === passwordValue || 'Passwords do not match',
                  })}
                />
                <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2">
                  {showConfirm ? <EyeOff className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} /> : <Eye className="w-4 h-4" style={{ color: 'var(--muted-foreground)' }} />}
                </button>
              </div>
              {errors.confirmPassword && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.confirmPassword.message}</p>}
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2.5">
              <input
                id="terms"
                type="checkbox"
                className="w-4 h-4 mt-0.5 rounded accent-primary"
                {...register('termsAccepted', { required: 'You must accept the terms to register' })}
              />
              <label htmlFor="terms" className="text-sm leading-relaxed" style={{ color: 'var(--muted-foreground)' }}>
                I agree to AgriMart's{' '}
                <span className="font-medium" style={{ color: 'var(--primary)' }}>Terms of Service</span>
                {' '}and{' '}
                <span className="font-medium" style={{ color: 'var(--primary)' }}>Privacy Policy</span>
                {' '}(DPDP Act 2023 compliant)
              </label>
            </div>
            {errors.termsAccepted && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.termsAccepted.message}</p>}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="btn-secondary flex-1 py-3"
              >
                Back
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="btn-primary flex-1 py-3"
              >
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Creating account...</>
                ) : (
                  <><UserCheck className="w-4 h-4" /> Create Account</>
                )}
              </button>
            </div>
          </div>
        )}
      </form>

      {/* Location note */}
      <div className="flex items-center gap-2 mt-4 p-3 rounded-lg" style={{ backgroundColor: 'var(--secondary)' }}>
        <MapPin className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--accent)' }} />
        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
          Location is used only for demand matching and logistics. We never share your data with third parties.
        </p>
      </div>

      {/* Divider */}
      <div className="flex items-center gap-3 my-5">
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>or continue with</span>
        <div className="flex-1 h-px" style={{ backgroundColor: 'var(--border)' }} />
      </div>

      {/* Google auth button */}
      <button
        type="button"
        onClick={handleGoogleSignUp}
        className="btn-secondary w-full py-3 gap-3 mb-4"
      >
        <svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p className="text-center text-sm mt-5" style={{ color: 'var(--muted-foreground)' }}>
        Already have an account?{' '}
        <button
          type="button"
          onClick={onSwitchToLogin}
          className="font-semibold"
          style={{ color: 'var(--primary)' }}
        >
          Sign in
        </button>
      </p>
    </div>
  );
}