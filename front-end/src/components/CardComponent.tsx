import { Card } from 'flowbite-react';

interface CardProps {
  groupName: string;
  listShip: string;
  isActive: boolean;
  onClick: () => void;
}

export function CardComponent({
  groupName,
  listShip,
  isActive,
  onClick,
}: CardProps) {
  return (
    <Card
      onClick={onClick}
      className={`
        h-full cursor-pointer transition-all duration-200
        ${
          isActive
            ? 'bg-red-50 border-2 border-red-600 shadow-md'
            : 'bg-white border border-gray-200 shadow-sm hover:border-red-300'
        }
      `}
    >
      <div className="flex flex-col h-full">
        <h5
          className={`
          text-lg font-semibold mb-3
          ${isActive ? 'text-red-700' : 'text-gray-900'}
        `}
        >
          {groupName}
        </h5>
        <p className="text-sm text-gray-600">{listShip}</p>
      </div>
    </Card>
  );
}
