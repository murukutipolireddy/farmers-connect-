'use client';

import React, { useState } from 'react';
import LoginForm from './LoginForm';
import SignUpForm from './SignUpForm';
import { Sprout, TrendingUp, ShieldCheck, Zap } from 'lucide-react';

export default function AuthScreen() {
  const [tab, setTab] = useState<'login' | 'signup'>('login');

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand */}
      <div className="hidden lg:flex lg:w-[52%] xl:w-[55%] flex-col justify-between p-10 xl:p-14 gradient-brand relative overflow-hidden">
        {/* Background decoration */}
        <div
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `radial-gradient(circle at 20% 80%, #D4820A 0%, transparent 50%),
                              radial-gradient(circle at 80% 20%, #2d9a5c 0%, transparent 50%)`,
          }}
        />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: 'rgba(255,255,255,0.15)' }}
          >
            <Sprout className="w-6 h-6 text-white" />
          </div>
          <span className="font-display text-2xl font-bold text-white">AgriMart</span>
        </div>

        {/* Hero copy */}
        <div className="relative z-10 space-y-6">
          <div>
            <h1 className="font-display text-4xl xl:text-5xl font-bold text-white leading-tight text-balance">
              Farm Fresh,<br />
              <span style={{ color: '#F0A030' }}>Direct to Market</span>
            </h1>
            <p className="mt-4 text-lg leading-relaxed" style={{ color: 'rgba(255,255,255,0.75)' }}>
              India's first AI-powered farm-to-retailer marketplace. No middlemen. No waste. Fair prices for every harvest.
            </p>
          </div>

          {/* Feature highlights */}
          <div className="grid grid-cols-2 gap-4">
            {[
              { icon: TrendingUp, title: 'Demand Forecasting', desc: 'AI predicts crop demand 8 weeks ahead' },
              { icon: ShieldCheck, title: 'Blockchain Trust', desc: 'Full farm-to-shelf traceability' },
              { icon: Zap, title: 'Flash Surplus Market', desc: 'Zero waste with instant deals' },
              { icon: Sprout, title: 'Carbon Credits', desc: 'Earn from regenerative farming' },
            ].map((f) => (
              <div
                key={`feature-${f.title}`}
                className="p-4 rounded-xl"
                style={{ backgroundColor: 'rgba(255,255,255,0.08)', backdropFilter: 'blur(8px)' }}
              >
                <f.icon className="w-5 h-5 mb-2" style={{ color: '#F0A030' }} />
                <p className="text-sm font-semibold text-white">{f.title}</p>
                <p className="text-xs mt-0.5" style={{ color: 'rgba(255,255,255,0.6)' }}>{f.desc}</p>
              </div>
            ))}
          </div>


        </div>

        {/* Bottom disclaimer */}
        <p className="relative z-10 text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
          © 2026 AgriMart Technologies Pvt. Ltd. · DPDP Act 2023 Compliant
        </p>
      </div>

      {/* Right panel — form */}
      <div
        className="flex-1 flex flex-col items-center justify-center p-6 sm:p-10 overflow-y-auto"
        style={{ backgroundColor: 'var(--background)' }}
      >
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: 'var(--primary)' }}
            >
              <Sprout className="w-5 h-5 text-white" />
            </div>
            <span className="font-display text-xl font-bold" style={{ color: 'var(--primary)' }}>AgriMart</span>
          </div>

          {/* Tab switcher */}
          <div
            className="flex rounded-xl p-1 mb-8"
            style={{ backgroundColor: 'var(--muted)' }}
            role="tablist"
          >
            {(['login', 'signup'] as const).map((t) => (
              <button
                key={`auth-tab-${t}`}
                role="tab"
                aria-selected={tab === t}
                onClick={() => setTab(t)}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-200 ${
                  tab === t
                    ? 'bg-card text-foreground shadow-card'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {t === 'login' ? 'Sign In' : 'Create Account'}
              </button>
            ))}
          </div>

          {tab === 'login' ? (
            <LoginForm onSwitchToSignup={() => setTab('signup')} />
          ) : (
            <SignUpForm onSwitchToLogin={() => setTab('login')} />
          )}
        </div>
      </div>
    </div>
  );
}