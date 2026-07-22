'use client';

import { Button, Badge } from 'flowbite-react';
import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmModal } from '../container/ConfirmModal';
import { CardComponent } from '../CardComponent';
import { InputComponent } from '../InputComponent';
import { TableComponent } from '../TableComponent';
import {
  HiUserGroup,
  HiStar,
  HiLockClosed,
  HiLockOpen,
  HiExclamationCircle,
  HiChevronDown,
  HiChevronUp,
} from 'react-icons/hi';
import {
  useLockedRotations,
  useCadanganData,
  usePromotionCandidates,
  useMutasiData,
  usePotentialPromotion,
  useGenerateSchedule,
  useLockRotation,
  useSubmitRotations,
  useJobSubmitted,
  usePendingChanges,
} from '../../hooks/useBargeCraneRotation';
import { exportRotationToExcel } from '../ExportRotationExcel';
import { exportRotationToPDF } from '../ExportRotationPDF';
import { Spinner } from 'flowbite-react';

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface BargeCraneProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
  categorization: string;
}

export function BargeCraneSeniorRotation({
  groups,
  vessel,
  type,
  part,
  job,
  categorization,
}: BargeCraneProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedStandby, setSelectedStandby] = useState<string[]>([]);
  const [selectedOptional, setSelectedOptional] = useState<string[]>([]);
  const [scheduleTable, setScheduleTable] = useState<TableJson | null>(null);
  const [nahkodaTable, setNahkodaTable] = useState<TableJson | null>(null);
  const [daratTable, setDaratTable] = useState<TableJson | null>(null);
  const [potentialTable, setPotentialTable] = useState<TableJson | null>(null);
  const [mutasiTable, setMutasiTable] = useState<TableJson | null>(null);
  const [error, setError] = useState<string>('');
  const [showOnlyMatchMutasi, setShowOnlyMatchMutasi] = useState(false);
  const [showOnlyMatchPotential, setShowOnlyMatchPotential] = useState(false);
  const [expandedMutasi, setExpandedMutasi] = useState(false);
  const [expandedPotential, setExpandedPotential] = useState(false);
  const [forecastMonthPerGroup, setForecastMonthPerGroup] = useState<Record<string, 1 | 2>>({});
  const forecastMonth = selectedGroup ? (forecastMonthPerGroup[selectedGroup] ?? 1) : 1;

  // Modal states
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const queryClient = useQueryClient();
  const [isCurrentGroupLocked, setIsCurrentGroupLocked] = useState(false);
  const { lockedRotations } = useLockedRotations(job, vessel, forecastMonth);
  // Always fetch fm=1 locks for cross-month awareness
  const { lockedRotations: lockedRotationsFm1 } = useLockedRotations(job, vessel, 1);

  // Calculate locked codes: current fm + fm=1 main crew
  const lockedCadanganCodes = useMemo(() => {
    const currentCodes = Object.values(lockedRotations)
      .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
      .flatMap(lock => lock.lockedCadanganCodes || []);
    if (forecastMonth >= 2) {
      const fm1MainCodes = Object.values(lockedRotationsFm1)
        .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
        .flatMap(lock => lock.lockedCadanganCodes || []);
      return [...new Set([...currentCodes, ...fm1MainCodes])];
    }
    return currentCodes;
  }, [lockedRotations, lockedRotationsFm1, job, forecastMonth]);

  // Calculate locked reliever codes
  const lockedRelieverCodes = useMemo(() => {
    const currentFmCodes = Object.values(lockedRotations)
      .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
      .filter(lock => lock.groupKey !== selectedGroup)
      .flatMap(lock => {
        if (lock.daratTable && lock.daratTable.data) {
          return lock.daratTable.data.map((row: any) =>
            String(
              row.seamancode ||
                row.SEAMANCODE ||
                row.Seamancode ||
                row.SeamanCode ||
                ''
            )
          );
        }
        return [];
      });
    if (forecastMonth >= 2) {
      const fm1RelieverCodes = Object.values(lockedRotationsFm1)
        .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
        .flatMap(lock => lock.lockedRelieverCodes || []);
      return [...new Set([...currentFmCodes, ...fm1RelieverCodes])];
    }
    return currentFmCodes;
  }, [lockedRotations, lockedRotationsFm1, job, selectedGroup, forecastMonth]);

  // Check if all groups are locked for fm=1 (used for submit button)
  const areAllGroupsLocked = useMemo(() => {
    const groupKeys = Object.keys(groups);
    const lockedGroupsForJob = Object.keys(lockedRotationsFm1).filter(
      key => lockedRotationsFm1[key]?.job?.toUpperCase() === job.toUpperCase()
    );
    return (
      groupKeys.length > 0 &&
      groupKeys.every(key => lockedGroupsForJob.includes(key))
    );
  }, [groups, lockedRotationsFm1, job]);

  // Lazy load cadangan data (only when group selected)
  const { cadanganData, loading: loadingCadangan } = useCadanganData(
    job,
    selectedGroup,
    lockedCadanganCodes,
    !!selectedGroup,
    forecastMonth,
    categorization
  );

  // Lazy load promotion candidates
  const { promotionCandidates: promotionCandidatesData } =
    usePromotionCandidates(
      job,
      selectedGroup,
      lockedCadanganCodes,
      !!selectedGroup,
      forecastMonth,
      categorization
    );

  // Lazy load mutasi data — type='bc' triggers BC-specific filtering in hook
  const { mutasiData: mutasiRawData, loading: loadingGroup } = useMutasiData(
    job,
    'bc',
    selectedGroup,
    groups,
    lockedCadanganCodes,
    !!selectedGroup,
    forecastMonth
  );

  // Lazy load potential promotion
  const { potentialData: potentialRawData, loading: loadingPotential } =
    usePotentialPromotion(job, selectedGroup, groups, !!selectedGroup, forecastMonth);

  // Mutations
  const { generateSchedule, loading: loadingGenerate } = useGenerateSchedule();
  const { lockRotation, unlockRotation } = useLockRotation();
  const { submitRotations, loading: loadingSubmit } = useSubmitRotations();
  const { isSubmitted } = useJobSubmitted(job, vessel);
  const {
    hasChanges,
    count: changesCount,
    affectedGroups,
  } = usePendingChanges(job, vessel);

  const isLoadingAnyData = useMemo(() => {
    return loadingGroup || loadingCadangan || loadingPotential;
  }, [loadingGroup, loadingCadangan, loadingPotential]);

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
    setSelectedGroup(null);
    setForecastMonthPerGroup({});
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
    setSelectedStandby([]);
    setSelectedOptional([]);
    setError('');
  }, [job]);

  // Reset tables saat ganti forecast month per group
  useEffect(() => {
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
    setSelectedStandby([]);
    setSelectedOptional([]);
  }, [forecastMonth]);

  // Check if current group is locked
  useEffect(() => {
    if (selectedGroup) {
      const locked = lockedRotations[selectedGroup];
      setIsCurrentGroupLocked(!!locked);

      if (locked) {
        setScheduleTable(locked.scheduleTable);
        setNahkodaTable(locked.nahkodaTable);
        setDaratTable(locked.daratTable);
      } else {
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
    setScheduleTable(null);
    setNahkodaTable(null);
    setDaratTable(null);
    setSelectedStandby([]);
    setSelectedOptional([]);
  };

  // Handle Lock Rotation - Save to Database
  const handleLockRotation = async () => {
    if (!selectedGroup || !scheduleTable || !nahkodaTable) {
      toast.warning(
        'Tidak ada data yang bisa di-lock. Generate schedule terlebih dahulu!'
      );
      return;
    }

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
      await lockRotation({
        groupKey: selectedGroup,
        job: job.toUpperCase(),
        vessel: vessel.toUpperCase(),
        categorization: categorization,
        scheduleTable,
        nahkodaTable,
        daratTable,
        lockedSeamanCodes,
        forecastMonth,
      });

      setIsCurrentGroupLocked(true);
      toast.success(`Rotasi untuk ${selectedGroup} berhasil di-lock!`);

      queryClient.invalidateQueries({ queryKey: ['bc', 'locked-rotations'] });
      queryClient.invalidateQueries({ queryKey: ['bc', 'job-submitted'] });
      queryClient.invalidateQueries({ queryKey: ['bc', 'pending-changes'] });
    } catch (error: any) {
      console.error('Error locking rotation:', error);
      toast.error(error.message || 'Gagal lock rotasi');
    }
  };

  // Handle Unlock Rotation - Delete from Database
  const handleUnlockRotation = async () => {
    if (!selectedGroup) {
      toast.warning('Tidak ada group yang dipilih!');
      return;
    }
    setShowUnlockModal(true);
  };

  // Confirm unlock rotation
  const confirmUnlockRotation = async () => {
    setShowUnlockModal(false);
    if (!selectedGroup) return;

    try {
      await unlockRotation({ groupKey: selectedGroup, job, vessel, forecastMonth });

      toast.success(`Rotasi untuk ${selectedGroup} berhasil di-unlock!`);
      setIsCurrentGroupLocked(false);
      setScheduleTable(null);
      setNahkodaTable(null);
      setDaratTable(null);

      queryClient.invalidateQueries({ queryKey: ['bc', 'locked-rotations'] });
      queryClient.invalidateQueries({ queryKey: ['bc', 'job-submitted'] });
      queryClient.invalidateQueries({ queryKey: ['bc', 'pending-changes'] });
    } catch (error: any) {
      console.error('Error unlocking rotation:', error);
      toast.error(error.message || 'Gagal unlock rotasi');
    }
  };

  // Generate schedule
  const handleGenerateSchedule = async () => {
    if (!selectedGroup) {
      toast.warning('Pilih group terlebih dahulu!');
      return;
    }

    const kapalList = groups[selectedGroup] || [];
    if (kapalList.length === 0) {
      toast.warning('Group tidak memiliki kapal!');
      return;
    }

    try {
      const result = await generateSchedule({
        vessel,
        job,
        groupKey: selectedGroup,
        kapal: kapalList,
        standby: selectedStandby,
        darat: selectedOptional,
        type: type,
        part: part,
        categorization: categorization,
        forecastMonth,
      });

      if (result.error) {
        toast.error(result.error);
        return;
      }

      setScheduleTable(result.schedule || null);
      setNahkodaTable(result.nahkoda || null);
      setDaratTable(result.darat || null);
      toast.success('Rotasi berhasil di-generate!');
    } catch (error: any) {
      console.error('Error generating schedule:', error);
      toast.error(error.message || 'Gagal generate rotasi');
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
      return { seamancode: seamancodeStr, name, last_location: '' };
    }) || [];

  const potentialItems =
    potentialTable?.data.map(item => {
      const seamancodeStr = String(item.seamancode).trim();
      return { seamancode: seamancodeStr, name: item.name, last_location: '' };
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

  const filteredCadanganItems = allCadanganItems.filter(
    item => !lockedCadanganCodes.includes(item.seamancode)
  );

  const standByData = filteredCadanganItems;
  const optionalData = filteredCadanganItems.filter(
    item => !selectedStandby.includes(item.seamancode)
  );

  // Export to Excel
  const handleExportToExcel = () => {
    exportRotationToExcel({ job, selectedGroup, scheduleTable, nahkodaTable, daratTable });
  };

  // Export to PDF
  const handleExportToPDF = () => {
    exportRotationToPDF({ job, selectedGroup, scheduleTable, nahkodaTable, daratTable });
  };

  // Get forecast month label
  const getForecastMonthLabel = (offset: number) => {
    const date = new Date();
    date.setMonth(date.getMonth() + offset);
    return date.toLocaleString('id-ID', { month: 'long', year: 'numeric' });
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

  // Get group display name
  const getGroupDisplayName = (groupKey: string | null): string => {
    if (!groupKey) return '';
    const groupNumber = groupKey.replace('bc_rotation', '');
    return `Group ${groupNumber} Barge Crane ${getJobDisplayName(job)}`;
  };

  // Handle Submit All Rotations
  const handleSubmitAllRotations = async () => {
    setShowSubmitModal(true);
  };

  // Confirm submit all rotations
  const confirmSubmitAllRotations = async () => {
    setShowSubmitModal(false);

    try {
      const result = await submitRotations({ job, categorization });

      if (result.status === 'success') {
        toast.success(
          `Berhasil mengirim ${result.submitted_count} rotasi! Notifikasi Apollo: ${result.apollo_success} berhasil, ${result.apollo_failed} gagal.`
        );
        queryClient.invalidateQueries({ queryKey: ['bc', 'job-submitted'] });
        queryClient.invalidateQueries({ queryKey: ['bc', 'pending-changes'] });
        queryClient.invalidateQueries({ queryKey: ['bc', 'locked-rotations'] });
      } else {
        toast.error(result.message || 'Gagal mengirim rotasi');
      }
    } catch (error: any) {
      console.error('Error submitting rotations:', error);
      toast.error(error.message || 'Gagal mengirim rotasi');
    }
  };

  return (
    <section>
      <div className="px-6">
        <div className="mb-6">
          <div className="flex justify-between items-center mb-1">
            <h1 className="text-3xl font-bold text-gray-800">
              Generate Barge Crane Schedule - {getJobDisplayName(job)}
            </h1>

            {/* Submit Button */}
            {areAllGroupsLocked && (!isSubmitted || hasChanges) && (
              <Button
                color="success"
                onClick={handleSubmitAllRotations}
                disabled={loadingSubmit}
              >
                {loadingSubmit ? (
                  <>
                    <Spinner size="sm" light className="mr-2" />
                    Submitting...
                  </>
                ) : hasChanges ? (
                  `Kirim Perubahan (${changesCount})`
                ) : (
                  `Kirim Rotasi`
                )}
              </Button>
            )}

            {/* Show submitted status */}
            {areAllGroupsLocked && isSubmitted && !hasChanges && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <HiLockClosed className="h-5 w-5" />
                <span className="font-medium">Terkirim</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            Generate dan kelola jadwal rotasi BARGE CRANE {getJobDisplayName(job)}
          </p>
        </div>

        {error && (
          <div className="p-4 mb-4 text-sm text-red-800 rounded-lg bg-red-50">
            {error}
          </div>
        )}

        {/* Pending Changes Alert */}
        {hasChanges && affectedGroups.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <h3 className="text-sm font-semibold text-yellow-800">
                  Permintaan Perubahan Terdeteksi
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  {changesCount} rotasi pada grup berikut perlu dikirim ulang:
                </p>
                <div className="flex flex-wrap gap-2">
                  {affectedGroups.map((groupKey: string) => (
                    <Badge key={groupKey} color="warning">
                      {groupKey.replace('bc_rotation', 'Grup ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card for group selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(groups)
            .sort(([keyA], [keyB]) => {
              const numA = parseInt(keyA.match(/rotation(\d+)$/)?.[1] || '0', 10);
              const numB = parseInt(keyB.match(/rotation(\d+)$/)?.[1] || '0', 10);
              return numA - numB;
            })
            .map(([groupKey, ships]) => {
              const isLocked = !!lockedRotationsFm1[groupKey];
              const hasPendingChange = affectedGroups.includes(groupKey);

              return (
                <div key={groupKey} className="relative">
                  {/* Locked Badge */}
                  {isLocked && !hasPendingChange && (
                    <div className="absolute top-4 right-4 bg-green-100 rounded-full p-1.5 shadow-sm z-10">
                      <HiLockClosed className="h-4 w-4 text-green-600" />
                    </div>
                  )}

                  {/* Pending Change Badge */}
                  {hasPendingChange && (
                    <div className="absolute top-4 right-4 bg-yellow-100 rounded-full p-1.5 shadow-sm z-10">
                      <HiExclamationCircle className="h-4 w-4 text-yellow-600" />
                    </div>
                  )}

                  <CardComponent
                    groupName={`Group ${groupKey.replace('bc_rotation', '')}`}
                    listShip={ships}
                    isActive={selectedGroup === groupKey}
                    onClick={() => handleCardClick(groupKey)}
                  />
                </div>
              );
            })}
        </div>

        {/* Per-group Forecast Month Selector */}
        {selectedGroup && (
          <div className="flex items-center gap-1 mt-4 bg-red-50 border border-red-100 rounded-full p-1 w-fit">
            {([1, 2] as const).map(month => (
              <button
                key={month}
                className={`px-4 py-1.5 text-sm font-medium rounded-full transition-all ${
                  forecastMonth === month
                    ? 'bg-red-500 text-white shadow-sm'
                    : 'text-red-400 hover:text-red-600'
                }`}
                onClick={() => {
                  if ((forecastMonthPerGroup[selectedGroup] ?? 1) !== month) {
                    setForecastMonthPerGroup(prev => ({
                      ...prev,
                      [selectedGroup]: month,
                    }));
                  }
                }}
              >
                {getForecastMonthLabel(month)}
              </button>
            ))}
          </div>
        )}

        {/* Loading state for group selection */}
        {loadingGroup && !isCurrentGroupLocked ? (
          <div className="flex flex-col items-center justify-center mt-6 py-12 gap-4">
            <Spinner size="xl" color="failure" />
            <span className="text-gray-600">Loading group data...</span>
          </div>
        ) : (
          (!isLoadingAnyData || hasData) && (
            <>
              {(mutasiTable || potentialTable) && (
                <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* EXISTING */}
                  {mutasiTable && (
                    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                      <button
                        type="button"
                        onClick={() => setExpandedMutasi(prev => !prev)}
                        className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-red-100 rounded-lg">
                            <HiUserGroup className="h-5 w-5 text-red-600" />
                          </div>
                          <h2 className="text-lg font-bold text-gray-900">
                            {getJobDisplayName(job)} EXISTING
                          </h2>
                          <span className="text-xs text-gray-500 font-normal">
                            ({mutasiTable.data.length} data)
                          </span>
                        </div>
                        {expandedMutasi ? (
                          <HiChevronUp className="h-5 w-5 text-gray-500 shrink-0" />
                        ) : (
                          <HiChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                        )}
                      </button>

                      {expandedMutasi && (
                        <div className="px-4 pb-4">
                          <div className="flex justify-end mb-3">
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
                                  <th className="px-4 py-3">History Vessels</th>
                                  <th className="px-4 py-3">Last Location</th>
                                  <th className="px-4 py-3">Match Count</th>
                                </tr>
                              </thead>
                              <tbody>
                                {mutasiTable.data.map((item, idx) => (
                                  <tr key={idx} className="border-b hover:bg-gray-50">
                                    <td className="px-4 py-3 font-medium">{item.seamancode}</td>
                                    <td className="px-4 py-3">{item.name}</td>
                                    <td className="px-4 py-3 text-xs">
                                      {item.vessels || '----- [BELUM ADA DATA MUTASI] -----'}
                                    </td>
                                    <td className="px-4 py-3">{item.last_location}</td>
                                    <td className="px-4 py-3 text-center">{item.matchCount}</td>
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* POTENTIAL PROMOTION */}
                  {(() => {
                    const isKKMorMasinisII = job === 'KKM' || job === 'masinisII';
                    const showForKKMorMasinisII =
                      isKKMorMasinisII &&
                      (selectedGroup === 'bc_rotation1' ||
                        selectedGroup === 'bc_rotation2');

                    const isNahkodaOrMualimI = job === 'nakhoda' || job === 'mualimI';
                    const showForNahkodaOrMualimI =
                      isNahkodaOrMualimI &&
                      (selectedGroup === 'bc_rotation1' ||
                        selectedGroup === 'bc_rotation2');

                    return (
                      (showForKKMorMasinisII || showForNahkodaOrMualimI) && (
                        <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
                          <button
                            type="button"
                            onClick={() => setExpandedPotential(prev => !prev)}
                            className="w-full flex items-center justify-between gap-3 p-4 hover:bg-gray-50 transition-colors"
                          >
                            <div className="flex items-center gap-3">
                              <div className="p-2 bg-yellow-100 rounded-lg">
                                <HiStar className="h-5 w-5 text-yellow-600" />
                              </div>
                              <h2 className="text-lg font-bold text-gray-900">
                                POTENTIAL PROMOTION
                              </h2>
                              {potentialTable && (
                                <span className="text-xs text-gray-500 font-normal">
                                  ({potentialTable.data.length} data)
                                </span>
                              )}
                            </div>
                            {expandedPotential ? (
                              <HiChevronUp className="h-5 w-5 text-gray-500 shrink-0" />
                            ) : (
                              <HiChevronDown className="h-5 w-5 text-gray-500 shrink-0" />
                            )}
                          </button>

                          {expandedPotential && (
                            <div className="px-4 pb-4">
                              {loadingPotential ? (
                                <div className="flex flex-col items-center justify-center py-8 gap-4">
                                  <Spinner size="lg" color="failure" />
                                  <span className="text-gray-600">
                                    Loading potential promotion data...
                                  </span>
                                </div>
                              ) : potentialTable && potentialTable.data.length > 0 ? (
                                <>
                                  <div className="flex justify-end mb-3">
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
                                  <div className="overflow-x-auto">
                                    <table className="w-full text-sm text-left text-gray-700">
                                      <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                                        <tr>
                                          <th className="px-4 py-3">Seaman Code</th>
                                          <th className="px-4 py-3">Name</th>
                                          <th className="px-4 py-3">History</th>
                                          <th className="px-4 py-3">Last Location</th>
                                          <th className="px-4 py-3">Match Count</th>
                                        </tr>
                                      </thead>
                                      <tbody>
                                        {potentialTable.data.map((item, idx) => (
                                          <tr key={idx} className="border-b hover:bg-gray-50">
                                            <td className="px-4 py-3 font-medium">{item.seamancode}</td>
                                            <td className="px-4 py-3">{item.name}</td>
                                            <td className="px-4 py-3 text-xs">{item.history}</td>
                                            <td className="px-4 py-3">{item.last_location}</td>
                                            <td className="px-4 py-3 text-center">{item.matchCount}</td>
                                          </tr>
                                        ))}
                                      </tbody>
                                    </table>
                                  </div>
                                </>
                              ) : (
                                <div className="text-center py-8 text-gray-500">
                                  Tidak ada {getJobDisplayName(job)} yang mendapatkan potensial promosi
                                </div>
                              )}
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
                      Pilih {getJobDisplayName(job)} Cadangan (Darat Stand By) [Wajib]:
                    </label>
                    <InputComponent
                      cadanganData={standByData}
                      value={selectedStandby}
                      onChange={setSelectedStandby}
                      isSingle={true}
                      lockedRelieverCodes={lockedRelieverCodes}
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
                      lockedRelieverCodes={lockedRelieverCodes}
                    />
                  </div>

                  <Button
                    color="success"
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
                      'Generate Rotasi'
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
          <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">RELIEVER:</h2>
            </div>
            <TableComponent table={daratTable} />
          </div>
        )}

        {scheduleTable && (
          <div className="mt-6 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
            <div className="flex items-center gap-3 mb-4">
              <h2 className="text-lg font-bold text-gray-900">ROTATION PLAN:</h2>
            </div>
            <TableComponent table={scheduleTable} />
          </div>
        )}

        {/* Action Buttons */}
        {(nahkodaTable || scheduleTable) && (
          <div className="flex justify-start gap-4 mt-4">
            <Button
              color="light"
              className="w-full sm:w-auto bg-green-600 hover:bg-green-700 text-white"
              onClick={handleExportToExcel}
            >
              Excel
            </Button>

            <Button
              color="failure"
              className="w-full sm:w-auto"
              onClick={handleExportToPDF}
            >
              PDF
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

      {/* Confirmation Modals */}
      <ConfirmModal
        show={showUnlockModal}
        onClose={() => setShowUnlockModal(false)}
        onConfirm={confirmUnlockRotation}
        message={`Apakah Anda yakin ingin unlock rotasi untuk ${getGroupDisplayName(selectedGroup)}?`}
        confirmText="Ya, Unlock"
        confirmColor="warning"
      />

      <ConfirmModal
        show={showSubmitModal}
        onClose={() => setShowSubmitModal(false)}
        onConfirm={confirmSubmitAllRotations}
        message={`Submit semua rotasi ${getJobDisplayName(job)} ke database dan kirim notifikasi ke Apollo?`}
        confirmText="Ya, Submit"
        confirmColor="success"
      />
    </section>
  );
}
