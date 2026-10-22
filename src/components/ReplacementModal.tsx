import React, { useState } from 'react';
import { X, Upload, AlertCircle, Camera, CheckCircle2, MessageCircle, AlertTriangle, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface ReplacementModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: any;
  onSuccess: () => void;
}

export default function ReplacementModal({ isOpen, onClose, order, onSuccess }: ReplacementModalProps) {
  const [reason, setReason] = useState<string>('Damaged Product');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [photoPreview, setPhotoPreview] = useState('');
  const [uploadingPhoto, setUploadingPhoto] = useState(false);
  const [unboxingVideoSent, setUnboxingVideoSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen || !order) return null;

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error('Please upload an image file (PNG, JPG, JPEG)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error('Image size must be under 10MB');
      return;
    }

    // Local preview immediately
    const reader = new FileReader();
    reader.onload = () => {
      setPhotoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    // Upload to server
    setUploadingPhoto(true);
    try {
      const formData = new FormData();
      formData.append('photo', file);

      const res = await fetch('/api/orders/upload-replacement-photo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.photoUrl) {
        setPhotoUrl(data.photoUrl);
        toast.success('Photo uploaded successfully');
      } else {
        // Fallback to base64 if upload endpoint fails
        setPhotoUrl(photoPreview || (await fileToBase64(file)));
      }
    } catch {
      // Fallback to base64 preview
      setPhotoUrl(photoPreview || (await fileToBase64(file)));
      toast.success('Photo attached');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const r = new FileReader();
      r.onload = () => resolve(r.result as string);
      r.onerror = reject;
      r.readAsDataURL(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reason) {
      toast.error('Please select a reason for replacement');
      return;
    }

    if (!description.trim() || description.trim().length < 5) {
      toast.error('Please describe what is wrong (minimum 5 characters)');
      return;
    }

    if (!photoUrl && !photoPreview) {
      toast.error('Photo of the defective/damaged item or box is mandatory');
      return;
    }

    if (reason === 'Empty Box Received' && !unboxingVideoSent) {
      toast.error('Please confirm or send unboxing video on WhatsApp for empty box claims');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/orders/${order.id}/change-requests`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'replacement',
          mobile: order.customerMobile,
          requestedValue: {
            reason,
            description: description.trim(),
            photoUrl: photoUrl || photoPreview,
            unboxingVideoSent: Boolean(unboxingVideoSent),
            productName: order.productSnapshot?.name,
            customerMobile: order.customerMobile,
            customerName: order.customerName,
            orderNumber: order.orderNumber
          }
        })
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || 'Replacement request submitted successfully!');
        onSuccess();
        onClose();
      } else {
        toast.error(data.error || 'Failed to submit replacement request');
      }
    } catch {
      toast.error('Network error submitting replacement request');
    } finally {
      setSubmitting(false);
    }
  };

  const openWhatsAppForUnboxing = () => {
    const text = `Hello Fancy Bazaar Support, I received an Empty Box (Box MT) for Order #${order.orderNumber}. Here is my unboxing video as required for replacement verification.`;
    window.open(`https://wa.me/917004664741?text=${encodeURIComponent(text)}`, '_blank');
    setUnboxingVideoSent(true);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl border border-gray-100 dark:border-gray-800 transition-colors my-8 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <div className="p-6 border-b dark:border-gray-800 flex justify-between items-center bg-gray-50/50 dark:bg-gray-850">
          <div>
            <h2 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <RefreshCw className="w-5 h-5 text-indigo-600" />
              Request Product Replacement
            </h2>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 font-mono">
              Order #{order.orderNumber}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors cursor-pointer text-gray-400"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[75vh] overflow-y-auto">
          
          {/* Policy Banner */}
          <div className="p-3.5 bg-indigo-50/80 dark:bg-indigo-950/40 border border-indigo-100 dark:border-indigo-900/40 rounded-2xl flex items-start gap-3">
            <CheckCircle2 className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5" />
            <p className="text-xs text-indigo-900 dark:text-indigo-300 leading-relaxed font-medium">
              <strong>All-Products Replacement Policy:</strong> Replacement is allowed if product is damaged, defective/not working, wrong product received, or empty box (Box MT).
            </p>
          </div>

          {/* Reason Selection */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Reason for Replacement *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {[
                { id: 'Damaged Product', label: 'Damaged Product', sub: 'Broken / physical damage' },
                { id: 'Defective / Not Working', label: 'Defect / Not Working', sub: 'Technical flaw or fault' },
                { id: 'Wrong Product Received', label: 'Wrong Product', sub: 'Different item delivered' },
                { id: 'Empty Box Received', label: 'Empty Box (Box MT)', sub: 'Parcel has empty box' },
              ].map(opt => (
                <label
                  key={opt.id}
                  className={`p-3 rounded-2xl border-2 cursor-pointer transition-all flex flex-col gap-0.5 ${
                    reason === opt.id 
                      ? 'border-indigo-600 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-900 dark:text-white' 
                      : 'border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold">{opt.label}</span>
                    <input
                      type="radio"
                      name="replacementReason"
                      value={opt.id}
                      checked={reason === opt.id}
                      onChange={() => setReason(opt.id)}
                      className="text-indigo-600 focus:ring-indigo-500 cursor-pointer"
                    />
                  </div>
                  <span className="text-[10px] text-gray-400">{opt.sub}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Special Empty Box WhatsApp Notice */}
          {reason === 'Empty Box Received' && (
            <div className="p-4 bg-amber-50 dark:bg-amber-950/40 border-2 border-amber-300 dark:border-amber-700 rounded-2xl space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5 animate-bounce" />
                <div>
                  <h4 className="text-xs font-black text-amber-900 dark:text-amber-200 uppercase tracking-wider">
                    Unboxing Video Mandatory for Empty Box
                  </h4>
                  <p className="text-[11px] text-amber-800 dark:text-amber-300 mt-1 leading-relaxed">
                    Empty box claims strictly require an unboxing video to prevent fraud. Please send your clear parcel unboxing video directly to our official WhatsApp support.
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={openWhatsAppForUnboxing}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
              >
                <MessageCircle className="w-4 h-4" /> Send Unboxing Video on WhatsApp
              </button>

              <label className="flex items-center gap-2 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={unboxingVideoSent}
                  onChange={(e) => setUnboxingVideoSent(e.target.checked)}
                  className="rounded text-emerald-600 focus:ring-emerald-500"
                />
                <span className="text-xs font-bold text-gray-800 dark:text-gray-200">
                  I have sent or will send unboxing video on WhatsApp
                </span>
              </label>
            </div>
          )}

          {/* Photo Proof Upload */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider flex items-center justify-between">
              <span>Photo Proof of Defect / Box *</span>
              <span className="text-[10px] text-gray-400 font-normal">Required</span>
            </label>

            {photoPreview || photoUrl ? (
              <div className="relative rounded-2xl overflow-hidden border-2 border-indigo-200 dark:border-indigo-800 w-full h-44 bg-gray-100 dark:bg-gray-800">
                <img src={photoPreview || photoUrl} alt="Defect proof" className="w-full h-full object-contain" />
                <button
                  type="button"
                  onClick={() => { setPhotoUrl(''); setPhotoPreview(''); }}
                  className="absolute top-2 right-2 p-1.5 bg-red-600 text-white rounded-full shadow-md hover:bg-red-700 transition-colors cursor-pointer"
                  title="Remove photo"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <label className="border-2 border-dashed border-gray-300 dark:border-gray-700 hover:border-indigo-500 rounded-2xl p-6 flex flex-col items-center justify-center gap-2 text-center cursor-pointer transition-colors bg-gray-50/50 dark:bg-gray-800/40">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 flex items-center justify-center">
                  <Camera className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-xs font-bold text-gray-700 dark:text-gray-300">Click to upload photo</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">Clear photo showing damage, defect or empty box</p>
                </div>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  className="hidden"
                />
              </label>
            )}
            {uploadingPhoto && <p className="text-xs text-indigo-600 font-bold">Uploading photo...</p>}
          </div>

          {/* Description of Issue */}
          <div className="space-y-2">
            <label className="text-xs font-black text-gray-800 dark:text-gray-200 uppercase tracking-wider">
              Describe Issue in Detail *
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Please explain what happened with the product or parcel..."
              rows={3}
              className="w-full px-4 py-3 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl text-xs text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-indigo-500 transition-all resize-none"
              required
            />
          </div>

          {/* Submit Action */}
          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-2xl font-bold text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploadingPhoto}
              className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-2xl font-black text-xs shadow-md shadow-indigo-100 dark:shadow-none transition-all cursor-pointer flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting...' : 'Submit Replacement'}
            </button>
          </div>
        </form>

      </div>
    </div>
  );
}
