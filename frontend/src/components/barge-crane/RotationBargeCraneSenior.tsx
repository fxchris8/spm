// src/components/barge-crane/RotationBargeCraneSenior.tsx
'use client';

import { RotationTabsPage } from '../RotationTabsPage';
import { BargeCraneSeniorRotation } from './BargeCraneSeniorRotation';
import { useRoleSettings } from '../../hooks/useRoleSettings';

export function RotationBargeCraneSenior() {
  const { getSeniorRoles, error: rolesError, refetch: onRetryRoles } = useRoleSettings();
  const seniorRoles = getSeniorRoles('bc');

  return (
    <RotationTabsPage
      type="senior"
      categorization="bc"
      roles={seniorRoles}
      rolesError={rolesError}
      onRetryRoles={onRetryRoles}
      ariaLabel="BC, TB, TK, Service rotation tabs"
      loadingText="Loading BC, TB, TK, Service rotations..."
      containerClassName="flex flex-col gap-3 mb-0"
      renderContent={vessel => (
        <BargeCraneSeniorRotation
          vessel={vessel.vessel}
          type={vessel.type}
          part={vessel.part}
          job={vessel.job_title}
          groups={vessel.groups}
          categorization={vessel.categorization}
        />
      )}
    />
  );
}
