'use client';

import { Tabs, TabsRef } from 'flowbite-react';
import { useRef, useState } from 'react';
import { HiUserCircle } from 'react-icons/hi';
import { ContainerRotation } from './ContainerRotation';

export function RotationSchedule() {
  const tabsRef = useRef<TabsRef>(null);
  const [, setActiveTab] = useState(0);

  return (
    <div>
      <Tabs
        aria-label="Crew rotation tabs"
        variant="underline"
        ref={tabsRef}
        onActiveTabChange={tab => setActiveTab(tab)}
      >
        {/* ================== MUALIM II ================== */}
        <Tabs.Item active title="Mualim II" icon={HiUserCircle}>
          <ContainerRotation
            vessel="D"
            type="container"
            part="deck"
            job="mualimII"
            groups={{
              container_rotation1: [
                'KM. ORIENTAL EMERALD',
                'KM. ORIENTAL RUBY',
                'KM. ORIENTAL SILVER',
                'KM. ORIENTAL GOLD',
                'KM. ORIENTAL JADE',
                'KM. ORIENTAL DIAMOND',
                'KM. LUZON',
                'KM. VERIZON',
                'KM. ORIENTAL GALAXY',
                'KM. HIJAU SAMUDRA',
                'KM. ARMADA PERMATA',
              ],
              container_rotation2: [
                'KM. ORIENTAL SAMUDERA',
                'KM. ORIENTAL PACIFIC',
                'KM. PULAU NUNUKAN',
                'KM. TELUK FLAMINGGO',
                'KM. TELUK BERAU',
                'KM. TELUK BINTUNI',
                'KM. PULAU LAYANG',
                'KM. PULAU WETAR',
                'KM. PULAU HOKI',
                'KM. SPIL HANA',
                'KM. SPIL HASYA',
                'KM. SPIL HAPSRI',
                'KM. SPIL HAYU',
              ],
              container_rotation3: [
                'KM. HIJAU JELITA',
                'KM. HIJAU SEJUK',
                'KM. ARMADA SEJATI',
                'KM. ARMADA SERASI',
                'KM. ARMADA SEGARA',
                'KM. ARMADA SENADA',
                'KM. HIJAU SEGAR',
                'KM. TITANIUM',
                'KM. VERTIKAL',
                'KM. SPIL RENATA',
                'KM. SPIL RATNA',
                'KM. SPIL RUMI',
                'KM. PEKAN BERAU',
                'KM SPIL RAHAYU',
                'KM. SPIL RETNO',
                'KM. MINAS BARU',
                'KM PEKAN SAMPIT',
                'KM. SELILI BARU',
              ],
              container_rotation4: [
                'KM. DERAJAT',
                'KM. MULIANIM',
                'KM. PRATIWI RAYA',
                'KM. MAGELLAN',
                'KM. PAHALA',
                'KM. PEKAN RIAU',
                'KM. PEKAN FAJAR',
                'KM. FORTUNE',
                'KM. PRATIWI SATU',
                'KM. BALI SANUR',
                'KM. BALI KUTA',
                'KM. BALI GIANYAR',
                'KM. BALI AYU',
                'KM. AKASHIA',
                'KM KAPPA',
              ],
            }}
          />
        </Tabs.Item>

        {/* ================== MUALIM III ================== */}
        <Tabs.Item title="Mualim III" icon={HiUserCircle}>
          <ContainerRotation
            vessel="D"
            type="container"
            part="deck"
            job="mualimIII"
            groups={{
              container_rotation1: [
                'KM. ORIENTAL EMERALD',
                'KM. ORIENTAL RUBY',
                'KM. ORIENTAL SILVER',
                'KM. ORIENTAL GOLD',
                'KM. ORIENTAL JADE',
                'KM. ORIENTAL DIAMOND',
                'KM. LUZON',
                'KM. VERIZON',
                'KM. ORIENTAL GALAXY',
                'KM. HIJAU SAMUDRA',
                'KM. ARMADA PERMATA',
              ],
              container_rotation2: [
                'KM. ORIENTAL SAMUDERA',
                'KM. ORIENTAL PACIFIC',
                'KM. PULAU NUNUKAN',
                'KM. TELUK FLAMINGGO',
                'KM. TELUK BERAU',
                'KM. TELUK BINTUNI',
                'KM. PULAU LAYANG',
                'KM. PULAU WETAR',
                'KM. PULAU HOKI',
                'KM. SPIL HANA',
                'KM. SPIL HASYA',
                'KM. SPIL HAPSRI',
                'KM. SPIL HAYU',
              ],
              container_rotation3: [
                'KM. HIJAU JELITA',
                'KM. HIJAU SEJUK',
                'KM. ARMADA SEJATI',
                'KM. ARMADA SERASI',
                'KM. ARMADA SEGARA',
                'KM. ARMADA SENADA',
                'KM. HIJAU SEGAR',
                'KM. TITANIUM',
                'KM. VERTIKAL',
                'KM. SPIL RENATA',
                'KM. SPIL RATNA',
                'KM. SPIL RUMI',
                'KM. PEKAN BERAU',
                'KM SPIL RAHAYU',
                'KM. SPIL RETNO',
                'KM. MINAS BARU',
                'KM PEKAN SAMPIT',
                'KM. SELILI BARU',
              ],
              container_rotation4: [
                'KM. DERAJAT',
                'KM. MULIANIM',
                'KM. PRATIWI RAYA',
                'KM. MAGELLAN',
                'KM. PAHALA',
                'KM. PEKAN RIAU',
                'KM. PEKAN FAJAR',
                'KM. FORTUNE',
                'KM. PRATIWI SATU',
                'KM. BALI SANUR',
                'KM. BALI KUTA',
                'KM. BALI GIANYAR',
                'KM. BALI AYU',
                'KM. AKASHIA',
                'KM KAPPA',
              ],
            }}
          />
        </Tabs.Item>

        {/* ================== MASINIS III ================== */}
        <Tabs.Item title="Masinis III" icon={HiUserCircle}>
          <ContainerRotation
            vessel="E"
            type="container"
            part="engine"
            job="masinisIII"
            groups={{
              container_rotation1: [
                'KM. ORIENTAL GOLD',
                'KM. ORIENTAL EMERALD',
                'KM. ORIENTAL GALAXY',
                'KM. ORIENTAL RUBY',
                'KM. ORIENTAL SILVER',
                'KM. ORIENTAL JADE',
                'KM. VERIZON',
                'KM. LUZON',
                'KM. ORIENTAL DIAMOND',
              ],
              container_rotation2: [
                'KM. SPIL HAPSRI',
                'KM. ARMADA PERMATA',
                'KM. HIJAU SAMUDRA',
                'KM. SPIL HASYA',
                'KM. ARMADA SEJATI',
                'KM. SPIL HAYU',
                'KM. SPIL HANA',
                'KM. HIJAU SEJUK',
                'KM. HIJAU JELITA',
                'KM. ORIENTAL PACIFIC',
                'KM. ORIENTAL SAMUDERA',
                'KM. ARMADA SEGARA',
                'KM. ARMADA SENADA',
                'KM. ARMADA SERASI',
                'KM. SPIL RATNA',
                'KM. SPIL RUMI',
                'KM. PULAU NUNUKAN',
              ],
              container_rotation3: [
                'KM. PULAU HOKI',
                'KM. TELUK BINTUNI',
                'KM. TELUK FLAMINGGO',
                'KM. PULAU LAYANG',
                'KM. TELUK BERAU',
                'KM. SPIL RENATA',
                'KM. PULAU WETAR',
                'KM SPIL RAHAYU',
                'KM. SPIL RETNO',
                'KM. MINAS BARU',
                'KM. SELILI BARU',
                'KM. VERTIKAL',
                'KM. HIJAU SEGAR',
                'KM. PEKAN RIAU',
                'KM. PEKAN BERAU',
                'KM. PEKAN FAJAR',
                'KM. PEKAN SAMPIT',
                'KM. TITANIUM',
              ],
              container_rotation4: [
                'KM. PRATIWI RAYA',
                'KM. PRATIWI SATU',
                'KM. BALI AYU',
                'KM. BALI GIANYAR',
                'KM. BALI SANUR',
                'KM. BALI KUTA',
                'KM. MAGELLAN',
                'KM. MULIANIM',
                'KM. PAHALA',
                'KM. FORTUNE',
                'KM. AKASHIA',
                'KM. DERAJAT',
              ],
            }}
          />
        </Tabs.Item>

        {/* ================== MASINIS IV ================== */}
        <Tabs.Item title="Masinis IV" icon={HiUserCircle}>
          <ContainerRotation
            vessel="E"
            type="container"
            part="engine"
            job="masinisIV"
            groups={{
              container_rotation1: [
                'KM. ORIENTAL GOLD',
                'KM. ORIENTAL EMERALD',
                'KM. ORIENTAL GALAXY',
                'KM. ORIENTAL RUBY',
                'KM. ORIENTAL SILVER',
                'KM. ORIENTAL JADE',
                'KM. VERIZON',
                'KM. LUZON',
                'KM. ORIENTAL DIAMOND',
              ],
              container_rotation2: [
                'KM. SPIL HAPSRI',
                'KM. ARMADA PERMATA',
                'KM. HIJAU SAMUDRA',
                'KM. SPIL HASYA',
                'KM. ARMADA SEJATI',
                'KM. SPIL HAYU',
                'KM. SPIL HANA',
                'KM. HIJAU SEJUK',
                'KM. HIJAU JELITA',
                'KM. ORIENTAL PACIFIC',
                'KM. ORIENTAL SAMUDERA',
                'KM. ARMADA SEGARA',
                'KM. ARMADA SENADA',
                'KM. ARMADA SERASI',
                'KM. SPIL RATNA',
                'KM. SPIL RUMI',
                'KM. PULAU NUNUKAN',
              ],
              container_rotation3: [
                'KM. PULAU HOKI',
                'KM. TELUK BINTUNI',
                'KM. TELUK FLAMINGGO',
                'KM. PULAU LAYANG',
                'KM. TELUK BERAU',
                'KM. SPIL RENATA',
                'KM. PULAU WETAR',
                'KM SPIL RAHAYU',
                'KM. SPIL RETNO',
                'KM. MINAS BARU',
                'KM. SELILI BARU',
                'KM. VERTIKAL',
                'KM. HIJAU SEGAR',
                'KM. PEKAN RIAU',
                'KM. PEKAN BERAU',
                'KM. PEKAN FAJAR',
                'KM. PEKAN SAMPIT',
                'KM. TITANIUM',
              ],
              container_rotation4: [
                'KM. PRATIWI RAYA',
                'KM. PRATIWI SATU',
                'KM. BALI AYU',
                'KM. BALI GIANYAR',
                'KM. BALI SANUR',
                'KM. BALI KUTA',
                'KM. MAGELLAN',
                'KM. MULIANIM',
                'KM. PAHALA',
                'KM. FORTUNE',
                'KM. AKASHIA',
                'KM. DERAJAT',
              ],
            }}
          />
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
