'use client';

import { Button, Badge } from 'flowbite-react';
import { useState, useEffect, useMemo } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ConfirmModal } from './ConfirmModal';
import { CardComponent } from '../CardComponent';
import { InputComponent } from '../InputComponent';
import { TableComponent } from '../TableComponent';
import {
  HiUserGroup,
  HiStar,
  HiLockClosed,
  HiLockOpen,
  HiExclamationCircle,
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
} from '../../hooks/useSeniorRotation';
import { exportRotationToExcel } from '../ExportRotationExcel';
import { exportRotationToPDF } from '../ExportRotationPDF';
import { Spinner } from 'flowbite-react';

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

interface SeniorProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
  categorization: string; // container, manalagi, bc
}

export function SeniorRotation({
  groups,
  vessel,
  type,
  part,
  job,
  categorization,
}: SeniorProps) {
  // const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
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
  // Alert state removed - using toast instead

  // Modal states
  const [showUnlockModal, setShowUnlockModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  const queryClient = useQueryClient();
  const [isCurrentGroupLocked, setIsCurrentGroupLocked] = useState(false);
  const { lockedRotations } = useLockedRotations(job, vessel);

  // Calculate locked codes from all rotations
  const lockedCadanganCodes = useMemo(() => {
    return Object.values(lockedRotations)
      .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
      .flatMap(lock => lock.lockedCadanganCodes || []);
  }, [lockedRotations, job]);

  // Calculate locked reliever codes (from daratTable) - should NOT be excluded, just marked
  const lockedRelieverCodes = useMemo(() => {
    return Object.values(lockedRotations)
      .filter(lock => lock.job?.toUpperCase() === job.toUpperCase())
      .filter(lock => lock.groupKey !== selectedGroup) // Exclude current group
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
  }, [lockedRotations, job, selectedGroup]);

  // Check if all groups are locked for current job
  const areAllGroupsLocked = useMemo(() => {
    const groupKeys = Object.keys(groups);
    const lockedGroupsForJob = Object.keys(lockedRotations).filter(
      key => lockedRotations[key]?.job?.toUpperCase() === job.toUpperCase()
    );
    return (
      groupKeys.length > 0 &&
      groupKeys.every(key => lockedGroupsForJob.includes(key))
    );
  }, [groups, lockedRotations, job]);

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
  const { lockRotation, unlockRotation } = useLockRotation();
  const { submitRotations, loading: loadingSubmit } = useSubmitRotations();
  const { isSubmitted } = useJobSubmitted(job, vessel);
  const {
    hasChanges,
    count: changesCount,
    affectedGroups,
  } = usePendingChanges(job, vessel);

  // Helper function removed - using toast directly

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
      toast.warning(
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
      await lockRotation({
        groupKey: selectedGroup,
        job: job.toUpperCase(),
        vessel: vessel.toUpperCase(),
        categorization: categorization,
        scheduleTable,
        nahkodaTable,
        daratTable,
        lockedSeamanCodes,
      });

      setIsCurrentGroupLocked(true);
      toast.success(`Rotasi untuk ${selectedGroup} berhasil di-lock!`);

      // Invalidate queries to refetch locked rotations data
      queryClient.invalidateQueries({ queryKey: ['locked-rotations'] });
      queryClient.invalidateQueries({ queryKey: ['job-submitted'] });
      queryClient.invalidateQueries({ queryKey: ['pending-changes'] });
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
      await unlockRotation({
        groupKey: selectedGroup,
        job,
        vessel,
      });

      toast.success(`Rotasi untuk ${selectedGroup} berhasil di-unlock!`);
      setIsCurrentGroupLocked(false);
      setScheduleTable(null);
      setNahkodaTable(null);
      setDaratTable(null);

      // Invalidate queries to refetch locked rotations data
      queryClient.invalidateQueries({ queryKey: ['locked-rotations'] });
      queryClient.invalidateQueries({ queryKey: ['job-submitted'] });
      queryClient.invalidateQueries({ queryKey: ['pending-changes'] });
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
        // selected_group: selectedGroup,
        kapal: kapalList,
        standby: selectedStandby,
        darat: selectedOptional,
        // cadangan: selectedStandby,
        // cadangan2: selectedOptional,
        type: type,
        part: part,
        categorization: categorization,
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

  const filteredCadanganItems = allCadanganItems.filter(
    item => !lockedCadanganCodes.includes(item.seamancode)
  );

  const standByData = filteredCadanganItems;
  const optionalData = filteredCadanganItems.filter(
    item => !selectedStandby.includes(item.seamancode)
  );

  // Export to Excel
  const handleExportToExcel = () => {
    exportRotationToExcel({
      job,
      selectedGroup,
      scheduleTable,
      nahkodaTable,
      daratTable,
    });
    // showAlert('success', 'Excel file exported successfully!');
  };

  // Export to PDF
  const handleExportToPDF = () => {
    exportRotationToPDF({
      job,
      selectedGroup,
      scheduleTable,
      nahkodaTable,
      daratTable,
    });
    // showAlert('success', 'PDF file exported successfully!');
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
    // Extract number from groupKey (e.g., "container_rotation1" -> "1")
    const groupNumber = groupKey.replace('container_rotation', '');
    return `Group ${groupNumber} Container ${getJobDisplayName(job)}`;
  };

  // Handle Submit All Rotations
  const handleSubmitAllRotations = async () => {
    setShowSubmitModal(true);
  };

  // Confirm submit all rotations
  const confirmSubmitAllRotations = async () => {
    setShowSubmitModal(false);

    try {
      const result = await submitRotations({
        job,
        categorization,
      });

      if (result.status === 'success') {
        toast.success(
          `Berhasil mengirim ${result.submitted_count} rotasi! Notifikasi Apollo: ${result.apollo_success} berhasil, ${result.apollo_failed} gagal.`
        );
        // Invalidate queries to update UI without reload
        queryClient.invalidateQueries({ queryKey: ['job-submitted'] });
        queryClient.invalidateQueries({ queryKey: ['pending-changes'] });
        queryClient.invalidateQueries({ queryKey: ['locked-rotations'] });
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
              Generate Container Schedule - {getJobDisplayName(job)}
            </h1>

            {/* Submit Button - Visible when:
              1. All groups locked AND not yet submitted (first submit)
              2. All groups locked AND has pending changes (resubmit after CHANGE)
          */}
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

            {/* Show submitted status - only when submitted and no pending changes */}
            {areAllGroupsLocked && isSubmitted && !hasChanges && (
              <div className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-800 rounded-lg">
                <HiLockClosed className="h-5 w-5" />
                <span className="font-medium">Terkirim</span>
              </div>
            )}
          </div>
          <p className="text-gray-600">
            Generate dan kelola jadwal rotasi CONTAINER {getJobDisplayName(job)}
          </p>
        </div>

        {/* Alert Component removed - using toast */}

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
                <h3 className="text-sm font-semibold text-yellow-800 ">
                  Permintaan Perubahan Terdeteksi
                </h3>
                <p className="text-sm text-yellow-700 mb-2">
                  {changesCount} rotasi pada grup berikut perlu dikirim ulang:
                </p>
                <div className="flex flex-wrap gap-2">
                  {affectedGroups.map((groupKey: string) => (
                    <Badge key={groupKey} color="warning">
                      {groupKey.replace('container_rotation', 'Grup ')}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Card for group selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(groups).map(([groupKey, ships]) => {
            const isLocked = !!lockedRotations[groupKey];
            const hasPendingChange = affectedGroups.includes(groupKey);

            return (
              <div key={groupKey} className="relative">
                {/* Locked Badge */}
                {isLocked && !hasPendingChange && (
                  <div className="absolute top-4 right-4 bg-green-100 rounded-full p-1.5 shadow-sm z-10">
                    <HiLockClosed className="h-4 w-4 text-green-600" />
                  </div>
                )}

                {/* Pending Change Badge - Higher priority than locked */}
                {hasPendingChange && (
                  <div className="absolute top-4 right-4 bg-yellow-100 rounded-full p-1.5 shadow-sm z-10">
                    <HiExclamationCircle className="h-4 w-4 text-yellow-600" />
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
                              <th className="px-4 py-3">Last Location</th>
                              <th className="px-4 py-3">Match Count</th>
                            </tr>
                          </thead>
                          <tbody>
                            {mutasiTable.data.map((item, idx) => (
                              <tr
                                key={idx}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 font-medium">
                                  {item.seamancode}
                                </td>
                                <td className="px-4 py-3">{item.name}</td>
                                <td className="px-4 py-3 text-xs">
                                  {item.vessels}
                                </td>
                                <td className="px-4 py-3">
                                  {item.last_location}
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
                    const isKKMorMasinisII =
                      job === 'KKM' || job === 'masinisII';
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
                            <div className="flex flex-col items-center justify-center py-8 gap-4">
                              <Spinner size="lg" color="failure" />
                              <span className="text-gray-600">
                                Loading potential promotion data...
                              </span>
                            </div>
                          ) : potentialTable &&
                            potentialTable.data.length > 0 ? (
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
                                      <td className="px-4 py-3">
                                        {item.last_location}
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
                              Tidak ada {getJobDisplayName(job)} yang
                              mendapatkan potensial promosi
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
              <h2 className="text-lg font-bold text-gray-900">
                ROTATION PLAN:
              </h2>
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
