'use client';

import { Tabs, TabsRef } from 'flowbite-react';
import { useRef, useState } from 'react';
import { SearchComponent } from '../SearchComponent';
import { SearchOffDutyAll } from './SearchOffDutyAll';

export function SearchOffDuty() {
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
        <Tabs.Item active title="All">
          {activeTab === 0 && <SearchOffDutyAll />}
        </Tabs.Item>
        <Tabs.Item title="Other">
          {activeTab === 1 && (
            <SearchComponent key="Other" type="others" part="" />
          )}
        </Tabs.Item>
      </Tabs>
    </div>
  );
}

