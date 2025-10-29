'use client';

import { Button, Spinner } from 'flowbite-react';
import { useState, useEffect } from 'react';
import {
  HiUserRemove,
  HiSwitchHorizontal,
  HiLockClosed,
  HiLockOpen,
  HiCheckCircle,
} from 'react-icons/hi';
import { CardComponent } from './CardComponent';

interface ScheduleProps {
  groups: Record<string, string[]>;
  vessel: string;
  type: string;
  part: string;
  job: string;
}

interface CrewToRelieve {
  seamancode: string;
  name: string;
  currentVessel: string;
  currentPosition: string;
  daysRemaining: number;
  daysElapsed: number;
  endDate: string;
  phoneNumber: string;
  certificate: string;
  reliefReason: 'elapsed' | 'remaining';
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

export function ScheduleRotation({
  groups,
  vessel: _vessel,
  type,
  part,
  job,
}: ScheduleProps) {
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [_selectedGroupVessels, _setSelectedGroupVessels] = useState<string[]>(
    []
  );

  const [crewToRelieve, setCrewToRelieve] = useState<CrewToRelieve[]>([]);
  const [replacementOptions, setReplacementOptions] = useState<
    ReplacementOption[]
  >([]);
  const [replacementInfo, setReplacementInfo] = useState<{
    nextGroup?: string;
  }>({});

  const [selectedReplacement, setSelectedReplacement] = useState<
    Record<string, ReplacementOption | null>
  >({});

  const [loading, setLoading] = useState(false);
  const [loadingReplacements, setLoadingReplacements] = useState(false);
  const [locked, setLocked] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  const formatJobName = (jobName: string): string => {
    const jobMapping: Record<string, string> = {
      mualimII: 'MUALIM II',
      mualimIII: 'MUALIM III',
      masinisIII: 'MASINIS III',
      masinisIV: 'MASINIS IV',
      nakhoda: 'NAKHODA',
      mualimi: 'MUALIM I',
      kkm: 'KKM',
      masinis1: 'MASINIS I',
      masinis2: 'MASINIS II',
    };

    return jobMapping[jobName] || jobName.toUpperCase();
  };

  // Fetch crew to relieve when group is selected
  useEffect(() => {
    if (selectedGroup) {
      fetchCrewToRelieve();
      fetchReplacementOptions();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedGroup, job]);

  const handleCardClick = (groupKey: string) => {
    setSelectedGroup(groupKey);
    _setSelectedGroupVessels(groups[groupKey] || []);
    // Reset selections
    setSelectedReplacement({});
    setLocked(false);
  };

  const fetchCrewToRelieve = async () => {
    if (!selectedGroup) return;

    setLoading(true);
    try {
      // Get vessels from selected group
      const vessels = groups[selectedGroup] || [];
      const vesselQuery = vessels.join(',');

      // Map job names to backend format
      const jobMapping: Record<string, string> = {
        mualimII: 'MUALIM II',
        mualimIII: 'MUALIM III',
        masinisIII: 'MASINIS III',
        masinisIV: 'MASINIS IV',
        nakhoda: 'NAKHODA',
        mualimi: 'MUALIM I',
        kkm: 'KKM',
        masinis1: 'MASINIS I',
        masinis2: 'MASINIS II',
      };
      const mappedJob = jobMapping[job] || job.toUpperCase();

      const response = await fetch(
        `${API_BASE_URL}/get_crew_to_relieve?vessel_group=${encodeURIComponent(
          vesselQuery
        )}&job=${mappedJob}&days_threshold=30&days_elapsed_threshold=335`
      );

      const result = await response.json();

      if (result.status === 'success') {
        setCrewToRelieve(result.data);
      } else {
        console.error('Error:', result.message);
        alert('Gagal memuat data crew: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching crew to relieve:', error);
      alert('Terjadi kesalahan saat memuat data crew');
    } finally {
      setLoading(false);
    }
  };

  const fetchReplacementOptions = async () => {
    if (!selectedGroup) return;

    setLoadingReplacements(true);
    try {
      // Map job names to backend format
      const jobMapping: Record<string, string> = {
        mualimII: 'MUALIM II',
        mualimIII: 'MUALIM III',
        masinisIII: 'MASINIS III',
        masinisIV: 'MASINIS IV',
        nakhoda: 'NAKHODA',
        mualimi: 'MUALIM I',
        kkm: 'KKM',
        masinis1: 'MASINIS I',
        masinis2: 'MASINIS II',
      };
      const mappedJob = jobMapping[job] || job.toUpperCase();

      // Get next group (circular)
      const groupKeys = Object.keys(groups);
      const currentIndex = groupKeys.indexOf(selectedGroup);
      const nextIndex = (currentIndex + 1) % groupKeys.length;
      const nextGroupKey = groupKeys[nextIndex];
      const nextGroupVessels = groups[nextGroupKey] || [];

      // Send next group vessels as query parameter
      const vesselsQuery = nextGroupVessels.join(',');

      const response = await fetch(
        `${API_BASE_URL}/get_available_replacements?job=${mappedJob}&vessel_group=${encodeURIComponent(
          selectedGroup
        )}&next_group=${encodeURIComponent(
          nextGroupKey
        )}&next_group_vessels=${encodeURIComponent(
          vesselsQuery
        )}&day_elapsed_threshold=0`
      );

      const result = await response.json();

      if (result.status === 'success') {
        setReplacementOptions(result.data);
        setReplacementInfo({
          nextGroup: nextGroupKey,
        });
        console.log('Replacement options loaded:', {
          count: result.count,
          current_job: result.job,
          current_group: result.vessel_group,
          next_group: nextGroupKey,
          next_group_vessels: nextGroupVessels,
        });
      } else {
        console.error('Error:', result.message);
        alert('Gagal memuat opsi pengganti: ' + result.message);
      }
    } catch (error) {
      console.error('Error fetching replacements:', error);
      alert('Terjadi kesalahan saat memuat opsi pengganti');
    } finally {
      setLoadingReplacements(false);
    }
  };

  const handleReplacementChange = (
    crewCode: string,
    replacementCode: string
  ) => {
    const replacement = replacementOptions.find(
      r => r.seamancode === replacementCode
    );
    setSelectedReplacement(
      (prev: Record<string, ReplacementOption | null>) => ({
        ...prev,
        [crewCode]: replacement || null,
      })
    );
  };

  const handleSubmitRotation = async () => {
    // Validate all crew have replacements
    const crewWithoutReplacement = crewToRelieve.filter(
      crew => !selectedReplacement[crew.seamancode]
    );

    if (crewWithoutReplacement.length > 0) {
      alert(
        `Masih ada ${crewWithoutReplacement.length} crew yang belum memiliki pengganti. Silakan pilih pengganti untuk semua crew.`
      );
      return;
    }

    if (!confirm('Apakah Anda yakin ingin submit rotation schedule ini?')) {
      return;
    }

    setSubmitting(true);
    try {
      // Prepare rotation data
      const rotations = crewToRelieve.map(crew => ({
        seamancode_out: crew.seamancode,
        seamancode_in: selectedReplacement[crew.seamancode]?.seamancode || '',
        vessel: crew.currentVessel,
        position: crew.currentPosition,
        days_remaining: crew.daysRemaining,
      }));

      // Map job names to backend format
      const jobMapping: Record<string, string> = {
        mualimII: 'MUALIM II',
        mualimIII: 'MUALIM III',
        masinisIII: 'MASINIS III',
        masinisIV: 'MASINIS IV',
        nakhoda: 'NAKHODA',
        mualimi: 'MUALIM I',
        kkm: 'KKM',
        masinis1: 'MASINIS I',
        masinis2: 'MASINIS II',
      };
      const mappedJob = jobMapping[job] || job.toUpperCase();

      const response = await fetch(`${API_BASE_URL}/submit_schedule_rotation`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          rotations,
          vessel_group: selectedGroup,
          job: mappedJob,
          type,
          part,
        }),
      });

      const result = await response.json();

      if (result.status === 'success') {
        alert('✅ Rotation schedule berhasil di-submit!');
        setLocked(true);
        // Optionally refresh data
        // fetchCrewToRelieve();
      } else {
        alert('❌ Gagal submit rotation: ' + result.message);
      }
    } catch (error) {
      console.error('Error submitting rotation:', error);
      alert('❌ Terjadi kesalahan saat submit rotation');
    } finally {
      setSubmitting(false);
    }
  };

