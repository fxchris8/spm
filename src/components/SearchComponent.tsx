"use client";

import React, { useEffect, useState } from "react";
import {
  Card,
  Label,
  Select,
  TextInput,
  Button,
  Table,
  Pagination,
} from "flowbite-react";

import { CallComponent } from "./CallComponent";

interface SearchProps {
  type: string;
  part: string;
}

export function SearchComponent({ type, part }: SearchProps) {
  // State untuk opsi dari /api/options
  const [options, setOptions] = useState({
    bagian_option: [] as string[],
    cert_option: [] as string[],
    rank_option: [] as string[],
    vessel_option: [] as string[],
  });

  // Loading state untuk memastikan request POST options selesai
  const [loadingOptions, setLoadingOptions] = useState<boolean>(true);

  // Controlled state untuk input form
  const [ageMin, setAgeMin] = useState<number>(0);
  const [ageMax, setAgeMax] = useState<number>(0);
  const [certificate, setCertificate] = useState<string>("");
  const [rank, setRank] = useState<string>("");
  // Jika prop part tidak kosong, gunakan part; jika tidak, gunakan type.
  const [bagian, setBagian] = useState<string>(part !== "" ? part : type);

  // State untuk vessel input dan dropdown
  const [vesselInput, setVesselInput] = useState<string>("");
  const [filteredVessels, setFilteredVessels] = useState<string[]>([]);

  // State untuk hasil pencarian (candidates)
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const itemsPerPage = 10; // Misal 10 item per halaman

  // Utility function: capitalize (misal "container" → "Container")
  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  // useEffect untuk mengambil options dan menginisialisasi data setiap kali type/part berubah
  useEffect(() => {
    async function fetchOptions() {
      try {
        const res = await fetch("http://192.168.16.44:8080/api/options", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: type, part: part }),
        });
        if (!res.ok) {
          throw new Error("Failed to fetch options");
        }
        const data = await res.json();
        setOptions(data);
      } catch (error) {
        console.error("Error fetching options:", error);
      } finally {
        setLoadingOptions(false);
      }
    }
    // Reset semua state saat type/part berubah
    setAgeMin(0);
    setAgeMax(0);
    setCertificate("");
    setRank("");
    setVesselInput("");
    setFilteredVessels([]);
    setSearchResults([]);
    setCurrentPage(1);
    setLoadingOptions(true);
    fetchOptions();
  }, [type, part]);

  // Fungsi untuk memfilter vessel sesuai input
  const filterVessel = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setVesselInput(value);
    if (!value) {
      setFilteredVessels([]);
      return;
    }
    const filtered = options.vessel_option.filter((vessel) =>
      vessel.toLowerCase().includes(value.toLowerCase())
    );
    setFilteredVessels(filtered);
  };

  // Fungsi saat memilih salah satu vessel dari dropdown
  const handleSelectVessel = (vessel: string) => {
    setVesselInput(vessel);
    setFilteredVessels([]);
  };

  // Handle submit untuk memanggil /api/get-manual-search
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (isNaN(ageMin) || isNaN(ageMax)) {
      alert("Age must be a valid number");
      return;
    }
    const sheetName = `${capitalize(type)}-${capitalize(part)}`;
    const umur = Math.round((ageMin + ageMax) / 2);

    const payload = {
      SHEET_NAME: sheetName,
      BAGIAN: capitalize(bagian),
      VESSEL: vesselInput,
      LB: ageMin,
      UB: ageMax,
      CERTIFICATE: certificate,
      RANK: rank,
      UMUR: umur,
      TYPE: type,
      PART: part,
    };

    try {
      const res = await fetch("http://192.168.16.44:8080/api/get-manual-search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Network response was not ok");
      const data = await res.json();
      setSearchResults(data);
      setCurrentPage(1); // Reset halaman ke 1 pada pencarian baru
    } catch (error) {
      console.error("Error fetching search results:", error);
      alert("Failed to fetch search results");
    }
  };

  // Pagination: hitung total halaman dan ambil data untuk halaman saat ini
  const totalPages = Math.ceil(searchResults.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentResults = searchResults.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const onPageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="p-4">
      {/* Card untuk Form Pencarian */}
      <Card className="mb-4">
        <h3 className="text-xl font-bold">Search for Crew Candidate</h3>
        {loadingOptions ? (
          <div>Loading options...</div>
        ) : (
          <form
            id="search-form"
            className="flex flex-col gap-4 mt-4"
            onSubmit={handleSubmit}
          >
            {/* Hidden input untuk sheet name */}
            <input type="hidden" id="sheet-name" name="sheet_name" />
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Bagian */}
              <div>
                <Label htmlFor="bagian-input" value="Bagian" />
                <Select
                  id="bagian-input"
                  required
                  disabled
                  value={bagian}
                  onChange={(e) => setBagian(e.target.value)}
                >
                  <option value={bagian}>{bagian}</option>
                </Select>
              </div>
              {/* Age Min */}
              <div>
                <Label htmlFor="age-input" value="Age Min" />
                <TextInput
                  id="age-input"
                  type="number"
                  min={16}
                  max={85}
                  required
                  value={ageMin}
                  onChange={(e) => setAgeMin(parseInt(e.target.value))}
                />
              </div>
              {/* Age Max */}
              <div>
                <Label htmlFor="age-input2" value="Age Max" />
                <TextInput
                  id="age-input2"
                  type="number"
                  min={16}
                  max={85}
                  required
                  value={ageMax}
                  onChange={(e) => setAgeMax(parseInt(e.target.value))}
                />
              </div>
              {/* Certificate */}
              <div>
                <Label htmlFor="certif-input" value="Certificate" />
                <Select
                  id="certif-input"
                  required
                  defaultValue=""
                  onChange={(e) => setCertificate(e.target.value)}
                >
                  <option value="" disabled>
                    Select Option
                  </option>
                  {options.cert_option.map((cert, idx) => (
                    <option key={idx} value={cert}>
                      {cert}
                    </option>
                  ))}
                </Select>
              </div>
              {/* Rank */}
              <div>
                <Label htmlFor="rank-input" value="Rank" />
                <Select
                  id="rank-input"
                  required
                  defaultValue=""
                  onChange={(e) => setRank(e.target.value)}
                >
                  <option value="" disabled>
                    Select Option
                  </option>
                  {options.rank_option.map((r, idx) => (
                    <option key={idx} value={r}>
                      {r}
                    </option>
                  ))}
                </Select>
              </div>
              {/* Vessel */}
              <div className="relative">
                <Label htmlFor="vessel-input" value="Vessel" />
                <TextInput
                  id="vessel-input"
                  type="text"
                  placeholder="Search Vessel"
                  required
                  value={vesselInput}
                  onChange={filterVessel}
                />
                {filteredVessels.length > 0 && (
                  <div
                    id="vesselDropdown"
                    className="dropdown-content absolute z-10 w-full bg-white border max-h-48 overflow-y-auto"
                  >
                    {filteredVessels.map((v, idx) => (
                      <div
                        key={idx}
                        onClick={() => handleSelectVessel(v)}
                        className="p-2 hover:bg-gray-200 cursor-pointer"
                      >
                        {v}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div>
              <Button type="submit">Search Candidate</Button>
            </div>
          </form>
        )}
      </Card>
      {/* Card untuk Tabel Hasil Pencarian */}
      <Card>
        <h3 className="text-xl font-bold">Results Candidate</h3>
        <div className="mt-4">
          <Table id="results-table" className="w-full" hoverable>
            <Table.Head>
              <Table.HeadCell>SEAMAN CODE</Table.HeadCell>
              <Table.HeadCell>SEAFARER CODE</Table.HeadCell>
              <Table.HeadCell>SEAMAN NAME</Table.HeadCell>
              <Table.HeadCell>RANK</Table.HeadCell>
              <Table.HeadCell>VESSEL</Table.HeadCell>
              <Table.HeadCell>UMUR</Table.HeadCell>
              <Table.HeadCell>CERTIFICATE</Table.HeadCell>
              <Table.HeadCell>DAY REMAINS</Table.HeadCell>
              <Table.HeadCell>CALL</Table.HeadCell>
            </Table.Head>
            <Table.Body className="divide-y">
              {currentResults.map((item, idx) => (
                <Table.Row key={idx}>
                  <Table.Cell>{item.seamancode}</Table.Cell>
                  <Table.Cell>{item.seafarercode}</Table.Cell>
                  <Table.Cell>{item.name}</Table.Cell>
                  <Table.Cell>{item.last_position}</Table.Cell>
                  <Table.Cell>{item.last_location}</Table.Cell>
                  <Table.Cell>{item.age}</Table.Cell>
                  <Table.Cell>{item.certificate}</Table.Cell>
                  <Table.Cell>{item.day_remains}</Table.Cell>
                  <Table.Cell>
                    <CallComponent
                      phone1={item.phone_number_1}
                      phone2={item.phone_number_2}
                      phone3={item.phone_number_3}
                      phone4={item.phone_number_4}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table>
          {totalPages > 1 && (
            <div className="flex justify-center mt-4">
              <Pagination
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={onPageChange}
                showIcons={true}
              />
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
