'use client';

interface LoadingComponentProps {
  message?: string;
  fullScreen?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function LoadingComponent({
  message = 'Loading data...',
  fullScreen = true,
  size = 'md',
}: LoadingComponentProps) {
  // Size configurations
  const sizeClasses = {
    sm: 'h-8 w-8 border-b-2',
    md: 'h-16 w-16 border-b-4',
    lg: 'h-24 w-24 border-b-4',
  };

  const textSizeClasses = {
    sm: 'text-sm',
    md: 'text-lg',
    lg: 'text-xl',
  };

  // Container classes based on fullScreen prop
  const containerClasses = fullScreen
    ? 'flex items-center justify-center min-h-screen'
    : 'flex items-center justify-center py-12';

  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <div className={containerClasses}>
        <div className="text-center">
          {/* Spinner */}
          <div
            className={`animate-spin rounded-full ${sizeClasses[size]} border-red-600 mx-auto`}
          ></div>

          {/* Loading Message */}
          {message && (
            <p
              className={`mt-4 text-gray-600 font-medium ${textSizeClasses[size]}`}
            >
              {message}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Minimal Loading Spinner (untuk digunakan dalam komponen kecil)
export function LoadingSpinner({
  size = 'md',
  message,
}: {
  size?: 'sm' | 'md' | 'lg';
  message?: string;
}) {
  const sizeClasses = {
    sm: 'h-6 w-6 border-b-2',
    md: 'h-12 w-12 border-b-2',
    lg: 'h-16 w-16 border-b-4',
  };

  const textSizeClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center justify-center gap-3">
      <div
        className={`animate-spin rounded-full ${sizeClasses[size]} border-red-600`}
      ></div>
      {message && (
        <p className={`text-gray-600 ${textSizeClasses[size]}`}>{message}</p>
      )}
    </div>
  );
}

// Loading Skeleton untuk Table
export function TableLoadingSkeleton({ rows = 5, columns = 8 }) {
  return (
    <div className="overflow-x-auto rounded-xl shadow-md">
      <table className="min-w-full border border-gray-200">
        <thead className="bg-gray-800">
          <tr>
            {Array.from({ length: columns }).map((_, idx) => (
              <th key={idx} className="p-3 border">
                <div className="h-4 bg-gray-700 rounded animate-pulse"></div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="bg-white">
          {Array.from({ length: rows }).map((_, rowIdx) => (
            <tr key={rowIdx} className="border-b">
              {Array.from({ length: columns }).map((_, colIdx) => (
                <td key={colIdx} className="p-3 border">
                  <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// Loading Card Skeleton untuk Dashboard
export function CardLoadingSkeleton({ count = 3 }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      {Array.from({ length: count }).map((_, idx) => (
        <div
          key={idx}
          className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 flex items-center animate-pulse"
        >
          <div className="p-4 bg-gray-200 rounded-xl mr-4 w-16 h-16"></div>
          <div className="flex-1">
            <div className="h-3 bg-gray-200 rounded w-24 mb-3"></div>
            <div className="h-8 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </div>
  );
}
