'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import {
  Card,
  Label,
  Select,
  TextInput,
  Button,
  Table,
  Spinner,
  Badge,
} from 'flowbite-react';
import {
  HiOutlineUserGroup,
  HiOutlineShieldCheck,
  HiOutlineClock,
  HiOutlineMagnifyingGlass,
  HiXMark,
  HiPlus,
  HiChevronLeft,
  HiChevronRight,
  HiArrowsUpDown,
} from 'react-icons/hi2';
import { GiCargoShip } from 'react-icons/gi';

import { CallComponent } from '../CallComponent';
import { useShipParticular } from '../../hooks/useShipParticular';
import { isVesselMatch } from '../../utils/vesselNormalizer';

interface OnDutySeaman {
  seamancode: number;
  seafarercode: string | null;
  name: string;
  last_position: string;
  last_location: string;
  vessel_name_clean: string;
  start_date: string | null;
  end_date: string | null;
  day_elapsed: number;
  day_remains: number;
  age: number | null;
  certificate: string;
  phone_number_1: string;
  phone_number_2: string;
  phone_number_3: string;
  phone_number_4: string;
  status: string;
}

type SortOption = 'none' | 'berlayar_desc' | 'berlayar_asc' | 'sisa_asc' | 'sisa_desc';

// Canonical maritime ranks in SPIL fleet
const ALL_RANKS = [
  'NAKHODA',
  'MUALIM I',
  'MUALIM II',
  'MUALIM III',
  'KKM',
  'MASINIS I',
  'MASINIS II',
  'MASINIS III',
  'MASINIS IV',
  'BOSUN',
  'SERANG',
  'JURU MUDI',
  'KELASI',
  'ELECTRICIAN',
  'MANDOR MESIN',
  'JURU MINYAK',
  'JURU MASAK I',
  'KADET DEK',
  'KADET MESIN',
  'KADET ELECTRONIC',
  'EXTRA KKM',
  'EXT. MUALIM I',
  'WIPER',
  'FITTER',
];

const OFFICER_RANKS = new Set([
  'NAKHODA',
  'MUALIM I',
  'MUALIM II',
  'MUALIM III',
  'KKM',
  'MASINIS I',
  'MASINIS II',
  'MASINIS III',
  'MASINIS IV',
  'EXT. MUALIM I',
  'EXTRA KKM',
]);

