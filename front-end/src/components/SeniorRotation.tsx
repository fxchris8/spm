'use client';

import { Button } from 'flowbite-react';
import { useState, useEffect, useMemo } from 'react';
import { CardComponent } from './CardComponent';
import { InputComponent } from './InputComponent';
import { TableComponent } from './TableComponent';
import { AlertComponent } from './AlertComponent';
import { HiUserGroup, HiStar, HiLockClosed, HiLockOpen } from 'react-icons/hi';
import {
  useLockedRotations,
  useCadanganData,
  usePromotionCandidates,
  useMutasiData,
  usePotentialPromotion,
  useGenerateSchedule,
  useLockRotation,
} from '../hooks/useSeniorRotation';
import * as XLSX from 'xlsx';
import { Spinner } from 'flowbite-react';

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface ApiResponse {
  schedule?: TableJson;
  nahkoda?: TableJson;
  darat?: TableJson | null;
  error?: string;
}

interface SeniorProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

interface LockedRotation {
  groupKey: string;
  job: string;
  scheduleTable: TableJson;
  nahkodaTable: TableJson;
  daratTable: TableJson | null;
  lockedSeamanCodes: string[]; // All locked codes (for backward compatibility)
  lockedCadanganCodes: string[]; // Only cadangan/nahkoda codes (for filtering EXISTING)
  lockedRelieverCodes: string[]; // Only reliever/darat codes (not used for filtering)
  lockedAt: string;
}

