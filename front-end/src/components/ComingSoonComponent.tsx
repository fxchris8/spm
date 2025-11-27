'use client';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faRocket, faClock, faTools } from '@fortawesome/free-solid-svg-icons';

interface ComingSoonProps {
  title?: string;
  description?: string;
}

export function ComingSoonComponent({
  title = 'Coming Soon',
  description = 'This feature is currently under development and will be available soon.',
}: ComingSoonProps) {
  return (
    <section className="p-6 flex-1 overflow-y-auto">
      <div className="flex items-center justify-center min-h-[calc(100vh-8rem)]">
        <div className="text-center max-w-2xl mx-auto">
          {/* Icon Container */}
          <div className="mb-8 flex justify-center gap-4">
            <div className="p-6 bg-red-100 rounded-2xl inline-block animate-bounce">
              <FontAwesomeIcon
                icon={faRocket}
                className="text-6xl text-red-600"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-4xl font-bold mb-4 text-gray-800">{title}</h1>

          {/* Description */}
          <p className="text-lg text-gray-600 mb-8">{description}</p>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="p-4 bg-blue-100 rounded-xl inline-block mb-4">
                <FontAwesomeIcon
                  icon={faTools}
                  className="text-3xl text-blue-600"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                In Development
              </h3>
              <p className="text-sm text-gray-600">
                Our team is working hard to bring you this feature with the best
                user experience.
              </p>
            </div>

            <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6">
              <div className="p-4 bg-green-100 rounded-xl inline-block mb-4">
                <FontAwesomeIcon
                  icon={faClock}
                  className="text-3xl text-green-600"
                />
              </div>
              <h3 className="text-lg font-semibold text-gray-800 mb-2">
                Stay Tuned
              </h3>
              <p className="text-sm text-gray-600">
                We'll notify you as soon as this feature is ready to use.
              </p>
            </div>
          </div>

          {/* Additional Info */}
          <div className="mt-12 p-6 bg-gray-50 rounded-xl border border-gray-200">
            <p className="text-sm text-gray-600">
              If you have any questions or suggestions, please contact our
              development team.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
