'use client';
import { useMemo, useState, useEffect } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faMagnifyingGlass,
  faUsers,
  faShip,
  faHouse,
} from '@fortawesome/free-solid-svg-icons';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from 'recharts';
import { useDashboardData } from '../../hooks/useDashboardData';
import { useSimilarSeamen } from '../../hooks/useSimilarSeamen';
import { LoadingComponent, LoadingSpinner } from '../LoadingComponent';
import { RotationSummary } from './RotationSummary';

export function Dashboard() {
  const { seamenData, loading } = useDashboardData();
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedSeamanCode, setSelectedSeamanCode] = useState<string | null>(
    null
  );
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState('');

  const { similarSeamen, loading: loadingSimilar } =
    useSimilarSeamen(selectedSeamanCode);

  const excludedStatus = [
    'PENDING CUTI',
    'DARAT BIASA',
    'DARAT STAND-BY',
    'PENDING GAJI',
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
    return <LoadingComponent message="Loading dashboard data..." />;
  }

  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Ship Personnel Management
      </h1>

      {/* === Dashboard with Pie Charts === */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Statistics Cards */}
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
                icon={faHouse}
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
            Seamen Distribution
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
            Offboard Distribution
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
                {offboardDistribution.map((entry, index) => {
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

      {/* Rotation Summary Section */}
      <RotationSummary />

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 border rounded-lg shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-md">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-800 text-white">
            <tr>
              {[
                'SEAMAN CODE',
                'SEAFARER CODE',
                'SEAMAN NAME',
                'RANK',
                'VESSEL',
                'UMUR',
                'CERTIFICATE',
                'DAY REMAINS',
                'ACTION',
              ].map(header => (
                <th key={header} className="p-3 border text-sm font-semibold">
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {currentItems.map((item, idx) => (
              <tr key={idx} className="hover:bg-gray-100 transition">
                {Object.values(item).map((value, i) => (
                  <td key={i} className="p-2 border text-center">
                    {value}
                  </td>
                ))}
                <td className="p-2 border text-center">
                  <button
                    onClick={() => showSimilar(item['SEAMAN CODE'])}
                    className="text-blue-600 hover:text-blue-800"
                  >
                    <FontAwesomeIcon icon={faMagnifyingGlass} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg shadow-sm disabled:opacity-50"
          >
            Previous
          </button>

          {generatePageNumbers().map((page, index) =>
            page === '...' ? (
              <span key={index} className="px-2">
                ...
              </span>
            ) : (
              <button
                key={index}
                onClick={() => setCurrentPage(page as number)}
                className={`px-3 py-1 border rounded-lg shadow-sm ${
                  currentPage === page ? 'bg-blue-500 text-white' : ''
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() =>
              setCurrentPage(prev => Math.min(totalPages, prev + 1))
            }
            disabled={currentPage === totalPages}
            className="px-3 py-1 border rounded-lg shadow-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>

        <div className="flex items-center gap-2">
          <span>Items per page:</span>
          <select
            value={itemsPerPage}
            onChange={e => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-1 border rounded-lg shadow-sm"
          >
            {[10, 20, 50].map(num => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center z-50">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
              onClick={closeModal}
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Top 5 Similar Seamen</h2>

            {loadingSimilar ? (
              <div className="py-8">
                <LoadingSpinner size="md" message="Loading similar seamen..." />
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full border border-gray-300 rounded-md">
                  <thead className="bg-gray-200">
                    <tr>
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
                        <th key={header} className="p-2 border text-sm">
                          {header}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {similarSeamen.length > 0 ? (
                      similarSeamen.map((seaman, idx) => (
                        <tr key={idx} className="hover:bg-gray-100 transition">
                          <td className="p-2 border">{seaman.seamancode}</td>
                          <td className="p-2 border">{seaman.seafarercode}</td>
                          <td className="p-2 border">{seaman.name}</td>
                          <td className="p-2 border">{seaman.last_position}</td>
                          <td className="p-2 border">{seaman.last_location}</td>
                          <td className="p-2 border">{seaman.age}</td>
                          <td className="p-2 border">{seaman.certificate}</td>
                          <td className="p-2 border">
                            {seaman['DAY REMAINS DIFF']}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={8} className="p-2 border text-center">
                          No similar seamen found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </section>
  );
}