export function SeniorRotation({
  groups,
  vessel,
  type,
  part,
  job,
}: SeniorProps) {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStandby, setSelectedStandby] = useState<string[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);
  const [scheduleTable, setScheduleTable] = useState<TableJson | null>(null);
  const [nahkodaTable, setNahkodaTable] = useState<TableJson | null>(null);
  const [daratTable, setDaratTable] = useState<TableJson | null>(null);
  const [potentialTable, setPotentialTable] = useState<TableJson | null>(null);
  // const [potentialRawData, setPotentialRawData] = useState<any[]>([]);
  const [mutasiTable, setMutasiTable] = useState<TableJson | null>(null);
  // const [mutasiRawData, setMutasiRawData] = useState<any[]>([]);
  const [error, setError] = useState<string>('');
  const [showOnlyMatchMutasi, setShowOnlyMatchMutasi] = useState(false);
  const [showOnlyMatchPotential, setShowOnlyMatchPotential] = useState(false);
  const [alertInfo, setAlertInfo] = useState<{
    show: boolean;
    type: 'success' | 'error' | 'info' | 'warning';
    message: string;
  }>({ show: false, type: 'info', message: '' });

  const [isCurrentGroupLocked, setIsCurrentGroupLocked] = useState(false);
  const { lockedRotations } = useLockedRotations(job);

  // Calculate locked codes from all rotations
  const lockedCadanganCodes = useMemo(() => {
    return Object.values(lockedRotations)
      .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
      .flatMap(lock => lock.lockedCadanganCodes || []);
  }, [lockedRotations, job]);

  // Lazy load cadangan data (only when group selected)
  const { cadanganData, loading: loadingCadangan } = useCadanganData(
    job,
    selectedGroup,
    lockedCadanganCodes,
    !!selectedGroup
  );

  // Lazy load promotion candidates
  const { promotionCandidates: promotionCandidatesData } =
    usePromotionCandidates(
      job,
      selectedGroup,
      lockedCadanganCodes,
      !!selectedGroup
    );

  // Lazy load mutasi data
  const { mutasiData: mutasiRawData, loading: loadingGroup } = useMutasiData(
    job,
    'senior',
    selectedGroup,
    groups,
    lockedCadanganCodes,
    !!selectedGroup
  );

  // console.log('🔍 Debug Mutasi Data:', mutasiRawData);

  // Lazy load potential promotion
  const { potentialData: potentialRawData, loading: loadingPotential } =
    usePotentialPromotion(job, selectedGroup, groups, !!selectedGroup);

  // console.log('🔍 Debug Potential Data:', potentialRawData);

  // Mutations
  const { generateSchedule, loading: loadingGenerate } = useGenerateSchedule();
  const { lockRotation, unlockRotation, lockLoading, unlockLoading } =
    useLockRotation();

  // Helper function to show alert
  const showAlert = (
    type: 'success' | 'error' | 'info' | 'warning',
    message: string
  ) => {
    setAlertInfo({ show: true, type, message });
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      setAlertInfo({ show: false, type: 'info', message: '' });
    }, 5000);
  };

  const isLoadingAnyData = useMemo(() => {
    return loadingGroup || loadingCadangan || loadingPotential;
  }, [loadingGroup, loadingCadangan, loadingPotential]);

  // console.log('isLoadingAnyData:', isLoadingAnyData);

  const hasData = useMemo(() => {
    return (
      mutasiRawData.length > 0 ||
      cadanganData.length > 0 ||
      potentialRawData.length > 0 ||
      promotionCandidatesData.length > 0
    );
  }, [mutasiRawData, cadanganData, potentialRawData, promotionCandidatesData]);

  // Reset state saat ganti job (pindah tabs)
  useEffect(() => {
    // Clear semua state saat ganti job
    setSelectedGroup(null);
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
    setSelectedStandby([]);
    setSelectedOptional([]);
    // setMutasiRawData([]);
    // setPotentialRawData([]);
    setError('');
  }, [job]); // Re-run saat job berubah

  // Check if current group is locked
  useEffect(() => {
    if (selectedGroup) {
      const locked = lockedRotations[selectedGroup];
      setIsCurrentGroupLocked(!!locked);

      // Jika group sudah di-lock, tampilkan data yang tersimpan
      if (locked) {
        setScheduleTable(locked.scheduleTable);
        setNahkodaTable(locked.nahkodaTable);
        setDaratTable(locked.daratTable);
      } else {
        // Jika group TIDAK di-lock, CLEAR semua tables
        // Agar tidak muncul data dari group sebelumnya
        setScheduleTable(null);
        setNahkodaTable(null);
        setDaratTable(null);
      }
    }
  }, [selectedGroup, lockedRotations]);

  // Filter mutasi data
  useEffect(() => {
    if (mutasiRawData.length === 0) {
      setMutasiTable(null);
      return;
    }

    const filteredRows = showOnlyMatchMutasi
      ? mutasiRawData.filter((r: any) => r.matchCount > 0)
      : mutasiRawData;

    setMutasiTable({
      columns: ['seamancode', 'name', 'vessels', 'matchCount'],
      data: filteredRows,
    });
  }, [mutasiRawData, showOnlyMatchMutasi]);

  // Filter potential promotion data
  useEffect(() => {
    if (potentialRawData.length === 0) {
      setPotentialTable(null);
      return;
    }

    const filteredRows = showOnlyMatchPotential
      ? potentialRawData.filter((r: any) => r.matchCount > 0)
      : potentialRawData;

    setPotentialTable({
      columns: ['seamancode', 'name', 'history', 'matchCount'],
      data: filteredRows,
    });
  }, [potentialRawData, showOnlyMatchPotential]);

  useEffect(() => {
    if (cadanganData && cadanganData.length > 0) {
      const standByCodes = cadanganData
        .filter(item => item.last_location === 'DARAT STAND-BY')
        .map(item => item.seamancode);
      setSelectedStandby(standByCodes);
    }
  }, [cadanganData]);

  // Handle card click
  const handleCardClick = async (groupKey: string) => {
    setSelectedGroup(groupKey);
    // setLoadingGroup(true);
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
  };

  // Handle Lock Rotation - Save to Database
  const handleLockRotation = async () => {
    if (!selectedGroup || !scheduleTable || !nahkodaTable) {
      showAlert(
        'warning',
        'Tidak ada data yang bisa di-lock. Generate schedule terlebih dahulu!'
      );
      return;
    }

    // Extract seaman codes
    const lockedCadanganCodes = nahkodaTable.data.map((row: any) =>
      String(
        row.seamancode ||
          row.SEAMANCODE ||
          row.Seamancode ||
          row.SeamanCode ||
          ''
      )
    );

    const lockedRelieverCodes: string[] = [];
    if (daratTable) {
      const daratCodes = daratTable.data.map((row: any) =>
        String(
          row.seamancode ||
            row.SEAMANCODE ||
            row.Seamancode ||
            row.SeamanCode ||
            ''
        )
      );
      lockedRelieverCodes.push(...daratCodes);
    }

    const lockedSeamanCodes = [...lockedCadanganCodes, ...lockedRelieverCodes];

    try {
      // ✅ Pakai hook mutation
      await lockRotation({
        groupKey: selectedGroup,
        job: job.toUpperCase(),
        scheduleTable,
        nahkodaTable,
        daratTable,
        lockedSeamanCodes,
      });

      showAlert('success', `Rotation for ${selectedGroup} has been locked!`);
      setIsCurrentGroupLocked(true);
    } catch (error: any) {
      console.error('Error locking rotation:', error);
      showAlert('error', error.message || 'Failed to lock rotation');
    }
  };
  // Handle Unlock Rotation - Delete from Database
  const handleUnlockRotation = async () => {
    if (!selectedGroup) {
      showAlert('warning', 'Tidak ada group yang dipilih!');
      return;
    }

    if (!window.confirm(`Unlock rotation for ${selectedGroup}?`)) {
      return;
    }

    try {
      // ✅ Pakai hook mutation
      await unlockRotation({
        groupKey: selectedGroup,
        job,
      });

      showAlert('success', `Rotation for ${selectedGroup} has been unlocked!`);
      setIsCurrentGroupLocked(false);
      setScheduleTable(null);
      setNahkodaTable(null);
      setDaratTable(null);
    } catch (error: any) {
      console.error('Error unlocking rotation:', error);
      showAlert('error', error.message || 'Failed to unlock rotation');
    }
  };

  // Generate schedule
  const handleGenerateSchedule = async () => {
    if (!selectedGroup) {
      showAlert('warning', 'Pilih group terlebih dahulu!');
      return;
    }

    const kapalList = groups[selectedGroup] || [];
    if (kapalList.length === 0) {
      showAlert('warning', 'Group tidak memiliki kapal!');
      return;
    }

    try {
      const result = await generateSchedule({
        vessel,
        job,
        groupKey: selectedGroup,
        // selected_group: selectedGroup,
        kapal: kapalList,
        standby: selectedStandby,
        darat: selectedOptional,
        // cadangan: selectedStandby,
        // cadangan2: selectedOptional,
        type: type,
        part: part,
      });

      if (result.error) {
        showAlert('error', result.error);
        return;
      }

      setScheduleTable(result.schedule || null);
      setNahkodaTable(result.nahkoda || null);
      setDaratTable(result.darat || null);
      showAlert('success', 'Schedule generated successfully!');
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      showAlert('error', error.message || 'Failed to generate schedule');
    }
  };

  // Gabungkan data cadangan
  const mutasiItems =
    mutasiTable?.data.map(item => {
      const seamancodeStr = String(item.seamancode).trim();
      const found = cadanganData.find(
        c => String(c.seamancode).trim() === seamancodeStr
      );
      const name = found?.name || item.name || 'Unknown';
      return {
        seamancode: seamancodeStr,
        name,
        last_location: '',
      };
    }) || [];

  const potentialItems =
    potentialTable?.data.map(item => {
      const seamancodeStr = String(item.seamancode).trim();
      return {
        seamancode: seamancodeStr,
        name: item.name,
        last_location: '',
      };
    }) || [];

  const promotionItems = promotionCandidatesData.map(item => ({
    seamancode: String(item.seamancode).trim(),
    name: item.name,
    last_location: '',
  }));

  const allCadanganItems = [
    ...mutasiItems,
    ...potentialItems.filter(
      p => !mutasiItems.some(m => m.seamancode === p.seamancode)
    ),
    ...promotionItems.filter(
      pr =>
        !mutasiItems.some(m => m.seamancode === pr.seamancode) &&
        !potentialItems.some(p => p.seamancode === pr.seamancode)
    ),
  ];

  // // Filter out locked CADANGAN codes (not reliever) from select fields
  // const lockedCadanganCodes = Object.values(lockedRotations)
  //   .filter(lock => lock.job?.toUpperCase() === job.toUpperCase()) // ✅ Case insensitive
  //   .flatMap(lock => lock.lockedCadanganCodes || []);

  const filteredCadanganItems = allCadanganItems.filter(
    item => !lockedCadanganCodes.includes(item.seamancode)
  );

  const standByData = filteredCadanganItems;
  const optionalData = filteredCadanganItems.filter(
    item => !selectedStandby.includes(item.seamancode)
  );

  // Export to Excel
  const exportToExcel = () => {
    const wb = XLSX.utils.book_new();
    if (nahkodaTable) {
      const wsNahkoda = XLSX.utils.json_to_sheet(nahkodaTable.data);
      XLSX.utils.book_append_sheet(wb, wsNahkoda, getJobDisplayName(job));
    }
    if (scheduleTable) {
      const wsSchedule = XLSX.utils.json_to_sheet(scheduleTable.data, {
        header: scheduleTable.columns,
      });
      XLSX.utils.book_append_sheet(wb, wsSchedule, 'RotationPlan');
    }
    if (daratTable) {
      const wsDarat = XLSX.utils.json_to_sheet(daratTable.data);
      XLSX.utils.book_append_sheet(wb, wsDarat, 'Reliever');
    }
    XLSX.writeFile(
      wb,
      `${getJobDisplayName(job)}_Schedule_${selectedGroup}.xlsx`
    );
  };

  // Get job display name
  const getJobDisplayName = (job: string): string => {
    switch (job) {
      case 'nakhoda':
        return 'NAHKODA';
      case 'KKM':
        return 'KKM';
      case 'mualimI':
        return 'MUALIM I';
      case 'masinisII':
        return 'MASINIS II';
      default:
        return job.toUpperCase();
    }
  };

  return (
    <div className="px-6">
      <div className="text-3xl mb-3 font-bold">Generate Ship Crew Schedule</div>

      {/* Alert Component */}
      {alertInfo.show && (
        <AlertComponent
          type={alertInfo.type}
          message={alertInfo.message}
          onClose={() =>
            setAlertInfo({ show: false, type: 'info', message: '' })
          }
        />
      )}

      {error && (
        <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
          {error}
        </div>
      )}

      {/* Card for group selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        {Object.entries(groups).map(([groupKey, ships]) => {
          const isLocked = !!lockedRotations[groupKey];
          return (
            <div key={groupKey} className="relative">
              {isLocked && (
                <div className="absolute top-4 right-4 bg-green-100 rounded-full p-1.5 shadow-sm">
                  <HiLockClosed className="h-4 w-4 text-green-600" />
                </div>
              )}
              <CardComponent
                groupName={`Group ${groupKey.replace(
                  'container_rotation',
                  ''
                )}`}
                listShip={ships}
                isActive={selectedGroup === groupKey}
                onClick={() => handleCardClick(groupKey)}
              />
            </div>
          );
        })}
      </div>

      {/* Loading state for group selection */}
      {loadingGroup && !isCurrentGroupLocked ? (
        <div className="flex flex-col justify-center items-center mt-6">
          <Spinner color="info" size="xl" />
          <span className="mt-2 text-gray-700">Loading data...</span>
          {/* {loadingGroup && ' (mutasi)'}
          {loadingCadangan && ' (cadangan)'}
          {loadingPotential && ' (potential)'} */}
        </div>
      ) : (
        (!isLoadingAnyData || hasData) && (
          <>
            {(mutasiTable || potentialTable) && (
              <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                {/* EXISTING */}
                {mutasiTable && (
                  <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                    <div className="flex items-center justify-between gap-3 mb-4 pb-3">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-red-100 rounded-lg">
                          <HiUserGroup className="h-5 w-5 text-red-600" />
                        </div>
                        <h2 className="text-lg font-bold text-gray-900">
                          {getJobDisplayName(job)} EXISTING
                        </h2>
                      </div>
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={showOnlyMatchMutasi}
                          onChange={e =>
                            setShowOnlyMatchMutasi(e.target.checked)
                          }
                          className="rounded"
                        />
                        Tampilkan matchCount &gt; 0 saja
                      </label>
                    </div>

                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left text-gray-700">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-3">Seaman Code</th>
                            <th className="px-4 py-3">Name</th>
                            <th className="px-4 py-3">Vessels</th>
                            <th className="px-4 py-3">Match Count</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mutasiTable.data.map((item, idx) => (
                            <tr key={idx} className="border-b hover:bg-gray-50">
                              <td className="px-4 py-3 font-medium">
                                {item.seamancode}
                              </td>
                              <td className="px-4 py-3">{item.name}</td>
                              <td className="px-4 py-3 text-xs">
                                {item.vessels}
                              </td>
                              <td className="px-4 py-3 text-center">
                                {item.matchCount}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* POTENTIAL PROMOTION */}
                {(() => {
                  const isKKMorMasinisII = job === 'KKM' || job === 'masinisII';
                  const showForKKMorMasinisII =
                    isKKMorMasinisII &&
                    (selectedGroup === 'container_rotation6' ||
                      selectedGroup === 'container_rotation7');

                  const isNahkodaOrMualimI =
                    job === 'nakhoda' || job === 'mualimI';
                  const showForNahkodaOrMualimI =
                    isNahkodaOrMualimI &&
                    (selectedGroup === 'container_rotation7' ||
                      selectedGroup === 'container_rotation8');

                  return (
                    (showForKKMorMasinisII || showForNahkodaOrMualimI) && (
                      <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                        <div className="flex items-center justify-between gap-3 mb-4 pb-3">
                          <div className="flex items-center gap-3">
                            <div className="p-2 bg-yellow-100 rounded-lg">
                              <HiStar className="h-5 w-5 text-yellow-600" />
                            </div>
                            <h2 className="text-lg font-bold text-gray-900">
                              POTENTIAL PROMOTION
                            </h2>
                          </div>
                          <label className="flex items-center gap-2 text-sm">
                            <input
                              type="checkbox"
                              checked={showOnlyMatchPotential}
                              onChange={e =>
                                setShowOnlyMatchPotential(e.target.checked)
                              }
                              className="rounded"
                            />
                            Tampilkan matchCount &gt; 0 saja
                          </label>
                        </div>

                        {loadingPotential ? (
                          <div className="flex justify-center items-center py-8">
                            <Spinner color="info" size="md" />
                            <span className="ml-2 text-gray-700">
                              Loading data...
                            </span>
                          </div>
                        ) : potentialTable && potentialTable.data.length > 0 ? (
                          <div className="overflow-x-auto">
                            <table className="w-full text-sm text-left text-gray-700">
                              <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                <tr>
                                  <th className="px-4 py-3">Seaman Code</th>
                                  <th className="px-4 py-3">Name</th>
                                  <th className="px-4 py-3">History</th>
                                  <th className="px-4 py-3">Match Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {potentialTable.data.map((item, idx) => (
                                  <tr
                                    key={idx}
                                    className="border-b hover:bg-gray-50"
                                  >
                                    <td className="px-4 py-3 font-medium">
                                      {item.seamancode}
                                    </td>
                                    <td className="px-4 py-3">{item.name}</td>
                                    <td className="px-4 py-3 text-xs">
                                      {item.history}
                                    </td>
                                    <td className="px-4 py-3 text-center">
                                      {item.matchCount}
                                    </td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        ) : (
                          <div className="text-center py-8 text-gray-500">
                            Tidak ada {getJobDisplayName(job)} yang mendapatkan
                            potensial promosi
                          </div>
                        )}
                      </div>
                    )
                  );
                })()}
              </div>
            )}

            {/* Input Section - Only show if not locked */}
            {!isCurrentGroupLocked && (
              <>
                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Pilih {getJobDisplayName(job)} Cadangan (Darat Stand By)
                    [Wajib]:
                  </label>
                  <InputComponent
                    cadanganData={standByData}
                    value={selectedStandby}
                    onChange={setSelectedStandby}
                    isSingle={true}
                  />
                </div>

                <div className="mt-4 space-y-2">
                  <label className="block text-sm font-medium text-gray-900">
                    Pilih {getJobDisplayName(job)} Cadangan (Reliever):
                  </label>
                  <InputComponent
                    cadanganData={optionalData}
                    value={selectedOptional}
                    onChange={setSelectedOptional}
                    isSingle={true}
                  />
                </div>

                <Button
                  gradientMonochrome="success"
                  className="mt-4 w-full sm:w-auto"
                  onClick={handleGenerateSchedule}
                  disabled={loadingGenerate || isCurrentGroupLocked}
                >
                  {loadingGenerate ? (
                    <>
                      <Spinner size="sm" light className="mr-2" />
                      Generating...
                    </>
                  ) : (
                    'Generate Schedule'
                  )}
                </Button>
              </>
            )}
          </>
        )
      )}

      {/* Results Tables */}
      {nahkodaTable && (
        <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
          <div className="flex items-center gap-3 mb-4">
            <h2 className="text-lg font-bold text-gray-900">
              {getJobDisplayName(job)}
            </h2>
            {isCurrentGroupLocked && (
              <span className="px-2 py-1 text-xs font-medium text-green-800 bg-green-100 rounded">
                LOCKED
              </span>
            )}
          </div>
          <TableComponent table={nahkodaTable} />
        </div>
      )}

      {daratTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">RELIEVER:</h2>
          <TableComponent table={daratTable} />
        </div>
      )}

      {scheduleTable && (
        <div className="mt-6 p-4 border rounded-lg bg-white overflow-x-auto">
          <h2 className="text-lg font-semibold mb-2">ROTATION PLAN:</h2>
          <TableComponent table={scheduleTable} />
        </div>
      )}

      {/* Action Buttons */}
      {(nahkodaTable || scheduleTable) && (
        <div className="flex justify-start gap-4 mt-4">
          <Button
            gradientMonochrome="info"
            className="w-full sm:w-auto"
            onClick={exportToExcel}
          >
            Export ke Excel
          </Button>

          {!isCurrentGroupLocked ? (
            <Button
              color="green"
              className="w-full sm:w-auto"
              onClick={handleLockRotation}
            >
              <HiLockClosed className="mr-2 h-5 w-5" />
              Lock Rotasi
            </Button>
          ) : (
            <Button
              color="red"
              className="w-full sm:w-auto"
              onClick={handleUnlockRotation}
            >
              <HiLockOpen className="mr-2 h-5 w-5" />
              Unlock Rotasi
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
