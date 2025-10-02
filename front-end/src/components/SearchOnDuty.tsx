"use client";

import { Tabs, TabsRef } from "flowbite-react";
import { useRef, useState } from "react";
import { SearchComponent } from "./SearchComponent";

export function SearchOnDuty() {
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        aria-label="Default tabs"
        variant="default"
        ref={tabsRef}
        onActiveTabChange={(tab) => setActiveTab(tab)}
      >
        <Tabs.Item active title="Container Deck">
          <SearchComponent key="Container-Deck" type="container" part="deck" />
        </Tabs.Item>
        <Tabs.Item title="Container Engine">
          <SearchComponent
            key="Container-Engine"
            type="container"
            part="engine"
          />
        </Tabs.Item>
        <Tabs.Item title="Manalagi Deck">
          <SearchComponent key="Manalagi-Deck" type="manalagi" part="deck" />
        </Tabs.Item>
        <Tabs.Item title="Manalagi Engine">
          <SearchComponent
            key="Manalagi-Engine"
            type="manalagi"
            part="engine"
          />
        </Tabs.Item>
        <Tabs.Item title="BC">
          <SearchComponent key="bc" type="bc" part="" />
        </Tabs.Item>
        <Tabs.Item title="MT">
          <SearchComponent key="mt" type="mt" part="" />
        </Tabs.Item>
        <Tabs.Item title="TB">
          <SearchComponent key="tb" type="tb" part="" />
        </Tabs.Item>
        <Tabs.Item title="TK">
          <SearchComponent key="tk" type="tk" part="" />
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
