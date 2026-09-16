// src/components/container/RotationSenior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { SeniorRotation } from './SeniorRotation';
import { useRoleSettings } from '../../hooks/useRoleSettings';

export function RotationSenior() {
  const { getSeniorRoles, error: rolesError, refetch: onRetryRoles } = useRoleSettings();
  const seniorRoles = getSeniorRoles('container');

  return (
    <RotationTabsPage
      type="senior"
      categorization="container"
      roles={seniorRoles}
      rolesError={rolesError}
      onRetryRoles={onRetryRoles}
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
