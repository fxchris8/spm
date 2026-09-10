// src/components/barge-crane/RotationBargeCraneJunior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { JuniorRotation } from '../container/JuniorRotation';

// Urutan tabs untuk schedule BC Junior (4 posisi lengkap: Mualim II, III & Masinis III, IV)
const BARGE_CRANE_JUNIOR_ORDER = ['mualimII', 'mualimIII', 'masinisIII', 'masinisIV'];

export function RotationBargeCraneJunior() {
  return (
    <RotationTabsPage
      type="junior"
      categorization="bc"
      roles={BARGE_CRANE_JUNIOR_ORDER}
      ariaLabel="BC junior rotation tabs"
      loadingText="Loading BC junior rotations..."
      renderContent={vessel => (
        <JuniorRotation
          vessel={vessel.vessel}
          type={vessel.type}
          part={vessel.part}
          job={vessel.job_title}
          groups={vessel.groups}
          categorization="bc"
        />
      )}
    />
  );
}
