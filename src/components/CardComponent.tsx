import { Card } from "flowbite-react";

interface CardProps {
  groupName: string;
  listShip: string;
  isActive: boolean;
  onClick: () => void;
}

export function CardComponent({ groupName, listShip, isActive, onClick }: CardProps) {
  return (
    <Card
      onClick={onClick}
      className={`max-w-sm h-full cursor-pointer transition-transform duration-300 flex flex-col ${
        isActive ? "bg-gray-200 scale-105" : "hover:bg-gray-100"
      }`}
    >
      <h5 className="text-xl font-bold tracking-tight text-red-800 dark:text-white">
        {groupName}
      </h5>
      <p className="text-xs font-normal text-gray-700 dark:text-gray-400 flex-grow">
        {listShip}
      </p>
    </Card>
  );
}