export function SearchOnDutyNew() {
  const [loading, setLoading] = useState<boolean>(true);
  const [results, setResults] = useState<OnDutySeaman[]>([]);

  // Filter states
  const [vesselInput, setVesselInput] = useState<string>('');
  const [selectedVessels, setSelectedVessels] = useState<string[]>([]);
  const [filteredVesselSuggestions, setFilteredVesselSuggestions] = useState<string[]>([]);
  const [vesselCategory, setVesselCategory] = useState<string>('');
  const [part, setPart] = useState<string>('');
  const [rank, setRank] = useState<string>('');
  const [nameSearch, setNameSearch] = useState<string>('');

  // Sorting state
  const [sortBy, setSortBy] = useState<SortOption>('none');

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(15);

  // Master vessel list for autocomplete suggestions
  const { vesselNames: shipParticularVessels } = useShipParticular();

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
  const searchDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Core fetch function
  const fetchData = async (params: {
    vessels: string[];
    pendingVesselText: string;
    vesselCategory: string;
    part: string;
    rank: string;
    name: string;
  }) => {
    setLoading(true);
    try {
      const query = new URLSearchParams();

      // Combine fixed vessel tags and pending input text
      const allVesselQueries = [...params.vessels];
      if (params.pendingVesselText.trim() && !allVesselQueries.includes(params.pendingVesselText.trim())) {
        allVesselQueries.push(params.pendingVesselText.trim());
      }

      if (allVesselQueries.length > 0) {
        query.append('vessel', allVesselQueries.join(','));
      }
      if (params.vesselCategory) query.append('vessel_category', params.vesselCategory);
      if (params.part) query.append('part', params.part);
      if (params.rank) query.append('rank', params.rank);
      if (params.name.trim()) query.append('name', params.name.trim());

      const res = await fetch(`${API_BASE_URL}/search-onduty-all?${query.toString()}`);
      if (!res.ok) throw new Error('Failed to fetch on-duty data');
      const data = await res.json();
      setResults(data);
      setCurrentPage(1);
    } catch (error) {
      console.error('Error fetching on-duty data:', error);
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced effect for input and filter changes
  useEffect(() => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(() => {
      fetchData({
        vessels: selectedVessels,
        pendingVesselText: vesselInput,
        vesselCategory,
        part,
        rank,
        name: nameSearch,
      });
    }, 300);

    return () => {
      if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    };
  }, [selectedVessels, vesselInput, vesselCategory, part, rank, nameSearch]);

  // Vessel input change & suggestions
  const handleVesselInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setVesselInput(val);
    if (!val.trim()) {
      setFilteredVesselSuggestions([]);
      return;
    }
    const matched = shipParticularVessels
      .filter(v => isVesselMatch(val, v))
      .slice(0, 8);
    setFilteredVesselSuggestions(matched);
  };

  // Add vessel to fixed tags
  const addVesselTag = (vesselName: string) => {
    const trimmed = vesselName.trim();
    if (!trimmed) return;
    if (!selectedVessels.includes(trimmed)) {
      setSelectedVessels(prev => [...prev, trimmed]);
    }
    setVesselInput('');
    setFilteredVesselSuggestions([]);
  };

  // Remove vessel from fixed tags
  const removeVesselTag = (vesselName: string) => {
    setSelectedVessels(prev => prev.filter(v => v !== vesselName));
  };

  // Keydown handler for Vessel input (Enter to fix tag)
  const handleVesselKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (vesselInput.trim()) {
        addVesselTag(vesselInput);
      }
    }
  };

  // Reset all filters
  const handleReset = () => {
    if (searchDebounceRef.current) clearTimeout(searchDebounceRef.current);
    setVesselInput('');
    setSelectedVessels([]);
    setFilteredVesselSuggestions([]);
    setVesselCategory('');
    setPart('');
    setRank('');
    setNameSearch('');
    setSortBy('none');
    setCurrentPage(1);
  };

  // Date formatter utility
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '-';
    try {
      const d = new Date(dateStr);
      if (isNaN(d.getTime())) return dateStr;
      return d.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Sorting results
  const sortedResults = useMemo(() => {
    const list = [...results];
    if (sortBy === 'berlayar_desc') {
      list.sort((a, b) => b.day_elapsed - a.day_elapsed);
    } else if (sortBy === 'berlayar_asc') {
      list.sort((a, b) => a.day_elapsed - b.day_elapsed);
    } else if (sortBy === 'sisa_asc') {
      list.sort((a, b) => a.day_remains - b.day_remains);
    } else if (sortBy === 'sisa_desc') {
      list.sort((a, b) => b.day_remains - a.day_remains);
    }
    return list;
  }, [results, sortBy]);

  // Table header click sort toggles
  const toggleBerlayarSort = () => {
    if (sortBy === 'berlayar_desc') setSortBy('berlayar_asc');
    else if (sortBy === 'berlayar_asc') setSortBy('none');
    else setSortBy('berlayar_desc');
  };

  const toggleSisaSort = () => {
    if (sortBy === 'sisa_asc') setSortBy('sisa_desc');
    else if (sortBy === 'sisa_desc') setSortBy('none');
    else setSortBy('sisa_asc');
  };

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(sortedResults.length / itemsPerPage));
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = sortedResults.slice(startIndex, startIndex + itemsPerPage);

  const generatePageNumbers = (): (number | string)[] => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    if (currentPage <= 4) {
      return [1, 2, 3, 4, 5, '...', totalPages];
    }
    if (currentPage >= totalPages - 3) {
      return [1, '...', totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, '...', currentPage - 1, currentPage, currentPage + 1, '...', totalPages];
  };

  // Statistics summaries
  const totalCrew = results.length;
  const officersCount = results.filter(r => OFFICER_RANKS.has(r.last_position.toUpperCase())).length;
  const abkCount = totalCrew - officersCount;
  const uniqueVesselsCount = new Set(results.map(r => r.vessel_name_clean || r.last_location)).size;

  return (
    <div className="px-6 space-y-4">
      {/* Header (Cleaned as requested) */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
          <GiCargoShip className="text-red-600 text-3xl" />
          Search On-Duty (New)
        </h1>
      </div>

      {/* Filter Card */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800 flex items-center gap-2">
            <HiOutlineMagnifyingGlass className="text-red-600 text-xl" />
            Filter Pencarian
          </h3>
          {(vesselInput || selectedVessels.length > 0 || vesselCategory || part || rank || nameSearch || sortBy !== 'none') && (
            <Button
              type="button"
              color="gray"
              size="xs"
              onClick={handleReset}
              className="flex items-center gap-1 cursor-pointer"
            >
              <HiXMark className="w-4 h-4" />
              Reset Filter
            </Button>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4 mt-2">
          {/* 1. Vessel Filter with Fixation & Autocomplete */}
          <div className="relative lg:col-span-2">
            <Label htmlFor="vessel-input" value="Kapal / Vessel (Tekan Enter untuk Fiksasi)" className="mb-1 text-xs font-semibold" />
            <div className="flex items-center gap-1">
              <TextInput
                id="vessel-input"
                type="text"
                placeholder="Ketik nama kapal (cth: ORIENTAL)..."
                value={vesselInput}
                onChange={handleVesselInputChange}
                onKeyDown={handleVesselKeyDown}
                className="flex-1"
              />
              <Button
                type="button"
                size="sm"
                color="light"
                onClick={() => addVesselTag(vesselInput)}
                disabled={!vesselInput.trim()}
                title="Kunci / Tambah Kapal"
                className="cursor-pointer px-2"
              >
                <HiPlus className="w-4 h-4" />
              </Button>
            </div>

            {/* Suggestions dropdown */}
            {filteredVesselSuggestions.length > 0 && (
              <ul className="absolute z-50 left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto divide-y divide-gray-100">
                {filteredVesselSuggestions.map((v, idx) => (
                  <li
                    key={idx}
                    className="px-3 py-2 text-sm hover:bg-red-50 hover:text-red-700 cursor-pointer transition flex items-center justify-between"
                    onClick={() => addVesselTag(v)}
                  >
                    <span>{v}</span>
                    <span className="text-xs text-gray-400 font-normal">Klik untuk fiksasi</span>
                  </li>
                ))}
              </ul>
            )}

            {/* Fixed Vessel Tags / Chips */}
            {selectedVessels.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 mt-2">
                <span className="text-[11px] text-gray-500 font-medium">Kapal Terfiksasi:</span>
                {selectedVessels.map((vesselTag, idx) => (
                  <Badge
                    key={idx}
                    color="info"
                    className="flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold rounded-full"
                  >
                    <span>{vesselTag}</span>
                    <button
                      type="button"
                      onClick={() => removeVesselTag(vesselTag)}
                      className="text-blue-600 hover:text-red-600 cursor-pointer ml-1"
                      title="Hapus fiksasi"
                    >
                      <HiXMark className="w-3.5 h-3.5" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* 2. Vessel Category */}
          <div>
            <Label htmlFor="category-select" value="Kategori Armada" className="mb-1 text-xs font-semibold" />
            <Select
              id="category-select"
              value={vesselCategory}
              onChange={e => setVesselCategory(e.target.value)}
            >
              <option value="">Semua Kategori</option>
              <option value="container">Container</option>
              <option value="manalagi">Manalagi</option>
              <option value="bc">BC, TB, TK, Service</option>
            </Select>
          </div>

          {/* 3. Department / Part */}
          <div>
            <Label htmlFor="part-select" value="Departemen" className="mb-1 text-xs font-semibold" />
            <Select
              id="part-select"
              value={part}
              onChange={e => setPart(e.target.value)}
            >
              <option value="">Semua Departemen</option>
              <option value="deck">Deck</option>
              <option value="engine">Engine</option>
            </Select>
          </div>

          {/* 4. Rank Filter */}
          <div>
            <Label htmlFor="rank-select" value="Jabatan / Rank" className="mb-1 text-xs font-semibold" />
            <Select
              id="rank-select"
              value={rank}
              onChange={e => setRank(e.target.value)}
            >
              <option value="">Semua Jabatan</option>
              {ALL_RANKS.map((r, idx) => (
                <option key={idx} value={r}>
                  {r}
                </option>
              ))}
            </Select>
          </div>

          {/* 5. Name / Seamancode Search */}
          <div>
            <Label htmlFor="name-input" value="Nama / Seamancode" className="mb-1 text-xs font-semibold" />
            <TextInput
              id="name-input"
              type="text"
              placeholder="Cari nama atau kode..."
              value={nameSearch}
              onChange={e => setNameSearch(e.target.value)}
            />
          </div>
        </div>
      </Card>

      {/* Summary KPI Badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-blue-50 text-blue-600 rounded-lg">
            <HiOutlineUserGroup className="text-xl" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Total Kru On-Duty</div>
            <div className="text-lg font-bold text-gray-900">{totalCrew.toLocaleString()}</div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-green-50 text-green-600 rounded-lg">
            <GiCargoShip className="text-xl" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Kapal Terpantau</div>
            <div className="text-lg font-bold text-gray-900">{uniqueVesselsCount}</div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-amber-50 text-amber-600 rounded-lg">
            <HiOutlineShieldCheck className="text-xl" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">Perwira</div>
            <div className="text-lg font-bold text-gray-900">{officersCount}</div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-3 flex items-center gap-3 shadow-xs">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-lg">
            <HiOutlineClock className="text-xl" />
          </div>
          <div>
            <div className="text-xs text-gray-500 font-medium">ABK (Anak Buah Kapal)</div>
            <div className="text-lg font-bold text-gray-900">{abkCount}</div>
          </div>
        </div>
      </div>

      {/* Results Table Card */}
      <Card>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-gray-800">
            Daftar Kru On-Board
            {!loading && (
              <span className="text-sm font-normal text-gray-500 ml-2">
                ({sortedResults.length} pelaut ditemukan)
              </span>
            )}
          </h3>
          {loading && <Spinner size="sm" color="failure" />}
        </div>

        <div className="mt-2 overflow-x-auto">
          <Table hoverable className="w-full text-xs">
            <Table.Head className="bg-gray-50 text-gray-700 uppercase font-semibold">
              <Table.HeadCell>KODE</Table.HeadCell>
              <Table.HeadCell>NAMA PELAUT</Table.HeadCell>
              <Table.HeadCell>JABATAN</Table.HeadCell>
              <Table.HeadCell>KAPAL SAAT INI</Table.HeadCell>
              <Table.HeadCell>SIGN-ON</Table.HeadCell>
              <Table.HeadCell>END CONTRACT</Table.HeadCell>

              {/* Clickable Header for Berlayar Sort */}
              <Table.HeadCell
                onClick={toggleBerlayarSort}
                className="cursor-pointer hover:bg-gray-200 select-none transition"
                title="Klik untuk ubah urutan Berlayar"
              >
                <div className="flex items-center gap-1">
                  <span>BERLAYAR</span>
                  {sortBy === 'berlayar_desc' ? (
                    <span className="text-red-600 font-bold">▼</span>
                  ) : sortBy === 'berlayar_asc' ? (
                    <span className="text-red-600 font-bold">▲</span>
                  ) : (
                    <HiArrowsUpDown className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </Table.HeadCell>

              {/* Clickable Header for Sisa Sort */}
              <Table.HeadCell
                onClick={toggleSisaSort}
                className="cursor-pointer hover:bg-gray-200 select-none transition"
                title="Klik untuk ubah urutan Sisa Kontrak"
              >
                <div className="flex items-center gap-1">
                  <span>SISA</span>
                  {sortBy === 'sisa_asc' ? (
                    <span className="text-red-600 font-bold">▲</span>
                  ) : sortBy === 'sisa_desc' ? (
                    <span className="text-red-600 font-bold">▼</span>
                  ) : (
                    <HiArrowsUpDown className="w-3.5 h-3.5 text-gray-400" />
                  )}
                </div>
              </Table.HeadCell>

              <Table.HeadCell>SERTIFIKAT & USIA</Table.HeadCell>
              <Table.HeadCell className="text-center">AKSI</Table.HeadCell>
            </Table.Head>

            <Table.Body className="divide-y divide-gray-200">
              {loading ? (
                <Table.Row>
                  <Table.Cell colSpan={10} className="text-center py-12">
                    <div className="flex flex-col items-center justify-center gap-2">
                      <Spinner size="md" color="failure" />
                      <span className="text-gray-500 text-sm">Memuat data kru on-duty...</span>
                    </div>
                  </Table.Cell>
                </Table.Row>
              ) : currentResults.length === 0 ? (
                <Table.Row>
                  <Table.Cell colSpan={10} className="text-center py-12 text-gray-500">
                    Tidak ada kru on-duty yang cocok dengan kriteria filter saat ini.
                  </Table.Cell>
                </Table.Row>
              ) : (
                currentResults.map(seaman => {
                  const isElapsedCritical = seaman.day_elapsed >= 335;
                  const isRemainsCritical = seaman.day_remains <= 30;

                  return (
                    <Table.Row key={seaman.seamancode} className="bg-white hover:bg-gray-50">
                      <Table.Cell className="font-mono text-gray-600">
                        {seaman.seamancode}
                      </Table.Cell>

                      <Table.Cell className="font-semibold text-gray-900">
                        {seaman.name}
                      </Table.Cell>

                      <Table.Cell>
                        <Badge
                          color={OFFICER_RANKS.has(seaman.last_position.toUpperCase()) ? 'info' : 'gray'}
                          className="w-fit font-medium text-[11px]"
                        >
                          {seaman.last_position}
                        </Badge>
                      </Table.Cell>

                      <Table.Cell className="font-medium text-gray-800">
                        {seaman.last_location}
                      </Table.Cell>

                      <Table.Cell className="text-gray-600 whitespace-nowrap">
                        {formatDate(seaman.start_date)}
                      </Table.Cell>

                      <Table.Cell className="text-gray-600 whitespace-nowrap">
                        {formatDate(seaman.end_date)}
                      </Table.Cell>

                      <Table.Cell>
                        <Badge
                          color={isElapsedCritical ? 'failure' : 'gray'}
                          className="w-fit font-mono"
                        >
                          {seaman.day_elapsed} hr
                        </Badge>
                      </Table.Cell>

                      <Table.Cell>
                        <Badge
                          color={isRemainsCritical ? 'failure' : seaman.day_remains <= 60 ? 'warning' : 'success'}
                          className="w-fit font-mono"
                        >
                          {seaman.day_remains} hr
                        </Badge>
                      </Table.Cell>

                      <Table.Cell>
                        <div className="text-gray-900 font-medium">{seaman.certificate}</div>
                        {seaman.age !== null && (
                          <div className="text-gray-400 text-[11px]">{seaman.age} thn</div>
                        )}
                      </Table.Cell>

                      <Table.Cell className="text-center">
                        <CallComponent
                          phone1={seaman.phone_number_1}
                          phone2={seaman.phone_number_2}
                          phone3={seaman.phone_number_3}
                          phone4={seaman.phone_number_4}
                        />
                      </Table.Cell>
                    </Table.Row>
                  );
                })
              )}
            </Table.Body>
          </Table>
        </div>

        {/* Pagination Footer: Page Size Selector (Bottom Left) + First/Last Buttons (Bottom Right) */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-4 border-t border-gray-200">
          {/* Bottom Left: Rows per page selector + summary count */}
          <div className="flex items-center gap-2 text-xs text-gray-600">
            <span className="font-medium">Tampilkan:</span>
            <Select
              sizing="sm"
              value={itemsPerPage}
              onChange={e => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="w-24 text-xs font-medium"
            >
              <option value={10}>10 baris</option>
              <option value={15}>15 baris</option>
              <option value={25}>25 baris</option>
              <option value={50}>50 baris</option>
              <option value={100}>100 baris</option>
            </Select>
            <span className="text-gray-500">
              (Menampilkan <span className="font-semibold text-gray-800">{sortedResults.length > 0 ? startIndex + 1 : 0}</span> -{' '}
              <span className="font-semibold text-gray-800">
                {Math.min(startIndex + itemsPerPage, sortedResults.length)}
              </span>{' '}
              dari <span className="font-semibold text-gray-800">{sortedResults.length}</span> kru)
            </span>
          </div>

          {/* Bottom Right: Unified Segmented Pagination Bar */}
          <nav aria-label="Pagination" className="inline-flex items-center -space-x-px text-xs rounded-lg shadow-xs">
            {/* Previous Page */}
            <button
              type="button"
              disabled={currentPage <= 1}
              onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
              title="Halaman Sebelumnya"
              className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-l-lg border border-gray-300 bg-white font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition select-none"
            >
              <HiChevronLeft className="w-3.5 h-3.5" />
              <span>Previous</span>
            </button>

            {/* Page Number Buttons */}
            {generatePageNumbers().map((page, index) =>
              page === '...' ? (
                <span
                  key={`ellipsis-${index}`}
                  className="h-8 min-w-[2.25rem] px-2 inline-flex items-center justify-center border border-gray-300 bg-white font-medium text-gray-400 select-none"
                >
                  ...
                </span>
              ) : (
                <button
                  key={`page-${page}`}
                  type="button"
                  onClick={() => setCurrentPage(page as number)}
                  className={`h-8 min-w-[2.25rem] px-2.5 inline-flex items-center justify-center font-medium border transition cursor-pointer select-none ${
                    currentPage === page
                      ? 'z-10 bg-red-50 border-red-500 text-red-600 font-semibold'
                      : 'border-gray-300 bg-white text-gray-500 hover:bg-gray-100 hover:text-gray-700'
                  }`}
                >
                  {page}
                </button>
              )
            )}

            {/* Next Page */}
            <button
              type="button"
              disabled={currentPage >= totalPages}
              onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
              title="Halaman Berikutnya"
              className="h-8 px-2.5 inline-flex items-center justify-center gap-1 rounded-r-lg border border-gray-300 bg-white font-medium text-gray-500 hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer transition select-none"
            >
              <span>Next</span>
              <HiChevronRight className="w-3.5 h-3.5" />
            </button>
          </nav>
        </div>
      </Card>
    </div>
  );
}
