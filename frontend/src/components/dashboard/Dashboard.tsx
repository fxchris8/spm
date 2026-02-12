'use client';
import { useMemo, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  TextInput,
  Table,
  Select,
  Modal,
  Spinner,
} from 'flowbite-react';
import {
  faUsers,
  faShip,
  faAnchor,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { ConfirmModal } from '../container/ConfirmModal';
import { toast } from 'sonner';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useSimilarSeamen } from '../../hooks/useSimilarSeamen';
import { useManualSync } from '../../hooks/useManualSync';
import { RotationSummary } from './RotationSummary';

export function Dashboard() {
  const { seamenData, loading, refetch } = useDashboardData();
  const { triggerSync, loading: syncLoading } = useManualSync();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeamanCode, setSelectedSeamanCode] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');
  const [showSyncModal, setShowSyncModal] = useState(false);

  const { similarSeamen, loading: loadingSimilar } =
    useSimilarSeamen(selectedSeamanCode);

  const excludedStatus = [
    'PENDING CUTI',
    'DARAT BIASA',
    'DARAT STAND-BY',
    'PENDING GAJI',
    'DARAT',
  ];

  const filteredData = useMemo(() => {
    if (searchTerm === '') {
      return seamenData;
    }

    return seamenData.filter(item =>
      Object.values(item).some(val =>
        (val ?? '').toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  }, [searchTerm, seamenData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const generatePageNumbers = () => {
    const pages = [];
    const range = 2;
    pages.push(1);
    if (currentPage - range > 2) pages.push('...');
    for (
      let i = Math.max(2, currentPage - range);
      i <= Math.min(totalPages - 1, currentPage + range);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage + range < totalPages - 1) pages.push('...');
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  const showSimilar = (seamanCode: string) => {
    setSelectedSeamanCode(seamanCode);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedSeamanCode(null); // Reset, stop query
  };

  const handleManualSync = () => {
    setShowSyncModal(true);
  };

  const confirmSync = async () => {
    setShowSyncModal(false);
    const result = await triggerSync();

    if (result.success) {
      toast.success(result.message);

      // Refresh dashboard data after successful sync
      setTimeout(() => {
        refetch();
      }, 1000);
    } else {
      toast.error(result.message);
    }
  };

  // Hitung seaman onboard & offboard
  const onboardSeamen = seamenData.filter(
    s => !excludedStatus.includes(s.VESSEL?.toUpperCase())
  );
  const offboardSeamen = seamenData.filter(s =>
    excludedStatus.includes(s.VESSEL?.toUpperCase())
  );

  // Hitung distribusi offboard berdasarkan status
  const offboardDistribution = useMemo(() => {
    const statusCounts = {
      'PENDING CUTI': 0,
      'PENDING GAJI': 0,
      'DARAT BIASA': 0,
      DARAT: 0,
      'DARAT STAND-BY': 0,
    };

    offboardSeamen.forEach(seaman => {
      const vessel = seaman.VESSEL?.toUpperCase();
      if (vessel && vessel in statusCounts) {
        statusCounts[vessel as keyof typeof statusCounts]++;
      }
    });

    return Object.entries(statusCounts)
      .filter(([, value]) => value > 0)
      .map(([name, value]) => ({ name, value }));
  }, [offboardSeamen]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner size="xl" color="failure" />
        <span className="text-gray-600">Loading dashboard data...</span>
      </div>
    );
  }

  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold text-gray-800">
            Ship Personnel Management
          </h1>
          <Button onClick={handleManualSync} disabled={syncLoading}>
            {syncLoading ? 'Syncing...' : 'Sinkronisasi - CITRIX'}
          </Button>
        </div>
        <p className="text-gray-600">
          Ikhtisar dan manajemen status serta distribusi seamen di Armada PT
          Salam Pacific Indonesia Lines.
        </p>
      </div>

      {/* === Dashboard with Pie Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="grid grid-cols-1 gap-4">
          {/* Total Seamen */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
            <div className="p-4 bg-red-100 rounded-xl mr-4">
              <FontAwesomeIcon
                icon={faUsers}
                className="text-3xl text-red-600"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Seamen</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {seamenData.length}
              </h2>
            </div>
          </div>

          {/* Total Onboard */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
            <div className="p-4 bg-green-100 rounded-xl mr-4">
              <FontAwesomeIcon
                icon={faShip}
                className="text-3xl text-green-600"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Onboard</p>
              <h2 className="text-3xl font-bold text-gray-900">
                {onboardSeamen.length}
              </h2>
            </div>
          </div>

          {/* Total Offboard */}
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
            <div className="p-4 bg-blue-100 rounded-xl mr-4">
              <FontAwesomeIcon
                icon={faAnchor}
                className="text-3xl text-blue-600"
              />
            </div>
            <div>
              <p className="text-sm text-gray-600 font-medium">
                Total Offboard
              </p>
              <h2 className="text-3xl font-bold text-gray-900">
                {offboardSeamen.length}
              </h2>
            </div>
          </div>
        </div>

        {/* Pie Chart 1 - Seamen Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Distribusi Seamen
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={[
                  {
                    name: 'Onboard',
                    value: onboardSeamen.length,
                    color: '#10b981',
                  },
                  {
                    name: 'Offboard',
                    value: offboardSeamen.length,
                    color: '#3b82f6',
                  },
                ]}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {[
                  {
                    name: 'Onboard',
                    value: onboardSeamen.length,
                    color: '#10b981',
                  },
                  {
                    name: 'Offboard',
                    value: offboardSeamen.length,
                    color: '#3b82f6',
                  },
                ].map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Pie Chart 2 - Offboard Distribution */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            Distribusi Offboard
          </h3>
          <ResponsiveContainer width="100%" height={350}>
            <PieChart>
              <Pie
                data={offboardDistribution}
                cx="50%"
                cy="45%"
                labelLine={false}
                label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                outerRadius={90}
                fill="#8884d8"
                dataKey="value"
              >
                {offboardDistribution.map((_, index) => {
                  const colors = [
                    '#ef4444',
                    '#f59e0b',
                    '#3b82f6',
                    '#8b5cf6',
                    '#ec4899',
                  ];
                  return (
                    <Cell
                      key={`cell-${index}`}
                      fill={colors[index % colors.length]}
                    />
                  );
                })}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-6">
        <TextInput
          id="search"
          type="text"
          placeholder="Cari data seamen..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <Table hoverable>
          <Table.Head>
            {[
              'NO',
              'SEAMAN CODE',
              'SEAFARER CODE',
              'SEAMAN NAME',
              'RANK',
              'VESSEL',
              'AGE',
              'CERTIFICATE',
              'DAY REMAINS',
              'SIMILARITY',
            ].map(header => (
              <Table.HeadCell key={header} className="bg-gray-800 text-white">
                {header}
              </Table.HeadCell>
            ))}
          </Table.Head>
          <Table.Body className="divide-y">
            {currentItems.map((item, idx) => (
              <Table.Row key={idx} className="bg-white">
                <Table.Cell className="text-left text-gray-800">
                  {idx + 1}
                </Table.Cell>
                {Object.values(item).map((value, i) => (
                  <Table.Cell key={i} className="text-left text-gray-800">
                    {value}
                  </Table.Cell>
                ))}
                <Table.Cell>
                  <Button
                    size="xs"
                    onClick={() => showSimilar(item['SEAMAN CODE'])}
                    className="!bg-blue-600 hover:!bg-blue-700 text-white"
                  >
                    CHECK
                  </Button>
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Button
            size="sm"
            className="text-gray-500 !bg-transparent"
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
          >
            <FontAwesomeIcon icon={faChevronLeft} />
          </Button>

          {generatePageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={index} className="px-2">
                ...
              </span>
            ) : (
              <Button
                key={index}
                size="sm"
                className={
                  currentPage === page
                    ? '!bg-gray-500 text-white border border-gray-200'
                    : '!bg-white text-gray-500 hover:!bg-gray-100 border border-gray-200'
                }
                onClick={() => setCurrentPage(page as number)}
              >
                {page}
              </Button>
            )
          )}

          <Button
            size="sm"
            className="text-gray-500 !bg-transparent"
            onClick={() =>
              setCurrentPage(prev => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
          >
            <FontAwesomeIcon icon={faChevronRight} />
          </Button>
        </div>

        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>Item per halaman:</span>
          <Select
            sizing="sm"
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
          >
            {[10, 20, 50, 100].map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="mt-12 pt-8 border-t border-gray-200">
        <RotationSummary />
      </div>

      {/* Modal */}
      <Modal show={modalOpen} onClose={closeModal} size="5xl">
        <Modal.Header>Top 5 Seamen yang Serupa</Modal.Header>
        <Modal.Body>
          {loadingSimilar ? (
            <div className="py-8 flex flex-col items-center justify-center gap-4">
              <Spinner size="lg" color="failure" />
              <span className="text-gray-600">Loading similar seamen...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table hoverable>
                <Table.Head>
                  {[
                    'SEAMAN CODE',
                    'SEAFARER CODE',
                    'SEAMAN NAME',
                    'LAST POSITION',
                    'LAST LOCATION',
                    'AGE',
                    'CERTIFICATE',
                    'DAY REMAINS DIFF',
                  ].map(header => (
                    <Table.HeadCell
                      key={header}
                      className="bg-gray-800 text-white"
                    >
                      {header}
                    </Table.HeadCell>
                  ))}
                </Table.Head>
                <Table.Body className="divide-y">
                  {similarSeamen.length > 0 ? (
                    similarSeamen.map((seaman, idx) => (
                      <Table.Row key={idx} className="bg-white">
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.seamancode}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.seafarercode}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.name}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.last_position}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.last_location}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.age}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman.certificate}
                        </Table.Cell>
                        <Table.Cell className="text-left text-gray-800">
                          {seaman['DAY REMAINS DIFF']}
                        </Table.Cell>
                      </Table.Row>
                    ))
                  ) : (
                    <Table.Row>
                      <Table.Cell
                        colSpan={8}
                        className="text-center text-gray-800"
                      >
                        Tidak ada data seamen serupa ditemukan.
                      </Table.Cell>
                    </Table.Row>
                  )}
                </Table.Body>
              </Table>
            </div>
          )}
        </Modal.Body>
      </Modal>

      <ConfirmModal
        show={showSyncModal}
        onClose={() => setShowSyncModal(false)}
        onConfirm={confirmSync}
        confirmColor="failure"
        message={
          <>
            Apakah anda yakin ingin melakukan Sinkronisasi Data?
            <br />
            <span className="text-sm">
              Tindakan ini akan menggantikan data seaman dan mutasi saat ini
              dengan data terbaru dari CITRIX.
            </span>
          </>
        }
        confirmText="Ya, Sinkronisasi"
        cancelText="Batal"
      />
    </section>
  );
}
