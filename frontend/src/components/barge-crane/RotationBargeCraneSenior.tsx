// src/components/barge-crane/RotationBargeCraneSenior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { BargeCraneSeniorRotation } from './BargeCraneSeniorRotation';

// Urutan tabs untuk barge crane senior (Nakhoda, KKM, Mualim I, Masinis II)
const BARGE_CRANE_SENIOR_ORDER = ['nakhoda', 'KKM', 'mualimI', 'masinisII'];

export function RotationBargeCraneSenior() {
  return (
    <RotationTabsPage
      type="senior"
      categorization="bc"
      roles={BARGE_CRANE_SENIOR_ORDER}
      ariaLabel="BC, TB, TK, Service rotation tabs"
      loadingText="Loading BC, TB, TK, Service rotations..."
      containerClassName="flex flex-col gap-3 mb-0"
      renderContent={vessel => (
        <BargeCraneSeniorRotation
          vessel={vessel.vessel}
          type={vessel.type}
          part={vessel.part}
          job={vessel.job_title}
          groups={vessel.groups}
          categorization={vessel.categorization}
        />
      )}
    />
  );
}
