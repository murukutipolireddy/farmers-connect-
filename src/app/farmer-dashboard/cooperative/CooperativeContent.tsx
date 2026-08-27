'use client';

import React, { useState } from 'react';
import {
  Users, Truck, Sprout, ShieldCheck, Sparkles,
  Calendar, Info, Plus, ChevronRight, CheckCircle
} from 'lucide-react';
import { toast } from 'sonner';

interface SharedTool {
  id: string;
  name: string;
  type: string;
  costPerHour: number;
  availableSlot: string;
  owner: string;
}

const tools: SharedTool[] = [
  { id: 'tool-501', name: 'Mahindra Arjun 605 Tractor', type: 'Tillage', costPerHour: 450, availableSlot: 'Tomorrow, 8 AM - 12 PM', owner: 'Vighnaharta Coop' },
  { id: 'tool-502', name: 'Laser Land Leveler', type: 'Land Prep', costPerHour: 300, availableSlot: '19 May, All day', owner: 'Nashik FPO' },
  { id: 'tool-503', name: 'Drone Crop Spraying Kit', type: 'Pesticides', costPerHour: 600, availableSlot: '20 May, 2 PM - 5 PM', owner: 'Suresh Patil' },
];

const logisticsPools = [
  { destination: 'Vashi APMC (Mumbai)', date: '20 May', filledWeight: '6.4 Tons', capacity: '10 Tons', farmersShared: 8, costPerKg: '₹1.50' },
  { destination: 'Pune Local Mandi', date: '22 May', filledWeight: '3.1 Tons', capacity: '5 Tons', farmersShared: 4, costPerKg: '₹0.80' },
];

