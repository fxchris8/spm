// src/components/container/RotationJunior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { JuniorRotation } from './JuniorRotation';

// Urutan tabs untuk schedule Container Junior (4 posisi lengkap)
const CONTAINER_JUNIOR_ORDER = ['mualimII', 'mualimIII', 'masinisIII', 'masinisIV'];

export function RotationJunior() {
  return (
    <RotationTabsPage
      type="junior"
      categorization="container"
      roles={CONTAINER_JUNIOR_ORDER}
      ariaLabel="Crew rotation tabs"
      loadingText="Loading junior rotations..."
      renderContent={vessel => (
        <JuniorRotation
          vessel={vessel.vessel}
          type={vessel.type}
          part={vessel.part}
          job={vessel.job_title}
          groups={vessel.groups}
          categorization="container"
        />
      )}
    />
  );
}
