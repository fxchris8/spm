interface CardProps {
  groupName: string;
  listShip: string[];
  isActive: boolean;
  onClick: () => void;
}

export function CardComponent({
  groupName,
  listShip = [],
  isActive,
  onClick,
}: CardProps) {
  const shipCount = listShip?.length || 0;

  return (
    <div
      onClick={onClick}
      className={`
        h-full cursor-pointer transition-all duration-200 rounded-xl p-4 sm:p-5
        ${
          isActive
            ? 'bg-red-50 border-2 border-red-600 shadow-md'
            : 'bg-white border border-gray-200 shadow-sm hover:border-red-300'
        }
      `}
    >
      <div className="flex flex-col h-full">
        <div className="flex items-center justify-between gap-2 mb-3">
          <h5
            className={`
            text-base sm:text-lg font-semibold
            ${isActive ? 'text-red-700' : 'text-gray-900'}
          `}
          >
            {groupName}
          </h5>
          <span className="text-xs font-medium text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full whitespace-nowrap">
            {shipCount} kapal
          </span>
        </div>

        {/* ✅ Render sebagai list */}
        <div className="text-sm text-gray-600">
          {(listShip || []).map((ship, index) => (
            <div key={index} className="leading-relaxed">
              {ship}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
