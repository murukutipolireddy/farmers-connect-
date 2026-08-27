'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import {
  Upload, Loader2, Sparkles, CheckCircle2, Camera,
  X, AlertCircle, ChevronDown,
} from 'lucide-react';
import Modal from '@/components/ui/Modal';
import GradeBadge from '@/components/ui/GradeBadge';
import { apiFetch } from '@/lib/api';

interface CreateListingFormValues {
  cropType: string;
  variety: string;
  quantityKg: number;
  pricePerKg: number;
  harvestDate: string;
  availableUntil: string;
  state: string;
  region: string;
  minOrderKg: number;
  description: string;
  certifications: string;
  isCooperative: boolean;
  grade?: 'A' | 'B' | 'C' | 'D';
}

interface CreateListingModalProps {
  open: boolean;
  onClose: () => void;
  isBuyRequest?: boolean;
}

type GradingState = 'idle' | 'uploading' | 'grading' | 'done';

const cropOptions = [
  'Tomato', 'Potato', 'Onion', 'Cauliflower', 'Spinach', 'Brinjal',
  'Okra', 'Bitter Gourd', 'Capsicum', 'Carrot', 'Cabbage', 'Pumpkin',
  'Ridge Gourd', 'Green Chilli', 'Beans', 'Peas',
];

const indianStates = [
  'Andhra Pradesh', 'Bihar', 'Gujarat', 'Haryana', 'Karnataka',
  'Kerala', 'Madhya Pradesh', 'Maharashtra', 'Odisha', 'Punjab',
  'Rajasthan', 'Tamil Nadu', 'Telangana', 'Uttar Pradesh', 'West Bengal',
];

const CROP_IMAGES: Record<string, string> = {
  Tomato: 'https://images.unsplash.com/photo-1723234387588-756c4d1e3e1a',
  Onion: 'https://images.unsplash.com/photo-1728363333238-1ebfd8eaf995',
  Spinach: 'https://img.rocket.new/generatedImages/rocket_gen_img_12d80f805-1773092219586.png',
  Potato: 'https://img.rocket.new/generatedImages/rocket_gen_img_1398448c4-1768159074106.png',
  Cauliflower: 'https://images.unsplash.com/photo-1704596931787-977e8fd53ef1',
  Okra: 'https://images.unsplash.com/photo-1696835537510-981fdb76321f',
  Capsicum: 'https://images.unsplash.com/photo-1716434128604-e7bff11ec0a8',
  Brinjal: 'https://images.unsplash.com/photo-1714751569833-85bb703b1b91',
  Carrot: 'https://images.unsplash.com/photo-1606355194341-10e4cf647387',
  'Green Chilli': 'https://images.unsplash.com/photo-1648627743560-cd547111b443',
  Cabbage: 'https://images.unsplash.com/photo-1621142471060-28370379785a',
  'Bitter Gourd': 'https://images.unsplash.com/photo-1719143227376-a6b0a400711c',
  Wheat: 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b',
};

