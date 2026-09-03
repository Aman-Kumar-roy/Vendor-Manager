import React, { useState } from 'react';
import { Modal } from '../../../components/common/Modal';
import { CreateSellerDto } from '../types';
import { UserPlus, Mail, Phone, MapPin, Building2, FileText } from 'lucide-react';

interface AddSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateSellerDto) => Promise<void>;
}

export const AddSellerModal: React.FC<AddSellerModalProps> = ({ isOpen, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [requireAdditional, setRequireAdditional] = useState(true);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleClose = () => {
    setName(''); setEmail(''); setPhone(''); setAddress(''); setGstNumber('');
    setRequireAdditional(true); setError(null); setFieldErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setFieldErrors({});

    const newErrors: Record<string, string> = {};

    if (!name.trim()) {
      newErrors.name = 'Seller name is required';
    }

    if (email.trim() && !/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (requireAdditional) {
      if (!phone.trim()) {
        newErrors.phone = 'Phone number is required when additional fields are enabled';
      }
      if (!address.trim()) {
        newErrors.address = 'Address is required when additional fields are enabled';
      }
      if (!gstNumber.trim()) {
        newErrors.gstNumber = 'GST Number is required when additional fields are enabled';
      }
    }

    if (Object.keys(newErrors).length > 0) {
      setFieldErrors(newErrors);
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit({
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to add seller');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Add New Seller"
      subtitle="Register a new seller account to begin tracking deliveries and settlements"
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            form="add-seller-form"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-glow disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Saving...</span>
            ) : (
              <>
                <UserPlus className="w-3.5 h-3.5" />
                <span>Save Seller</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="add-seller-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Required Fields Toggle */}
        <div className="flex items-center justify-between p-3.5 rounded-xl bg-slate-800/60 border border-slate-700/80">
          <div>
            <p className="text-xs font-semibold text-slate-200">Require additional fields</p>
            <p className="text-[11px] text-slate-400 mt-0.5">
              {requireAdditional
                ? 'Phone, address & GST number are required'
                : 'Only seller name is required'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setRequireAdditional((v) => !v)}
            className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none ${
              requireAdditional ? 'bg-brand-500' : 'bg-slate-700'
            }`}
            aria-pressed={requireAdditional}
            aria-label="Toggle required additional fields"
            id="require-additional-toggle"
          >
            <span
              className={`inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform duration-200 ${
                requireAdditional ? 'translate-x-5' : 'translate-x-0.5'
              }`}
            />
          </button>
        </div>

        {/* Seller Name (always required) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Seller / Business Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              id="seller-name"
              type="text"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (fieldErrors.name) setFieldErrors(p => ({ ...p, name: '' }));
              }}
              placeholder="e.g. Acme Supplies Ltd."
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.name ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.name && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.name}</p>
          )}
        </div>

        {/* Email (always optional) */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address <span className="text-slate-500 font-normal text-[10px]">(Optional)</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              id="seller-email"
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (fieldErrors.email) setFieldErrors(p => ({ ...p, email: '' }));
              }}
              placeholder="contact@acmesupplies.com"
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.email ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.email && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.email}</p>
          )}
        </div>

        {/* GST Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            GST Number
            {requireAdditional ? (
              <span className="text-rose-400"> *</span>
            ) : (
              <span className="text-slate-500 font-normal text-[10px]"> (Optional)</span>
            )}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <FileText className="w-4 h-4" />
            </div>
            <input
              id="seller-gst"
              type="text"
              value={gstNumber}
              onChange={(e) => {
                setGstNumber(e.target.value.toUpperCase());
                if (fieldErrors.gstNumber) setFieldErrors(p => ({ ...p, gstNumber: '' }));
              }}
              placeholder="e.g. 27AAPFU0939F1ZV"
              maxLength={15}
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.gstNumber
                  ? 'border-rose-500 focus:border-rose-500'
                  : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.gstNumber && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.gstNumber}</p>
          )}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Phone Number
            {requireAdditional ? (
              <span className="text-rose-400"> *</span>
            ) : (
              <span className="text-slate-500 font-normal text-[10px]"> (Optional)</span>
            )}
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Phone className="w-4 h-4" />
            </div>
            <input
              id="seller-phone"
              type="text"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                if (fieldErrors.phone) setFieldErrors(p => ({ ...p, phone: '' }));
              }}
              placeholder="+91 98765 43210"
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors ${
                fieldErrors.phone ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.phone && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.phone}</p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Office / Dispatch Address
            {requireAdditional ? (
              <span className="text-rose-400"> *</span>
            ) : (
              <span className="text-slate-500 font-normal text-[10px]"> (Optional)</span>
            )}
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <MapPin className="w-4 h-4" />
            </div>
            <textarea
              id="seller-address"
              value={address}
              onChange={(e) => {
                setAddress(e.target.value);
                if (fieldErrors.address) setFieldErrors(p => ({ ...p, address: '' }));
              }}
              placeholder="123 Commerce St, Suite 10, City"
              rows={2}
              className={`w-full bg-slate-950/80 border rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none transition-colors resize-none ${
                fieldErrors.address ? 'border-rose-500 focus:border-rose-500' : 'border-slate-800 focus:border-brand-500 focus:ring-1 focus:ring-brand-500'
              }`}
            />
          </div>
          {fieldErrors.address && (
            <p className="text-xs text-rose-400 mt-1 font-medium">{fieldErrors.address}</p>
          )}
        </div>
      </form>
    </Modal>
  );
};

