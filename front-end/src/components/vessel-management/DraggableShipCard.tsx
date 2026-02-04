import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { HiTrash } from 'react-icons/hi';
import { Button } from 'flowbite-react';

interface DraggableShipCardProps {
  shipName: string;
  groupKey: string;
  index: number;
  onDelete: () => void;
  isEditMode: boolean;
}

export function DraggableShipCard({
  shipName,
  groupKey,
  index,
  onDelete,
  isEditMode,
}: DraggableShipCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: `${groupKey}-${index}`,
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
      className={`flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200 ${
        isEditMode ? 'cursor-move hover:bg-gray-100' : ''
      } ${isDragging ? 'shadow-lg ring-2 ring-blue-400' : ''}`}
    >
      <span className="text-sm font-medium text-gray-900">{shipName}</span>
      {isEditMode && (
        <Button
          size="xs"
          color="failure"
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
        >
          <HiTrash />
        </Button>
      )}
    </div>
  );
}
