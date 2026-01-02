// Component untuk menampilkan summary rotasi di Dashboard
'use client';

import { useDashboardRotationData } from '../../hooks/useDashboardRotationData';
import { LoadingSpinner } from '../LoadingComponent';
import { HiLockClosed } from 'react-icons/hi';
import { FaShip } from 'react-icons/fa';
import { Tabs, Accordion } from 'flowbite-react';

export function RotationSummary() {
  const { dashboardData, loading } = useDashboardRotationData();

  if (loading) {
    return (
      <div className="py-8">
        <LoadingSpinner size="lg" message="Loading rotation data..." />
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
    <div className="mb-8">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Rotation Overview
      </h2>

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
                      <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                        {catData.senior.totalGroups} Groups
                      </span>
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
                                <span className="font-medium">Jumlah Group:</span> {stats.totalGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">Jumlah Group Lock:</span> {stats.lockedGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">Jumlah Reliever:</span> {stats.totalRelievers} Reliever{stats.totalRelievers > 1 ? 's' : ''}
                              </div>
                            </div>

                            {/* Accordion for Groups */}
                            <Accordion collapseAll className="border-none rounded-none">
                              <Accordion.Panel>
                                <Accordion.Title className="bg-gray-50 hover:bg-gray-100 py-2 focus:ring-0 text-sm">
                                  Lihat Detail Groups ({stats.totalGroups})
                                </Accordion.Title>
                                <Accordion.Content className="p-3">
                                  <div className="space-y-2">
                                    {job.groups.map((group: any, groupIdx: number) => (
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
                                                  {formatJobTitle(job.jobTitle)} WAJIB:
                                                </span>
                                                <div className="mt-1 ml-2">
                                                  {group.wajib.map((name: string, idx: number) => (
                                                    <div
                                                      key={idx}
                                                      className="text-gray-600"
                                                    >
                                                      • {name}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* RELIEVER */}
                                            {group.reliever.length > 0 && (
                                              <div>
                                                <span className="font-semibold text-gray-700">
                                                  {formatJobTitle(job.jobTitle)} RELIEVER:
                                                </span>
                                                <div className="mt-1 ml-2">
                                                  {group.reliever.map(
                                                    (name: string, idx: number) => (
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
                                    ))}
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
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                        {catData.junior.totalGroups} Groups
                      </span>
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
                                <span className="font-medium">Jumlah Group:</span> {stats.totalGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">Jumlah Group Lock:</span> {stats.lockedGroups} Groups
                                <span className="mx-2 text-gray-400">|</span>
                                <span className="font-medium">Jumlah Reliever:</span> {stats.totalRelievers} Reliever{stats.totalRelievers > 1 ? 's' : ''}
                              </div>
                            </div>

                            {/* Accordion for Groups */}
                            <Accordion collapseAll className="border-none rounded-none">
                              <Accordion.Panel>
                                <Accordion.Title className="bg-gray-50 hover:bg-gray-100 py-2 focus:ring-0 text-sm">
                                  Lihat Detail Groups ({stats.totalGroups})
                                </Accordion.Title>
                                <Accordion.Content className="p-3">
                                  <div className="space-y-2">
                                    {job.groups.map((group: any, groupIdx: number) => (
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
                                                  {formatJobTitle(job.jobTitle)} WAJIB:
                                                </span>
                                                <div className="mt-1 ml-2">
                                                  {group.wajib.map((name: string, idx: number) => (
                                                    <div
                                                      key={idx}
                                                      className="text-gray-600"
                                                    >
                                                      • {name}
                                                    </div>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {/* RELIEVER */}
                                            {group.reliever.length > 0 && (
                                              <div>
                                                <span className="font-semibold text-gray-700">
                                                  {formatJobTitle(job.jobTitle)} RELIEVER:
                                                </span>
                                                <div className="mt-1 ml-2">
                                                  {group.reliever.map(
                                                    (name: string, idx: number) => (
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
                                    ))}
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
