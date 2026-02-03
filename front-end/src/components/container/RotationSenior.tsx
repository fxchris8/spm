// src/components/RotationSenior.tsx
'use client';

import { Tabs, Spinner } from 'flowbite-react';
import { HiUserCircle } from 'react-icons/hi';
import { SeniorRotation } from './SeniorRotation';
import { useRotationContainer } from '../../hooks/useRotationContainer';
import { useMemo } from 'react';

export function RotationSenior() {
  const { vessels, loading, error } = useRotationContainer(
    'senior',
    'container'
  );

  // Urutan tabs untuk container
  const containerOrder = ['nakhoda', 'KKM', 'mualimI', 'masinisII'];

  // ✅ Optimized: useMemo untuk sorting
  const sortedVessels = useMemo(() => {
    return [...vessels].sort((a, b) => {
      const indexA = containerOrder.indexOf(a.job_title);
      const indexB = containerOrder.indexOf(b.job_title);

      if (indexA === -1) return 1;
      if (indexB === -1) return -1;

      return indexA - indexB;
    });
  }, [vessels]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="xl" color="failure" />
        <span className="text-gray-600">Loading senior rotations...</span>
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

  if (vessels.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Tidak ada konfigurasi rotasi senior</p>
      </div>
    );
  }

  return (
    <div>
      <Tabs aria-label="Crew rotation tabs" variant="underline">
        {sortedVessels.map((v, index) => (
          <Tabs.Item
            key={v.id}
            active={index === 0}
            title={v.job_title === 'KKM' ? 'KKM' : formatJobTitle(v.job_title)}
            icon={HiUserCircle}
          >
            {/* ✅ Lazy Loading: Component hanya render saat tab aktif */}
            <div>
              <SeniorRotation
                categorization={v.categorization}
                vessel={v.vessel}
                type={v.type}
                part={v.part}
                job={v.job_title}
                groups={v.groups}
              />
            </div>
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
