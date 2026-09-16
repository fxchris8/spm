import { useState } from 'react';
import { Select, Spinner } from 'flowbite-react';
import { HiOutlineArrowPath, HiCheck } from 'react-icons/hi2';
import { toast } from 'sonner';
import {
  useRoleSettings,
  RoleClassification,
} from '../../hooks/useRoleSettings';
import {
  formatCategorizationDisplay,
  formatPositionDisplay,
} from '../../utils/vesselMappingUtils';

interface RoleDecisionCardProps {
  categorization: string;
}

const POSITION_SUBTITLES: Record<string, string> = {
  nakhoda: 'Master / Captain',
  mualimI: 'Chief Mate / 1st Officer',
  mualimII: '2nd Officer',
  mualimIII: '3rd Officer',
  KKM: 'Kepala Kamar Mesin (Chief Engineer)',
  masinisII: 'Second Engineer (2/E)',
  masinisIII: 'Third Engineer (3/E)',
  masinisIV: 'Fourth Engineer (4/E)',
};

const ORDERED_POSITIONS = [
  'nakhoda',
  'mualimI',
  'mualimII',
  'mualimIII',
  'KKM',
  'masinisII',
  'masinisIII',
  'masinisIV',
];

export function RoleDecisionCard({ categorization }: RoleDecisionCardProps) {
  const {
    setRoleSetting,
    resetRoleSettings,
    isUpdating,
    getSeniorRoles,
    getJuniorRoles,
    getPositionRole,
    error,
    refetch,
    hasAuthoritativeSettings,
  } = useRoleSettings();

  const [activeTab, setActiveTab] = useState<RoleClassification>('senior');

  const seniorRoles = getSeniorRoles(categorization);
  const juniorRoles = getJuniorRoles(categorization);

  const seniorCount = seniorRoles.length;
  const juniorCount = juniorRoles.length;

  const isControlDisabled = isUpdating || Boolean(error) || !hasAuthoritativeSettings;

  const handleTogglePosition = async (position: string) => {
    if (isControlDisabled) return;

    const currentRole = getPositionRole(categorization, position);
    const targetRole: RoleClassification =
      currentRole === 'senior' ? 'junior' : 'senior';

    if (currentRole === 'senior' && seniorCount <= 1) {
      toast.warning('Rotasi Senior minimal harus memiliki 1 posisi perwira.');
      return;
    }
    if (currentRole === 'junior' && juniorCount <= 1) {
      toast.warning('Rotasi Junior minimal harus memiliki 1 posisi perwira.');
      return;
    }

    try {
      await setRoleSetting(categorization, position, targetRole);
      const posLabel = formatPositionDisplay(position);
      const roleLabel = targetRole === 'senior' ? 'Senior' : 'Junior';
      toast.success(`${posLabel} dipindahkan ke rotasi ${roleLabel}!`);
    } catch (err: any) {
      toast.error(`Gagal mengubah role: ${err.message}`);
    }
  };

  const handleResetDefaults = async () => {
    if (isControlDisabled) return;

    try {
      await resetRoleSettings(categorization);
      toast.success(
        `Pengaturan role ${formatCategorizationDisplay(categorization)} dikembalikan ke default SPIL.`
      );
    } catch (err: any) {
      toast.error(`Gagal mereset: ${err.message}`);
    }
  };

  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-xs p-4 sm:p-5">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3.5 border-b border-gray-100">
        <div>
          <h3 className="text-base font-semibold text-gray-900">
            Klasifikasi Role Rotasi: {formatCategorizationDisplay(categorization)}
          </h3>
        </div>

        {/* Status & Reset */}
        <div className="flex items-center gap-2 self-end sm:self-center">
          {isUpdating ? (
            <div className="flex items-center gap-1.5 text-xs text-cyan-700 bg-cyan-50 px-2.5 py-1 rounded">
              <Spinner size="xs" />
              <span>Menyimpan...</span>
            </div>
          ) : error ? (
            <div className="flex items-center gap-1 text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">
              <span>Gagal sinkron</span>
            </div>
          ) : (
            <div className="flex items-center gap-1 text-xs text-gray-400 px-1">
              <HiCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tersimpan otomatis</span>
            </div>
          )}

          <button
            type="button"
            disabled={isControlDisabled}
            onClick={handleResetDefaults}
            title="Kembalikan semua posisi ke pengaturan standar SPIL"
            className="inline-flex items-center gap-1 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 border border-gray-200 px-2.5 py-1 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <HiOutlineArrowPath className="w-3.5 h-3.5 text-gray-500" />
            <span>Reset Default</span>
          </button>
        </div>
      </div>

      {/* Error / Fail-Closed Notification */}
      {error && (
        <div className="my-3 p-3 bg-red-50 border border-red-200 rounded-lg text-xs sm:text-sm text-red-700 flex items-center justify-between gap-2">
          <div>
            <span className="font-semibold">Gagal memuat konfigurasi role:</span>{' '}
            <span>{error.message || 'Koneksi ke server bermasalah'}. Mengubah role dinonaktifkan demi keamanan data.</span>
          </div>
          <button
            type="button"
            onClick={() => refetch()}
            className="px-2.5 py-1 bg-red-100 hover:bg-red-200 text-red-800 rounded text-xs font-semibold shrink-0 cursor-pointer"
          >
            Coba Lagi
          </button>
        </div>
      )}

      {/* Role Selection Dropdown */}
      <div className="flex items-center gap-3 my-4">
        <label htmlFor="role-select" className="text-xs sm:text-sm font-medium text-gray-700 whitespace-nowrap">
          Rotasi yang dikonfigurasi:
        </label>
        <Select
          id="role-select"
          value={activeTab}
          disabled={isControlDisabled}
          onChange={e => setActiveTab(e.target.value as RoleClassification)}
          sizing="sm"
          className="w-56"
        >
          <option value="senior">Rotasi Senior ({seniorCount} Posisi)</option>
          <option value="junior">Rotasi Junior ({juniorCount} Posisi)</option>
        </Select>
      </div>

      {/* Positions Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {ORDERED_POSITIONS.map(pos => {
          const currentRole = getPositionRole(categorization, pos);
          const isAssignedToActiveTab = currentRole === activeTab;
          const title = formatPositionDisplay(pos);
          const subtitle = POSITION_SUBTITLES[pos] || pos;

          return (
            <label
              key={pos}
              className={`flex items-center justify-between p-3 rounded-lg border transition-colors ${
                isControlDisabled
                  ? 'opacity-60 cursor-not-allowed bg-gray-50 border-gray-200'
                  : isAssignedToActiveTab
                  ? 'bg-cyan-50/60 border-cyan-300 text-gray-900 cursor-pointer'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50 cursor-pointer'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <input
                  type="checkbox"
                  checked={isAssignedToActiveTab}
                  disabled={isControlDisabled}
                  onChange={() => handleTogglePosition(pos)}
                  className="w-4 h-4 text-cyan-600 rounded border-gray-300 focus:ring-cyan-500 cursor-pointer disabled:cursor-not-allowed"
                />
                <div className="min-w-0">
                  <span className="text-sm font-medium text-gray-900">{title}</span>
                  <span className="text-xs text-gray-500 ml-2 truncate">({subtitle})</span>
                </div>
              </div>

              <span
                className={`text-xs px-2 py-0.5 rounded font-medium flex-shrink-0 ${
                  currentRole === 'senior'
                    ? 'bg-cyan-100 text-cyan-800'
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                {currentRole === 'senior' ? 'Senior' : 'Junior'}
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
