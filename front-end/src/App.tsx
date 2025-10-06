'use client';

import { NavbarComponent } from './components/NavbarComponent';
import { SidebarComponent } from './components/SidebarComponent';
import { Dashboard } from './components/Dashboard';
import { RotationContainer } from './components/RotationContainer';
import { RotationKKM } from './components/RotationKKM';
import { SearchOnDuty } from './components/SearchOnDuty';
import { SearchOffDuty } from './components/SearchOffDuty';
import { Route, Routes, Navigate } from 'react-router-dom';

export function App() {
  const NAVBAR_HEIGHT = '4rem';

  return (
    <div className="min-h-screen relative">
      <div
        className="fixed top-0 left-0 w-full z-50"
        style={{ height: NAVBAR_HEIGHT }}
      >
        <NavbarComponent />
      </div>

      <div
        className="flex"
        style={{
          paddingTop: NAVBAR_HEIGHT,
        }}
      >
        <div
          className="fixed left-0 bottom-0 bg-gray-100 overflow-y-auto z-40"
          style={{
            top: NAVBAR_HEIGHT,
            width: '16rem',
          }}
        >
          <SidebarComponent />
        </div>

        <main
          className="flex-1 p-4 overflow-x-hidden"
          style={{ marginLeft: '16rem' }}
        >
          <Routes>
            <Route path="/" element={<Navigate to="/dashboard" />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/search_on_duty" element={<SearchOnDuty />} />
            <Route path="/search_off_duty" element={<SearchOffDuty />} />
            <Route path="/container_rotation" element={<RotationContainer />} />
            <Route path="/manalagi_rotation" element={<RotationKKM />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
