// src/components/container/RotationSenior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { SeniorRotation } from './SeniorRotation';

// Urutan tabs untuk container senior (Nakhoda, KKM, Mualim I, Masinis II)
const CONTAINER_SENIOR_ORDER = ['nakhoda', 'KKM', 'mualimI', 'masinisII'];

export function RotationSenior() {
  return (
    <RotationTabsPage
      type="senior"
      categorization="container"
      roles={CONTAINER_SENIOR_ORDER}
      ariaLabel="Crew rotation tabs"
      loadingText="Loading senior rotations..."
      renderContent={vessel => (
        <div>
          <SeniorRotation
            categorization={vessel.categorization}
            vessel={vessel.vessel}
            type={vessel.type}
            part={vessel.part}
            job={vessel.job_title}
            groups={vessel.groups}
          />
        </div>
      )}
    />
  );
}
