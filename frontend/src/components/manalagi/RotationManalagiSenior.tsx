// src/components/manalagi/RotationManalagiSenior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { ManalagiSeniorRotation } from './ManalagiSeniorRotation';
import { useRoleSettings } from '../../hooks/useRoleSettings';

export function RotationManalagiSenior() {
  const { getSeniorRoles, error: rolesError, refetch: onRetryRoles } = useRoleSettings();
  const seniorRoles = getSeniorRoles('manalagi');

  return (
    <RotationTabsPage
      type="senior"
      categorization="manalagi"
      roles={seniorRoles}
      rolesError={rolesError}
      onRetryRoles={onRetryRoles}
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
