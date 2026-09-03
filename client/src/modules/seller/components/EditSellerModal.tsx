import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/common/Modal';
import { Seller, CreateSellerDto } from '../types';
import { Edit2, Mail, Phone, MapPin, Building2, FileText } from 'lucide-react';

interface EditSellerModalProps {
  isOpen: boolean;
  seller: Seller | null;
  onClose: () => void;
  onSubmit: (id: string, data: Partial<CreateSellerDto>) => Promise<void>;
}

export const EditSellerModal: React.FC<EditSellerModalProps> = ({ isOpen, seller, onClose, onSubmit }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [gstNumber, setGstNumber] = useState('');
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (seller) {
      setName(seller.name || '');
      setEmail(seller.email || '');
      setPhone(seller.phone || '');
      setAddress(seller.address || '');
      setGstNumber(seller.gstNumber || '');
    }
  }, [seller]);

  const handleClose = () => {
    setError(null);
    setFieldErrors({});
    onClose();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    setError(null);
    setFieldErrors({});

    if (!name.trim()) {
      setFieldErrors({ name: 'Seller name is required' });
      return;
    }

    setIsSubmitting(true);
    try {
      await onSubmit(seller.id, {
        name: name.trim(),
        email: email.trim() || undefined,
        phone: phone.trim() || undefined,
        address: address.trim() || undefined,
        gstNumber: gstNumber.trim() || undefined,
      });
      handleClose();
    } catch (err: any) {
      setError(err.response?.data?.message || err.message || 'Failed to update seller details');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Edit Vendor Record"
      subtitle={`Update details for ${seller?.name || 'seller account'}`}
      maxWidth="md"
      footer={
        <div className="flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isSubmitting}
            form="edit-seller-form"
            className="flex items-center space-x-2 px-4 py-2 rounded-xl text-xs font-semibold text-white bg-brand-600 hover:bg-brand-500 shadow-glow disabled:opacity-50 transition-all cursor-pointer"
          >
            {isSubmitting ? (
              <span>Updating...</span>
            ) : (
              <>
                <Edit2 className="w-3.5 h-3.5" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      }
    >
      <form id="edit-seller-form" onSubmit={handleSubmit} noValidate className="space-y-4">
        {error && (
          <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium">
            {error}
          </div>
        )}

        {/* Seller Name */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Seller / Business Name <span className="text-rose-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Building2 className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Acme Supplies Ltd."
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
          {fieldErrors.name && <p className="text-xs text-rose-400 mt-1">{fieldErrors.name}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Email Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Mail className="w-4 h-4" />
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="contact@acmesupplies.com"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Phone */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Phone Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <Phone className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="+91 98765 43210"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* GST */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            GST Number
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <FileText className="w-4 h-4" />
            </div>
            <input
              type="text"
              value={gstNumber}
              onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
              placeholder="e.g. 27AAPFU0939F1ZV"
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500"
            />
          </div>
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-300 mb-1.5">
            Address
          </label>
          <div className="relative">
            <div className="absolute top-2.5 left-0 pl-3.5 flex items-center pointer-events-none text-slate-500">
              <MapPin className="w-4 h-4" />
            </div>
            <textarea
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={2}
              className="w-full bg-slate-950/80 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-brand-500 resize-none"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
