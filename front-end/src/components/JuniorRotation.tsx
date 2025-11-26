// src/components/JuniorRotation.tsx
'use client';

import { Button, Spinner } from 'flowbite-react';
import { useState, useEffect, useMemo } from 'react';
import {
  HiUserRemove,
  HiSwitchHorizontal,
  HiLockClosed,
  HiLockOpen,
  HiStar,
} from 'react-icons/hi';
import { CardComponent } from './CardComponent';
import {
  useLockedRotations,
  useCrewToRelieve,
  useReplacementOptions,
  usePromotionCandidates,
  useLockRotation,
  formatJobName,
} from '../hooks/useJuniorRotation';

interface JuniorProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

interface ReplacementOption {
  seamancode: string;
  name: string;
  position: string;
  lastVessel: string;
  status: string;
  certificate: string;
  experience: string;
  phoneNumber: string;
  age: string;
  daysSinceLastVessel: number;
}

// ============= PROMOTION CANDIDATES TABLE COMPONENT =============
interface PromotionTableProps {
  job: string;
  groupKey: string | null;
}

function PromotionCandidatesTable({ job, groupKey }: PromotionTableProps) {
  const { promotionCandidates, loading } = usePromotionCandidates(
    job,
    groupKey,
    true
  );

  const formatJobForPromotion = (jobName: string): string => {
    const jobMapping: Record<string, string> = {
      mualimII: 'MUALIM II',
      mualimIII: 'MUALIM III',
      masinisIII: 'MASINIS III',
      masinisIV: 'MASINIS IV',
      'MUALIM II': 'MUALIM III',
      'MUALIM III': 'MUALIM II',
      'MASINIS III': 'MASINIS IV',
      'MASINIS IV': 'MASINIS III',
    };
    return jobMapping[jobName] || jobName;
  };

  if (loading) {
    return (
      <div className="mt-4 p-6 border border-gray-200 rounded-xl bg-white shadow-sm">
        <div className="flex items-center justify-center py-8">
          <Spinner />
          <span className="ml-2 text-gray-600">Loading promotion data...</span>
        </div>
      </div>
    );
  }

  if (promotionCandidates.length === 0) {
    return null;
  }

  return (
    <div className="mt-4 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
      <div className="flex items-center gap-3 mb-4 pb-3">
        <div className="p-2 bg-yellow-100 rounded-lg">
          <HiStar className="h-5 w-5 text-yellow-600" />
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            POTENTIAL PROMOTION TO {formatJobForPromotion(job)}
          </h2>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-700">
          <thead className="text-xs text-gray-700 uppercase bg-gray-50">
            <tr>
              <th className="px-4 py-3">Seaman Code</th>
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">Rank Saat Ini</th>
              <th className="px-4 py-3">History</th>
              <th className="px-4 py-3">Match Count</th>
            </tr>
          </thead>
          <tbody>
            {promotionCandidates.map((candidate, index) => (
              <tr key={index} className="border-b hover:bg-gray-50">
                <td className="px-4 py-3 font-medium text-gray-900">
                  {candidate.seamancode}
                </td>
                <td className="px-4 py-3">{candidate.name}</td>
                <td className="px-4 py-3">{candidate.rank}</td>
                <td className="px-4 py-3 text-xs text-gray-600">
                  {candidate.history || 'Tidak ada riwayat'}
                </td>
                <td className="px-4 py-3 text-center">
                  {candidate.matchCount}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============= MAIN JUNIOR ROTATION COMPONENT =============
export function JuniorRotation({
  groups,
  vessel: _vessel,
  type: _type,
  part: _part,
  job,
}: JuniorProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [selectedReplacement, setSelectedReplacement] = useState<
    Record<string, ReplacementOption | null>
  >({});
  const [submitting, setSubmitting] = useState(false);

  // ============= TANSTACK QUERY HOOKS =============

  // Load all locked rotations
  const {
    allLockedRotations,
    loading: loadingLocked,
    isGroupLocked,
    getLockedData,
    refetch: refetchLocked,
  } = useLockedRotations(job);

  // Get locked data for current group
  const lockedData = useMemo(
    () => (selectedGroup ? getLockedData(selectedGroup) : null),
    [selectedGroup, getLockedData]
  );

  // Check if current group is locked
  const isCurrentGroupLocked = useMemo(
    () => (selectedGroup ? isGroupLocked(selectedGroup) : false),
    [selectedGroup, isGroupLocked]
  );

  // Load crew to relieve (will use locked data if group is locked)
  const { crewToRelieve, loading: loadingCrew } = useCrewToRelieve(
    selectedGroup,
    groups,
    job,
    lockedData,
    !!selectedGroup
  );

  // Load replacement options
  const { replacementOptions, loading: loadingReplacements } =
    useReplacementOptions(selectedGroup, groups, job, !!selectedGroup);

  // Lock/Unlock mutations
  const { lockRotation, unlockRotation, lockLoading, unlockLoading } =
    useLockRotation();

  // ============= EFFECTS =============

  // Load locked selections when group is locked
  useEffect(() => {
    if (lockedData && selectedGroup) {
      try {
        let relieverData = lockedData.reliever_data;
        if (typeof relieverData === 'string') {
          relieverData = JSON.parse(relieverData);
        }
        setSelectedReplacement(
          (relieverData as Record<string, ReplacementOption | null>) || {}
        );
        console.log(
          'SUCCES! Loaded locked selections for group:',
          selectedGroup
        );
      } catch (error) {
        console.error('FAILED! Error parsing locked reliever data:', error);
        setSelectedReplacement({});
      }
    } else {
      // Clear selections when group is not locked or no group selected
      setSelectedReplacement({});
    }
  }, [lockedData, selectedGroup]);

  // Reset selections when changing job
  useEffect(() => {
    setSelectedGroup(null);
    setSelectedReplacement({});
  }, [job]);

  // ============= HANDLERS =============

  const handleCardClick = (groupKey: string) => {
    setSelectedGroup(groupKey);
  };

  const handleReplacementChange = (
    seamancode: string,
    selectedCode: string | null
  ) => {
    if (isCurrentGroupLocked) return; // Prevent changes on locked group

    setSelectedReplacement(prev => {
      const updated = { ...prev };

      console.log('🧩 handleReplacementChange triggered:', {
        seamancode,
        selectedCode,
      });

      if (!selectedCode || selectedCode === '') {
        delete updated[seamancode];
      } else {
        const replacement = replacementOptions.find(
          r => String(r.seamancode) === String(selectedCode) // pastikan dibandingkan sebagai string
        );
        console.log('🔍 Found replacement:', replacement);
        if (replacement) {
          updated[seamancode] = replacement;
        }
      }

      console.log('SUCCES! Updated state:', updated);
      return updated;
    });
  };

  const handleLockToggle = async () => {
    if (!selectedGroup) return;

    setSubmitting(true);

    try {
      if (isCurrentGroupLocked && lockedData) {
        // Unlock
        await unlockRotation({
          selectedGroup: selectedGroup,
          job: formatJobName(job),
        });
        await refetchLocked(); // Refresh locked rotations
        alert('SUCCES! Data berhasil di-unlock!');
      } else {
        // Lock
        const scheduleTable = crewToRelieve.map(crew => {
          const replacement = selectedReplacement[crew.seamancode];
          return {
            currentCrew: {
              seamancode: crew.seamancode,
              name: crew.name,
              vessel: crew.currentVessel,
              position: crew.currentPosition,
              daysRemaining: crew.daysRemaining,
              daysElapsed: crew.daysElapsed,
              endDate: crew.endDate,
            },
            replacement: replacement
              ? {
                  seamancode: replacement.seamancode,
                  name: replacement.name,
                  position: replacement.position,
                  lastVessel: replacement.lastVessel,
                  status: replacement.status,
                  daysSinceLastVessel: replacement.daysSinceLastVessel,
                }
              : null,
          };
        });

        const lockedSeamanCodes = Object.values(selectedReplacement)
          .filter(r => r !== null)
          .map(r => (r as ReplacementOption).seamancode);

        const payload = {
          groupKey: selectedGroup,
          job: formatJobName(job),
          scheduleTable: JSON.stringify(scheduleTable),
          nahkodaTable: crewToRelieve,
          daratTable: selectedReplacement,
          lockedSeamanCodes: lockedSeamanCodes,
        };

        await lockRotation(payload);
        await refetchLocked(); // Refresh locked rotations
        alert('SUCCES! Data berhasil di-lock!');
      }
    } catch (error: any) {
      console.error('FAILED! Error toggling lock:', error);
      alert(`FAILED! Gagal: ${error.message}`);
    } finally {
      setSubmitting(false);
    }
  };

  // ============= COMPUTED VALUES =============

  const isLoadingAnyData = loadingLocked || loadingCrew || loadingReplacements;

  // ============= RENDER =============

  return (
    <div className="px-6">
      <div className="text-3xl mb-3 font-bold">
        Generate Junior Crew Rotation
      </div>

      {/* Card for group selection */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {Object.entries(groups).map(([groupKey, vessels]) => (
          <div key={groupKey} className="relative">
            <CardComponent
              groupName={`Group ${groupKey.replace('container_rotation', '')}`}
              listShip={vessels}
              isActive={selectedGroup === groupKey}
              onClick={() => handleCardClick(groupKey)}
            />
            {isGroupLocked(groupKey) && (
              <div className="absolute top-4 right-4 bg-green-100 rounded-full p-1.5 shadow-sm">
                <HiLockClosed className="h-4 w-4 text-green-600" />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Main Content */}
      {selectedGroup && (
        <>
          {isLoadingAnyData ? (
            <div className="flex items-center justify-center py-12">
              <Spinner size="xl" />
              <span className="ml-3 text-gray-700">Loading data...</span>
            </div>
          ) : (
            <>
              {/* Crew To Relieve Table */}
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                <div className="lg:col-span-2 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                  <div className="flex items-center justify-between mb-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <HiUserRemove className="h-5 w-5 text-red-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        PERLU GANTI CREW ({formatJobName(job)})
                      </h2>
                    </div>
                  </div>

                  {crewToRelieve.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada crew yang perlu diganti untuk group ini
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                          <tr>
                            <th className="px-4 py-3">Seaman</th>
                            <th className="px-4 py-3">Vessel</th>
                            <th className="px-4 py-3">Sisa Hari</th>
                            <th className="px-4 py-3">Hari Kerja</th>
                            <th className="px-4 py-3 w-[300px]">Pengganti</th>
                          </tr>
                        </thead>
                        <tbody>
                          {crewToRelieve.map((crew, index) => {
                            const replacement =
                              selectedReplacement[crew.seamancode];
                            const isAssigned = !!replacement;

                            return (
                              <tr
                                key={index}
                                className="border-b hover:bg-gray-50"
                              >
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  {crew.seamancode} - {crew.name}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {crew.currentVessel}
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  <span
                                    className={`rounded px-2 py-1 text-xs text-center font-semibold ${
                                      crew.daysElapsed > 365
                                        ? 'bg-red-100 text-red-800'
                                        : crew.daysRemaining < 7
                                          ? 'bg-red-100 text-red-800'
                                          : crew.daysRemaining < 30
                                            ? 'bg-orange-100 text-orange-800'
                                            : 'bg-green-100 text-green-800'
                                    }`}
                                  >
                                    {crew.daysElapsed > 365
                                      ? `+ ${crew.daysElapsed - 365} hari`
                                      : `- ${365 - crew.daysElapsed} hari`}
                                  </span>
                                </td>
                                <td className="px-4 py-3 text-xs">
                                  {crew.daysElapsed} hari
                                </td>
                                <td className="px-4 py-3">
                                  {isCurrentGroupLocked ? (
                                    // 🔒 KONDISI 1: Data LOCKED - Tampilkan read-only
                                    <div className="flex items-center gap-2">
                                      {isAssigned ? (
                                        <span className="text-xs font-medium text-gray-900">
                                          {replacement!.seamancode} -{' '}
                                          {replacement!.name}
                                        </span>
                                      ) : (
                                        <span className="text-xs text-red-600">
                                          Belum dipilih
                                        </span>
                                      )}
                                    </div>
                                  ) : isAssigned ? (
                                    // 🔒 KONDISI 2: UNLOCKED & sudah ada replacement - Tampilkan dengan tombol X
                                    <div className="flex items-center justify-between gap-2">
                                      <span className="text-xs font-medium text-gray-900">
                                        {replacement!.seamancode} -{' '}
                                        {replacement!.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          handleReplacementChange(
                                            crew.seamancode,
                                            null
                                          )
                                        }
                                        className="text-sm text-red-600 hover:text-red-800 font-bold"
                                        title="Hapus pilihan"
                                      >
                                        ✕
                                      </button>
                                    </div>
                                  ) : (
                                    // 🔒 KONDISI 3: UNLOCKED & belum ada replacement - Tampilkan dropdown
                                    <select
                                      className="rounded border-gray-300 text-xs w-full"
                                      value={
                                        selectedReplacement[crew.seamancode]
                                          ?.seamancode || ''
                                      }
                                      onChange={e => {
                                        handleReplacementChange(
                                          crew.seamancode,
                                          e.target.value || null
                                        );
                                      }}
                                      disabled={loadingReplacements}
                                    >
                                      <option value="">
                                        {loadingReplacements
                                          ? 'Loading...'
                                          : '-- Pilih Pengganti --'}
                                      </option>
                                      {replacementOptions
                                        .filter(opt => {
                                          // Filter out seamen yang sudah dipilih di crew lain di group ini
                                          const alreadySelected = Object.values(
                                            selectedReplacement
                                          )
                                            .filter(r => r !== null)
                                            .some(
                                              r =>
                                                r!.seamancode === opt.seamancode
                                            );

                                          if (alreadySelected) return false;

                                          // Filter out seamen yang sudah di-lock di group lain
                                          const lockedRelieverCodes =
                                            allLockedRotations
                                              .filter(
                                                lock =>
                                                  lock.group_key !==
                                                    selectedGroup &&
                                                  lock.is_active
                                              )
                                              .flatMap(lock => {
                                                try {
                                                  const relieverData =
                                                    typeof lock.reliever_data ===
                                                    'string'
                                                      ? JSON.parse(
                                                          lock.reliever_data
                                                        )
                                                      : lock.reliever_data ||
                                                        {};
                                                  return Object.values(
                                                    relieverData
                                                  )
                                                    .filter(r => r !== null)
                                                    .map((r: any) =>
                                                      String(r.seamancode)
                                                    );
                                                } catch {
                                                  return [];
                                                }
                                              });

                                          return !lockedRelieverCodes.includes(
                                            String(opt.seamancode)
                                          );
                                        })
                                        .map(opt => (
                                          <option
                                            key={opt.seamancode}
                                            value={opt.seamancode}
                                          >
                                            {opt.seamancode} - {opt.name} (
                                            {opt.status})
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
                  )}
                </div>

                {/* Replacement Options Table */}
                <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                  <div className="flex flex-col gap-2 mb-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <HiSwitchHorizontal className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        OPSI PENGGANTI
                      </h2>
                    </div>
                  </div>

                  {replacementOptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada crew pengganti tersedia
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500 table-fixed">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-700">
                          <tr>
                            <th className="px-4 py-3 w-[200px]">Seamen</th>
                            <th className="px-4 py-3 w-[140px] text-center">
                              Last Location
                            </th>
                            <th className="px-4 py-3 w-[120px] text-center">
                              Hari Kerja
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {replacementOptions.map((replacement, index) => {
                            // Check if this seaman is locked in another group
                            const lockedInGroup = allLockedRotations.find(
                              lock => {
                                if (
                                  lock.group_key === selectedGroup ||
                                  !lock.is_active
                                )
                                  return false;

                                try {
                                  const relieverData =
                                    typeof lock.reliever_data === 'string'
                                      ? JSON.parse(lock.reliever_data)
                                      : lock.reliever_data || {};

                                  return Object.values(relieverData).some(
                                    (r: any) =>
                                      r &&
                                      String(r.seamancode) ===
                                        String(replacement.seamancode)
                                  );
                                } catch {
                                  return false;
                                }
                              }
                            );

                            const isLockedElsewhere = !!lockedInGroup;
                            const isSelected = Object.values(
                              selectedReplacement
                            ).some(
                              sel =>
                                (sel as ReplacementOption | null)
                                  ?.seamancode === replacement.seamancode
                            );

                            return (
                              <tr
                                key={index}
                                className={`border-b hover:bg-gray-50 ${
                                  isSelected
                                    ? 'bg-green-50'
                                    : isLockedElsewhere
                                      ? 'bg-gray-50 opacity-60'
                                      : ''
                                }`}
                              >
                                <td className="px-4 py-3 font-medium text-gray-900">
                                  <div className="flex flex-col gap-1">
                                    <div className="flex items-center gap-2">
                                      <span className="text-xs">
                                        {replacement.seamancode} -{' '}
                                        {replacement.name}
                                      </span>
                                    </div>
                                    {isLockedElsewhere && lockedInGroup && (
                                      <span className="text-[10px] text-orange-600 font-medium">
                                        Locked di Group{' '}
                                        {lockedInGroup.group_key.replace(
                                          'container_rotation',
                                          ''
                                        )}{' '}
                                        - {lockedInGroup.job}
                                      </span>
                                    )}
                                  </div>
                                </td>
                                <td className="px-4 py-3 text-xs text-center">
                                  {replacement.lastVessel}
                                </td>
                                <td className="px-4 py-3 text-xs font-medium text-gray-700 text-center">
                                  {replacement.daysSinceLastVessel} hari
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </div>

              {/* Promotion Candidates Table (Group 3 & 4 only) */}
              {(selectedGroup === 'container_rotation3' ||
                selectedGroup === 'container_rotation4') && (
                <PromotionCandidatesTable job={job} groupKey={selectedGroup} />
              )}

              {/* Action Buttons */}
              {crewToRelieve.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="flex gap-2">
                    <Button
                      color={isCurrentGroupLocked ? 'red' : 'green'}
                      onClick={handleLockToggle}
                      disabled={
                        submitting || loadingCrew || loadingReplacements
                      }
                      className="flex items-center gap-2"
                    >
                      {submitting || lockLoading || unlockLoading ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          {isCurrentGroupLocked ? 'Unlocking...' : 'Locking...'}
                        </>
                      ) : isCurrentGroupLocked ? (
                        <>
                          <HiLockOpen className="mr-2 h-5 w-5" />
                          Unlock Data
                        </>
                      ) : (
                        <>
                          <HiLockClosed className="mr-2 h-5 w-5" />
                          Lock Data
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </>
      )}
    </div>
  );
}
