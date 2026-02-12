'use client';
import { useMemo, useState, useEffect } from 'react';
import { useRotationSubmissions } from '../../hooks/useSeniorRotation';
import { Button, TextInput, Table, Select, Spinner } from 'flowbite-react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  faList,
  faClock,
  faCheckCircle,
  faExchangeAlt,
  faChevronLeft,
  faChevronRight,
} from '@fortawesome/free-solid-svg-icons';

export function InMessage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [jobFilter, setJobFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  // Fetch all submissions
  const { submissions, loading } = useRotationSubmissions();

  // Filter submissions - hanya yang sudah ada response dari pusat (tanggal_ready tidak null)
  const incomingMessages = useMemo(() => {
    // Filter hanya yang sudah ada tanggal_ready (sudah di-respond oleh tim pusat)
    return submissions.filter((sub: any) => sub.tanggal_ready !== null);
  }, [submissions]);

  // Apply additional filters
  const filteredSubmissions = useMemo(() => {
    let result = incomingMessages;

    // Filter by job
    if (jobFilter !== 'ALL') {
      result = result.filter(
        (sub: any) => sub.job?.toUpperCase() === jobFilter.toUpperCase()
      );
    }

    // Filter by status
    if (statusFilter !== 'ALL') {
      result = result.filter(
        (sub: any) =>
          sub.status_data?.toUpperCase() === statusFilter.toUpperCase()
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
  }, [incomingMessages, jobFilter, statusFilter, searchTerm]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, jobFilter, statusFilter]);

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSubmissions.slice(
    indexOfFirstItem,
    indexOfLastItem
  );
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

  // Count by status for incoming messages
  const statusCounts = useMemo(() => {
    return {
      total: incomingMessages.length,
      change: incomingMessages.filter((s: any) => s.status_data === 'CHANGE')
        .length,
      familiarisasi: incomingMessages.filter(
        (s: any) =>
          s.status_data === 'CHANGE' &&
          s.stage?.toUpperCase() === 'FAMILIARISASI'
      ).length,
      konfirmasi: incomingMessages.filter(
        (s: any) =>
          s.status_data === 'CHANGE' &&
          s.stage?.toUpperCase() === 'KONFIRMASI ROB'
      ).length,
    };
  }, [incomingMessages]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner size="xl" color="failure" />
        <span className="text-gray-600">Loading incoming messages...</span>
      </div>
    );
  }

  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold text-gray-800">
            In Messages (Pesan Masuk)
          </h1>
        </div>
        <p className="text-gray-600">
          Riwayat pesan masuk dari tim IT untuk keperluan melakukan rotation
          plan kembali.
        </p>
      </div>

      {/* Dashboard Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {/* Total Messages */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
          <div className="p-4 bg-blue-100 rounded-xl mr-4">
            <FontAwesomeIcon icon={faList} className="text-3xl text-blue-600" />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Total In Messages
            </p>
            <h2 className="text-3xl font-bold text-gray-900">
              {statusCounts.total}
            </h2>
          </div>
        </div>

        {/* Change Requests */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
          <div className="p-4 bg-orange-100 rounded-xl mr-4">
            <FontAwesomeIcon
              icon={faExchangeAlt}
              className="text-3xl text-orange-600"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">Change Requests</p>
            <h2 className="text-3xl font-bold text-orange-600">
              {statusCounts.change}
            </h2>
          </div>
        </div>

        {/* Change Dari Familiarisasi */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
          <div className="p-4 bg-yellow-100 rounded-xl mr-4">
            <FontAwesomeIcon
              icon={faClock}
              className="text-3xl text-yellow-600"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Change from Konfirmasi ROB
            </p>
            <h2 className="text-3xl font-bold text-yellow-600">
              {statusCounts.konfirmasi}
            </h2>
          </div>
        </div>

        {/* KONFIRMASI */}
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm transition-shadow p-6 flex items-center">
          <div className="p-4 bg-yellow-100 rounded-xl mr-4">
            <FontAwesomeIcon
              icon={faCheckCircle}
              className="text-3xl text-yellow-600"
            />
          </div>
          <div>
            <p className="text-sm text-gray-600 font-medium">
              Change from Familiarisasi
            </p>
            <h2 className="text-3xl font-bold text-yellow-600">
              {statusCounts.familiarisasi}
            </h2>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        {/* Search */}
        <TextInput
          id="search"
          type="text"
          placeholder="Search incoming messages..."
          value={searchTerm}
          onChange={e => setSearchTerm(e.target.value)}
        />

        {/* Job Filter */}
        <Select value={jobFilter} onChange={e => setJobFilter(e.target.value)}>
          <option value="ALL">All Jobs</option>
          <option value="NAKHODA">NAKHODA</option>
          <option value="KKM">KKM</option>
          <option value="MUALIM I">MUALIM I</option>
          <option value="MASINIS II">MASINIS II</option>
        </Select>

        {/* Status Filter */}
        <Select
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value)}
        >
          <option value="ALL">All Status</option>
          <option value="PENDING">PENDING</option>
          <option value="ACCEPTED">ACCEPTED</option>
          <option value="REJECTED">REJECTED</option>
          <option value="CHANGE">CHANGE</option>
        </Select>
      </div>
      <div className="overflow-x-auto rounded-xl bg-white">
        <Table hoverable className="min-w-full border-collapse">
          <Table.Head>
            {[
              'No',
              'Category',
              'Job',
              'Group',
              'Seaman Code',
              'Name',
              'From',
              'To',
              'Ready Date',
              'Status',
              'Stage',
              'Updated At',
            ].map(header => (
              <Table.HeadCell key={header} className="bg-gray-800 text-white">
                {header}
              </Table.HeadCell>
            ))}
          </Table.Head>
          <Table.Body className="divide-y divide-gray-200">
            {currentItems.length === 0 ? (
              <Table.Row>
                <Table.Cell
                  colSpan={11}
                  className="px-4 py-8 text-center text-gray-500"
                >
                  No incoming messages found
                </Table.Cell>
              </Table.Row>
            ) : (
              currentItems.map((item: any, idx: number) => (
                <Table.Row key={idx} className="bg-white">
                  <Table.Cell className="text-left text-gray-800">
                    {idx + 1}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.categorization.toUpperCase()}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.job}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.group_key?.startsWith('container_rotation')
                      ? `Group ${item.group_key.replace(
                          'container_rotation',
                          ''
                        )}`
                      : item.group_key?.startsWith('manalagi_rotation')
                        ? `Group ${item.group_key.replace(
                            'manalagi_rotation',
                            ''
                          )}`
                        : item.group_key}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.seamancode}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.nama}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.mutation_from}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.mutation_to}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.tanggal_ready
                      ? new Date(item.tanggal_ready).toLocaleDateString('id-ID')
                      : '-'}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        item.status_data === 'CHANGE'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {item.status_data}
                    </span>
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {item.stage}
                  </Table.Cell>
                  <Table.Cell className="text-left text-gray-800">
                    {new Date(item.updated_at).toLocaleDateString('id-ID', {
                      year: 'numeric',
                      month: 'numeric',
                      day: 'numeric',
                    })}
                  </Table.Cell>
                </Table.Row>
              ))
            )}
          </Table.Body>
        </Table>
      </div>

      {/* Count
      <div className="mt-4 text-sm text-gray-600">
        Showing {indexOfFirstItem + 1}-
        {Math.min(indexOfLastItem, filteredSubmissions.length)} of{' '}
        {filteredSubmissions.length} messages
      </div> */}

      {totalPages > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Button
              size="sm"
              className="text-gray-500 !bg-transparent text-sm"
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </Button>

            {generatePageNumbers().map((page, index) =>
              page === '...' ? (
                <span key={`ellipsis-${index}`} className="px-2">
                  ...
                </span>
              ) : (
                <Button
                  key={`page-${page}`}
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
              className="text-gray-500 !bg-transparent text-sm"
              onClick={() =>
                setCurrentPage(prev => Math.min(totalPages, prev + 1))
              }
              disabled={currentPage === totalPages}
            >
              <FontAwesomeIcon icon={faChevronRight} />
            </Button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
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
      )}
    </section>
  );
}
