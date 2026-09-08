// src/components/manalagi/RotationManalagiSenior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { ManalagiSeniorRotation } from './ManalagiSeniorRotation';

// Urutan tabs untuk manalagi senior (Nakhoda, KKM, Mualim I, Masinis II)
const MANALAGI_SENIOR_ORDER = ['nakhoda', 'KKM', 'mualimI', 'masinisII'];

export function RotationManalagiSenior() {
  return (
    <RotationTabsPage
      type="senior"
      categorization="manalagi"
      roles={MANALAGI_SENIOR_ORDER}
      ariaLabel="Manalagi senior rotation tabs"
      loadingText="Loading manalagi rotations..."
      renderContent={vessel => (
        <ManalagiSeniorRotation
          categorization={vessel.categorization}
          vessel={vessel.vessel}
          type={vessel.type}
          part={vessel.part}
          job={vessel.job_title}
          groups={vessel.groups}
        />
      )}
    />
  );
}
