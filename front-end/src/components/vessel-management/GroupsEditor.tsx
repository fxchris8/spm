import { useState } from 'react';
import { Button, TextInput } from 'flowbite-react';
import { HiPlus } from 'react-icons/hi';
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
import {
  formatGroupName,
  generateNextGroupKey,
} from '../../utils/vesselMappingUtils';

interface GroupsEditorProps {
  groups: Record<string, string[]>;
  categorization: string;
  isEditMode: boolean;
  onGroupsChange: (groups: Record<string, string[]>) => void;
}

export function GroupsEditor({
  groups,
  categorization,
  isEditMode,
  onGroupsChange,
}: GroupsEditorProps) {
  const [newShipInputs, setNewShipInputs] = useState<Record<string, string>>(
    {}
  );
  const [activeShip, setActiveShip] = useState<{
    shipName: string;
    groupKey: string;
  } | null>(null);

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
    onGroupsChange(newGroups);
  };

  const handleAddShip = (groupKey: string) => {
    const shipName = newShipInputs[groupKey]?.trim();
    if (!shipName) return;

    const newGroups = { ...groups };
    newGroups[groupKey] = [...(newGroups[groupKey] || []), shipName];
    onGroupsChange(newGroups);

    // Clear input
    setNewShipInputs(prev => ({ ...prev, [groupKey]: '' }));
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

    // Determine target group key (handle both empty and non-empty drops)
    const targetGroupKey = overData.groupKey;
    const targetIndex = overData.index;
    const isTargetEmpty = overData.isEmpty === true;

    if (sourceGroupKey === targetGroupKey && sourceIndex === targetIndex) {
      return;
    }

    const newGroups = { ...groups };

    // Remove from source
    newGroups[sourceGroupKey] = newGroups[sourceGroupKey].filter(
      (_, i) => i !== sourceIndex
    );

    // Add to target
    if (isTargetEmpty || sourceGroupKey !== targetGroupKey) {
      // Different group or empty group, append to end
      newGroups[targetGroupKey] = [...newGroups[targetGroupKey], shipName];
    } else {
      // Same group, reorder
      newGroups[targetGroupKey].splice(targetIndex, 0, shipName);
    }

    onGroupsChange(newGroups);
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

  if (Object.keys(groups).length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500 mb-4">
          Belum ada konfigurasi untuk kategori dan position ini.
        </p>
        {isEditMode && (
          <Button onClick={handleAddGroup}>
            Buat Group Pertama
          </Button>
        )}
      </div>
    );
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      {/* Groups Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.entries(groups).map(([groupKey, ships]) => (
          <div
            key={groupKey}
            className="relative bg-white border border-gray-200 rounded-lg p-4"
          >
            {/* Group Header */}
            <div className="flex justify-between items-center mb-3">
              <h4 className="font-bold text-gray-900 text-lg">
                {formatGroupName(groupKey)}
              </h4>
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

            {/* Add Ship Input (Edit Mode Only) */}
            {isEditMode && (
              <div className="flex gap-2 mb-3">
                <TextInput
                  value={newShipInputs[groupKey] || ''}
                  onChange={e =>
                    setNewShipInputs(prev => ({
                      ...prev,
                      [groupKey]: e.target.value,
                    }))
                  }
                  onKeyPress={e => handleKeyPress(e, groupKey)}
                  placeholder="Nama Kapal (e.g., KM. ORIENTAL EMERALD)"
                  className="flex-1"
                  sizing="sm"
                />
                <Button size="sm" onClick={() => handleAddShip(groupKey)}>
                  <HiPlus />
                </Button>
              </div>
            )}

            {/* Ships List */}
            <SortableContext
              items={ships.map((_, idx) => `${groupKey}-${idx}`)}
              strategy={verticalListSortingStrategy}
            >
              <div className="space-y-1 max-h-60 overflow-y-auto">
                {ships.length === 0 ? (
                  <EmptyGroupDropZone groupKey={groupKey} />
                ) : (
                  ships.map((ship, index) => (
                    <DraggableShipCard
                      key={`${groupKey}-${index}`}
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
            className="flex flex-col items-center justify-center min-h-[150px] border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-blue-400 hover:bg-blue-50 transition-colors cursor-pointer"
          >
            <HiPlus className="h-8 w-8 text-gray-400 mb-2" />
            <span className="text-gray-500 font-medium">Tambah Group</span>
          </button>
        )}
      </div>

      {/* Drag Overlay */}
      <DragOverlay>
        {activeShip ? (
          <div className="p-2 bg-blue-100 rounded border-2 border-blue-400">
            <span className="text-sm font-medium text-gray-900">
              {activeShip.shipName}
            </span>
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
