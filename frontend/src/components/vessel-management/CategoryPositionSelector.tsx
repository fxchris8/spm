import { Label, Select, Tabs } from 'flowbite-react';
import { FaShip } from 'react-icons/fa';
import {
  formatCategorizationDisplay,
  formatPositionDisplay,
  getAllCategorizations,
  getAllPositions,
} from '../../utils/vesselMappingUtils';

interface CategoryPositionSelectorProps {
  selectedCategory: string | null;
  selectedPosition: string | null;
  onCategoryChange: (category: string) => void;
  onPositionChange: (position: string) => void;
  disabled?: boolean;
}

// Categories that only support Nahkoda and KKM positions
const LIMITED_CATEGORIES = ['manalagi', 'bc'];
const ALLOWED_POSITIONS_FOR_LIMITED = ['nakhoda', 'kkm'];

export function CategoryPositionSelector({
  selectedCategory,
  selectedPosition,
  onCategoryChange,
  onPositionChange,
  disabled = false,
}: CategoryPositionSelectorProps) {
  const categorizations = getAllCategorizations();
  const positions = getAllPositions();

  // Check if a position should be disabled based on category
  const isPositionDisabled = (
    category: string | null,
    position: string
  ): boolean => {
    if (!category) return false;
    if (!LIMITED_CATEGORIES.includes(category.toLowerCase())) return false;
    return !ALLOWED_POSITIONS_FOR_LIMITED.includes(position.toLowerCase());
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
      {/* Category Tabs */}
      <Tabs
        aria-label="Vessel category tabs"
        variant="underline"
        onActiveTabChange={tab => {
          const category = categorizations[tab];
          if (category) {
            onCategoryChange(category);
          }
        }}
      >
        {categorizations.map(cat => (
          <Tabs.Item
            key={cat}
            active={selectedCategory === cat}
            title={formatCategorizationDisplay(cat)}
            icon={FaShip}
          >
            {/* Position Selection */}
            <div className="pt-4">
              <Label
                htmlFor="position-select"
                className="mb-2 block font-semibold"
              >
                Pilih Posisi / Job
              </Label>
              <Select
                id="position-select"
                value={selectedPosition || ''}
                onChange={e => onPositionChange(e.target.value)}
                disabled={disabled}
                required
                className="max-w-md"
              >
                <option value="">-- Pilih Posisi --</option>
                {positions.map(pos => (
                  <option
                    key={pos}
                    value={pos}
                    disabled={isPositionDisabled(cat, pos)}
                  >
                    {formatPositionDisplay(pos)}
                    {isPositionDisabled(cat, pos) ? ' (Tidak tersedia)' : ''}
                  </option>
                ))}
              </Select>
            </div>
          </Tabs.Item>
        ))}
      </Tabs>
    </div>
  );
}
