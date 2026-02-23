'use client';

import { Tabs, TabsRef } from 'flowbite-react';
import { useRef, useState } from 'react';
import { SearchComponent } from '../SearchComponent';

const tabs = [
  { title: 'Container Deck', type: 'container', part: 'deck' },
  { title: 'Container Engine', type: 'container', part: 'engine' },
  { title: 'Manalagi Deck', type: 'manalagi', part: 'deck' },
  { title: 'Manalagi Engine', type: 'manalagi', part: 'engine' },
  { title: 'BC', type: 'bc', part: '' },
  { title: 'MT', type: 'mt', part: '' },
  { title: 'TB', type: 'tb', part: '' },
  { title: 'TK', type: 'tk', part: '' },
];

export function SearchOnDuty() {
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        aria-label="Default tabs"
        variant="default"
        ref={tabsRef}
        onActiveTabChange={tab => setActiveTab(tab)}
      >
        {tabs.map((tab, idx) => (
          <Tabs.Item key={tab.title} active={idx === 0} title={tab.title}>
            {/* Hanya render SearchComponent saat tab aktif (lazy render) */}
            {activeTab === idx && (
              <SearchComponent type={tab.type} part={tab.part} />
            )}
          </Tabs.Item>
        ))}
      </Tabs>
    </div>
  );
}
