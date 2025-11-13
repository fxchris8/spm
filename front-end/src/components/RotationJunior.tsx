// src/components/RotationSchedule.tsx
'use client';

import { Tabs } from 'flowbite-react';
import { HiUserCircle } from 'react-icons/hi';
import { JuniorRotation } from './JuniorRotation';
import { useRotationConfigs } from '../hooks/useRotationConfigs';

export function RotationJunior() {
  const { configs, loading, error } = useRotationConfigs('junior');

  // Urutan tabs untuk schedule
  const scheduleOrder = ['mualimII', 'mualimIII', 'masinisIII', 'masinisIV'];

  const sortedConfigs = [...configs].sort((a, b) => {
    const indexA = scheduleOrder.indexOf(a.job_title);
    const indexB = scheduleOrder.indexOf(b.job_title);

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
          <p className="mt-4 text-gray-600">Loading junior rotations...</p>
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
        <p className="text-gray-600">Tidak ada konfigurasi rotasi schedule</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs aria-label="Crew rotation tabs" variant="underline">
        {sortedConfigs.map((config, index) => (
          <Tabs.Item
            key={config.id}
            active={index === 0}
            title={formatJobTitle(config.job_title)}
            icon={HiUserCircle}
          >
            <JuniorRotation
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

// Helper function untuk format job title
function formatJobTitle(jobTitle: string): string {
  // Convert camelCase to Title Case
  // mualimII -> Mualim II
  // masinisIII -> Masinis III
  return jobTitle
    .replace(/([A-Z]+)/g, ' $1')
    .replace(/([A-Z][a-z])/g, ' $1')
    .trim()
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}
