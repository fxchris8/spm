import { Link } from 'react-router-dom';
import { HiOutlineSquaresPlus } from 'react-icons/hi2';
import {
  formatCategorizationDisplay,
  formatPositionDisplay,
} from '../utils/vesselMappingUtils';

interface EmptyRotationGroupStateProps {
  categorization: string; // 'container' | 'manalagi' | 'bc'
  position: string; // e.g. 'mualimII', 'masinisIII'
  type?: 'senior' | 'junior';
}

export function EmptyRotationGroupState({
  categorization,
  position,
}: EmptyRotationGroupStateProps) {
  const formattedCategory = formatCategorizationDisplay(categorization);
  const formattedPosition = formatPositionDisplay(position);

  return (
    <div className="py-12 px-4">
      <div className="max-w-xl mx-auto bg-white border border-gray-200 rounded-2xl shadow-sm p-8 text-center">
        {/* Icon */}
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-blue-50 text-blue-600 mb-5">
          <HiOutlineSquaresPlus className="w-8 h-8" />
        </div>

        {/* Heading */}
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Grouping Kapal Belum Dibuat
        </h3>

        {/* Description with hyperlink */}
        <p className="text-gray-600 text-sm leading-relaxed">
          Konfigurasi grup rotasi kapal untuk posisi{' '}
          <strong className="text-gray-800">{formattedPosition}</strong> pada
          armada <strong className="text-gray-800">{formattedCategory}</strong>{' '}
          belum diatur di database.{' '}
          <Link
            to="/vessel-management"
            className="text-blue-600 hover:text-blue-700 underline font-medium inline-flex items-center gap-1"
          >
            Atur disini &rarr;
          </Link>
        </p>
      </div>
    </div>
  );
}
