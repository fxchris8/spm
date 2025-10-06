"use client";

import { Tabs, TabsRef } from "flowbite-react";
import { useRef, useState } from "react";
import { HiUserCircle } from "react-icons/hi";
import { ContainerRotation } from "./ContainerRotation";

export function RotationKKM() {
  const tabsRef = useRef<TabsRef>(null);
  const [, setActiveTab] = useState(0);

  return (
    <div className="flex flex-col gap-3 mb-0">
      <Tabs
        aria-label="Default tabs"
        variant="default"
        ref={tabsRef}
        onActiveTabChange={(tab) => setActiveTab(tab)}
      >
        <Tabs.Item active title="Nakhoda" icon={HiUserCircle}>
          <ContainerRotation
            vessel="F"
            type="manalagi"
            part="deck"
            job="nakhoda"
            groups={{
              container_rotation1: [
                "KM. MANALAGI PRITA",
                "KM. MANALAGI ASTA",
                "KM. MANALAGI ASTI",
                "KM. MANALAGI DASA",
                "KM. MANALAGI ENZI",
                "KM. MANALAGI TARA",
                "KM. MANALAGI WANDA",
              ],
              container_rotation2: [
                "KM. MANALAGI TISYA",
                "KM. MANALAGI SAMBA",
                "KM. MANALAGI HITA",
                "KM. MANALAGI VIRA",
                "KM. MANALAGI YASA",
                "KM. XYS SATU",
              ],
            }}
          />
        </Tabs.Item>
        <Tabs.Item title="KKM" icon={HiUserCircle}>
          <ContainerRotation
            vessel="G"
            type="manalagi"
            part="engine"
            job="KKM"
            groups={{
              manalagi_kkm1: [
                "KM. MANALAGI ASTA",
                "KM. MANALAGI ASTI",
                "KM. MANALAGI SAMBA",
                "KM. MANALAGI YASA",
                "KM. XYS SATU",
                "KM. MANALAGI WANDA",
              ],
              manalagi_kkm2: [
                "KM. MANALAGI TISYA",
                "KM. MANALAGI PRITA",
                "KM. MANALAGI DASA",
                "KM. MANALAGI HITA",
                "KM. MANALAGI ENZI",
                "KM. MANALAGI TARA",
                "KM. MANALAGI VIRA",
              ],
            }}
          />
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
