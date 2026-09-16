// src/components/container/RotationJunior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { JuniorRotation } from './JuniorRotation';
import { useRoleSettings } from '../../hooks/useRoleSettings';

export function RotationJunior() {
  const { getJuniorRoles, error: rolesError, refetch: onRetryRoles } = useRoleSettings();
  const juniorRoles = getJuniorRoles('container');

  return (
    <RotationTabsPage
      type="junior"
      categorization="container"
      roles={juniorRoles}
      rolesError={rolesError}
      onRetryRoles={onRetryRoles}
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