export default function CooperativeContent() {
  const [activeTab, setActiveTab] = useState<'logistics' | 'equipment'>('logistics');

  const handleBook = (name: string) => {
    toast.success(`Booking request submitted for: ${name}!`);
    toast.info('Cooperative administrator will call you to confirm pick up details.');
  };

  const handleJoinPool = (dest: string) => {
    toast.success(`Joined bulk delivery pool for ${dest}!`);
    toast.info('We have updated your active produce listings with shared logistics details.');
  };

  return (
    <div className="px-4 xl:px-8 2xl:px-12 py-6 max-w-screen-2xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex justify-between items-start flex-wrap gap-4">
        <div>
          <h1 className="font-display text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
            Cooperative & Shared Logistics Hub
          </h1>
          <p className="text-sm mt-1" style={{ color: 'var(--muted-foreground)' }}>
            Reduce your farming costs. Book shared tractors, drones, and join group cold-chain shipping pools.
          </p>
        </div>
        
        {/* Cooperative details banner */}
        <div className="flex items-center gap-3 px-4 py-2.5 rounded-xl border bg-card text-foreground" style={{ borderColor: 'var(--border)' }}>
          <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary-bg">
            <Users className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="text-xs font-bold">Nashik Agro-Growers FPO</p>
            <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Active Members: 124 Farmers</p>
          </div>
        </div>
      </div>

      {/* Tab select */}
      <div className="flex rounded-lg overflow-hidden border mb-5 max-w-md" style={{ borderColor: 'var(--border)' }}>
        {[
          { id: 'logistics', label: 'Shared Shipping Pools', icon: Truck },
          { id: 'equipment', label: 'Shared Farming Machinery', icon: Sprout },
        ].map((t) => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className="flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
              style={{
                backgroundColor: activeTab === t.id ? 'var(--primary)' : 'transparent',
                color: activeTab === t.id ? 'var(--primary-foreground)' : 'var(--muted-foreground)'
              }}
            >
              <Icon className="w-4 h-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {activeTab === 'logistics' ? (
        <div className="grid grid-cols-1 xl:grid-cols-3 gap-5 items-stretch">
          {/* Pools List */}
          <div className="xl:col-span-2 card p-5">
            <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Truck className="w-5 h-5 text-primary" /> Joint Delivery Pools
            </h2>

            <div className="space-y-4">
              {logisticsPools.map((pool, idx) => {
                const filledPct = Math.round((parseFloat(pool.filledWeight) / parseFloat(pool.capacity)) * 100);
                return (
                  <div key={idx} className="p-4 rounded-xl border flex flex-col justify-between gap-3" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--secondary)' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-sm font-bold text-foreground">{pool.destination}</p>
                        <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>
                          Departure Date: {pool.date} · Shared logistics cost: <strong style={{ color: 'var(--primary)' }}>{pool.costPerKg}/Kg</strong>
                        </p>
                      </div>
                      <span className="text-2xs font-semibold px-2 py-0.5 rounded-full bg-success-bg text-success">
                        {pool.farmersShared} Farmers Sharing
                      </span>
                    </div>

                    <div>
                      <div className="flex justify-between text-2xs mb-1 font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                        <span>Capacity Filled ({pool.filledWeight})</span>
                        <span>{filledPct}% ({pool.capacity} Truck)</span>
                      </div>
                      <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--muted)' }}>
                        <div className="h-full bg-primary rounded-full" style={{ width: `${filledPct}%` }} />
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-t pt-3 mt-1" style={{ borderColor: 'var(--border)' }}>
                      <p className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Save up to 40% on transport cost compared to booking solo.</p>
                      <button
                        onClick={() => handleJoinPool(pool.destination)}
                        className="w-full sm:w-auto px-4 py-2 rounded-lg text-xs font-bold text-white bg-primary hover:opacity-90 active:scale-95 transition-all text-center"
                      >
                        Join Pool Sourcing
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Quick FAQ / Info */}
          <div className="xl:col-span-1 card p-5 flex flex-col justify-between">
            <div>
              <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-1.5" style={{ color: 'var(--foreground)' }}>
                <Sparkles className="w-5 h-5 text-amber-500" /> Logistics Benefits
              </h2>
              <ul className="space-y-3.5 text-xs" style={{ color: 'var(--muted-foreground)' }}>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <strong>Cold Chain Shipping</strong>: Refrigerated trucks maintain freshness scores up to Vashi APMC.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <strong>Doorstep Harvesting Pick-up</strong>: Joint cooperative routes fetch crop bags directly from your farm.
                </li>
                <li className="flex gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                  <strong>Zero Wastage Guarantee</strong>: In-transit sorting reduces storage weight losses by 10%.
                </li>
              </ul>
            </div>
            
            <div className="p-3.5 rounded-xl border text-2xs mt-4 flex items-start gap-2" style={{ borderColor: 'var(--border)', backgroundColor: 'var(--info-bg)', color: 'var(--info)' }}>
              <Info className="w-4 h-4 flex-shrink-0" />
              <span>Logistics pooling slots close 48 hours prior to dispatch to schedule routing details.</span>
            </div>
          </div>
        </div>
      ) : (
        <div className="card p-5">
          <h2 className="font-display font-semibold text-base mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
            <Sprout className="w-5 h-5 text-primary" /> Machinery Sharing Pool
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {tools.map((t) => (
              <div key={t.id} className="p-4 rounded-xl border flex flex-col justify-between gap-4" style={{ borderColor: 'var(--border)' }}>
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--success-bg)', color: 'var(--success)' }}>
                      {t.type}
                    </span>
                    <span className="text-xs font-semibold" style={{ color: 'var(--muted-foreground)' }}>
                      Owner: {t.owner}
                    </span>
                  </div>
                  <h3 className="text-sm font-bold mt-2" style={{ color: 'var(--foreground)' }}>{t.name}</h3>
                  <p className="text-lg font-extrabold mt-1 text-primary">
                    ₹{t.costPerHour}<span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>/Hour</span>
                  </p>
                  <p className="text-2xs mt-2" style={{ color: 'var(--muted-foreground)' }}>
                    <strong>Available Slot:</strong> {t.availableSlot}
                  </p>
                </div>

                <button
                  onClick={() => handleBook(t.name)}
                  className="w-full py-2 border rounded-xl text-xs font-bold hover:bg-muted transition-colors text-foreground"
                  style={{ borderColor: 'var(--border)' }}
                >
                  Request Booking
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
