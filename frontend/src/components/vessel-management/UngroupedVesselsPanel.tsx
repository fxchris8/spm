import { useState, useMemo } from 'react';
import { TextInput, Checkbox, Label, Spinner } from 'flowbite-react';
import { HiSearch } from 'react-icons/hi';
import { useDroppable } from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableShipCard } from './DraggableShipCard';
import { ShipParticular } from '../../hooks/useShipParticular';
import { VESSEL_TYPE_IDS_BY_CATEGORY } from '../../utils/vesselMappingUtils';

interface UngroupedVesselsPanelProps {
  ships: ShipParticular[];
  groupedShipNames: Set<string>;
  categorization: string;
  isEditMode: boolean;
  loading?: boolean;
}

export function UngroupedVesselsPanel({
  ships,
  groupedShipNames,
  categorization,
  isEditMode,
  loading = false,
}: UngroupedVesselsPanelProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showAllTypes, setShowAllTypes] = useState(false);

  // Droppable container for dropping ships back to ungrouped
  const { setNodeRef, isOver } = useDroppable({
    id: '__ungrouped__',
    data: {
      groupKey: '__ungrouped__',
      isEmpty: true,
    },
    disabled: !isEditMode,
  });

  // Filter ships that belong to this category and are not yet in any group
  const ungroupedShips = useMemo(() => {
    const allowedTypeIds = VESSEL_TYPE_IDS_BY_CATEGORY[categorization] || [];

    return ships.filter(ship => {
      const name = ship.vesselname;
      if (!name) return false;

      // Must not be already in any group
      if (groupedShipNames.has(name)) {
        return false;
      }

      // Filter by vesseltypeid unless showAllTypes is checked
      if (!showAllTypes && allowedTypeIds.length > 0) {
        if (!allowedTypeIds.includes(ship.vesseltypeid)) {
          return false;
        }
      }

      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.trim().toLowerCase();
        if (!name.toLowerCase().includes(query)) {
          return false;
        }
      }

      return true;
    });
  }, [ships, groupedShipNames, categorization, showAllTypes, searchQuery]);

  return (
    <div
      ref={setNodeRef}
      className={`bg-slate-50 border rounded-xl p-4 flex flex-col h-full transition-colors ${
        isOver && isEditMode
          ? 'border-blue-500 bg-blue-50/50 ring-2 ring-blue-300'
          : 'border-slate-200'
      }`}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-3">
        <div>
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            Kapal Ungrouped
            <span className="text-xs font-semibold text-slate-700 bg-slate-200 px-2 py-0.5 rounded-full">
              {ungroupedShips.length}
            </span>
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {isEditMode
              ? 'Drag kapal ke grup di kanan'
              : 'Daftar kapal belum masuk grup'}
          </p>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-3">
        <TextInput
          icon={HiSearch}
          placeholder="Cari kapal ungrouped..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          sizing="sm"
        />
      </div>

      {/* Show all types toggle */}
      <div className="flex items-center gap-2 mb-3 px-1">
        <Checkbox
          id="show-all-types"
          checked={showAllTypes}
          onChange={e => setShowAllTypes(e.target.checked)}
        />
        <Label
          htmlFor="show-all-types"
          className="text-xs text-gray-600 cursor-pointer font-normal"
        >
          Tampilkan semua jenis kapal
        </Label>
      </div>

      {/* Ships List */}
      <div className="flex-1 overflow-y-auto min-h-[300px] max-h-[550px] pr-1 space-y-1.5">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-2 text-gray-400">
            <Spinner size="md" />
            <span className="text-xs">Memuat daftar kapal...</span>
          </div>
        ) : ungroupedShips.length === 0 ? (
          <div className="text-center py-10 px-4 bg-white/60 border border-dashed border-slate-200 rounded-lg">
            <p className="text-xs text-gray-500">
              {searchQuery
                ? 'Tidak ada kapal yang cocok dengan pencarian'
                : 'Semua kapal sudah dialokasikan ke grup'}
            </p>
          </div>
        ) : (
          <SortableContext
            items={ungroupedShips.map(
              (ship, idx) => `__ungrouped__-${ship.vesselname}-${idx}`
            )}
            strategy={verticalListSortingStrategy}
          >
            {ungroupedShips.map((ship, idx) => (
              <DraggableShipCard
                key={`ungrouped-${ship.vesselname}-${idx}`}
                shipName={ship.vesselname}
                groupKey="__ungrouped__"
                index={idx}
                isEditMode={isEditMode}
              />
            ))}
          </SortableContext>
        )}
      </div>

      {isOver && isEditMode && (
        <div className="mt-2 p-2 bg-blue-100/70 border border-blue-300 rounded text-center text-xs font-medium text-blue-700">
          Lepaskan di sini untuk mengeluarkan kapal dari grup
        </div>
      )}
    </div>
  );
}
