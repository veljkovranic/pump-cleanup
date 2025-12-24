/**
 * CustomDestinationModal Component
 * 
 * Modal for setting a custom destination wallet for refunded SOL.
 */

import React, { useState } from 'react';
import { isValidPublicKey } from '@/lib/solana';

interface CustomDestinationModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentDestination: string | null;
  onConfirm: (address: string | null) => void;
  defaultAddress: string;
}

export const CustomDestinationModal: React.FC<CustomDestinationModalProps> = ({
  isOpen,
  onClose,
  currentDestination,
  onConfirm,
  defaultAddress,
}) => {
  const [address, setAddress] = useState(currentDestination || '');
  const [error, setError] = useState<string | null>(null);

  const handleConfirm = () => {
    if (!address.trim()) {
      // Clear custom destination, use default
      onConfirm(null);
      onClose();
      return;
    }

    if (!isValidPublicKey(address.trim())) {
      setError('Invalid Solana address');
      return;
    }

    onConfirm(address.trim());
    onClose();
  };

  const handleClear = () => {
    setAddress('');
    setError(null);
    onConfirm(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />
      
      {/* Modal */}
      <div className="relative bg-degen-darker border border-degen-border rounded-2xl w-full max-w-md mx-4 p-6">
        {/* Header */}
        <div className="flex items-start justify-between mb-6">
          <div>
            <h2 className="text-xl font-bold font-display text-white">
              Custom Destination
            </h2>
            <p className="text-gray-400 text-sm font-mono mt-1">
              Send refunded SOL to a different wallet
            </p>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition-colors text-2xl"
          >
            ×
          </button>
        </div>

        {/* Current destination indicator */}
        {currentDestination && (
          <div className="mb-4 p-3 bg-degen-purple/20 border border-degen-purple/30 rounded-lg">
            <p className="text-xs text-gray-400 font-mono mb-1">Currently sending to:</p>
            <p className="text-sm text-degen-purple font-mono truncate">{currentDestination}</p>
          </div>
        )}

        {/* Input */}
        <div className="mb-4">
          <label className="block text-gray-400 text-sm font-mono mb-2">
            Destination Wallet Address
          </label>
          <input
            type="text"
            value={address}
            onChange={(e) => {
              setAddress(e.target.value);
              setError(null);
            }}
            placeholder="Enter wallet address..."
            className="w-full bg-degen-card border border-degen-border rounded-lg px-4 py-3 font-mono text-white placeholder-gray-600 focus:outline-none focus:border-degen-purple transition-colors"
          />
          {error && (
            <p className="text-red-400 text-xs font-mono mt-2">{error}</p>
          )}
        </div>

        {/* Info */}
        <div className="mb-6 p-3 bg-degen-card border border-degen-border rounded-lg">
          <p className="text-gray-400 text-xs font-mono">
            This option allows you to send the refunded SOL directly to your other wallet.
          </p>
        </div>

        {/* Default address info */}
        <div className="mb-6 text-center">
          <p className="text-gray-500 text-xs font-mono">
            Default: {defaultAddress.slice(0, 8)}...{defaultAddress.slice(-8)}
          </p>
        </div>

        {/* Buttons */}
        <div className="flex gap-3">
          {currentDestination && (
            <button
              onClick={handleClear}
              className="flex-1 py-3 bg-red-500/20 text-red-400 font-bold rounded-lg font-mono hover:bg-red-500/30 transition-colors"
            >
              Use Default
            </button>
          )}
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-degen-card border border-degen-border rounded-lg font-mono text-white hover:bg-degen-border/50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleConfirm}
            className="flex-1 py-3 bg-degen-purple text-white font-bold rounded-lg font-mono hover:opacity-90 transition-all"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default CustomDestinationModal;

