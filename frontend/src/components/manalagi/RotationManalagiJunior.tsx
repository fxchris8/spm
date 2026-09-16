// src/components/manalagi/RotationManalagiJunior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { JuniorRotation } from '../container/JuniorRotation';
import { useRoleSettings } from '../../hooks/useRoleSettings';

export function RotationManalagiJunior() {
  const { getJuniorRoles, error: rolesError, refetch: onRetryRoles } = useRoleSettings();
  const juniorRoles = getJuniorRoles('manalagi');

  return (
    <RotationTabsPage
      type="junior"
      categorization="manalagi"
      roles={juniorRoles}
      rolesError={rolesError}
      onRetryRoles={onRetryRoles}
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
