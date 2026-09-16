import { useState, useMemo, useEffect } from 'react';
import { Button, TextInput, Spinner } from 'flowbite-react';
import { HiPlus } from 'react-icons/hi';
import { useShipParticular } from '../../hooks/useShipParticular';
import {
  DndContext,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  closestCorners,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { DraggableShipCard } from './DraggableShipCard';
import { EmptyGroupDropZone } from './EmptyGroupDropZone';
import { UngroupedVesselsPanel } from './UngroupedVesselsPanel';
import {
  formatGroupName,
  generateNextGroupKey,
  renumberGroups,
  mergeRenames,
} from '../../utils/vesselMappingUtils';

interface GroupsEditorProps {
  groups: Record<string, string[]>;
  categorization: string;
  isEditMode: boolean;
  onGroupsChange: (groups: Record<string, string[]>) => void;
  onGroupKeyRenames?: (updater: (prev: Record<string, string>) => Record<string, string>) => void;
}

export function GroupsEditor({
  groups,
  categorization,
  isEditMode,
  onGroupsChange,
  onGroupKeyRenames,
}: GroupsEditorProps) {
  const [newShipInputs, setNewShipInputs] = useState<Record<string, string>>(
    {}
  );
  const [activeShip, setActiveShip] = useState<{
    shipName: string;
    groupKey: string;
  } | null>(null);
  // Autocomplete: filtered suggestions per group
  const [filteredSuggestions, setFilteredSuggestions] = useState<
    Record<string, string[]>
  >({});
  // Toggle Ungrouped panel visibility (default closed in view mode so groups have maximum width)
  const [showUngrouped, setShowUngrouped] = useState(false);

  useEffect(() => {
    if (isEditMode) {
      setShowUngrouped(true);
    }
  }, [isEditMode]);

  // Ambil daftar kapal dari ship_particular
  const { ships, vesselNames, loading: loadingShips } = useShipParticular();

  // Set of ship names already assigned to groups
  const groupedShipNames = useMemo(() => {
    const names = new Set<string>();
    Object.values(groups).forEach(shipList => {
      shipList.forEach(name => {
        if (name) names.add(name);
      });
    });
    return names;
  }, [groups]);

  // Sorted group entries
  const sortedGroupEntries = useMemo(() => {
    return Object.entries(groups).sort(([keyA], [keyB]) => {
      const numA = parseInt(keyA.match(/rotation(\d+)$/)?.[1] || '0', 10);
      const numB = parseInt(keyB.match(/rotation(\d+)$/)?.[1] || '0', 10);
      return numA - numB;
    });
  }, [groups]);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleAddGroup = () => {
    const newGroupKey = generateNextGroupKey(groups, categorization);
    onGroupsChange({
      ...groups,
      [newGroupKey]: [],
    });
  };

  const handleRemoveGroup = (groupKey: string) => {
    const newGroups = { ...groups };
    delete newGroups[groupKey];
    const { renumberedGroups, renames } = renumberGroups(newGroups, categorization);
    onGroupsChange(renumberedGroups);
    if (Object.keys(renames).length > 0) {
      onGroupKeyRenames?.(prev => mergeRenames(prev, renames));
    }
  };

  const handleAddShip = (groupKey: string) => {
    const shipName = newShipInputs[groupKey]?.trim();
    if (!shipName) return;

    const newGroups = { ...groups };
    newGroups[groupKey] = [...(newGroups[groupKey] || []), shipName];
    onGroupsChange(newGroups);

    // Clear input & suggestions
    setNewShipInputs(prev => ({ ...prev, [groupKey]: '' }));
    setFilteredSuggestions(prev => ({ ...prev, [groupKey]: [] }));
  };

  const handleShipInputChange = (groupKey: string, value: string) => {
    setNewShipInputs(prev => ({ ...prev, [groupKey]: value }));
    if (!value) {
      setFilteredSuggestions(prev => ({ ...prev, [groupKey]: [] }));
      return;
    }
    const filtered = vesselNames.filter(name =>
      name.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredSuggestions(prev => ({ ...prev, [groupKey]: filtered.slice(0, 10) }));
  };

  const handleSelectSuggestion = (groupKey: string, shipName: string) => {
    const newGroups = { ...groups };
    newGroups[groupKey] = [...(newGroups[groupKey] || []), shipName];
    onGroupsChange(newGroups);
    setNewShipInputs(prev => ({ ...prev, [groupKey]: '' }));
    setFilteredSuggestions(prev => ({ ...prev, [groupKey]: [] }));
  };

  const handleRemoveShip = (groupKey: string, index: number) => {
    const newGroups = { ...groups };
    newGroups[groupKey] = newGroups[groupKey].filter((_, i) => i !== index);
    onGroupsChange(newGroups);
  };

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    const data = active.data.current;
    if (data) {
      setActiveShip({
        shipName: data.shipName,
        groupKey: data.groupKey,
      });
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveShip(null);

    if (!over) return;

    const activeData = active.data.current;
    const overData = over.data.current;

    if (!activeData || !overData) return;

    const sourceGroupKey = activeData.groupKey;
    const sourceIndex = activeData.index;
    const shipName = activeData.shipName;

    const targetGroupKey = overData.groupKey;
    const targetIndex = overData.index;
    const isTargetEmpty = overData.isEmpty === true;

    // Case 1: Dragging within ungrouped -> no-op
    if (sourceGroupKey === '__ungrouped__' && targetGroupKey === '__ungrouped__') {
      return;
    }

    const newGroups = { ...groups };

    // Case 2: Dragging from ungrouped -> into a group
    if (sourceGroupKey === '__ungrouped__' && targetGroupKey !== '__ungrouped__') {
      if (!newGroups[targetGroupKey]) {
        newGroups[targetGroupKey] = [];
      }
      if (!newGroups[targetGroupKey].includes(shipName)) {
        if (isTargetEmpty || targetIndex === undefined) {
          newGroups[targetGroupKey] = [...newGroups[targetGroupKey], shipName];
        } else {
          newGroups[targetGroupKey] = [...newGroups[targetGroupKey]];
          newGroups[targetGroupKey].splice(targetIndex, 0, shipName);
        }
        onGroupsChange(newGroups);
      }
      return;
    }

    // Case 3: Dragging from a group -> back into ungrouped panel
    if (sourceGroupKey !== '__ungrouped__' && targetGroupKey === '__ungrouped__') {
      if (newGroups[sourceGroupKey]) {
        newGroups[sourceGroupKey] = newGroups[sourceGroupKey].filter(
          (_, i) => i !== sourceIndex
        );
        onGroupsChange(newGroups);
      }
      return;
    }

    // Case 4: Dragging from group to group or reordering within a group
    if (sourceGroupKey !== '__ungrouped__' && targetGroupKey !== '__ungrouped__') {
      if (sourceGroupKey === targetGroupKey && sourceIndex === targetIndex) {
        return;
      }

      // Remove from source
      if (newGroups[sourceGroupKey]) {
        newGroups[sourceGroupKey] = newGroups[sourceGroupKey].filter(
          (_, i) => i !== sourceIndex
        );
      }

      // Add to target
      if (!newGroups[targetGroupKey]) {
        newGroups[targetGroupKey] = [];
      }

      if (isTargetEmpty || sourceGroupKey !== targetGroupKey || targetIndex === undefined) {
        newGroups[targetGroupKey] = [...newGroups[targetGroupKey], shipName];
      } else {
        newGroups[targetGroupKey] = [...newGroups[targetGroupKey]];
        newGroups[targetGroupKey].splice(targetIndex, 0, shipName);
      }

      onGroupsChange(newGroups);
    }
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLInputElement>,
    groupKey: string
  ) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddShip(groupKey);
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex justify-between items-center mb-4">
        <button
          type="button"
          onClick={() => setShowUngrouped(!showUngrouped)}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-gray-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-3 py-1.5 rounded-lg transition-colors"
        >
          {showUngrouped
            ? 'Sembunyikan Kapal Ungrouped'
            : 'Tampilkan Kapal Ungrouped'}
        </button>
      </div>

      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Column: Ungrouped Vessels Panel (toggleable) */}
        {showUngrouped && (
          <div className="w-full lg:w-72 xl:w-80 flex-shrink-0">
            <UngroupedVesselsPanel
              ships={ships}
              groupedShipNames={groupedShipNames}
              categorization={categorization}
              isEditMode={isEditMode}
              loading={loadingShips}
            />
          </div>
        )}

        {/* Right Column: Groups Grid */}
        <div className="flex-1 min-w-0 w-full">
          {sortedGroupEntries.length === 0 ? (
            <div className="text-center py-16 bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
              <p className="text-gray-500 mb-4 font-medium">
                Belum ada group untuk konfigurasi kategori dan posisi ini.
              </p>
              {isEditMode && (
                <Button onClick={handleAddGroup}>Buat Group Pertama</Button>
              )}
            </div>
          ) : (
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(280px,1fr))]">
              {sortedGroupEntries.map(([groupKey, shipsInGroup]) => (
                <div
                  key={groupKey}
                  className="relative bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:border-slate-300 transition-colors"
                >
                  {/* Group Header */}
                  <div className="flex justify-between items-center mb-3">
                    <h4 className="font-bold text-gray-900 text-base">
                      {formatGroupName(groupKey)}
                    </h4>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full">
                        {shipsInGroup.length} kapal
                      </span>
                      {isEditMode && (
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() => handleRemoveGroup(groupKey)}
                        >
                          Hapus
                        </Button>
                      )}
                    </div>
                  </div>

                  {/* Add Ship Input (Edit Mode Only) */}
                  {isEditMode && (
                    <div className="flex flex-col gap-2 mb-3">
                      <div className="relative">
                        <div className="flex gap-2">
                          <div className="flex-1 relative">
                            <TextInput
                              value={newShipInputs[groupKey] || ''}
                              onChange={e =>
                                handleShipInputChange(groupKey, e.target.value)
                              }
                              onKeyPress={e => handleKeyPress(e, groupKey)}
                              placeholder={
                                loadingShips
                                  ? 'Loading kapal...'
                                  : 'Cari atau ketik nama kapal...'
                              }
                              sizing="sm"
                              disabled={loadingShips}
                              rightIcon={
                                loadingShips ? () => <Spinner size="xs" /> : undefined
                              }
                            />
                            {/* Autocomplete dropdown */}
                            {(filteredSuggestions[groupKey] ?? []).length > 0 && (
                              <div className="absolute z-20 w-full bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto mt-1">
                                {(filteredSuggestions[groupKey] ?? []).map(
                                  (name, idx) => (
                                    <div
                                      key={idx}
                                      onClick={() =>
                                        handleSelectSuggestion(groupKey, name)
                                      }
                                      className="px-3 py-2 text-sm text-gray-800 hover:bg-blue-50 hover:text-blue-700 cursor-pointer border-b border-gray-100 last:border-0"
                                    >
                                      {name}
                                    </div>
                                  )
                                )}
                              </div>
                            )}
                          </div>
                          <Button size="sm" onClick={() => handleAddShip(groupKey)}>
                            <HiPlus />
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Ships List in Group (Non-scrollable, fully expanded) */}
                  <SortableContext
                    items={shipsInGroup.map(
                      (ship, idx) => `${groupKey}-${ship}-${idx}`
                    )}
                    strategy={verticalListSortingStrategy}
                  >
                    <div className="space-y-1.5">
                      {shipsInGroup.length === 0 ? (
                        <EmptyGroupDropZone groupKey={groupKey} />
                      ) : (
                        shipsInGroup.map((ship, index) => (
                          <DraggableShipCard
                            key={`${groupKey}-${ship}-${index}`}
                            shipName={ship}
                            groupKey={groupKey}
                            index={index}
                            onDelete={() => handleRemoveShip(groupKey, index)}
                            isEditMode={isEditMode}
                          />
                        ))
                      )}
                    </div>
                  </SortableContext>
                </div>
              ))}

              {/* Add Group Card - appears as last item in grid */}
              {isEditMode && (
                <button
                  onClick={handleAddGroup}
                  className="flex flex-col items-center justify-center min-h-[160px] border-2 border-dashed border-gray-300 rounded-xl p-4 hover:border-blue-400 hover:bg-blue-50/50 transition-all cursor-pointer"
                >
                  <HiPlus className="h-7 w-7 text-gray-400 mb-1.5" />
                  <span className="text-gray-600 font-medium text-sm">
                    Tambah Group
                  </span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeShip ? (
          <div className="p-2.5 bg-blue-100 rounded-lg border-2 border-blue-500 shadow-xl opacity-95 flex items-center gap-2">
            <span className="text-sm font-semibold text-blue-900">
              {activeShip.shipName}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}

