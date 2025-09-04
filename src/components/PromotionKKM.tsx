"use client";

import { Tabs, TabsRef, Modal, Button, TextInput } from "flowbite-react";
import { useRef, useState, useEffect, useMemo } from "react";

type Seaman = {
  code: string;
  name: string;
  rank: string;
  history: string;
};

export function PromotionKKM() {
  const tabsRef = useRef<TabsRef>(null);
  const [activeTab, setActiveTab] = useState(0);
  const [selectedSeamen, setSelectedSeamen] = useState<Seaman[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [seamanList, setSeamanList] = useState<Seaman[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [saving, setSaving] = useState(false);

  // Fetch seaman data from backend API
  useEffect(() => {
    const fetchSeamen = async () => {
      try {
        const res = await fetch("http://192.168.16.44:8080/api/seamen/promotion_candidates_kkm");
        const json = await res.json();
        if (json.status === "success") {
          const formatted = json.data.map((item: any) => ({
            code: String(item.code),
            name: item.name,
            rank: item.rank,
            history: item.history
            .filter((h: string) => h !== "PENDING GAJI" && h !== "PENDING CUTI" && h !== "DARAT STAND-BY" && h !== "DARAT BIASA")
            .join(", "),
          }));
          setSeamanList(formatted);
        } else {
          console.error("Gagal memuat data:", json.message);
        }
      } catch (err) {
        console.error("Error fetching seamen:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchSeamen();
  }, []);

  const handleAddFromModal = (seaman: Seaman) => {
    if (!selectedSeamen.some((s) => s.code === seaman.code)) {
      setSelectedSeamen([...selectedSeamen, seaman]);
    }
    // setShowModal(false);
    setSearchTerm("");
  };

  const handleRemove = (code: string) => {
    setSelectedSeamen(selectedSeamen.filter((s) => s.code !== code));
  };

  async function saveToExcel() {
    setSaving(true);
    try {
      const res = await fetch("http://192.168.16.44:8080/api/save-excel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(selectedSeamen),
      });
      const json = await res.json();
      if (json.status === "success") {
        alert("Berhasil simpan data!");
      } else {
        alert("Gagal simpan: " + json.message);
      }
    } catch (error: any) {
      alert("Error: " + error.message);
    } finally {
      setSaving(false);
    }
  }

  // Filter seamanList based on search term (case insensitive)
  const filteredSeamanList = useMemo(() => {
    if (!searchTerm.trim()) return seamanList;
    return seamanList.filter(
      (s) =>
        s.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.rank.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [searchTerm, seamanList]);

  return (
    <div className="flex flex-col gap-3">
      <Tabs
        aria-label="Default tabs"
        variant="default"
        ref={tabsRef}
        onActiveTabChange={(tab) => setActiveTab(tab)}
      >
        <Tabs.Item active title="KKM">
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-semibold">Seaman Terpilih</h3>
              <Button onClick={() => setShowModal(true)}>Tambah Seaman</Button>
            </div>

            {/* Tabel seaman yang dipilih */}
            <div className="overflow-x-auto rounded-lg shadow">
              <table className="min-w-full text-sm text-left text-gray-500">
                <thead className="text-xs text-gray-700 uppercase bg-green-100">
                  <tr>
                    <th className="px-4 py-3">Seaman Code</th>
                    <th className="px-4 py-3">Nama</th>
                    <th className="px-4 py-3">Rank</th>
                    <th className="px-4 py-3">History</th>
                    <th className="px-4 py-3">Aksi</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {selectedSeamen.length > 0 ? (
                    selectedSeamen.map((seaman) => (
                      <tr key={seaman.code}>
                        <td className="px-4 py-2">{seaman.code}</td>
                        <td className="px-4 py-2">{seaman.name}</td>
                        <td className="px-4 py-2">{seaman.rank}</td>
                        <td className="px-4 py-2">{seaman.history}</td>
                        <td className="px-4 py-2">
                          <button
                            className="bg-red-500 hover:bg-red-600 text-white text-xs px-3 py-1 rounded"
                            onClick={() => handleRemove(seaman.code)}
                            aria-label={`Hapus seaman ${seaman.name}`}
                          >
                            Hapus
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="text-center py-4 text-gray-400">
                        Belum ada seaman terpilih.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <Button
              onClick={saveToExcel}
              disabled={selectedSeamen.length === 0 || saving}
              color="success"
            >
              {saving ? "Menyimpan..." : "Submit"}
            </Button>

            {/* Modal untuk memilih seaman */}
            <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl">
              <Modal.Header>Pilih Seaman</Modal.Header>
              <Modal.Body>
                {loading ? (
                  <div className="text-center py-4">Memuat data...</div>
                ) : (
                  <>
                    <div className="mb-4">
                      <TextInput
                        type="search"
                        placeholder="Cari berdasarkan code, nama, atau rank"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        aria-label="Cari seaman"
                      />
                    </div>
                    <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                      <table className="min-w-full text-sm text-left text-gray-500">
                        <thead className="text-xs text-gray-700 uppercase bg-gray-100">
                          <tr>
                            <th className="px-4 py-3">Seaman Code</th>
                            <th className="px-4 py-3">Nama</th>
                            <th className="px-4 py-3">Rank</th>
                            <th className="px-4 py-3">History</th>
                            <th className="px-4 py-3">Action</th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                          {filteredSeamanList.length > 0 ? (
                            filteredSeamanList.map((seaman) => (
                              <tr key={seaman.code}>
                                <td className="px-4 py-2">{seaman.code}</td>
                                <td className="px-4 py-2">{seaman.name}</td>
                                <td className="px-4 py-2">{seaman.rank}</td>
                                <td className="px-4 py-2">{seaman.history}</td>
                                <td className="px-4 py-2">
                                  <button
                                    className={`text-xs px-3 py-1 rounded ${
                                      selectedSeamen.some((s) => s.code === seaman.code)
                                        ? "bg-gray-400 cursor-not-allowed"
                                        : "bg-blue-500 hover:bg-blue-600 text-white"
                                    }`}
                                    onClick={() => !selectedSeamen.some((s) => s.code === seaman.code) && handleAddFromModal(seaman)}
                                    disabled={selectedSeamen.some((s) => s.code === seaman.code)}
                                    aria-label={`Pilih seaman ${seaman.name}`}
                                  >
                                    {selectedSeamen.some((s) => s.code === seaman.code)
                                      ? "Sudah Dipilih"
                                      : "Pilih"}
                                  </button>
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={5} className="text-center py-4 text-gray-400">
                                Tidak ada data seaman tersedia.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </Modal.Body>
              <Modal.Footer className="flex justify-between items-center">
                <Button color="gray" onClick={() => setShowModal(false)}>
                  Tutup
                </Button>
              </Modal.Footer>
            </Modal>
          </div>
        </Tabs.Item>
      </Tabs>
    </div>
  );
}
