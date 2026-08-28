'use client';

import { useEffect, useRef, useState } from 'react';
import {
  Card,
  Label,
  Select,
  TextInput,
  Button,
  Table,
  Pagination,
  Spinner,
  Badge,
  ToggleSwitch,
} from 'flowbite-react';

import { CallComponent } from '../CallComponent';

interface OffDutySeaman {
  seamancode: number;
  seafarercode: number;
  name: string;
  last_position: string;
  last_location: string;
  prevlocation: string;
  age: number;
  certificate: string;
  end_date: string;
  offboard_status: string;
  phone_number_1: string;
  phone_number_2: string;
  phone_number_3: string;
  phone_number_4: string;
}

// Fixed list of all possible ranks (not derived from results, so it never shrinks)
const ALL_RANKS = [
  'NAKHODA',
  'MUALIM I',
  'MUALIM II',
  'MUALIM III',
  'KKM',
  'MASINIS I',
  'MASINIS II',
  'MASINIS III',
  'SERANG',
  'JURU MUDI',
  'ELECTRICIAN',
  'MANDOR MESIN',
  'JURU MINYAK',
  'JURU MASAK I',
  'KADET DEK',
  'KADET MESIN',
  'EXTRA KKM',
  'KADET ELECTRONIC',
  'EXT. MUALIM I',
];

