import { Modal, Table, Badge, Spinner } from 'flowbite-react';
import { useState, useEffect } from 'react';
import { useOffboardDetail } from '../../hooks/useOffboardDetail';

interface OffboardDetailModalProps {
  show: boolean;
  onClose: () => void;
  locationName: string;
}

// Urutan jabatan dari tertinggi ke terendah (exact match)
const RANK_ORDER = [
  'NAKHODA',
  'EXTRA NAKHODA',
  'KKM',
  'MUALIM I',
  'EXT. MUALIM I',
  'MASINIS I',
  'MASINIS II',
  'EXT. MASINIS II',
  'MUALIM II',
  'MASINIS III',
  'MUALIM III',
  'MASINIS IV',
  'MUALIM IV',
  'ELECTRICIAN',
  'SERANG',
  'MANDOR MESIN',
  'FITTER',
  'JURU MUDI',
  'JURU MINYAK',
  'KELASI',
  'KADET DEK',
  'KADET MESIN',
  'KADET ELECTRONIC',
  'JURU MASAK I',
  'PELAYAN',
];

const LOCATION_BADGE_COLOR: Record<string, string> = {
  'DARAT STAND-BY': 'warning',
  'DARAT BIASA': 'gray',
  DARAT: 'blue',
  'PENDING CUTI': 'purple',
  'PENDING GAJI': 'red',
};

function getRankOrder(rank: string): number {
  const idx = RANK_ORDER.findIndex(
    r => rank?.toUpperCase().trim() === r.toUpperCase()
  );
  return idx === -1 ? RANK_ORDER.length : idx;
}

export function OffboardDetailModal({
  show,
  onClose,
  locationName,
}: OffboardDetailModalProps) {
  const [activeTab, setActiveTab] = useState(0);
  const { seamen, loading } = useOffboardDetail(show ? locationName : null);

  // Reset tab ke 0 setiap kali lokasi berganti
  useEffect(() => {
    setActiveTab(0);
  }, [locationName]);

  // Kelompokkan per rank, urutkan sesuai RANK_ORDER
  const groups = seamen.reduce<Record<string, typeof seamen>>((acc, s) => {
    const rank = s.last_position || 'Tidak Diketahui';
    if (!acc[rank]) acc[rank] = [];
    acc[rank].push(s);
    return acc;
  }, {});

  const sortedGroups = Object.entries(groups).sort(
    ([a], [b]) => getRankOrder(a) - getRankOrder(b)
  );

  const badgeColor = LOCATION_BADGE_COLOR[locationName] ?? 'gray';
  const activeGroup = sortedGroups[activeTab];

  return (
    <Modal show={show} onClose={onClose} size="5xl">
      <Modal.Header>
        <div className="flex items-center gap-3 flex-wrap">
          <span>Detail Offboard</span>
          <Badge color={badgeColor as any} size="sm">
            {locationName}
          </Badge>
          {!loading && (
            <span className="text-sm font-normal text-gray-500">
              {seamen.length} seamen &bull; {sortedGroups.length} jabatan
            </span>
          )}
        </div>
      </Modal.Header>

      <Modal.Body>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <Spinner size="lg" color="failure" />
            <span className="text-gray-600">Loading data...</span>
          </div>
        ) : sortedGroups.length === 0 ? (
          <div className="text-center py-12 text-gray-400">
            Tidak ada data seamen untuk kategori ini.
          </div>
        ) : (
          <>
            {/* Tab List */}
            <div className="flex flex-wrap gap-2 mb-5 border-b border-gray-200 pb-3">
              {sortedGroups.map(([rank, members], idx) => (
                <button
                  key={rank}
                  type="button"
                  onClick={() => setActiveTab(idx)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    activeTab === idx
                      ? 'bg-gray-800 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {rank}
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs font-semibold ${
                      activeTab === idx
                        ? 'bg-white text-gray-800'
                        : 'bg-gray-300 text-gray-700'
                    }`}
                  >
                    {members.length}
                  </span>
                </button>
              ))}
            </div>

            {/* Tab Content */}
            {activeGroup && (
              <div className="overflow-x-auto">
                <Table hoverable>
                  <Table.Head>
                    {[
                      'No',
                      'Seaman Code',
                      'Seafarer Code',
                      'Nama',
                      'Lokasi Sebelumnya',
                      'Usia',
                      'Certificate',
                    ].map(h => (
                      <Table.HeadCell
                        key={h}
                        className="bg-gray-800 text-white"
                      >
                        {h}
                      </Table.HeadCell>
                    ))}
                  </Table.Head>
                  <Table.Body className="divide-y">
                    {activeGroup[1].map((s, idx) => (
                      <Table.Row key={idx} className="bg-white">
                        <Table.Cell className="text-gray-500 text-sm">
                          {idx + 1}
                        </Table.Cell>
                        <Table.Cell className="font-medium text-gray-800">
                          {s.seamancode}
                        </Table.Cell>
                        <Table.Cell className="text-gray-700">
                          {s.seafarercode}
                        </Table.Cell>
                        <Table.Cell className="text-gray-700">
                          {s.name}
                        </Table.Cell>
                        <Table.Cell className="text-gray-700 text-xs">
                          {s.prevlocation || '-'}
                        </Table.Cell>
                        <Table.Cell className="text-gray-700">
                          {s.age}
                        </Table.Cell>
                        <Table.Cell className="text-gray-700 text-xs">
                          {s.certificate}
                        </Table.Cell>
                      </Table.Row>
                    ))}
                  </Table.Body>
                </Table>
              </div>
            )}
          </>
        )}
      </Modal.Body>
    </Modal>
  );
}
