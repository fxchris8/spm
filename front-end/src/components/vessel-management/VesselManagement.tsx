import { useState, useEffect, useMemo } from 'react';
import { Button, Alert, Spinner } from 'flowbite-react';
import { HiRefresh } from 'react-icons/hi';
import { CategoryPositionSelector } from './CategoryPositionSelector';
import { GroupsEditor } from './GroupsEditor';
import { useVesselManagement } from '../../hooks/useVesselManagement';
import { LoadingComponent } from '../LoadingComponent';
import {
  getHiddenFieldsFromSelection,
  formatCategorizationDisplay,
  formatPositionDisplay,
} from '../../utils/vesselMappingUtils';

type AlertType = 'success' | 'error' | 'warning' | 'info';

export function VesselManagement() {
  const {
    vessels,
    loading,
    createVessel,
    updateVessel,
    deleteVessel,
    refetch,
  } = useVesselManagement();

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

  const showAlert = (type: AlertType, message: string) => {
    setAlert({ show: true, type, message });
    setTimeout(() => {
      setAlert({ show: false, type: 'info', message: '' });
    }, 5000);
  };

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
      showAlert('warning', 'Pilih kategori dan position terlebih dahulu!');
      return;
    }

    if (Object.keys(editedGroups).length === 0) {
      showAlert('warning', 'Minimal harus ada 1 group!');
      return;
    }

    const hasEmptyGroup = Object.entries(editedGroups).some(
      ([, ships]) => ships.length === 0
    );

    if (hasEmptyGroup) {
      showAlert('warning', 'Semua group harus memiliki minimal 1 kapal!');
      return;
    }

    // Get hidden fields from mapping
    const hiddenFields = getHiddenFieldsFromSelection(
      selectedCategory,
      selectedPosition
    );

    if (!hiddenFields) {
      showAlert(
        'error',
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
        showAlert(
          'success',
          result.message || 'Konfigurasi berhasil diupdate!'
        );
      } else {
        // Create new
        const result = await createVessel(payload);
        showAlert('success', result.message || 'Konfigurasi berhasil dibuat!');
      }

      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error saving vessel:', error);
      showAlert('error', `Gagal menyimpan: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!existingVessel) return;

    if (
      !window.confirm(
        `Yakin ingin menghapus konfigurasi ${formatPositionDisplay(selectedPosition!)} untuk ${formatCategorizationDisplay(selectedCategory!)}?`
      )
    ) {
      return;
    }

    setIsSubmitting(true);
    try {
      const result = await deleteVessel(existingVessel.id);
      showAlert('success', result.message || 'Konfigurasi berhasil dihapus!');
      setSelectedPosition(null);
      setEditedGroups({});
      setIsEditMode(false);
    } catch (error: any) {
      console.error('Error deleting config:', error);
      showAlert('error', `Gagal menghapus: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <LoadingComponent message="Loading rotation vessels..." />;
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
            <span>{alert.message}</span>
          </Alert>
        </div>
      )}

      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold text-gray-800">
            Rotation Ship Configuration
          </h1>
          <Button
            color="gray"
            onClick={() => refetch()}
            size="sm"
            className="hidden"
          >
            <HiRefresh className="mr-2" />
            Refresh
          </Button>
        </div>
        <p className="text-gray-600">
          Kelola konfigurasi rotasi kapal berdasarkan kategori dan position.
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
        <div className="space-y-4">
          {/* Action Buttons */}
          <div className="flex justify-between items-center bg-white p-4 rounded-lg border border-gray-200">
            <div>
              <h2 className="text-xl font-bold text-gray-800">
                {formatCategorizationDisplay(selectedCategory)} -{' '}
                {formatPositionDisplay(selectedPosition)}
              </h2>
              <p className="text-sm text-gray-600">
                {existingVessel
                  ? `${Object.keys(existingVessel.groups).length} group(s) terkonfigurasi`
                  : 'Belum ada konfigurasi'}
              </p>
            </div>
            <div className="flex gap-2">
              {!isEditMode ? (
                <>
                  <Button onClick={handleEditToggle}>
                    {existingVessel
                      ? 'Edit Configuration'
                      : 'Create Configuration'}
                  </Button>
                  {existingVessel && (
                    <Button
                      color="failure"
                      onClick={handleDelete}
                      disabled={isSubmitting}
                    >
                      {isSubmitting && <Spinner size="sm" className="mr-2" />}
                      Delete
                    </Button>
                  )}
                </>
              ) : (
                <>
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
                      <>
                        Simpan
                      </>
                    )}
                  </Button>
                  <Button
                    color="gray"
                    onClick={handleEditToggle}
                    disabled={isSubmitting}
                  >
                    Batal
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Groups Editor */}
          <div className="bg-white p-6 rounded-lg border border-gray-200">
            <GroupsEditor
              groups={editedGroups}
              categorization={selectedCategory}
              isEditMode={isEditMode}
              onGroupsChange={setEditedGroups}
            />
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
  );
}
