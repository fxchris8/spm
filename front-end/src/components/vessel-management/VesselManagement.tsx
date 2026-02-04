import { useState, useEffect, useMemo } from 'react';
import { Button, Spinner } from 'flowbite-react';
import { toast } from 'sonner';
import { CategoryPositionSelector } from './CategoryPositionSelector';
import { GroupsEditor } from './GroupsEditor';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { useVesselManagement } from '../../hooks/useVesselManagement';
import {
  getHiddenFieldsFromSelection,
  formatCategorizationDisplay,
  formatPositionDisplay,
} from '../../utils/vesselMappingUtils';

export function VesselManagement() {
  const { vessels, loading, createVessel, updateVessel, deleteVessel } =
    useVesselManagement();

  // Selection states
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    'container'
  );
  const [selectedPosition, setSelectedPosition] = useState<string | null>(null);

  // Edit states
  const [isEditMode, setIsEditMode] = useState(false);
  const [editedGroups, setEditedGroups] = useState<Record<string, string[]>>(
    {}
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

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
  };

  const handlePositionChange = (position: string) => {
    setSelectedPosition(position);
    setIsEditMode(false);
  };

  const handleEditToggle = () => {
    if (isEditMode) {
      // Cancel edit - revert to original
      if (existingVessel) {
        setEditedGroups(existingVessel.groups);
      } else {
        setEditedGroups({});
      }
    }
    setIsEditMode(!isEditMode);
  };

  const handleSave = async () => {
    if (!selectedCategory || !selectedPosition) {
      toast.warning('Pilih kategori dan position terlebih dahulu!');
      return;
    }

    if (Object.keys(editedGroups).length === 0) {
      toast.warning('Minimal harus ada 1 group!');
      return;
    }

    const hasEmptyGroup = Object.entries(editedGroups).some(
      ([, ships]) => ships.length === 0
    );

    if (hasEmptyGroup) {
      toast.warning('Semua group harus memiliki minimal 1 kapal!');
      return;
    }

    // Get hidden fields from mapping
    const hiddenFields = getHiddenFieldsFromSelection(
      selectedCategory,
      selectedPosition
    );

    if (!hiddenFields) {
      toast.error(
        'Kombinasi kategori dan position tidak valid! Silakan hubungi administrator.'
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        job_title: selectedPosition,
        vessel: hiddenFields.vessel,
        type: hiddenFields.type,
        part: hiddenFields.part,
        categorization: selectedCategory,
        groups: editedGroups,
      };

      if (existingVessel) {
        // Update existing
        const result = await updateVessel(existingVessel.id, payload);
        toast.success(result.message || 'Konfigurasi berhasil diupdate!');
      } else {
        // Create new
        const result = await createVessel(payload);
        toast.success(result.message || 'Konfigurasi berhasil dibuat!');
      }

      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error saving vessel:', error);
      toast.error(`Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-1">
          <h1 className="text-3xl font-bold text-gray-800">
            Manajemen Vessel / Kapal
          </h1>
        </div>
        <p className="text-gray-600">
          Kelola konfigurasi group kapal berdasarkan kategori kapal dan posisi
          seamen.
        </p>
      </div>

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
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            {/* Header */}
            <div className="flex justify-between items-center bg-white rounded-lg mb-8">
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

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        show={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        onConfirm={handleDeleteConfirm}
        message={`Yakin ingin menghapus konfigurasi ${formatPositionDisplay(
          selectedPosition || ''
        )} untuk ${formatCategorizationDisplay(selectedCategory || '')}?`}
      />
    </div>
  );
}
