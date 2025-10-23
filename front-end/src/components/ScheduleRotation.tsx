'use client';

import { Card, Button } from 'flowbite-react';
import { useState } from 'react';
import {
  HiUserRemove,
  HiSwitchHorizontal,
  HiLockClosed,
  HiLockOpen,
} from 'react-icons/hi';
import { CardComponent } from './CardComponent';

interface ScheduleProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

// ================== DUMMY DATA ==================
const dummyCrewToRelieve = [
  {
    seamancode: '20150123',
    name: 'Budi Santoso',
    currentVessel: 'KM. JAYA ABADI',
    position: 'CHIEF OFFICER',
    daysRemaining: 30,
  },
  {
    seamancode: '20180456',
    name: 'Agus Wijaya',
    currentVessel: 'KM. SINAR HARAPAN',
    position: 'MUALIM II',
    daysRemaining: 55,
  },
  {
    seamancode: '20190789',
    name: 'Citra Lestari',
    currentVessel: 'KM. PELITA JAYA',
    position: 'MUALIM III',
    daysRemaining: 70,
  },
  {
    seamancode: '20160211',
    name: 'Dewi Anggraini',
    currentVessel: 'KM. SAMUDRA BIRU',
    position: 'CHIEF OFFICER',
    daysRemaining: 42,
  },
  {
    seamancode: '20170330',
    name: 'Eka Kurniawan',
    currentVessel: 'KM. BINTANG TIMUR',
    position: 'MUALIM II',
    daysRemaining: 85,
  },
];

const dummyReplacementOptions = [
  {
    seamancode: '20190515',
    name: 'Rudi Hartono',
    historyVessel: 'KM. GARUDA JAYA, KM. MITRA SEJATI',
    position: 'CHIEF OFFICER',
    days: 90,
  },
  {
    seamancode: '20170822',
    name: 'Wahyu Pratama',
    historyVessel: 'KM. SINAR HARAPAN, KM. BINTANG TIMUR',
    position: 'MUALIM II',
    days: 110,
  },
  {
    seamancode: '20200130',
    name: 'Nina Maharani',
    historyVessel: 'KM. SAMUDRA BIRU, KM. PELITA JAYA',
    position: 'MUALIM III',
    days: 80,
  },
  {
    seamancode: '20181105',
    name: 'Andi Saputra',
    historyVessel: 'KM. JAYA ABADI',
    position: 'MUALIM II',
    days: 135,
  },
];

export function ScheduleRotation({
  groups,
  vessel,
  type,
  part,
  job,
}: ScheduleProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedReplacement, setSelectedReplacement] = useState<
    Record<string, { seamancode: string; name: string } | null>
  >({});
  const [locked, setLocked] = useState(false);

  const handleCardClick = (groupKey: string) => {
    setSelectedGroup(groupKey);
  };

  const handleReplacementChange = (
    crewCode: string,
    replacementCode: string
  ) => {
    const replacement = dummyReplacementOptions.find(
      r => r.seamancode === replacementCode
    );
    setSelectedReplacement(prev => ({
      ...prev,
      [crewCode]: replacement
        ? { seamancode: replacement.seamancode, name: replacement.name }
        : null,
    }));
  };

  const handleLockToggle = () => {
    setLocked(!locked);
    alert(locked ? '🔓 Data telah dibuka kembali.' : '🔒 Data telah dikunci.');
  };

  return (
    <div className="space-y-4">
      {/* ================== GRID CARD ================== */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => (
          <CardComponent
            key={groupKey}
            groupName={`Group ${groupKey.replace('container_rotation', '')}`}
            listShip={ships.join(', ')}
            isActive={selectedGroup === groupKey}
            onClick={() => handleCardClick(groupKey)}
          />
        ))}
      </div>

      {/* ================== TABLES ================== */}
      {selectedGroup ? (
        <>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
            {/* ================== KRU AKAN TURUN ================== */}
            <Card className="lg:col-span-2">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-red-100 rounded-lg">
                  <HiUserRemove className="h-5 w-5 text-red-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">
                  KRU AKAN TURUN
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500">
                  <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-4 py-3 w-[110px]">Seaman Code</th>
                      <th className="px-4 py-3 w-[160px]">Nama</th>
                      <th className="px-4 py-3 w-[160px]">Vessel</th>
                      <th className="px-4 py-3 w-[120px]">Sisa Hari</th>
                      <th className="px-4 py-3 w-[220px]">Pengganti</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dummyCrewToRelieve.map((crew, index) => {
                      const replacement = selectedReplacement[crew.seamancode];
                      return (
                        <tr key={index} className="border-b hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-900">
                            {crew.seamancode}
                          </td>
                          <td className="px-4 py-3">{crew.name}</td>
                          <td className="px-4 py-3">{crew.currentVessel}</td>
                          <td className="px-4 py-3">
                            <span className="rounded px-2 py-1 text-xs font-semibold text-gray-800">
                              {crew.daysRemaining} hari
                            </span>
                          </td>

                          {/* Kolom PENGGANTI */}
                          <td className="px-4 py-3">
                            {replacement ? (
                              <span className="font-medium text-gray-900">
                                {replacement.seamancode} - {replacement.name}
                              </span>
                            ) : (
                              <select
                                className="rounded border-gray-300 text-sm w-full"
                                defaultValue=""
                                onChange={e =>
                                  handleReplacementChange(
                                    crew.seamancode,
                                    e.target.value
                                  )
                                }
                              >
                                <option value="">Pilih Pengganti</option>
                                {dummyReplacementOptions.map(opt => (
                                  <option
                                    key={opt.seamancode}
                                    value={opt.seamancode}
                                  >
                                    {opt.seamancode} - {opt.name}
                                  </option>
                                ))}
                              </select>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* ================== OPSI CREW ================== */}
            <Card>
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HiSwitchHorizontal className="h-5 w-5 text-blue-600" />
                </div>
                <h2 className="text-lg font-bold text-gray-900">OPSI CREW</h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-gray-500 table-fixed">
                  <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                    <tr>
                      <th className="px-3 py-3 w-[90px]">Seaman</th>
                      <th className="px-3 py-3 w-[110px]">Nama</th>
                      <th className="px-3 py-3">History</th>
                    </tr>
                  </thead>
                  <tbody>
                    {dummyReplacementOptions.map((replacement, index) => (
                      <tr key={index} className="border-b hover:bg-gray-50">
                        <td className="px-3 py-3 font-medium text-gray-900">
                          {replacement.seamancode}
                        </td>
                        <td className="px-3 py-3">{replacement.name}</td>
                        <td className="px-3 py-3 text-xs leading-snug">
                          {replacement.historyVessel}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>

          {/* 🔒 Tombol Lock/Unlock Data */}
          <div className="flex justify-end mt-4">
            <Button
              color={locked ? 'gray' : 'blue'}
              onClick={handleLockToggle}
              className="flex items-center gap-2"
            >
              {locked ? (
                <>
                  <HiLockOpen className="h-5 w-5" />
                  Unlock Data
                </>
              ) : (
                <>
                  <HiLockClosed className="h-5 w-5" />
                  Lock Data
                </>
              )}
            </Button>
          </div>
        </>
      ) : (
        <Card className="bg-gray-50">
          <p className="text-center text-gray-600">
            Pilih salah satu rotation group di atas untuk melihat data kru
          </p>
        </Card>
      )}
    </div>
  );
}
