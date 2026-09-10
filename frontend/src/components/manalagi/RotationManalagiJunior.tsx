// src/components/manalagi/RotationManalagiJunior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { JuniorRotation } from '../container/JuniorRotation';

// Urutan tabs untuk schedule Manalagi Junior (4 posisi lengkap)
const MANALAGI_JUNIOR_ORDER = ['mualimII', 'mualimIII', 'masinisIII', 'masinisIV'];

export function RotationManalagiJunior() {
  return (
    <RotationTabsPage
      type="junior"
      categorization="manalagi"
      roles={MANALAGI_JUNIOR_ORDER}
      ariaLabel="Manalagi junior rotation tabs"
      loadingText="Loading Manalagi junior rotations..."
      renderContent={vessel => (
        <JuniorRotation
          vessel={vessel.vessel}
          type={vessel.type}
          part={vessel.part}
          job={vessel.job_title}
          groups={vessel.groups}
          categorization="manalagi"
        />
      )}
    />
  );
}
