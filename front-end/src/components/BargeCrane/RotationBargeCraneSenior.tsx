// src/components/BargeCrane/RotationBargeCraneSenior.tsx
'use client';

import { Tabs } from 'flowbite-react';
import { HiUserCircle } from 'react-icons/hi';
import { BargeCraneSeniorRotation } from './BargeCraneSeniorRotation';
import { useRotationConfigs } from '../../hooks/useRotationConfigs';

export function RotationBargeCraneSenior() {
  const { configs, loading, error } = useRotationConfigs('senior', 'bc');

  // Urutan tabs untuk barge crane
  const bargeCraneOrder = ['nakhoda', 'KKM'];

  const sortedConfigs = [...configs].sort((a, b) => {
    const indexA = bargeCraneOrder.indexOf(a.job_title);
    const indexB = bargeCraneOrder.indexOf(b.job_title);

    // Jika tidak ada di urutan, taruh di akhir
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading barge crane rotations...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <div className="text-red-600 mb-2">⚠️ Error loading data</div>
        <p className="text-gray-600">{error}</p>
      </div>
    );
  }

  if (configs.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">
          Tidak ada konfigurasi rotasi barge crane
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 mb-0">
      <Tabs aria-label="Default tabs" variant="default">
        {sortedConfigs.map((config, index) => (
          <Tabs.Item
            key={config.id}
            active={index === 0}
            title={
              config.job_title === 'KKM'
                ? 'KKM'
                : formatJobTitle(config.job_title)
            }
            icon={HiUserCircle}
          >
            <BargeCraneSeniorRotation
              vessel={config.vessel}
              type={config.type}
              part={config.part}
              job={config.job_title}
              groups={config.groups}
            />
          </Tabs.Item>
        ))}
      </Tabs>
    </div>
  );
}

function formatJobTitle(jobTitle: string): string {
  return jobTitle
    .replace(/([A-Z]+)/g, ' $1')
    .replace(/([A-Z][a-z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
