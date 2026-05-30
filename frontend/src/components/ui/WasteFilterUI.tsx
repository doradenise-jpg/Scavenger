import React, { useState } from 'react';
import { Filter, X } from 'lucide-react';
import { cn } from '@/lib/cn';
import { WasteFilter, FilterPreset } from '@/lib/wasteFilterManager';

interface WasteFilterUIProps {
  filters: WasteFilter;
  onFilterChange: (filters: Partial<WasteFilter>) => void;
  onClear: () => void;
  presets: FilterPreset[];
  onApplyPreset: (presetId: string) => void;
  onSavePreset: (name: string) => void;
  isActive: boolean;
}

export const WasteFilterUI: React.FC<WasteFilterUIProps> = ({
  filters,
  onFilterChange,
  onClear,
  presets,
  onApplyPreset,
  onSavePreset,
  isActive,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [presetName, setPresetName] = useState('');

  const wasteTypes = ['Plastic', 'Metal', 'Paper', 'Glass', 'Organic'];
  const statuses = ['Pending', 'Verified', 'Transferred', 'Processed'];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={cn(
            'flex items-center gap-2 px-3 py-2 rounded-lg border transition-colors',
            isActive
              ? 'bg-blue-50 border-blue-300 text-blue-700'
              : 'bg-white border-gray-300 text-gray-700 hover:border-gray-400'
          )}
        >
          <Filter className="w-4 h-4" />
          <span>Filters</span>
          {isActive && (
            <span className="ml-1 px-2 py-0.5 bg-blue-200 rounded-full text-xs font-medium">
              Active
            </span>
          )}
        </button>
        {isActive && (
          <button
            onClick={onClear}
            className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
            title="Clear filters"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {isOpen && (
        <div className="border border-gray-200 rounded-lg p-4 space-y-4 bg-gray-50">
          {/* Waste Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Waste Type
            </label>
            <div className="flex flex-wrap gap-2">
              {wasteTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => {
                    const current = filters.wasteType || [];
                    const updated = current.includes(type)
                      ? current.filter((t) => t !== type)
                      : [...current, type];
                    onFilterChange({ wasteType: updated });
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    filters.wasteType?.includes(type)
                      ? 'bg-blue-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status
            </label>
            <div className="flex flex-wrap gap-2">
              {statuses.map((status) => (
                <button
                  key={status}
                  onClick={() => {
                    const current = filters.status || [];
                    const updated = current.includes(status)
                      ? current.filter((s) => s !== status)
                      : [...current, status];
                    onFilterChange({ status: updated });
                  }}
                  className={cn(
                    'px-3 py-1 rounded-full text-sm transition-colors',
                    filters.status?.includes(status)
                      ? 'bg-green-500 text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:border-gray-400'
                  )}
                >
                  {status}
                </button>
              ))}
            </div>
          </div>

          {/* Weight Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Weight Range (kg)
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                placeholder="Min"
                value={filters.weight?.min || ''}
                onChange={(e) =>
                  onFilterChange({
                    weight: {
                      min: parseFloat(e.target.value) || 0,
                      max: filters.weight?.max || Infinity,
                    },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
              <input
                type="number"
                placeholder="Max"
                value={filters.weight?.max === Infinity ? '' : filters.weight?.max || ''}
                onChange={(e) =>
                  onFilterChange({
                    weight: {
                      min: filters.weight?.min || 0,
                      max: parseFloat(e.target.value) || Infinity,
                    },
                  })
                }
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
              />
            </div>
          </div>

          {/* Verification Status Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Verification Status
            </label>
            <select
              value={filters.verificationStatus || 'all'}
              onChange={(e) =>
                onFilterChange({
                  verificationStatus: e.target.value as any,
                })
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All</option>
              <option value="verified">Verified</option>
              <option value="unverified">Unverified</option>
            </select>
          </div>

          {/* Save Preset */}
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="Preset name"
              value={presetName}
              onChange={(e) => setPresetName(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm"
            />
            <button
              onClick={() => {
                if (presetName.trim()) {
                  onSavePreset(presetName);
                  setPresetName('');
                }
              }}
              className="px-3 py-2 bg-blue-500 text-white rounded-lg text-sm hover:bg-blue-600 transition-colors"
            >
              Save
            </button>
          </div>
        </div>
      )}

      {/* Presets */}
      {presets.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium text-gray-700">Quick Presets</p>
          <div className="flex flex-wrap gap-2">
            {presets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => onApplyPreset(preset.id)}
                className="px-3 py-1 bg-gray-200 text-gray-700 rounded-full text-sm hover:bg-gray-300 transition-colors"
              >
                {preset.name}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default WasteFilterUI;
