import { useState, useMemo } from 'react';
import {
  Button,
  Table,
  TextInput,
  Label,
  Select,
  Badge,
  Alert,
  Card,
} from 'flowbite-react';
import {
  HiPlus,
  HiTrash,
  HiRefresh,
  HiChevronUp,
  HiPencil,
  HiX,
} from 'react-icons/hi';
import {
  useRotationShipConfig,
  RotationConfig,
} from '../hooks/useRotationShipConfig';

type AlertType = 'success' | 'error' | 'warning' | 'info';

export default function RotationShipConfig() {
  const {
    configs,
    loading,
    createConfig,
    updateConfig,
    deleteConfig,
    refetch,
  } = useRotationShipConfig();

  const [expandedRowId, setExpandedRowId] = useState<number | null>(null);
  const [editingConfig, setEditingConfig] = useState<RotationConfig | null>(
    null
  );
  const [showCreateForm, setShowCreateForm] = useState(false);

  const [formData, setFormData] = useState({
    job_title: '',
    vessel: 'D',
    type: 'senior',
    part: 'deck',
    groups: {} as Record<string, string[]>,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFieldsLocked, setIsFieldsLocked] = useState(true);

  // Filter states
  const [filterType, setFilterType] = useState<string>('all');
  const [filterPart, setFilterPart] = useState<string>('all');
  const [filterPosition, setFilterPosition] = useState<string>('all');

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
    setIsFieldsLocked(false);
    setExpandedRowId(null);
    setFormData({
      job_title: '',
      vessel: 'D',
      type: 'senior',
      part: 'deck',
      groups: {},
    });
    setShowCreateForm(true);
  };

  const handleEdit = (config: RotationConfig) => {
    setShowCreateForm(false);
    setEditingConfig(config);
    setIsFieldsLocked(true);
    setExpandedRowId(config.id);
    setFormData({
      job_title: config.job_title,
      vessel: config.vessel,
      type: config.type,
      part: config.part,
      groups: config.groups,
    });
  };

  const handleCancelEdit = () => {
    setExpandedRowId(null);
    setEditingConfig(null);
    setShowCreateForm(false);
    setIsFieldsLocked(true);
  };

  const handleDelete = async (id: number, jobTitle: string) => {
    if (!window.confirm(`Yakin ingin menghapus konfigurasi ${jobTitle}?`)) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteConfig(id);
      showAlert('success', result.message || 'Konfigurasi berhasil dihapus!');
      handleCancelEdit();
    } catch (error: any) {
      console.error('Error deleting config:', error);
      showAlert('error', `Gagal menghapus: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.job_title.trim()) {
      showAlert('warning', 'Position harus diisi!');
      return;
    }

    if (Object.keys(formData.groups).length === 0) {
      showAlert('warning', 'Minimal harus ada 1 group!');
      return;
    }

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
      handleCancelEdit();
    } catch (error: any) {
      console.error('Error saving config:', error);
      showAlert('error', `Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const addGroup = () => {
    const groupNumber = Object.keys(formData.groups).length + 1;
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

  const formatJobTitleDisplay = (jobTitle: string): string => {
    const formatMap: Record<string, string> = {
      nakhoda: 'Nahkoda',
      KKM: 'KKM',
      mualimI: 'Mualim I',
      mualimII: 'Mualim II',
      mualimIII: 'Mualim III',
      masinisII: 'Masinis II',
      masinisIII: 'Masinis III',
      masinisIV: 'Masinis IV',
    };
    return formatMap[jobTitle] || jobTitle;
  };

  const formatGroupName = (groupKey: string): string => {
    const match = groupKey.match(/rotation(\d+)$/);
    return match ? `Group ${match[1]}` : groupKey;
  };

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
  const typeOrder = ['senior', 'junior', 'manalagi'];

  const filteredAndSortedConfigs = useMemo(() => {
    return [...configs]
      .filter(config => {
        if (filterType !== 'all' && config.type !== filterType) return false;
        if (filterPart !== 'all' && config.part !== filterPart) return false;
        if (filterPosition !== 'all' && config.job_title !== filterPosition)
          return false;
        return true;
      })
      .sort((a, b) => {
        const typeIndexA = typeOrder.indexOf(a.type);
        const typeIndexB = typeOrder.indexOf(b.type);
        if (typeIndexA !== typeIndexB) return typeIndexA - typeIndexB;

        const jobIndexA = jobTitleOrder.indexOf(a.job_title);
        const jobIndexB = jobTitleOrder.indexOf(b.job_title);
        if (jobIndexA === -1) return 1;
        if (jobIndexB === -1) return -1;
        return jobIndexA - jobIndexB;
      });
  }, [configs, filterType, filterPart, filterPosition]);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-red-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">
            Loading rotation configurations...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {alert.show && (
        <div className="mb-4">
          <Alert
            color={alert.type}
            onDismiss={() => setAlert({ ...alert, show: false })}
          >
            <span>{alert.message}</span>
          </Alert>
        </div>
      )}

      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Rotation Ship Configuration
          </h1>
          <div className="flex gap-2">
            <Button color="gray" onClick={() => refetch()} className="hidden">
              <HiRefresh className="mr-2" />
              Refresh
            </Button>
            <Button onClick={handleCreate}>
              <HiPlus className="mr-2" />
              Tambah Konfigurasi
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-gray-50 p-4 rounded-lg">
          <div>
            <Label htmlFor="filter-type" className="mb-2 block">
              Filter by Type
            </Label>
            <Select
              id="filter-type"
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
            >
              <option value="all">Semua Type</option>
              <option value="senior">Senior</option>
              <option value="junior">Junior</option>
              <option value="manalagi">Manalagi</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-part" className="mb-2 block">
              Filter by Part
            </Label>
            <Select
              id="filter-part"
              value={filterPart}
              onChange={e => setFilterPart(e.target.value)}
            >
              <option value="all">Semua Part</option>
              <option value="deck">Deck</option>
              <option value="engine">Engine</option>
            </Select>
          </div>
          <div>
            <Label htmlFor="filter-position" className="mb-2 block">
              Filter by Position
            </Label>
            <Select
              id="filter-position"
              value={filterPosition}
              onChange={e => setFilterPosition(e.target.value)}
            >
              <option value="all">Semua Position</option>
              <option value="nakhoda">Nahkoda</option>
              <option value="KKM">KKM</option>
              <option value="mualimI">Mualim I</option>
              <option value="mualimII">Mualim II</option>
              <option value="mualimIII">Mualim III</option>
              <option value="masinisII">Masinis II</option>
              <option value="masinisIII">Masinis III</option>
              <option value="masinisIV">Masinis IV</option>
            </Select>
          </div>
        </div>
      </div>

      {showCreateForm && (
        <Card className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold text-gray-800">
              Tambah Konfigurasi Baru
            </h2>
            <Button size="sm" color="gray" onClick={handleCancelEdit}>
              <HiX className="mr-2" />
              Batal
            </Button>
          </div>
          <EditForm
            formData={formData}
            setFormData={setFormData}
            isFieldsLocked={false}
            setIsFieldsLocked={setIsFieldsLocked}
            editingConfig={null}
            isSubmitting={isSubmitting}
            handleSubmit={handleSubmit}
            addGroup={addGroup}
            removeGroup={removeGroup}
            addShipToGroup={addShipToGroup}
            removeShipFromGroup={removeShipFromGroup}
            formatGroupName={formatGroupName}
          />
        </Card>
      )}

      <div className="overflow-x-auto rounded-xl shadow-md">
        <Table striped>
          <Table.Head>
            <Table.HeadCell>Type</Table.HeadCell>
            <Table.HeadCell>Part</Table.HeadCell>
            <Table.HeadCell>Vessel</Table.HeadCell>
            <Table.HeadCell>Position</Table.HeadCell>
            <Table.HeadCell>Groups</Table.HeadCell>
            <Table.HeadCell>Aksi</Table.HeadCell>
          </Table.Head>
          <Table.Body className="divide-y">
            {filteredAndSortedConfigs.length === 0 ? (
              <Table.Row>
                <Table.Cell colSpan={6} className="text-center py-8">
                  <p className="text-gray-500">
                    Tidak ada konfigurasi yang sesuai dengan filter
                  </p>
                </Table.Cell>
              </Table.Row>
            ) : (
              filteredAndSortedConfigs.map(config => (
                <>
                  <Table.Row key={config.id} className="bg-white">
                    <Table.Cell>
                      <Badge
                        color={
                          config.type === 'senior'
                            ? 'success'
                            : config.type === 'junior'
                              ? 'warning'
                              : 'purple'
                        }
                      >
                        {config.type}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color={config.part === 'deck' ? 'blue' : 'gray'}>
                        {config.part}
                      </Badge>
                    </Table.Cell>
                    <Table.Cell>
                      <Badge color="info">{config.vessel}</Badge>
                    </Table.Cell>
                    <Table.Cell className="font-medium">
                      {formatJobTitleDisplay(config.job_title)}
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex flex-wrap gap-1">
                        {Object.keys(config.groups).map(groupKey => (
                          <Badge key={groupKey} color="gray" size="sm">
                            {formatGroupName(groupKey)} (
                            {config.groups[groupKey].length})
                          </Badge>
                        ))}
                      </div>
                    </Table.Cell>
                    <Table.Cell>
                      <div className="flex gap-2">
                        <Button
                          size="xs"
                          onClick={() =>
                            expandedRowId === config.id
                              ? handleCancelEdit()
                              : handleEdit(config)
                          }
                          disabled={isSubmitting || showCreateForm}
                        >
                          {expandedRowId === config.id ? (
                            <>
                              <HiChevronUp className="mr-1" />
                              Tutup
                            </>
                          ) : (
                            <>
                              <HiPencil className="mr-1" />
                              Edit
                            </>
                          )}
                        </Button>
                        <Button
                          size="xs"
                          color="failure"
                          onClick={() =>
                            handleDelete(config.id, config.job_title)
                          }
                          disabled={isSubmitting || showCreateForm}
                        >
                          <HiTrash />
                        </Button>
                      </div>
                    </Table.Cell>
                  </Table.Row>

                  {expandedRowId === config.id && editingConfig && (
                    <Table.Row>
                      <Table.Cell colSpan={6} className="bg-gray-50 p-0">
                        <Card className="m-4">
                          <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-800">
                              Edit Konfigurasi
                            </h2>
                            <Button
                              size="sm"
                              color="gray"
                              onClick={handleCancelEdit}
                            >
                              <HiX className="mr-2" />
                              Batal
                            </Button>
                          </div>
                          <EditForm
                            formData={formData}
                            setFormData={setFormData}
                            isFieldsLocked={isFieldsLocked}
                            setIsFieldsLocked={setIsFieldsLocked}
                            editingConfig={editingConfig}
                            isSubmitting={isSubmitting}
                            handleSubmit={handleSubmit}
                            addGroup={addGroup}
                            removeGroup={removeGroup}
                            addShipToGroup={addShipToGroup}
                            removeShipFromGroup={removeShipFromGroup}
                            formatGroupName={formatGroupName}
                          />
                        </Card>
                      </Table.Cell>
                    </Table.Row>
                  )}
                </>
              ))
            )}
          </Table.Body>
        </Table>
      </div>
    </div>
  );
}

function EditForm({
  formData,
  setFormData,
  isFieldsLocked,
  setIsFieldsLocked,
  editingConfig,
  isSubmitting,
  handleSubmit,
  addGroup,
  removeGroup,
  addShipToGroup,
  removeShipFromGroup,
  formatGroupName,
}: any) {
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {editingConfig && !isFieldsLocked && (
        <Alert color="warning">
          <div className="flex items-start justify-between">
            <span className="text-sm">
              ⚠️ Anda sedang mengubah field kritis! Pastikan perubahan sudah
              benar!
            </span>
            <Button
              size="xs"
              color="gray"
              onClick={() => setIsFieldsLocked(true)}
              className="shrink-0 ml-4"
            >
              Lock Kembali
            </Button>
          </div>
        </Alert>
      )}

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div>
          <Label htmlFor="type">
            Type *
            {editingConfig && isFieldsLocked && (
              <span className="ml-2 text-xs text-amber-600"></span>
            )}
          </Label>
          <Select
            id="type"
            value={formData.type}
            onChange={e => setFormData({ ...formData, type: e.target.value })}
            disabled={editingConfig ? isFieldsLocked : false}
            className={editingConfig && isFieldsLocked ? 'bg-gray-100' : ''}
          >
            <option value="senior">Senior</option>
            <option value="junior">Junior</option>
            <option value="manalagi">Manalagi</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="part">
            Part *
            {editingConfig && isFieldsLocked && (
              <span className="ml-2 text-xs text-amber-600"></span>
            )}
          </Label>
          <Select
            id="part"
            value={formData.part}
            onChange={e => setFormData({ ...formData, part: e.target.value })}
            disabled={editingConfig ? isFieldsLocked : false}
            className={editingConfig && isFieldsLocked ? 'bg-gray-100' : ''}
          >
            <option value="deck">Deck</option>
            <option value="engine">Engine</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="vessel">
            Vessel *
            {editingConfig && isFieldsLocked && (
              <span className="ml-2 text-xs text-amber-600"></span>
            )}
          </Label>
          <Select
            id="vessel"
            value={formData.vessel}
            onChange={e => setFormData({ ...formData, vessel: e.target.value })}
            disabled={editingConfig ? isFieldsLocked : false}
            className={editingConfig && isFieldsLocked ? 'bg-gray-100' : ''}
          >
            <option value="D">D</option>
            <option value="E">E</option>
            <option value="F">F</option>
            <option value="G">G</option>
          </Select>
        </div>
        <div>
          <Label htmlFor="job_title">
            Position *
            {editingConfig && isFieldsLocked && (
              <span className="ml-2 text-xs text-amber-600"></span>
            )}
          </Label>
          <Select
            id="job_title"
            value={formData.job_title}
            onChange={e =>
              setFormData({ ...formData, job_title: e.target.value })
            }
            required
            disabled={editingConfig ? isFieldsLocked : false}
            className={editingConfig && isFieldsLocked ? 'bg-gray-100' : ''}
          >
            <option value="">Pilih Position</option>
            <option value="nakhoda">Nahkoda</option>
            <option value="KKM">KKM</option>
            <option value="mualimI">Mualim I</option>
            <option value="mualimII">Mualim II</option>
            <option value="mualimIII">Mualim III</option>
            <option value="masinisII">Masinis II</option>
            <option value="masinisIII">Masinis III</option>
            <option value="masinisIV">Masinis IV</option>
          </Select>
        </div>
      </div>

      {editingConfig && isFieldsLocked && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <p className="text-sm text-blue-800">
            Field kritis di-lock untuk mencegah perubahan tidak sengaja.
            <button
              type="button"
              onClick={() => setIsFieldsLocked(false)}
              className="ml-2 text-blue-600 hover:text-blue-800 underline font-medium"
            >
              Klik di sini untuk unlock
            </button>
          </p>
        </div>
      )}

      <div className="border-t pt-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Groups & Kapal</h3>
          <Button type="button" size="sm" onClick={addGroup}>
            <HiPlus className="mr-2" />
            Tambah Group
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(formData.groups).map(([groupKey, ships]) => (
            <GroupEditor
              key={groupKey}
              groupKey={groupKey}
              ships={ships as string[]}
              onAddShip={shipName => addShipToGroup(groupKey, shipName)}
              onRemoveShip={index => removeShipFromGroup(groupKey, index)}
              onRemoveGroup={() => removeGroup(groupKey)}
              formatGroupName={formatGroupName}
            />
          ))}

          {Object.keys(formData.groups).length === 0 && (
            <div className="col-span-2 text-center py-8 text-gray-500">
              Belum ada group. Klik "Tambah Group" untuk membuat group pertama.
            </div>
          )}
        </div>
      </div>

      <div className="flex justify-end gap-2 pt-4 border-t">
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
  );
}

