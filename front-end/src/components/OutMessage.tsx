'use client';
import { useMemo, useState, useEffect } from 'react';
import { useRotationSubmissions } from '../hooks/useSeniorRotation';
import { Spinner } from 'flowbite-react';

export function OutMessage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all submissions (no job filter initially)
  const { submissions, loading } = useRotationSubmissions();

  // Filter submissions
  const filteredSubmissions = useMemo(() => {
    let result = submissions;

    // Filter by job
    if (jobFilter !== 'ALL') {
      result = result.filter(
        (sub: any) => sub.job?.toUpperCase() === jobFilter.toUpperCase()
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter(
        (sub: any) => sub.status_data?.toUpperCase() === statusFilter.toUpperCase()
      );
    }

    // Filter by search term
    if (searchTerm) {
      result = result.filter((sub: any) =>
        Object.values(sub).some(val =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }

    return result;
  }, [submissions, jobFilter, statusFilter, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobFilter, statusFilter]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubmissions.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSubmissions.length / itemsPerPage);

  const generatePageNumbers = () => {
    const pages: (number | string)[] = [];
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

  // Count by status
  const statusCounts = useMemo(() => {
    return {
      total: submissions.length,
      pending: submissions.filter(
        (s: any) => s.status_data === 'PENDING'
      ).length,
      accepted: submissions.filter(
        (s: any) => s.status_data === 'ACCEPTED'
      ).length,
      rejected: submissions.filter(
        (s: any) => s.status_data === 'REJECTED'
      ).length,
    };
  }, [submissions]);

  if (loading) {
    return (
      <section className="p-6 flex-1 overflow-y-auto">
        <div className="flex items-center justify-center h-screen">
          <div className="text-center">
            <Spinner size="xl" color="info" />
            <p className="mt-4 text-gray-600 text-lg">Loading submissions...</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">
        Out Information (Rotation Submissions)
      </h1>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Total Submissions</p>
          <h2 className="text-3xl font-bold text-gray-900">{statusCounts.total}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Pending</p>
          <h2 className="text-3xl font-bold text-yellow-600">{statusCounts.pending}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Accepted</p>
          <h2 className="text-3xl font-bold text-green-600">{statusCounts.accepted}</h2>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
          <p className="text-sm text-gray-600 font-medium">Rejected</p>
          <h2 className="text-3xl font-bold text-red-600">{statusCounts.rejected}</h2>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <input
          type="text"
          placeholder="Search submissions..."
          className="w-full p-2 border rounded-lg shadow-sm"
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        {/* Job Filter */}
        <select
          value={jobFilter}
          onChange={e => setJobFilter(e.target.value)}
          className="p-2 border rounded-lg shadow-sm"
        >
          <option value="ALL">All Jobs</option>
          <option value="NAKHODA">NAKHODA</option>
          <option value="KKM">KKM</option>
          <option value="MUALIM I">MUALIM I</option>
          <option value="MASINIS II">MASINIS II</option>
        </select>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
          className="p-2 border rounded-lg shadow-sm"
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CHANGE">CHANGE</option>
        </select>
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-md bg-white">
        <table className="min-w-full border-collapse">
          <thead className="bg-gray-800 text-white">
            <tr>
              {[
                'Job',
                'Group',
                'Seaman Code',
                'Name',
                'Mutation From',
                'Mutation To',
                'Tanggal',
                'Tanggal Ready',
                'Auto Accept At',
                'Status',
                'Created At',
              ].map(header => (
                <th
                  key={header}
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider border-b border-gray-700"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={12} className="px-4 py-8 text-center text-gray-500">
                  No submissions found
                </td>
              </tr>
            ) : (
              currentItems.map((item: any, idx: number) => (
                <tr key={idx} className="hover:bg-gray-50 transition">
                  <td className="px-4 py-3 text-sm font-medium border-b">
                    {item.job}
                  </td>
                      <td className="px-4 py-3 text-sm border-b">
                      {item.group_key?.startsWith('container_rotation') 
                        ? `Group ${item.group_key.replace('container_rotation', '')}` 
                        : item.group_key}
                      </td>
                  <td className="px-4 py-3 text-sm font-medium border-b">
                    {item.seamancode}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">{item.nama}</td>
                  <td className="px-4 py-3 text-sm text-gray-600 border-b">
                    {item.mutation_from}
                  </td>
                  <td className="px-4 py-3 text-sm text-blue-600 font-medium border-b">
                    {item.mutation_to}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {item.tanggal
                      ? new Date(item.tanggal).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {item.tanggal_ready
                      ? new Date(item.tanggal_ready).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {item.auto_accept_at
                      ? new Date(item.auto_accept_at).toLocaleDateString('id-ID')
                      : '-'}
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status_data === 'PENDING'
                          ? 'bg-yellow-100 text-yellow-800'
                          : item.status_data === 'ACCEPTED'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {item.status_data}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm border-b">
                    {new Date(item.created_at).toLocaleDateString('id-ID')}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Count */}
      <div className="mt-4 text-sm text-gray-600">
        Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, filteredSubmissions.length)} of {filteredSubmissions.length} submissions
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 border rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Previous
            </button>

            {generatePageNumbers().map((page, index) =>
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2">
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  onClick={() => setCurrentPage(page as number)}
                  className={`px-3 py-1 border rounded-lg shadow-sm hover:bg-gray-100 ${
                    currentPage === page
                      ? 'bg-blue-500 text-white hover:bg-blue-600'
                      : ''
                  }`}
                >
                  {page}
                </button>
              )
            )}

            <button
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 border rounded-lg shadow-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100"
            >
              Next
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="p-1 border rounded-lg shadow-sm"
            >
              {[10, 20, 50, 100].map(num => (
                <option key={num} value={num}>
                  {num}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}
    </section>
  );
}
