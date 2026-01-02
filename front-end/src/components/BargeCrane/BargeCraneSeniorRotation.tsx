'use client';

import { CardComponent } from '../CardComponent';

interface BargeCraneProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

export function BargeCraneSeniorRotation({
  groups,
  vessel,
  type,
  part,
  job,
}: BargeCraneProps) {
  const getJobDisplayName = (job: string): string => {
    switch (job) {
      case 'nakhoda':
        return 'NAHKODA';
      case 'KKM':
        return 'KKM';
      case 'mualimI':
        return 'MUALIM I';
      case 'masinisII':
        return 'MASINIS II';
      default:
        return job.toUpperCase();
    }
  };

  return (
    <div className="px-6">
      <div className="text-3xl mb-3 font-bold">
        {getJobDisplayName(job)} - Barge Crane Rotation
      </div>

      {/* Card for group display */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => (
          <CardComponent
            key={groupKey}
            groupName={`Group ${groupKey.replace('bc_rotation', '')}`}
            listShip={ships}
            isActive={false}
            onClick={() => {}}
          />
        ))}
      </div>
    </div>
  );
}