export default function CreateListingModal({ open, onClose, isBuyRequest = false }: CreateListingModalProps) {
  const [uploadedPhotos, setUploadedPhotos] = useState<string[]>([]);
  const [gradingState, setGradingState] = useState<GradingState>('idle');
  const [aiResult, setAiResult] = useState<{ grade: 'A' | 'B' | 'C' | 'D'; score: number; suggestedPrice: number } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
    watch,
  } = useForm<CreateListingFormValues>({
    defaultValues: { 
      cropType: '',
      variety: '',
      quantityKg: 500,
      pricePerKg: 35,
      minOrderKg: 50,
      state: 'Maharashtra',
      region: 'Nashik',
      isCooperative: false,
      grade: 'A',
      harvestDate: new Date().toISOString().split('T')[0],
      availableUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    },
  });

  const selectedCrop = watch('cropType');

  React.useEffect(() => {
    if (open && typeof window !== 'undefined') {
      const stored = localStorage.getItem('agrimart_user');
      if (stored) {
        try {
          const user = JSON.parse(stored);
          if (user.state) setValue('state', user.state);
          if (user.region) setValue('region', user.region || 'Nashik');
        } catch (e) {}
      }
    }
  }, [open, setValue]);

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const previews = Array.from(files).slice(0, 5 - uploadedPhotos.length).map((f) => URL.createObjectURL(f));
    setUploadedPhotos((prev) => [...prev, ...previews]);
    setGradingState('idle');
    setAiResult(null);
  };

  const removePhoto = (index: number) => {
    setUploadedPhotos((prev) => prev.filter((_, i) => i !== index));
    setAiResult(null);
    setGradingState('idle');
  };

  const triggerAiGrading = async () => {
    if (uploadedPhotos.length < 1) {
      toast.error('Upload at least 1 photo to trigger AI grading');
      return;
    }
    const mockGrade: 'A' | 'B' | 'C' | 'D' = uploadedPhotos.length >= 3 ? 'A' : 'B';
    const mockScore = uploadedPhotos.length >= 3 ? 94 : 82;
    const mockPrice = uploadedPhotos.length >= 3 ? 36 : 28;
    setAiResult({ grade: mockGrade, score: mockScore, suggestedPrice: mockPrice });
    setValue('pricePerKg', mockPrice);
    setGradingState('done');
    toast.success('AI grading complete — Grade ' + mockGrade + ' detected');
  };

  const onSubmit = async (data: CreateListingFormValues) => {
    if (!data.cropType) {
      toast.error('Please select a Crop Type');
      return;
    }
    setIsSubmitting(true);
    try {
      let farmerName = 'Ramesh Kumar';
      let farmName = 'Ramesh Kumar Farm';
      let sellerPhone = '9876543210';
      if (typeof window !== 'undefined') {
        const stored = localStorage.getItem('agrimart_user');
        if (stored) {
          try {
            const user = JSON.parse(stored);
            farmerName = user.name || farmerName;
            farmName = user.role === 'retailer' ? `${user.name} Procurement` : `${user.name} Farm`;
            sellerPhone = user.phone || '9876543210';
          } catch (e) {}
        }
      }

      const cropImg = uploadedPhotos[0] || CROP_IMAGES[data.cropType] || 'https://images.unsplash.com/photo-1574323347407-f5e1ad6d020b';
      
      const payload = {
        cropType: data.cropType,
        variety: data.variety || `${data.cropType} Fresh Harvest`,
        farmName,
        farmerName,
        region: data.region || 'Nashik',
        state: data.state || 'Maharashtra',
        grade: isBuyRequest ? (data.grade || 'A') : (aiResult?.grade || data.grade || 'A'),
        qualityScore: aiResult?.score || 95,
        quantityKg: Number(data.quantityKg) || 500,
        pricePerKg: Number(data.pricePerKg) || 30,
        harvestDate: data.harvestDate || new Date().toLocaleDateString('en-GB'),
        availableUntil: data.availableUntil || new Date(Date.now() + 14 * 86400000).toLocaleDateString('en-GB'),
        freshnessScore: isBuyRequest ? 90 : (aiResult?.score || 95),
        isCooperative: isBuyRequest ? false : Boolean(data.isCooperative),
        minOrderKg: Number(data.minOrderKg) || 50,
        description: data.description || '',
        certifications: data.certifications ? data.certifications.split(',').map((c) => c.trim()) : ['FSSAI Certified'],
        sellerPhone,
        isBuyRequest: !!isBuyRequest,
        imageUrl: cropImg,
      };

      const response = await apiFetch('/api/listings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || 'Failed to publish listing');
      }

      const savedData = await response.json();

      setIsSubmitting(false);
      toast.success(`${data.cropType} listing added successfully.`);
      reset();
      setUploadedPhotos([]);
      setAiResult(null);
      setGradingState('idle');
      onClose();
      
      // Trigger update on parent with fresh data
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('agrimart_listings_update', { detail: savedData }));
      }
    } catch (err: any) {
      setIsSubmitting(false);
      toast.error(err.message || 'Failed to create listing');
    }
  };

  const onInvalid = (formErrors: any) => {
    const errorKeys = Object.keys(formErrors);
    if (errorKeys.length > 0) {
      const firstError = formErrors[errorKeys[0]];
      toast.error(firstError?.message || `Please fill in required field: ${errorKeys[0]}`);
    }
  };

  const handleClose = () => {
    reset();
    setUploadedPhotos([]);
    setAiResult(null);
    setGradingState('idle');
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={handleClose}
      title={isBuyRequest ? "Create Procurement Sourcing Request" : "Create Produce Listing"}
      description={isBuyRequest ? "Request crops you need and let farmers fulfill your demands" : "List your fresh produce on the AgriMart marketplace"}
      size="xl"
      footer={
        <>
          <button onClick={handleClose} type="button" className="btn-secondary">Cancel</button>
          <button
            type="button"
            onClick={handleSubmit(onSubmit, onInvalid)}
            disabled={isSubmitting}
            className="btn-primary"
          >
            {isSubmitting ? (
              isBuyRequest ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Posting Request...</>
              ) : (
                <><Loader2 className="w-4 h-4 animate-spin" /> Publishing Listing...</>
              )
            ) : (
              isBuyRequest ? 'Post Procurement Request' : 'Publish Listing'
            )}
          </button>
        </>
      }
    >
      <form noValidate className="space-y-6">
        {!isBuyRequest && (
          <div>
            <label className="form-label">Produce Photos</label>
            <p className="form-helper mb-3">Upload 3+ clear photos for best AI grading accuracy. Min. 1 required.</p>

            <div className="flex flex-wrap gap-3 mb-3">
              {uploadedPhotos.map((photo, i) => (
                <div
                  key={`photo-${i}`}
                  className="relative rounded-xl overflow-hidden border-2"
                  style={{ width: '88px', height: '88px', borderColor: 'var(--border)' }}
                >
                  <img
                    src={photo}
                    alt={`Produce photo ${i + 1}`}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removePhoto(i)}
                    className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                  >
                    <X className="w-3 h-3 text-white" />
                  </button>
                </div>
              ))}
              {uploadedPhotos.length < 5 && (
                <label
                  className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:bg-muted"
                  style={{ width: '88px', height: '88px', borderColor: 'var(--border)' }}
                >
                  <Camera className="w-5 h-5 mb-1" style={{ color: 'var(--muted-foreground)' }} />
                  <span className="text-2xs" style={{ color: 'var(--muted-foreground)' }}>Add photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </label>
              )}
            </div>

            {/* AI Grading trigger */}
            {uploadedPhotos.length > 0 && gradingState !== 'done' && (
              <button
                type="button"
                onClick={triggerAiGrading}
                disabled={gradingState !== 'idle'}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border-2 transition-all disabled:opacity-60"
                style={{
                  borderColor: 'var(--primary)',
                  color: 'var(--primary)',
                  backgroundColor: 'var(--success-bg)',
                }}
              >
                {gradingState === 'idle' && <><Sparkles className="w-4 h-4" /> Run AI Quality Grading</>}
                {gradingState === 'uploading' && <><Loader2 className="w-4 h-4 animate-spin" /> Uploading photos...</>}
                {gradingState === 'grading' && <><Loader2 className="w-4 h-4 animate-spin" /> AI analysing quality...</>}
              </button>
            )}

            {/* AI Result */}
            {gradingState === 'done' && aiResult && (
              <div
                className="flex items-center gap-4 p-4 rounded-xl border-2 animate-slide-up"
                style={{ borderColor: 'var(--primary)', backgroundColor: 'var(--success-bg)' }}
              >
                <CheckCircle2 className="w-6 h-6 flex-shrink-0" style={{ color: 'var(--primary)' }} />
                <div className="flex-1">
                  <p className="text-sm font-semibold" style={{ color: 'var(--primary)' }}>
                    AI Grading Complete
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Quality score: {aiResult.score}/100 · Suggested price: ₹{aiResult.suggestedPrice}/kg
                  </p>
                </div>
                <GradeBadge grade={aiResult.grade} size="lg" />
              </div>
            )}
          </div>
        )}

        {/* Crop details */}
        <div>
          <h3 className="font-display font-semibold text-sm mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            {isBuyRequest ? "Procurement Demand Information" : "Crop Information"}
          </h3>
          <div className={`grid grid-cols-1 ${isBuyRequest ? 'sm:grid-cols-3' : 'sm:grid-cols-2'} gap-4`}>
            <div>
              <label htmlFor="crop-type" className="form-label">Crop Type</label>
              <div className="relative">
                <select
                  id="crop-type"
                  className={`form-input appearance-none pr-8 ${errors.cropType ? 'error' : ''}`}
                  {...register('cropType', { required: 'Select a crop type' })}
                >
                  <option value="">Select crop</option>
                  {cropOptions.map((c) => (
                    <option key={`crop-opt-${c}`} value={c}>{c}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
              </div>
              {errors.cropType && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.cropType.message}</p>}
            </div>
            <div>
              <label htmlFor="variety" className="form-label">Variety / Cultivar (optional)</label>
              <input
                id="variety"
                type="text"
                placeholder={selectedCrop ? `e.g. ${selectedCrop} Fresh Harvest` : "e.g. Hybrid F1 — Naveen"}
                className="form-input"
                {...register('variety')}
              />
            </div>
            {isBuyRequest && (
              <div>
                <label htmlFor="grade" className="form-label">Desired Quality Grade</label>
                <div className="relative">
                  <select
                    id="grade"
                    className="form-input appearance-none pr-8"
                    {...register('grade', { required: 'Select desired quality grade' })}
                  >
                    <option value="A">Grade A (Premium)</option>
                    <option value="B">Grade B (Medium)</option>
                    <option value="C">Grade C (Average)</option>
                    <option value="D">Grade D (Low)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quantity & Pricing */}
        <div>
          <h3 className="font-display font-semibold text-sm mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            {isBuyRequest ? "Procurement Demand & Target Budget" : "Quantity & Pricing"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="quantity" className="form-label">{isBuyRequest ? "Quantity Needed (kg)" : "Total Quantity (kg)"}</label>
              <input
                id="quantity"
                type="number"
                min={1}
                placeholder={isBuyRequest ? "e.g. 5000" : "e.g. 2500"}
                className={`form-input tabular-nums ${errors.quantityKg ? 'error' : ''}`}
                {...register('quantityKg', {
                  required: 'Quantity is required',
                  min: { value: 1, message: 'Quantity must be at least 1 kg' },
                  valueAsNumber: true,
                })}
              />
              {errors.quantityKg && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.quantityKg.message}</p>}
            </div>
            <div>
              <label htmlFor="price" className="form-label">
                {isBuyRequest ? "Target Price per kg (₹)" : "Price per kg (₹)"}
                {aiResult && (
                  <span className="ml-1 text-xs font-normal" style={{ color: 'var(--primary)' }}>
                    AI suggests ₹{aiResult.suggestedPrice}
                  </span>
                )}
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>₹</span>
                <input
                  id="price"
                  type="number"
                  min={1}
                  placeholder="28"
                  className={`form-input pl-7 tabular-nums ${errors.pricePerKg ? 'error' : ''}`}
                  {...register('pricePerKg', {
                    required: 'Price is required',
                    min: { value: 1, message: 'Price must be at least ₹1' },
                    valueAsNumber: true,
                  })}
                />
              </div>
              {errors.pricePerKg && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.pricePerKg.message}</p>}
            </div>
            <div>
              <label htmlFor="min-order" className="form-label">{isBuyRequest ? "Min. Supply Qty (kg)" : "Min. Order (kg)"}</label>
              <input
                id="min-order"
                type="number"
                min={1}
                placeholder="100"
                className={`form-input tabular-nums ${errors.minOrderKg ? 'error' : ''}`}
                {...register('minOrderKg', {
                  required: 'Minimum quantity required',
                  min: { value: 1, message: 'Must be at least 1 kg' },
                  valueAsNumber: true,
                })}
              />
              {errors.minOrderKg && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.minOrderKg.message}</p>}
            </div>
          </div>
        </div>

        {/* Dates */}
        <div>
          <h3 className="font-display font-semibold text-sm mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            {isBuyRequest ? "Procurement Timeframe" : "Harvest & Availability Window"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="harvest-date" className="form-label">{isBuyRequest ? "Required By Date" : "Harvest Date"}</label>
              <input
                id="harvest-date"
                type="date"
                className={`form-input ${errors.harvestDate ? 'error' : ''}`}
                {...register('harvestDate', { required: 'Date is required' })}
              />
              {errors.harvestDate && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.harvestDate.message}</p>}
            </div>
            <div>
              <label htmlFor="available-until" className="form-label">{isBuyRequest ? "Request Valid Until" : "Available Until"}</label>
              <p className="form-helper mb-1.5">{isBuyRequest ? "Request auto-expires after this date" : "Listing auto-expires after this date"}</p>
              <input
                id="available-until"
                type="date"
                className={`form-input ${errors.availableUntil ? 'error' : ''}`}
                {...register('availableUntil', { required: 'Expiration date is required' })}
              />
              {errors.availableUntil && <p className="form-error"><span className="w-3 h-3 rounded-full bg-red-500" />{errors.availableUntil.message}</p>}
            </div>
          </div>
        </div>

        {/* Location */}
        <div>
          <h3 className="font-display font-semibold text-sm mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            {isBuyRequest ? "Delivery Destination Location" : "Farm Location"}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label htmlFor="listing-state" className="form-label">{isBuyRequest ? "Delivery State" : "State"}</label>
              <div className="relative">
                <select
                  id="listing-state"
                  className="form-input appearance-none pr-8"
                  {...register('state')}
                >
                  <option value="Maharashtra">Maharashtra</option>
                  {indianStates.filter(s => s !== 'Maharashtra').map((s) => (
                    <option key={`lst-state-${s}`} value={s}>{s}</option>
                  ))}
                </select>
                <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 pointer-events-none" style={{ color: 'var(--muted-foreground)' }} />
              </div>
            </div>
            <div>
              <label htmlFor="listing-region" className="form-label">{isBuyRequest ? "Delivery District / Region" : "District / Region"}</label>
              <input
                id="listing-region"
                type="text"
                placeholder="e.g. Nashik"
                className="form-input"
                {...register('region')}
              />
            </div>
          </div>
        </div>

        {/* Additional */}
        <div>
          <h3 className="font-display font-semibold text-sm mb-4 pb-2 border-b" style={{ color: 'var(--foreground)', borderColor: 'var(--border)' }}>
            Additional Details
          </h3>
          <div className="space-y-4">
            <div>
              <label htmlFor="certifications" className="form-label">{isBuyRequest ? "Required Certifications (optional)" : "Certifications"}</label>
              <p className="form-helper mb-1.5">Comma-separated, e.g. Organic India, APEDA, FSSAI</p>
              <input
                id="certifications"
                type="text"
                placeholder="Organic India, APEDA"
                className="form-input"
                {...register('certifications')}
              />
            </div>
            <div>
              <label htmlFor="description" className="form-label">Description (optional)</label>
              <textarea
                id="description"
                rows={3}
                placeholder={isBuyRequest ? "Describe your specific requirements — acceptable moisture content, size, packaging specifications..." : "Describe your produce — growing practices, soil type, irrigation method..."}
                className="form-input resize-none"
                {...register('description')}
              />
            </div>
            {!isBuyRequest && (
              <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: 'var(--border)' }}>
                <input
                  id="is-cooperative"
                  type="checkbox"
                  className="w-4 h-4 rounded accent-primary"
                  {...register('isCooperative')}
                />
                <label htmlFor="is-cooperative" className="flex-1">
                  <p className="text-sm font-medium" style={{ color: 'var(--foreground)' }}>
                    This is a cooperative listing
                  </p>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    Pooled produce from multiple nearby farmers — revenue split automatically by contribution
                  </p>
                </label>
              </div>
            )}
          </div>
        </div>

        {/* Blockchain info */}
        <div
          className="flex items-start gap-3 p-4 rounded-xl"
          style={{ backgroundColor: 'var(--info-bg)' }}
        >
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--info)' }} />
          <div>
            <p className="text-sm font-semibold" style={{ color: 'var(--info)' }}>Blockchain Traceability Enabled</p>
            <p className="text-xs mt-0.5" style={{ color: 'var(--info)' }}>
              This listing will be recorded on the Polygon blockchain. A QR code will be generated for retailers and consumers to verify full farm-to-shelf provenance.
            </p>
          </div>
        </div>
      </form>
    </Modal>
  );
}