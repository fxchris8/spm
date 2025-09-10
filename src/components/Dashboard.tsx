"use client";
import { useEffect, useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faMagnifyingGlass,
  faUsers,
  faShip,
  faHouse,
} from "@fortawesome/free-solid-svg-icons";

interface Seaman {
  "SEAMAN CODE": string;
  "SEAFARER CODE": string;
  "SEAMAN NAME": string;
  RANK: string;
  VESSEL: string;
  UMUR: number;
  CERTIFICATE: string;
  "DAY REMAINS": number;
}

interface SimilarSeaman {
  seamancode: string;
  seafarercode: string;
  name: string;
  last_position: string;
  last_location: string;
  age: number;
  certificate: string;
  "DAY REMAINS DIFF": number;
}

export function Dashboard() {
  const [seamenData, setSeamenData] = useState<Seaman[]>([]);
  const [filteredData, setFilteredData] = useState<Seaman[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [similarSeamen, setSimilarSeamen] = useState<SimilarSeaman[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [searchTerm, setSearchTerm] = useState("");
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;

  // status yang tidak dihitung sebagai onboard
  const excludedStatus = [
    "PENDING CUTI",
    "DARAT BIASA",
    "DARAT STAND-BY",
    "PENDING GAJI",
  ];

  // Fetch data
  useEffect(() => {
    const fetchData = () => {
      fetch(`${API_BASE_URL}/dashboard-data`)
        .then((res) => {
          if (!res.ok) throw new Error("Gagal memuat data");
          return res.json();
        })
        .then((data) => {
          setSeamenData(data);
          setFilteredData(data);
        })
        .catch(console.error);
    };

    fetchData();
    const interval = setInterval(fetchData, 3000000);
    return () => clearInterval(interval);
  }, []);

  // Fungsi pencarian
  useEffect(() => {
    const results = seamenData.filter((item) =>
      Object.values(item).some((val) =>
        (val ?? "").toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
    setFilteredData(results);
    setCurrentPage(1);
  }, [searchTerm, seamenData]);

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredData.length / itemsPerPage);

  const generatePageNumbers = () => {
    const pages = [];
    const range = 2;
    pages.push(1);
    if (currentPage - range > 2) pages.push("...");
    for (
      let i = Math.max(2, currentPage - range);
      i <= Math.min(totalPages - 1, currentPage + range);
      i++
    ) {
      pages.push(i);
    }
    if (currentPage + range < totalPages - 1) pages.push("...");
    if (totalPages > 1) pages.push(totalPages);
    return pages;
  };

  // Show similar
  const showSimilar = async (seamanCode: string) => {
    try {
      const response = await fetch(`http://localhost:8080/similarity/${seamanCode}`);
      if (!response.ok) throw new Error("Gagal mengambil data similar");

      const data = await response.json();
      if (data.status === "error") throw new Error(data.message);

      setSimilarSeamen(data.data);
      setModalOpen(true);
    } catch (error) {
      console.error("Error:", error);
      alert("Error: " + (error as Error).message);
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSimilarSeamen([]);
  };

  // Hitung seaman onboard (VESSEL bukan status excluded)
  const onboardSeamen = seamenData.filter(
    (s) => !excludedStatus.includes(s.VESSEL?.toUpperCase())
  );

  // Hitung seaman onboard (VESSEL bukan status excluded)
  const offboardSeamen = seamenData.filter(
    (s) => excludedStatus.includes(s.VESSEL?.toUpperCase())
  );

  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Ship Personnel Management</h1>

      {/* === Dashboard Cards === */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gradient-to-r from-red-500 to-indigo-600 text-white rounded-2xl shadow-lg p-6 flex items-center">
          <div className="p-4 bg-white bg-opacity-20 rounded-full mr-4">
            <FontAwesomeIcon icon={faUsers} className="text-3xl" />
          </div>
          <div>
            <p className="text-sm opacity-80">Total Seamen</p>
            <h2 className="text-3xl font-bold">{seamenData.length}</h2>
          </div>
        </div>
        {/* Total Onboard */}
        <div className="bg-gradient-to-r from-green-500 to-indigo-600 text-white rounded-2xl shadow-lg p-6 flex items-center">
          <div className="p-4 bg-white bg-opacity-20 rounded-full mr-4">
            <FontAwesomeIcon icon={faShip} className="text-3xl" />
          </div>
          <div>
            <p className="text-sm opacity-80">Total Onboard</p>
            <h2 className="text-3xl font-bold">{onboardSeamen.length}</h2>
          </div>
        </div>
        {/* Total Offboard */}
        <div className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white rounded-2xl shadow-lg p-6 flex items-center">
          <div className="p-4 bg-white bg-opacity-20 rounded-full mr-4">
            <FontAwesomeIcon icon={faHouse} className="text-3xl" />
          </div>
          <div>
            <p className="text-sm opacity-80">Total Offboard</p>
            <h2 className="text-3xl font-bold">{offboardSeamen.length}</h2>
          </div>
        </div>
      </div>

      {/* Search Input */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search..."
          className="w-full p-2 border rounded-lg shadow-sm"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto rounded-xl shadow-md">
        <table className="min-w-full border border-gray-200">
          <thead className="bg-gray-800 text-white">
            <tr>
              {[
                "SEAMAN CODE",
                "SEAFARER CODE",
                "SEAMAN NAME",
                "RANK",
                "VESSEL",
                "UMUR",
                "CERTIFICATE",
                "DAY REMAINS",
                "ACTION",
              ].map((header) => (
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
                    onClick={() => showSimilar(item["SEAMAN CODE"])}
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
            onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 border rounded-lg shadow-sm disabled:opacity-50"
          >
            Previous
          </button>

          {generatePageNumbers().map((page, index) =>
            page === "..." ? (
              <span key={index} className="px-2">
                ...
              </span>
            ) : (
              <button
                key={index}
                onClick={() => setCurrentPage(page as number)}
                className={`px-3 py-1 border rounded-lg shadow-sm ${
                  currentPage === page ? "bg-blue-500 text-white" : ""
                }`}
              >
                {page}
              </button>
            )
          )}

          <button
            onClick={() =>
              setCurrentPage((prev) => Math.min(totalPages, prev + 1))
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
            onChange={(e) => {
              setItemsPerPage(Number(e.target.value));
              setCurrentPage(1);
            }}
            className="p-1 border rounded-lg shadow-sm"
          >
            {[10, 20, 50].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-gray-900 bg-opacity-50 flex justify-center items-center">
          <div className="bg-white p-6 rounded-xl shadow-lg w-full max-w-3xl relative">
            <button
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-900 text-2xl"
              onClick={closeModal}
            >
              &times;
            </button>
            <h2 className="text-xl font-semibold mb-4">Top 5 Similar Seamen</h2>

            <div className="overflow-x-auto">
              <table className="min-w-full border border-gray-300 rounded-md">
                <thead className="bg-gray-200">
                  <tr>
                    {[
                      "SEAMAN CODE",
                      "SEAFARER CODE",
                      "SEAMAN NAME",
                      "LAST POSITION",
                      "LAST LOCATION",
                      "AGE",
                      "CERTIFICATE",
                      "DAY REMAINS DIFF",
                    ].map((header) => (
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
                          {seaman["DAY REMAINS DIFF"]}
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
          </div>
        </div>
      )}
    </section>
  );
}