function GroupEditor({
  groupKey,
  ships,
  onAddShip,
  onRemoveShip,
  onRemoveGroup,
  formatGroupName,
}: {
  groupKey: string;
  ships: string[];
  onAddShip: (shipName: string) => void;
  onRemoveShip: (index: number) => void;
  onRemoveGroup: () => void;
  formatGroupName: (key: string) => string;
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
    <div className="p-4 border-2 border-gray-200 rounded-lg bg-white">
      <div className="flex justify-between items-center mb-3">
        <h4 className="font-bold text-gray-900 text-lg">
          {formatGroupName(groupKey)}
        </h4>
        <Button size="xs" color="failure" onClick={onRemoveGroup}>
          <HiTrash className="mr-1" />
          Hapus
        </Button>
      </div>

      <div className="flex gap-2 mb-3">
        <TextInput
          value={newShip}
          onChange={e => setNewShip(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Nama Kapal (contoh: KM. ORIENTAL EMERALD)"
          className="flex-1"
          sizing="sm"
        />
        <Button size="sm" onClick={handleAdd}>
          <HiPlus />
        </Button>
      </div>

      <div className="space-y-1 max-h-40 overflow-y-auto">
        {ships.length === 0 ? (
          <p className="text-sm text-gray-500 italic py-2 text-center">
            Belum ada kapal
          </p>
        ) : (
          ships.map((ship, index) => (
            <div
              key={index}
              className="flex justify-between items-center p-2 bg-gray-50 rounded border border-gray-200"
            >
              <span className="text-sm font-medium">{ship}</span>
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
