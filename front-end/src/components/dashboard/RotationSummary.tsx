// Component untuk menampilkan summary rotasi di Dashboard
'use client';

import { useDashboardRotationData } from '../../hooks/useDashboardRotationData';
import { useVesselStats } from '../../hooks/useVesselStats';
import { Spinner, Tabs, Accordion, Badge } from 'flowbite-react';
import { HiLockClosed } from 'react-icons/hi';
import { FaShip } from 'react-icons/fa';

export function RotationSummary() {
  const { dashboardData, loading } = useDashboardRotationData();
  const { vesselStats, loading: loadingVesselStats } = useVesselStats();

  if (loading || loadingVesselStats) {
    return (
      <div className="flex flex-col items-center justify-center py-12 gap-4">
        <Spinner size="xl" color="failure" />
        <span className="text-gray-600">Loading rotation data...</span>
      </div>
    );
  }

  // Helper function to format categorization name
  const formatCategorization = (cat: string): string => {
    switch (cat) {
      case 'container':
        return 'Container';
      case 'manalagi':
        return 'Manalagi';
      case 'bc':
        return 'Barge Crane';
      default:
        return cat.toUpperCase();
    }
  };

  // Helper function to format job title
  const formatJobTitle = (job: string): string => {
    switch (job) {
      case 'nakhoda':
        return 'Nahkoda';
      case 'KKM':
        return 'KKM';
      case 'mualimI':
        return 'Mualim I';
      case 'mualimII':
        return 'Mualim II';
      case 'mualimIII':
        return 'Mualim III';
      case 'masinisI':
        return 'Masinis I';
      case 'masinisII':
        return 'Masinis II';
      case 'masinisIII':
        return 'Masinis III';
      case 'masinisIV':
        return 'Masinis IV';
      default:
        return job.toUpperCase();
    }
  };

  // Calculate statistics for a job
  const getJobStats = (job: any) => {
    const totalGroups = job.groups.length;
    const lockedGroups = job.groups.filter((g: any) => g.isLocked).length;
    const totalRelievers = job.groups.reduce(
      (sum: number, g: any) => sum + (g.reliever?.length || 0),
      0
    );

    return { totalGroups, lockedGroups, totalRelievers };
  };

  return (
    <div className="mb-6">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold text-gray-800">
            Rotation Overview
          </h1>
        </div>
        <p className="text-gray-600">
          Ringkasan data rotasi dan kapal di PT Salam Pacific Indonesia Lines.
        </p>
      </div>

      {/* Vessel Statistics Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {/* Container */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 font-medium mb-1">
              Total Container
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              {vesselStats.container > 0 ? vesselStats.container : '-'}{' '}
              <span className="text-xs font-normal text-gray-600">vessels</span>
            </h3>
          </div>
        </div>

        {/* Manalagi */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 font-medium mb-1">
              Total Manalagi
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              {vesselStats.manalagi > 0 ? vesselStats.manalagi : '-'}{' '}
              <span className="text-xs font-normal text-gray-600">vessels</span>
            </h3>
          </div>
        </div>

        {/* Barge Crane */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 font-medium mb-1">
              Total Barge Crane
            </p>
            <h3 className="text-2xl font-bold text-gray-900">
              {vesselStats.bc > 0 ? vesselStats.bc : '-'}{' '}
              <span className="text-xs font-normal text-gray-600">vessels</span>
            </h3>
          </div>
        </div>

        {/* MT */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 font-medium mb-1">Total MT</p>
            <h3 className="text-2xl font-bold text-gray-900">
              -{' '}
              <span className="text-xs font-normal text-gray-600">vessels</span>
            </h3>
          </div>
        </div>

        {/* TB */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 font-medium mb-1">Total TB</p>
            <h3 className="text-2xl font-bold text-gray-900">
              -{' '}
              <span className="text-xs font-normal text-gray-600">vessels</span>
            </h3>
          </div>
        </div>

        {/* TK */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6">
          <div className="flex flex-col">
            <p className="text-sm text-gray-600 font-medium mb-1">Total TK</p>
            <h3 className="text-2xl font-bold text-gray-900">
              -{' '}
              <span className="text-xs font-normal text-gray-600">vessels</span>
            </h3>
          </div>
        </div>
      </div>

      {dashboardData.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm">
          <p className="text-gray-600">No rotation data available</p>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <Tabs aria-label="Rotation category tabs" variant="underline">
            {dashboardData.map((catData, idx) => (
              <Tabs.Item
                key={idx}
                active={idx === 0}
                title={formatCategorization(catData.categorization)}
                icon={FaShip}
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 pt-4">
                  {/* SENIOR Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Senior
                      </h4>
                      <Badge className="border border-purple-600 text-purple-600 bg-transparent text-[10px] font-medium rounded-full">
                        {catData.senior.totalGroups} Groups
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {catData.senior.jobs.map((job, jobIdx) => {
                        const stats = getJobStats(job);

                        return (
                          <div
                            key={jobIdx}
                            className="border border-gray-200 rounded-lg bg-gray-50"
                          >
                            {/* Job Header with Statistics */}
                            <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                              <h5 className="font-semibold text-gray-800 mb-2">
                                {formatJobTitle(job.jobTitle)}
                              </h5>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">
                                  Jumlah Group:
                                </span>{' '}
                                {stats.totalGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">
                                  Jumlah Group Lock:
                                </span>{' '}
                                {stats.lockedGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">
                                  Jumlah Reliever:
                                </span>{' '}
                                {stats.totalRelievers} Reliever
                                {stats.totalRelievers > 1 ? 's' : ''}
                              </div>
                            </div>

                            {/* Accordion for Groups */}
                            <Accordion
                              collapseAll
                              className="border-none rounded-none"
                            >
                              <Accordion.Panel>
                                <Accordion.Title className="bg-gray-50 hover:bg-gray-100 py-2 focus:ring-0 text-sm">
                                  Lihat Detail Groups ({stats.totalGroups})
                                </Accordion.Title>
                                <Accordion.Content className="p-3">
                                  <div className="space-y-2">
                                    {job.groups.map(
                                      (group: any, groupIdx: number) => (
                                        <div
                                          key={groupIdx}
                                          className={`p-3 rounded-md border ${
                                            group.isLocked
                                              ? 'bg-green-50 border-green-200'
                                              : 'bg-white border-gray-200'
                                          }`}
                                        >
                                          {/* Group Header */}
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-800">
                                              {group.groupName}
                                            </span>
                                            {group.isLocked && (
                                              <div className="flex items-center gap-1 text-green-700">
                                                <HiLockClosed className="h-4 w-4" />
                                                <span className="text-xs font-medium">
                                                  Locked
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Show names if locked */}
                                          {group.isLocked && (
                                            <div className="mt-2 space-y-2 text-sm">
                                              {/* WAJIB */}
                                              {group.wajib.length > 0 && (
                                                <div>
                                                  <span className="font-semibold text-gray-700">
                                                    {formatJobTitle(
                                                      job.jobTitle
                                                    )}{' '}
                                                    WAJIB:
                                                  </span>
                                                  <div className="mt-1 ml-2">
                                                    {group.wajib.map(
                                                      (
                                                        name: string,
                                                        idx: number
                                                      ) => (
                                                        <div
                                                          key={idx}
                                                          className="text-gray-600"
                                                        >
                                                          • {name}
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {/* RELIEVER */}
                                              {group.reliever.length > 0 && (
                                                <div>
                                                  <span className="font-semibold text-gray-700">
                                                    {formatJobTitle(
                                                      job.jobTitle
                                                    )}{' '}
                                                    RELIEVER:
                                                  </span>
                                                  <div className="mt-1 ml-2">
                                                    {group.reliever.map(
                                                      (
                                                        name: string,
                                                        idx: number
                                                      ) => (
                                                        <div
                                                          key={idx}
                                                          className="text-gray-600"
                                                        >
                                                          • {name}
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Show message if not locked */}
                                          {!group.isLocked && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              Not yet locked
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </Accordion.Content>
                              </Accordion.Panel>
                            </Accordion>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* JUNIOR Section */}
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Junior
                      </h4>
                      <Badge
                        color="info"
                        className="border border-blue-600 text-blue-600 bg-transparent text-[10px] font-medium rounded-full"
                      >
                        {catData.junior.totalGroups} Groups
                      </Badge>
                    </div>

                    <div className="space-y-3">
                      {catData.junior.jobs.map((job, jobIdx) => {
                        const stats = getJobStats(job);

                        return (
                          <div
                            key={jobIdx}
                            className="border border-gray-200 rounded-lg bg-gray-50"
                          >
                            {/* Job Header with Statistics */}
                            <div className="p-3 border-b border-gray-200 bg-white rounded-t-lg">
                              <h5 className="font-semibold text-gray-800 mb-2">
                                {formatJobTitle(job.jobTitle)}
                              </h5>
                              <div className="text-sm text-gray-700">
                                <span className="font-medium">
                                  Jumlah Group:
                                </span>{' '}
                                {stats.totalGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">
                                  Jumlah Group Lock:
                                </span>{' '}
                                {stats.lockedGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">
                                  Jumlah Reliever:
                                </span>{' '}
                                {stats.totalRelievers} Reliever
                                {stats.totalRelievers > 1 ? 's' : ''}
                              </div>
                            </div>

                            {/* Accordion for Groups */}
                            <Accordion
                              collapseAll
                              className="border-none rounded-none"
                            >
                              <Accordion.Panel>
                                <Accordion.Title className="bg-gray-50 hover:bg-gray-100 py-2 focus:ring-0 text-sm">
                                  Lihat Detail Groups ({stats.totalGroups})
                                </Accordion.Title>
                                <Accordion.Content className="p-3">
                                  <div className="space-y-2">
                                    {job.groups.map(
                                      (group: any, groupIdx: number) => (
                                        <div
                                          key={groupIdx}
                                          className={`p-3 rounded-md border ${
                                            group.isLocked
                                              ? 'bg-green-50 border-green-200'
                                              : 'bg-white border-gray-200'
                                          }`}
                                        >
                                          {/* Group Header */}
                                          <div className="flex items-center justify-between mb-2">
                                            <span className="font-medium text-gray-800">
                                              {group.groupName}
                                            </span>
                                            {group.isLocked && (
                                              <div className="flex items-center gap-1 text-green-700">
                                                <HiLockClosed className="h-4 w-4" />
                                                <span className="text-xs font-medium">
                                                  Locked
                                                </span>
                                              </div>
                                            )}
                                          </div>

                                          {/* Show names if locked */}
                                          {group.isLocked && (
                                            <div className="mt-2 space-y-2 text-sm">
                                              {/* WAJIB */}
                                              {group.wajib.length > 0 && (
                                                <div>
                                                  <span className="font-semibold text-gray-700">
                                                    {formatJobTitle(
                                                      job.jobTitle
                                                    )}{' '}
                                                    WAJIB:
                                                  </span>
                                                  <div className="mt-1 ml-2">
                                                    {group.wajib.map(
                                                      (
                                                        name: string,
                                                        idx: number
                                                      ) => (
                                                        <div
                                                          key={idx}
                                                          className="text-gray-600"
                                                        >
                                                          • {name}
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}

                                              {/* RELIEVER */}
                                              {group.reliever.length > 0 && (
                                                <div>
                                                  <span className="font-semibold text-gray-700">
                                                    {formatJobTitle(
                                                      job.jobTitle
                                                    )}{' '}
                                                    RELIEVER:
                                                  </span>
                                                  <div className="mt-1 ml-2">
                                                    {group.reliever.map(
                                                      (
                                                        name: string,
                                                        idx: number
                                                      ) => (
                                                        <div
                                                          key={idx}
                                                          className="text-gray-600"
                                                        >
                                                          • {name}
                                                        </div>
                                                      )
                                                    )}
                                                  </div>
                                                </div>
                                              )}
                                            </div>
                                          )}

                                          {/* Show message if not locked */}
                                          {!group.isLocked && (
                                            <p className="text-xs text-gray-500 mt-1">
                                              Not yet locked
                                            </p>
                                          )}
                                        </div>
                                      )
                                    )}
                                  </div>
                                </Accordion.Content>
                              </Accordion.Panel>
                            </Accordion>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </Tabs.Item>
            ))}
          </Tabs>
        </div>
      )}
    </div>
  );
}