export function SearchOffDutyAll() {
  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<OffDutySeaman[]>([]);

  // Filter states
  const [vesselCategory, setVesselCategory] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [nameSearch, setNameSearch] = useState<string>('');
  const [forecastMonth, setForecastMonth] = useState<number>(1);

  // Pagination
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 15;

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // Debounce timer ref for name search
  const nameDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core fetch function — takes explicit param values to avoid stale closure issues
  const fetchData = async (params: {
    vesselCategory: string;
    rank: string;
    name: string;
    forecastMonth: number;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();
      if (params.vesselCategory) query.append('vessel_category', params.vesselCategory);
      if (params.rank) query.append('rank', params.rank);
      if (params.name.trim()) query.append('name', params.name.trim());
      query.append('forecast_month', params.forecastMonth.toString());

      const res = await fetch(`${API_BASE_URL}/search-offduty-all?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch offduty data');
      const data = await res.json();
      setResults(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching off-duty data:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Load data on mount
  useEffect(() => {
    fetchData({ vesselCategory: '', rank: '', name: '', forecastMonth: 1 });
  }, []);

  // Auto-fetch when vesselCategory, rank, or forecastMonth changes
  useEffect(() => {
    fetchData({ vesselCategory, rank, name: nameSearch, forecastMonth });
  }, [vesselCategory, rank, forecastMonth]);

  // Debounced auto-fetch for name search (300ms delay)
  useEffect(() => {
    if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    nameDebounceRef.current = setTimeout(() => {
      fetchData({ vesselCategory, rank, name: nameSearch, forecastMonth });
    }, 300);
    return () => {
      if (nameDebounceRef.current) clearTimeout(nameDebounceRef.current);
    };
  }, [nameSearch]);

  // Reset all filters
  const handleReset = () => {
    setVesselCategory('');
    setRank('');
    setNameSearch('');
    setForecastMonth(1);
    // useEffect for each filter will fire, but let's fire directly too
    fetchData({ vesselCategory: '', rank: '', name: '', forecastMonth: 1 });
  };

  // Pagination
  const totalPages = Math.ceil(results.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = results.slice(startIndex, startIndex + itemsPerPage);

  // Badge color based on offboard status
  const getStatusBadge = (status: string) => {
    if (status === 'Currently Offboard') {
      return <Badge color="success">{status}</Badge>;
    } else if (status.includes('Sep')) {
      return <Badge color="warning">{status}</Badge>;
    } else if (status.includes('Oct')) {
      return <Badge color="purple">{status}</Badge>;
    }
    return <Badge color="gray">{status}</Badge>;
  };

  return (
    <div className="px-6">
      {/* Filter Card */}
      <Card className="mb-4">
        <h3 className="text-xl font-bold">All Off-Duty Seamen</h3>
        <p className="text-sm text-gray-500 mt-1">
          Showing all offboard seamen across all vessel categories. Filters apply
          automatically on change.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mt-4">
          {/* Vessel Category Filter */}
          <div>
            <Label htmlFor="vessel-category-filter" value="Vessel Category (History)" />
            <Select
              id="vessel-category-filter"
              value={vesselCategory}
              onChange={e => setVesselCategory(e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="bc">Barge Crane</option>
              <option value="container">Container</option>
              <option value="manalagi">Manalagi</option>
            </Select>
          </div>

          {/* Rank Filter — uses static list so it never shrinks */}
          <div>
            <Label htmlFor="rank-filter" value="Rank" />
            <Select
              id="rank-filter"
              value={rank}
              onChange={e => setRank(e.target.value)}
            >
              <option value="">All Ranks</option>
              {ALL_RANKS.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          {/* Name Search */}
          <div>
            <Label htmlFor="name-filter" value="Name" />
            <TextInput
              id="name-filter"
              type="text"
              placeholder="Search by name..."
              value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
            />
          </div>

          {/* Forecast Toggle */}
          <div className="flex flex-col justify-end">
            <Label value="Include October Forecast" className="mb-2" />
            <ToggleSwitch
              checked={forecastMonth === 2}
              onChange={checked => setForecastMonth(checked ? 2 : 1)}
              label={forecastMonth === 2 ? '2 Months (Oct 2026)' : '1 Month (Sep 2026)'}
            />
          </div>
        </div>

        <div className="mt-3">
          <Button type="button" color="gray" size="sm" onClick={handleReset}>
            Reset Filters
          </Button>
        </div>
      </Card>

      {/* Results Card */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold">
            Results
            {!loading && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({results.length} seamen found)
              </span>
            )}
          </h3>
          {loading && <Spinner size="sm" color="failure" />}
        </div>

        <div className="mt-4 overflow-x-auto">
          <Table id="offduty-all-table" className="w-full" hoverable>
            <Table.Head>
              <Table.HeadCell>SEAMAN CODE</Table.HeadCell>
              <Table.HeadCell>SEAFARER CODE</Table.HeadCell>
              <Table.HeadCell>NAME</Table.HeadCell>
              <Table.HeadCell>RANK</Table.HeadCell>
              <Table.HeadCell>LAST LOCATION</Table.HeadCell>
              <Table.HeadCell>END DATE</Table.HeadCell>
              <Table.HeadCell>PREVIOUS VESSEL</Table.HeadCell>
              <Table.HeadCell>AGE</Table.HeadCell>
              <Table.HeadCell>CERTIFICATE</Table.HeadCell>
              <Table.HeadCell>OFFBOARD STATUS</Table.HeadCell>
              <Table.HeadCell>CALL</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={11} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <Spinner size="lg" color="failure" />
                      <span className="text-gray-600">Loading off-duty seamen...</span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : currentResults.length > 0 ? (
                currentResults.map((item, idx) => (
                  <Table.Row key={idx}>
                    <Table.Cell>{item.seamancode}</Table.Cell>
                    <Table.Cell>{item.seafarercode}</Table.Cell>
                    <Table.Cell>{item.name}</Table.Cell>
                    <Table.Cell>{item.last_position}</Table.Cell>
                    <Table.Cell>{item.last_location}</Table.Cell>
                    <Table.Cell>{item.end_date || '-'}</Table.Cell>
                    <Table.Cell>{item.prevlocation || '-'}</Table.Cell>
                    <Table.Cell>{item.age}</Table.Cell>
                    <Table.Cell>{item.certificate}</Table.Cell>
                    <Table.Cell>{getStatusBadge(item.offboard_status)}</Table.Cell>
                    <Table.Cell>
                      <CallComponent
                        phone1={item.phone_number_1}
                        phone2={item.phone_number_2}
                        phone3={item.phone_number_3}
                        phone4={item.phone_number_4}
                      />
                    </Table.Cell>
                  </Table.Row>
                ))
              ) : (
                <Table.Row>
                  <Table.Cell colSpan={11} className="text-center py-8">
                    <p className="text-gray-500">No off-duty seamen found.</p>
                  </Table.Cell>
                </Table.Row>
              )}
            </Table.Body>
          </Table>
          {!loading && totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={page => setCurrentPage(page)}
                showIcons={true}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
