import { useState } from 'react';
import {
  Button,
  Table,
  Modal,
  TextInput,
  Label,
  Select,
  Badge,
  Alert,
} from 'flowbite-react';
import { HiPlus, HiPencil, HiTrash, HiRefresh } from 'react-icons/hi';
import {
  useRotationConfigs,
  RotationConfig,
} from '../hooks/useRotationConfigs';

type AlertType = 'success' | 'error' | 'warning' | 'info';

export default function RotationShipConfig() {
  const {
    configs,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    refetch,
  } = useRotationConfigs();
  const [showModal, setShowModal] = useState(false);
  const [editingConfig, setEditingConfig] = useState<RotationConfig | null>(
    null
  );
  const [formData, setFormData] = useState({
    job_title: '',
    vessel: 'D',
    type: 'container',
    part: 'deck',
    groups: {} as Record<string, string[]>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Alert state
  const [alert, setAlert] = useState<{
    show: boolean;
    type: AlertType;
    message: string;
  }>({
    show: false,
    type: 'info',
    message: '',
  });

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: 'info', message: '' });
    }, 5000);
  };

  const handleCreate = () => {
    setEditingConfig(null);
    setFormData({
      job_title: '',
      vessel: 'D',
      type: 'container',
      part: 'deck',
      groups: {},
    });
    setShowModal(true);
  };

  const handleEdit = (config: RotationConfig) => {
    setEditingConfig(config);
    setFormData({
      job_title: config.job_title,
      vessel: config.vessel,
      type: config.type,
      part: config.part,
      groups: config.groups,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, jobTitle: string) => {
    if (!window.confirm(`Yakin ingin menghapus konfigurasi ${jobTitle}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteConfig(id);
      showAlert('success', result.message || 'Konfigurasi berhasil dihapus!');
    } catch (error: any) {
      console.error('Error deleting config:', error);
      showAlert('error', `Gagal menghapus: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validasi
    if (!formData.job_title.trim()) {
      showAlert('warning', 'Job title harus diisi!');
      return;
    }

    if (Object.keys(formData.groups).length === 0) {
      showAlert('warning', 'Minimal harus ada 1 group!');
      return;
    }

    // Check if any group is empty
    const hasEmptyGroup = Object.entries(formData.groups).some(
      ([, ships]) => ships.length === 0
    );

    if (hasEmptyGroup) {
      showAlert('warning', 'Semua group harus memiliki minimal 1 kapal!');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingConfig) {
        const result = await updateConfig(editingConfig.id, formData);
        showAlert(
          'success',
          result.message || 'Konfigurasi berhasil diupdate!'
        );
      } else {
        const result = await createConfig(formData);
        showAlert('success', result.message || 'Konfigurasi berhasil dibuat!');
      }
      setShowModal(false);
    } catch (error: any) {
      console.error('Error saving config:', error);
      showAlert('error', `Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGroup = () => {
    const groupNumber = Object.keys(formData.groups).length + 1;
    // Untuk senior dan junior gunakan 'container', untuk manalagi tetap 'manalagi'
    const typePrefix =
      formData.type === 'senior' || formData.type === 'junior'
        ? 'container'
        : formData.type;
    const groupKey = `${typePrefix}_rotation${groupNumber}`;
    setFormData({
      ...formData,
      groups: {
        ...formData.groups,
        [groupKey]: [],
      },
    });
  };

  const removeGroup = (groupKey: string) => {
    const newGroups = { ...formData.groups };
    delete newGroups[groupKey];
    setFormData({ ...formData, groups: newGroups });
  };

  const addShipToGroup = (groupKey: string, shipName: string) => {
    if (!shipName.trim()) {
      showAlert('warning', 'Nama kapal tidak boleh kosong!');
      return;
    }

    setFormData({
      ...formData,
      groups: {
        ...formData.groups,
        [groupKey]: [...(formData.groups[groupKey] || []), shipName.trim()],
      },
    });
  };

  const removeShipFromGroup = (groupKey: string, index: number) => {
    const ships = [...formData.groups[groupKey]];
    ships.splice(index, 1);
    setFormData({
      ...formData,
      groups: {
        ...formData.groups,
        [groupKey]: ships,
      },
    });
  };

  // Urutan hierarki jabatan
  const jobTitleOrder = [
    'nakhoda',
    'KKM',
    'mualimI',
    'masinisII',
    'mualimII',
    'masinisIII',
    'mualimIII',
    'masinisIV',
  ];

  const sortedConfigs = [...configs].sort((a, b) => {
    const indexA = jobTitleOrder.indexOf(a.job_title);
    const indexB = jobTitleOrder.indexOf(b.job_title);

    // Jika tidak ada di urutan, taruh di akhir
    if (indexA === -1) return 1;
    if (indexB === -1) return -1;

    return indexA - indexB;
  });

  if (loading) {
    return (
      <div className="p-6">
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Alert */}
      {alert.show && (
        <div className="mb-4">
          <Alert
            color={alert.type}
            onDismiss={() => setAlert({ ...alert, show: false })}
          >
            {alert.message}
          </Alert>
        </div>
      )}

      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Kelola Konfigurasi Rotasi
          </h1>
          <p className="text-gray-600 mt-1">
            Manage rotation configurations for all job types
          </p>
        </div>
        <div className="flex gap-2">
          <Button color="gray" onClick={refetch} disabled={isSubmitting}>
            <HiRefresh className="mr-2" />
            Refresh
          </Button>
          <Button onClick={handleCreate} disabled={isSubmitting}>
            <HiPlus className="mr-2" />
            Tambah Konfigurasi
          </Button>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <Table>
          <Table.Head>
            <Table.HeadCell>Job Title</Table.HeadCell>
            <Table.HeadCell>Vessel</Table.HeadCell>
            <Table.HeadCell>Type</Table.HeadCell>
            <Table.HeadCell>Part</Table.HeadCell>
            <Table.HeadCell>Groups</Table.HeadCell>
            <Table.HeadCell>Total Ships</Table.HeadCell>
            <Table.HeadCell>Actions</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {sortedConfigs.map(config => {
              const totalShips = Object.values(config.groups).flat().length;

              // Helper function untuk vessel color
              const getVesselColor = (vessel: string) => {
                switch (vessel) {
                  case 'D':
                    return { color: 'info', label: 'D' };
                  case 'E':
                    return { color: 'failure', label: 'E' };
                  case 'F':
                    return { color: 'warning', label: 'F' };
                  case 'G':
                    return { color: 'success', label: 'G' };
                  default:
                    return { color: 'gray', label: vessel };
                }
              };

              // Helper function untuk type color
              const getTypeColor = (type: string) => {
                switch (type) {
                  case 'senior':
                    return { color: 'purple', label: 'Senior' };
                  case 'junior':
                    return { color: 'pink', label: 'Junior' };
                  case 'manalagi':
                    return { color: 'indigo', label: 'Manalagi' };
                  default:
                    return { color: 'gray', label: type };
                }
              };

              // Helper function untuk part color
              const getPartColor = (part: string) => {
                switch (part) {
                  case 'deck':
                    return { color: 'success', label: 'Deck' };
                  case 'engine':
                    return { color: 'warning', label: 'Engine' };
                  default:
                    return { color: 'gray', label: part };
                }
              };

              const vesselInfo = getVesselColor(config.vessel);
              const typeInfo = getTypeColor(config.type);
              const partInfo = getPartColor(config.part);

              return (
                <Table.Row
                  key={config.id}
                  className="bg-white hover:bg-gray-50"
                >
                  <Table.Cell className="font-bold text-gray-900 text-base">
                    {config.job_title}
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={vesselInfo.color as any}
                      size="lg"
                      className="font-semibold"
                    >
                      {vesselInfo.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={typeInfo.color as any}
                      size="lg"
                      className="font-semibold"
                    >
                      {typeInfo.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <Badge
                      color={partInfo.color as any}
                      size="lg"
                      className="font-semibold"
                    >
                      {partInfo.label}
                    </Badge>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium text-gray-700">
                      {Object.keys(config.groups).length} groups
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <span className="font-medium text-blue-600">
                      {totalShips} ships
                    </span>
                  </Table.Cell>
                  <Table.Cell>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        color="gray"
                        onClick={() => handleEdit(config)}
                        disabled={isSubmitting}
                      >
                        <HiPencil />
                      </Button>
                      <Button
                        size="sm"
                        color="failure"
                        onClick={() =>
                          handleDelete(config.id, config.job_title)
                        }
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        ) : (
                          <HiTrash />
                        )}
                      </Button>
                    </div>
                  </Table.Cell>
                </Table.Row>
              );
            })}
          </Table.Body>
        </Table>

        {configs.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            Belum ada konfigurasi rotasi. Klik "Tambah Konfigurasi" untuk
            membuat yang baru.
          </div>
        )}
      </div>

      {/* Modal Form */}
      <Modal show={showModal} onClose={() => setShowModal(false)} size="4xl">
        <Modal.Header>
          {editingConfig ? 'Edit' : 'Tambah'} Konfigurasi Rotasi
        </Modal.Header>
        <Modal.Body>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="job_title">Job Title *</Label>
                <TextInput
                  id="job_title"
                  value={formData.job_title}
                  onChange={e =>
                    setFormData({ ...formData, job_title: e.target.value })
                  }
                  placeholder="contoh: mualimII, nakhoda, KKM"
                  required
                />
              </div>
              <div>
                <Label htmlFor="vessel">Vessel *</Label>
                <Select
                  id="vessel"
                  value={formData.vessel}
                  onChange={e =>
                    setFormData({ ...formData, vessel: e.target.value })
                  }
                >
                  <option value="D">D</option>
                  <option value="E">E</option>
                  <option value="F">F</option>
                  <option value="G">G</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="type">Type *</Label>
                <Select
                  id="type"
                  value={formData.type}
                  onChange={e =>
                    setFormData({ ...formData, type: e.target.value })
                  }
                >
                  <option value="senior">Senior</option>
                  <option value="junior">Junior</option>
                  <option value="manalagi">Manalagi</option>
                </Select>
              </div>
              <div>
                <Label htmlFor="part">Part *</Label>
                <Select
                  id="part"
                  value={formData.part}
                  onChange={e =>
                    setFormData({ ...formData, part: e.target.value })
                  }
                >
                  <option value="deck">Deck</option>
                  <option value="engine">Engine</option>
                </Select>
              </div>
            </div>

            <div className="border-t pt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Groups & Kapal</h3>
                <Button type="button" size="sm" onClick={addGroup}>
                  <HiPlus className="mr-2" />
                  Tambah Group
                </Button>
              </div>

              <div className="space-y-4 max-h-96 overflow-y-auto">
                {Object.entries(formData.groups).map(([groupKey, ships]) => (
                  <GroupEditor
                    key={groupKey}
                    groupKey={groupKey}
                    ships={ships}
                    onAddShip={shipName => addShipToGroup(groupKey, shipName)}
                    onRemoveShip={index => removeShipFromGroup(groupKey, index)}
                    onRemoveGroup={() => removeGroup(groupKey)}
                  />
                ))}

                {Object.keys(formData.groups).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    Belum ada group. Klik "Tambah Group" untuk membuat group
                    pertama.
                  </div>
                )}
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-4 border-t">
              <Button
                color="gray"
                onClick={() => setShowModal(false)}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    {editingConfig ? 'Updating...' : 'Menyimpan...'}
                  </>
                ) : editingConfig ? (
                  'Update'
                ) : (
                  'Simpan'
                )}
              </Button>
            </div>
          </form>
        </Modal.Body>
      </Modal>
    </div>
  );
}

// Component untuk edit group
function GroupEditor({
  groupKey,
  ships,
  onAddShip,
  onRemoveShip,
  onRemoveGroup,
}: {
  groupKey: string;
  ships: string[];
  onAddShip: (shipName: string) => void;
  onRemoveShip: (index: number) => void;
  onRemoveGroup: () => void;
}) {
  const [newShip, setNewShip] = useState('');

  const handleAdd = () => {
    if (newShip.trim()) {
      onAddShip(newShip);
      setNewShip('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAdd();
    }
  };

  return (
    <div className="p-4 border rounded-lg bg-gray-50">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-semibold text-gray-900">{groupKey}</h4>
        <Button size="xs" color="failure" onClick={onRemoveGroup}>
          <HiTrash className="mr-1" />
          Hapus Group
        </Button>
      </div>

      <div className="flex gap-2 mb-3">
        <TextInput
          value={newShip}
          onChange={e => setNewShip(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nama Kapal (contoh: KM. ORIENTAL EMERALD)"
          className="flex-1"
        />
        <Button size="sm" onClick={handleAdd}>
          <HiPlus />
        </Button>
      </div>

      <div className="space-y-1">
        {ships.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-2">Belum ada kapal</p>
        ) : (
          ships.map((ship, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-white rounded border"
            >
              <span className="text-sm">{ship}</span>
              <Button
                size="xs"
                color="failure"
                onClick={() => onRemoveShip(index)}
              >
                <HiTrash />
              </Button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
