// src/components/RotationTabsPage.tsx
'use client';

import React from 'react';
import { Tabs, Spinner } from 'flowbite-react';
import { HiUserCircle } from 'react-icons/hi';
import { useRotationVessels, RotationVessel } from '../hooks/useRotationVessels';
import { EmptyRotationGroupState } from './EmptyRotationGroupState';
import { formatPositionDisplay } from '../utils/vesselMappingUtils';

export interface RotationTabsPageProps {
  type: 'senior' | 'junior';
  categorization: 'container' | 'manalagi' | 'bc';
  roles: string[];
  ariaLabel: string;
  loadingText?: string;
  containerClassName?: string;
  renderContent: (vessel: RotationVessel) => React.ReactNode;
}

export function RotationTabsPage({
  type,
  categorization,
  roles,
  ariaLabel,
  loadingText,
  containerClassName,
  renderContent,
}: RotationTabsPageProps) {
  const { vessels, loading, error } = useRotationVessels(type, categorization);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="xl" color="failure" />
        <span className="text-gray-600">
          {loadingText || `Loading ${type} rotations...`}
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">Error loading data</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  return (
    <div className={containerClassName}>
      <Tabs aria-label={ariaLabel} variant="underline">
        {roles.map((role, index) => {
          const vessel = vessels.find(
            v => v.job_title === role && Object.keys(v.groups || {}).length > 0
          );

          return (
            <Tabs.Item
              key={role}
              active={index === 0}
              title={formatPositionDisplay(role)}
              icon={HiUserCircle}
            >
              {vessel ? (
                renderContent(vessel)
              ) : (
                <EmptyRotationGroupState
                  categorization={categorization}
                  position={role}
                  type={type}
                />
              )}
            </Tabs.Item>
          );
        })}
      </Tabs>
    </div>
  );
}
