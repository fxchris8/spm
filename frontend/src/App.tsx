'use client';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { Login } from './components/auth/Login';
import { SsoCallback } from './components/auth/SsoCallback';
import { NavbarComponent } from './components/layouts/NavbarComponent';
import { SidebarComponent } from './components/layouts/SidebarComponent';
import { Dashboard } from './components/dashboard/Dashboard';
import { VesselManagement } from './components/vessel-management/VesselManagement';
import { RotationSenior } from './components/container/RotationSenior';
import { RotationJunior } from './components/container/RotationJunior';
import { RotationManalagiSenior } from './components/manalagi/RotationManalagiSenior';
import { RotationManalagiJunior } from './components/manalagi/RotationManalagiJunior';
import { RotationBargeCraneSenior } from './components/barge-crane/RotationBargeCraneSenior';
import { RotationBargeCraneJunior } from './components/barge-crane/RotationBargeCraneJunior';
import { SearchOnDuty } from './components/search/SearchOnDuty';
import { SearchOffDuty } from './components/search/SearchOffDuty';
import { AllMessage } from './components/message/AllMessage';
import { InMessage } from './components/message/InMessage';
import { OutMessage } from './components/message/OutMessage';
// import { ComingSoonComponent } from './components/ComingSoonComponent';
import { Route, Routes } from 'react-router-dom';
import { Toaster } from 'sonner';

export function App() {
  const NAVBAR_HEIGHT = '4rem';

  return (
    <div className="min-h-screen relative">
      <AuthProvider>
        <Routes>
          {/* Public Route */}
          <Route path="/login" element={<Login />} />
          <Route path="/auth/sso/callback" element={<SsoCallback />} />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route
              path="/*"
              element={
                <>
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
                        <Route
                          path="/search-onduty"
                          element={<SearchOnDuty />}
                        />
                        <Route
                          path="/search-offduty"
                          element={<SearchOffDuty />}
                        />
                        <Route
                          path="/vessel-management"
                          element={<VesselManagement />}
                        />
                        <Route
                          path="/senior-rotation"
                          element={<RotationSenior />}
                        />
                        <Route
                          path="/junior-rotation"
                          element={<RotationJunior />}
                        />
                        <Route
                          path="/manalagi-senior-rotation"
                          element={<RotationManalagiSenior />}
                        />
                        <Route
                          path="/manalagi-junior-rotation"
                          element={<RotationManalagiJunior />}
                        />
                        <Route
                          path="/bc-senior-rotation"
                          element={<RotationBargeCraneSenior />}
                        />
                        <Route
                          path="/bc-junior-rotation"
                          element={<RotationBargeCraneJunior />}
                        />
                        <Route path="/all-message" element={<AllMessage />} />
                        <Route path="/in-message" element={<InMessage />} />
                        <Route path="/out-message" element={<OutMessage />} />
                      </Routes>
                    </main>
                  </div>
                </>
              }
            />
          </Route>
        </Routes>
        <Toaster position="top-right" richColors closeButton />
      </AuthProvider>
    </div>
  );
}
