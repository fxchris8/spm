import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiTrash } from 'react-icons/hi';
import { Button } from 'flowbite-react';

interface DraggableShipCardProps {
  shipName: string;
  groupKey: string;
  index: number;
  onDelete?: () => void;
  isEditMode: boolean;
}

export function DraggableShipCard({
  shipName,
  groupKey,
  index,
  onDelete,
  isEditMode,
}: DraggableShipCardProps) {
  const isUngrouped = groupKey === '__ungrouped__';
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${groupKey}-${shipName}-${index}`,
    data: {
      shipName,
      groupKey,
      index,
    },
    disabled: !isEditMode,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`flex justify-between items-center p-2 rounded border transition-all ${
        isUngrouped
          ? 'bg-white border-slate-200 hover:border-blue-400 hover:shadow-sm'
          : 'bg-gray-50 border-gray-200 hover:bg-gray-100'
      } ${isEditMode ? 'cursor-grab active:cursor-grabbing' : ''} ${
        isDragging ? 'shadow-lg ring-2 ring-blue-400 opacity-50 z-50' : ''
      }`}
    >
      <span className="text-sm font-medium text-gray-900 truncate" title={shipName}>
        {shipName}
      </span>
      {isEditMode && !isUngrouped && onDelete && (
        <Button
          size="xs"
          color="failure"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="ml-2 flex-shrink-0"
        >
          <HiTrash />
        </Button>
      )}
    </div>
  );
}
