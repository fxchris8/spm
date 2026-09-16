// src/components/barge-crane/RotationBargeCraneJunior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { JuniorRotation } from '../container/JuniorRotation';
import { useRoleSettings } from '../../hooks/useRoleSettings';

export function RotationBargeCraneJunior() {
  const { getJuniorRoles, error: rolesError, refetch: onRetryRoles } = useRoleSettings();
  const juniorRoles = getJuniorRoles('bc');

  return (
    <RotationTabsPage
      type="junior"
      categorization="bc"
      roles={juniorRoles}
      rolesError={rolesError}
      onRetryRoles={onRetryRoles}
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
