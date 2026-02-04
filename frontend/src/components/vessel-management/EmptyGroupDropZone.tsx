import { useDroppable } from '@dnd-kit/core';

interface EmptyGroupDropZoneProps {
  groupKey: string;
}

export function EmptyGroupDropZone({ groupKey }: EmptyGroupDropZoneProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: `empty-${groupKey}`,
    data: {
      groupKey,
      isEmpty: true,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className={`min-h-[100px] border-2 border-dashed rounded-lg flex items-center justify-center transition-colors ${
        isOver ? 'border-blue-400 bg-blue-50' : 'border-gray-300 bg-gray-50'
      }`}
    >
      <p className="text-sm text-gray-500 italic text-center px-4">
        {isOver ? 'Lepaskan di sini' : 'Drag kapal ke sini atau tambah manual'}
      </p>
    </div>
  );
}
