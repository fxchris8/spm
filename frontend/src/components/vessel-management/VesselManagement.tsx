import { useState, useEffect, useMemo } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { FaShip } from 'react-icons/fa';
import { HiOutlineCube, HiOutlineShieldCheck } from 'react-icons/hi2';
import { GiShipWheel, GiCargoCrane } from 'react-icons/gi';
import { toast } from 'sonner';
import { CategoryPositionSelector } from './CategoryPositionSelector';
import { GroupsEditor } from './GroupsEditor';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { SyncConfirmModal } from './SyncConfirmModal';
import { RoleDecisionCard } from './RoleDecisionCard';
import { useVesselManagement } from '../../hooks/useVesselManagement';
import {
  getHiddenFieldsFromSelection,
  getLinkedPosition,
  formatCategorizationDisplay,
  formatPositionDisplay,
} from '../../utils/vesselMappingUtils';

export function VesselManagement() {
  const { vessels, loading, createVessel, updateVessel, deleteVessel } =
    useVesselManagement();

  // Top-level tab state: 'vessels' | 'roles'
  const [activeMainTab, setActiveMainTab] = useState<'vessels' | 'roles'>('vessels');

  // Role category selection state
  const [selectedRoleCategory, setSelectedRoleCategory] = useState<string>('container');

  // Selection states for Vessel Management
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    'container'
  );
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Edit states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedGroups, setEditedGroups] = useState<Record<string, string[]>>(
    {}
  );
  const [groupKeyRenames, setGroupKeyRenames] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Sync modal state
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<null | {
    job_title: string;
    vessel: string;
    type?: string;
    part: string;
    categorization: string;
    groups: Record<string, string[]>;
    group_key_renames: Record<string, string>;
  }>(null);

  // Find existing vessel configuration based on selection
  const existingVessel = useMemo(() => {
    if (!selectedCategory || !selectedPosition) return null;

    return vessels.find(
      v =>
        v.categorization === selectedCategory &&
        v.job_title === selectedPosition
    );
  }, [vessels, selectedCategory, selectedPosition]);

  // Update edited groups when existing vessel changes
  useEffect(() => {
    if (existingVessel) {
      setEditedGroups(existingVessel.groups);
    } else {
      setEditedGroups({});
    }
  }, [existingVessel]);

  const handleCategoryChange = (category: string) => {
    setSelectedCategory(category);
    setSelectedPosition(null);
    setIsEditMode(false);
    setEditedGroups({});
    setGroupKeyRenames({});
  };

  const handlePositionChange = (position: string) => {
    setSelectedPosition(position);
    setIsEditMode(false);
    setGroupKeyRenames({});
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - revert to original
      if (existingVessel) {
        setEditedGroups(existingVessel.groups);
      } else {
        setEditedGroups({});
      }
      setGroupKeyRenames({});
    }
    setIsEditMode(!isEditMode);
  };

  const executeSave = async (
    payload: {
      job_title: string;
      vessel: string;
      type?: string;
      part: string;
      categorization: string;
      groups: Record<string, string[]>;
      group_key_renames: Record<string, string>;
    },
    alsoSyncLinked: boolean
  ) => {
    setIsSubmitting(true);
    try {
      // Save current position
      if (existingVessel) {
        const result = await updateVessel(existingVessel.id, payload);
        toast.success(result.message || 'Konfigurasi berhasil diupdate!');
      } else {
        const result = await createVessel(payload);
        toast.success(result.message || 'Konfigurasi berhasil dibuat!');
      }

      // If user wants to sync, save the linked position too
      if (alsoSyncLinked && selectedCategory && selectedPosition) {
        const linkedPosition = getLinkedPosition(
          selectedCategory,
          selectedPosition
        );
        if (linkedPosition) {
          const linkedHiddenFields = getHiddenFieldsFromSelection(
            selectedCategory,
            linkedPosition
          );
          if (linkedHiddenFields) {
            const linkedPayload = {
              ...payload,
              job_title: linkedPosition,
              vessel: linkedHiddenFields.vessel,
              part: linkedHiddenFields.part,
            };
            const existingLinked = vessels.find(
              v =>
                v.categorization === selectedCategory &&
                v.job_title === linkedPosition
            );
            if (existingLinked) {
              await updateVessel(existingLinked.id, linkedPayload);
            } else {
              await createVessel(linkedPayload);
            }
            toast.success(
              `Konfigurasi ${formatPositionDisplay(
                linkedPosition
              )} juga berhasil diupdate!`
            );
          }
        }
      }

      setIsEditMode(false);
      setGroupKeyRenames({});
    } catch (error: any) {
      console.error('Error saving config:', error);
      const errMsg = error.error || error.message || 'Gagal menyimpan konfigurasi';
      toast.error(`Gagal menyimpan: ${errMsg}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (!selectedCategory || !selectedPosition) {
      toast.error('Kategori dan posisi harus dipilih');
      return;
    }

    // Validasi struktur grup rotasi (minimal 1 grup, setiap grup minimal 1 kapal)
    const groupKeys = Object.keys(editedGroups || {});
    if (groupKeys.length === 0) {
      toast.error('Minimal harus memiliki 1 grup rotasi.');
      return;
    }

    for (const groupKey of groupKeys) {
      const ships = editedGroups[groupKey];
      if (!ships || ships.length === 0) {
        toast.error(`Grup '${groupKey}' minimal harus memiliki 1 kapal.`);
        return;
      }
    }

    const hiddenFields = getHiddenFieldsFromSelection(
      selectedCategory,
      selectedPosition
    );

    if (!hiddenFields) {
      toast.error('Gagal menentukan mapping untuk kombinasi ini');
      return;
    }

    const payload = {
      job_title: selectedPosition,
      vessel: hiddenFields.vessel,
      part: hiddenFields.part,
      categorization: selectedCategory,
      groups: editedGroups,
      group_key_renames: groupKeyRenames,
    };

    const linkedPosition = getLinkedPosition(
      selectedCategory,
      selectedPosition
    );

    if (linkedPosition) {
      setPendingPayload(payload);
      setShowSyncModal(true);
    } else {
      await executeSave(payload, false);
    }
  };

  const handleSyncBoth = async () => {
    setShowSyncModal(false);
    if (pendingPayload) {
      await executeSave(pendingPayload, true);
      setPendingPayload(null);
    }
  };

  const handleSyncSaveOnly = async () => {
    setShowSyncModal(false);
    if (pendingPayload) {
      await executeSave(pendingPayload, false);
      setPendingPayload(null);
    }
  };

  const handleSyncModalClose = () => {
    setShowSyncModal(false);
    setPendingPayload(null);
  };

  const handleDeleteClick = () => {
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!existingVessel) return;

    setShowDeleteModal(false);
    setIsSubmitting(true);
    try {
      const result = await deleteVessel(existingVessel.id);
      toast.success(result.message || 'Konfigurasi berhasil dihapus!');
      setSelectedPosition(null);
      setEditedGroups({});
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error deleting config:', error);
      toast.error(`Gagal menghapus: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <Spinner size="xl" color="failure" />
        <span className="text-gray-600">Loading rotation vessels...</span>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 tracking-tight">
          Vessels & Roles
        </h1>
      </div>

      {/* Top-Level Tabs: Vessels vs Roles */}
      <div className="border-b border-gray-200 mb-6">
        <div className="flex space-x-6">
          <button
            type="button"
            onClick={() => setActiveMainTab('vessels')}
            className={`inline-flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeMainTab === 'vessels'
                ? 'border-cyan-600 text-cyan-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <FaShip className="w-4 h-4" />
            <span>Vessels</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveMainTab('roles')}
            className={`inline-flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
              activeMainTab === 'roles'
                ? 'border-cyan-600 text-cyan-600 font-semibold'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            <HiOutlineShieldCheck className="w-4 h-4" />
            <span>Roles</span>
          </button>
        </div>
      </div>

      {/* Tab Content: Vessels */}
      {activeMainTab === 'vessels' && (
        <div>
          {/* Step 1 & 2: Category and Position Selection */}
          <div className="mb-6">
            <CategoryPositionSelector
              selectedCategory={selectedCategory}
              selectedPosition={selectedPosition}
              onCategoryChange={handleCategoryChange}
              onPositionChange={handlePositionChange}
              disabled={isEditMode}
            />
          </div>

          {/* Step 3: Groups Display & Edit */}
          {selectedCategory && selectedPosition && (
            <div>
              <div className="bg-white p-4 sm:p-6 rounded-xl border border-gray-200 shadow-xs">
                {/* Header */}
                <div className="flex justify-between items-center bg-white rounded-lg mb-5">
                  <div>
                    <h2 className="text-2xl font-bold text-gray-800">
                      {formatCategorizationDisplay(selectedCategory)} -{' '}
                      {formatPositionDisplay(selectedPosition)}
                    </h2>
                    <p className="text-sm text-gray-600">
                      {existingVessel
                        ? `${Object.keys(existingVessel.groups).length} group`
                        : 'Belum ada group'}
                    </p>
                  </div>
                  {!isEditMode && (
                    <div className="flex gap-2">
                      <Button onClick={handleEditToggle}>
                        {existingVessel ? 'Edit' : 'Buat'}
                      </Button>
                      {existingVessel && (
                        <Button
                          color="failure"
                          onClick={handleDeleteClick}
                          disabled={isSubmitting}
                        >
                          {isSubmitting && <Spinner size="sm" className="mr-2" />}
                          Delete
                        </Button>
                      )}
                    </div>
                  )}
                </div>

                {/* Groups Editor */}
                <GroupsEditor
                  groups={editedGroups}
                  categorization={selectedCategory}
                  isEditMode={isEditMode}
                  onGroupsChange={setEditedGroups}
                  onGroupKeyRenames={updater =>
                    setGroupKeyRenames(prev => updater(prev))
                  }
                />

                {/* Action Buttons - Bottom Right */}
                {isEditMode && (
                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      color="gray"
                      onClick={handleEditToggle}
                      disabled={isSubmitting}
                    >
                      Batal
                    </Button>
                    <Button
                      color="success"
                      onClick={handleSave}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? (
                        <>
                          <Spinner size="sm" className="mr-2" />
                          Menyimpan...
                        </>
                      ) : (
                        <>Simpan</>
                      )}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Empty State */}
          {!selectedCategory && (
            <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
              <p className="text-gray-500 text-lg">
                Pilih kategori dan position untuk melihat atau mengelola konfigurasi
                rotasi kapal.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Tab Content: Roles */}
      {activeMainTab === 'roles' && (
        <div className="space-y-4">
          {/* Category Tabs for Roles (matching screenshot and sidebar icons) */}
          <div className="border-b border-gray-200 mb-4">
            <div className="flex space-x-6">
              {[
                {
                  id: 'container',
                  label: 'Container, Free Cargo, RORO',
                  Icon: HiOutlineCube,
                },
                {
                  id: 'manalagi',
                  label: 'Manalagi',
                  Icon: GiShipWheel,
                },
                {
                  id: 'bc',
                  label: 'BC, TB, TK, Service',
                  Icon: GiCargoCrane,
                },
              ].map(cat => {
                const isActive = selectedRoleCategory === cat.id;
                const IconComponent = cat.Icon;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => setSelectedRoleCategory(cat.id)}
                    className={`inline-flex items-center gap-2 pb-3 px-1 border-b-2 text-sm font-medium transition-colors ${
                      isActive
                        ? 'border-cyan-600 text-cyan-600 font-semibold'
                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    <IconComponent className="w-5 h-5 flex-shrink-0" />
                    <span>{cat.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Role Decision Card for Selected Category */}
          <RoleDecisionCard categorization={selectedRoleCategory} />
        </div>
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        message={`Yakin ingin menghapus konfigurasi ${formatPositionDisplay(
          selectedPosition || ''
        )} untuk ${formatCategorizationDisplay(selectedCategory || '')}?`}
      />

      {/* Sync Confirmation Modal */}
      {selectedCategory && selectedPosition && (
        <SyncConfirmModal
          show={showSyncModal}
          currentPosition={formatPositionDisplay(selectedPosition)}
          linkedPosition={formatPositionDisplay(
            getLinkedPosition(selectedCategory, selectedPosition) || ''
          )}
          onSyncBoth={handleSyncBoth}
          onSaveOnly={handleSyncSaveOnly}
          onClose={handleSyncModalClose}
        />
      )}
    </div>
  );
}