  const handleLockToggle = () => {
    if (locked) {
      if (confirm('Apakah Anda yakin ingin membuka kunci data?')) {
        setLocked(false);
      }
    } else {
      setLocked(true);
      alert('🔒 Data telah dikunci.');
    }
  };

  const getDaysRemainingColor = (days: number) => {
    if (days < 7) return 'bg-red-100 text-red-800';
    if (days < 30) return 'bg-orange-100 text-orange-800';
    return 'bg-green-100 text-green-800';
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
            onClick={() => !locked && handleCardClick(groupKey)}
          />
        ))}
      </div>

      {/* ================== TABLES ================== */}
      {selectedGroup ? (
        <>
          {loading ? (
            <div className="flex flex-col justify-center items-center mt-6">
              <Spinner color="info" size="xl" />
              <span className="mt-2 text-gray-700">Loading data...</span>
            </div>
          ) : (
            <>
              <div className="mt-6 grid grid-cols-1 gap-4 lg:grid-cols-3">
                {/* ================== KRU AKAN TURUN ================== */}
                <div className="lg:col-span-2 p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                  <div className="flex items-center justify-between mb-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-red-100 rounded-lg">
                        <HiUserRemove className="h-5 w-5 text-red-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        [PERLU] ROTASI KAPAL {formatJobName(job)}
                      </h2>
                    </div>
                    <span className="text-sm text-gray-500">
                      Group: {selectedGroup?.replace('container_rotation', '')}
                    </span>
                  </div>

                  {crewToRelieve.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada crew yang perlu diganti dalam 30 hari ke depan
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-700">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-50">
                          <tr>
                            <th className="px-4 py-3 w-[240px]">
                              {formatJobName(job)} saat ini
                            </th>
                            <th className="px-4 py-3 w-[140px]">Vessel</th>
                            {/* <th className="px-4 py-3 w-[100px]">Position</th> */}
                            <th className="px-4 py-3 w-[100px]">Sisa Hari</th>
                            <th className="px-4 py-3 w-[100px]">Hari Kerja</th>
                            <th className="px-4 py-3 w-[240px]">Pengganti</th>
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
                                {/* <td className="px-4 py-3 text-xs">
                                  {crew.currentPosition}
                                </td> */}
                                <td className="px-4 py-3">
                                  <span
                                    className={`rounded px-2 py-1 text-xs font-semibold ${getDaysRemainingColor(
                                      crew.daysRemaining
                                    )}`}
                                  >
                                    {crew.daysRemaining} hari
                                  </span>
                                </td>
                                <td className="px-4 py-3">
                                  <span className="text-xs font-medium text-gray-700">
                                    {crew.daysElapsed} hari
                                  </span>
                                </td>

                                {/* Kolom PENGGANTI */}
                                <td className="px-4 py-3">
                                  {locked ? (
                                    <div className="flex items-center gap-2">
                                      {isAssigned ? (
                                        <>
                                          <HiCheckCircle className="h-5 w-5 text-green-600" />
                                          <span className="font-medium text-gray-900">
                                            {replacement.seamancode} -{' '}
                                            {replacement.name}
                                          </span>
                                        </>
                                      ) : (
                                        <span className="text-red-600">
                                          Belum dipilih
                                        </span>
                                      )}
                                    </div>
                                  ) : replacement ? (
                                    <div className="flex items-center gap-2">
                                      <HiCheckCircle className="h-5 w-5 text-green-600" />
                                      <span className="font-medium text-gray-900">
                                        {replacement.seamancode} -{' '}
                                        {replacement.name}
                                      </span>
                                      <button
                                        onClick={() =>
                                          setSelectedReplacement(
                                            (
                                              prev: Record<
                                                string,
                                                ReplacementOption | null
                                              >
                                            ) => ({
                                              ...prev,
                                              [crew.seamancode]: null,
                                            })
                                          )
                                        }
                                        className="text-red-600 hover:text-red-800 text-xs"
                                      >
                                        ✕
                                      </button>
                                    </div>
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
                                      disabled={loadingReplacements}
                                    >
                                      <option value="">
                                        {loadingReplacements
                                          ? 'Loading...'
                                          : 'Pilih Pengganti'}
                                      </option>
                                      {replacementOptions.map(opt => (
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

                {/* ================== OPSI CREW ================== */}
                <div className="p-6 border border-gray-200 rounded-xl bg-white shadow-sm overflow-x-auto">
                  <div className="flex flex-col gap-2 mb-4 pb-3">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-blue-100 rounded-lg">
                        <HiSwitchHorizontal className="h-5 w-5 text-blue-600" />
                      </div>
                      <h2 className="text-lg font-bold text-gray-900">
                        OPSI PENGGANTI
                        {/* ({replacementOptions.length}) */}
                      </h2>
                    </div>
                    {/* {replacementInfo.nextGroup && (
                      <div className="text-xs text-gray-600 ml-11">
                        <div>
                          <span className="font-semibold">Job:</span>{' '}
                          {formatJobName(job)}
                        </div>
                        <div>
                          <span className="font-semibold">Dari Group:</span>{' '}
                          {replacementInfo.nextGroup.replace(
                            'container_rotation',
                            ''
                          )}
                        </div>
                      </div>
                    )} */}
                  </div>

                  {loadingReplacements ? (
                    <div className="flex items-center justify-center py-8">
                      <Spinner />
                      <span className="ml-2 text-gray-600">Loading...</span>
                    </div>
                  ) : replacementOptions.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                      Tidak ada crew pengganti tersedia
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm text-gray-500 table-fixed">
                        <thead className="bg-gray-100 text-xs uppercase text-gray-700">
                          <tr>
                            <th className="px-4 py-3 w-[180px]">Code - Nama</th>
                            <th className="px-3 py-3 w-[120px] text-center">
                              Last Location
                            </th>
                            <th className="px-3 py-3">Status</th>
                            <th className="px-3 py-3">Hari Kerja</th>
                          </tr>
                        </thead>
                        <tbody>
                          {replacementOptions.map((replacement, index) => {
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
                                  isSelected ? 'bg-green-50' : ''
                                }`}
                              >
                                <td className="px-3 py-3 font-medium text-gray-900">
                                  <div className="flex items-center gap-1">
                                    <span className="text-xs">
                                      {replacement.seamancode} -{' '}
                                      {replacement.name}
                                    </span>
                                    {isSelected && (
                                      <HiCheckCircle className="h-4 w-4 text-green-600 flex-shrink-0" />
                                    )}
                                  </div>
                                </td>
                                <td className="px-3 py-3 text-xs">
                                  {replacement.lastVessel}
                                </td>
                                <td className="px-3 py-3 text-xs text-gray-700">
                                  {replacement.status}
                                </td>
                                <td className="px-3 py-3 text-xs font-medium text-gray-700">
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

              {/* ================== ACTION BUTTONS ================== */}
              {crewToRelieve.length > 0 && (
                <div className="flex justify-between items-center mt-4">
                  <div className="text-sm text-gray-600">
                    {
                      Object.keys(selectedReplacement).filter(
                        k => selectedReplacement[k]
                      ).length
                    }{' '}
                    / {crewToRelieve.length} crew sudah dipilih pengganti
                  </div>

                  <div className="flex gap-2">
                    {!locked && (
                      <Button
                        color="success"
                        onClick={handleSubmitRotation}
                        disabled={
                          submitting ||
                          Object.keys(selectedReplacement).filter(
                            k => selectedReplacement[k]
                          ).length !== crewToRelieve.length
                        }
                        className="flex items-center gap-2"
                      >
                        {submitting ? (
                          <>
                            <Spinner size="sm" />
                            Submitting...
                          </>
                        ) : (
                          <>
                            <HiCheckCircle className="h-5 w-5" />
                            Submit Rotation
                          </>
                        )}
                      </Button>
                    )}

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
                </div>
              )}
            </>
          )}
        </>
      ) : null}
    </div>
  );
}
