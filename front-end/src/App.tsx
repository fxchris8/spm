'use client';

import { NavbarComponent } from './components/layouts/NavbarComponent';
import { SidebarComponent } from './components/layouts/SidebarComponent';
import { Dashboard } from './components/Dashboard/Dashboard';
import RotationShipConfig from './components/RotationShipConfig';
import { RotationSenior } from './components/Container/RotationSenior';
import { RotationJunior } from './components/Container/RotationJunior';
import { RotationManalagiSenior } from './components/Manalagi/RotationManalagiSenior';
import { RotationManalagiJunior } from './components/Manalagi/RotationManalagiJunior';
import { RotationBargeCraneSenior } from './components/BargeCrane/RotationBargeCraneSenior';
import { RotationBargeCraneJunior } from './components/BargeCrane/RotationBargeCraneJunior';
import { SearchOnDuty } from './components/Search/SearchOnDuty';
import { SearchOffDuty } from './components/Search/SearchOffDuty';
import { AllMessage } from './components/Message/AllMessage';
import { InMessage } from './components/Message/InMessage';
import { OutMessage } from './components/Message/OutMessage';
// import { ComingSoonComponent } from './components/ComingSoonComponent';
import { Route, Routes } from 'react-router-dom';

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
            <Route path="/" element={<Dashboard />} />
            <Route path="/search_on_duty" element={<SearchOnDuty />} />
            <Route path="/search_off_duty" element={<SearchOffDuty />} />
            <Route path="/rotation_ship" element={<RotationShipConfig />} />
            <Route path="/senior_rotation" element={<RotationSenior />} />
            <Route path="/junior_rotation" element={<RotationJunior />} />
            <Route
              path="/manalagi_senior_rotation"
              element={<RotationManalagiSenior />}
            />
            <Route
              path="/manalagi_junior_rotation"
              element={<RotationManalagiJunior />}
            />
            <Route
              path="/barge_crane_senior_rotation"
              element={<RotationBargeCraneSenior />}
            />
            <Route
              path="/barge_crane_junior_rotation"
              element={<RotationBargeCraneJunior />}
            />
            <Route path="/all_message" element={<AllMessage />} />
            <Route path="/in_message" element={<InMessage />} />
            <Route path="/out_message" element={<OutMessage />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}
