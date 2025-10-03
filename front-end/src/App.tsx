"use client";
import { NavbarComponent } from "./components/NavbarComponent";
import { SidebarComponent } from "./components/SidebarComponent";
import { Dashboard } from "./components/Dashboard";
import { RotationContainer } from "./components/RotationContainer";
import { RotationKKM } from "./components/RotationKKM";
import { SearchOnDuty } from "./components/SearchOnDuty";
import { SearchOffDuty } from "./components/SearchOffDuty";
// import { PromotionNahkoda } from "./components/PromotionNahkoda";
// import { PromotionKKM } from "./components/PromotionKKM";

import {
  BrowserRouter as Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

export function App() {
  // Misalkan tinggi navbar = 4rem (64px). Sesuaikan dengan style Navbar Anda.
  const NAVBAR_HEIGHT = "4rem";

  return (
    <div className="min-h-screen relative">
      {/* 1. Navbar fixed di atas */}
      <div
        className="fixed top-0 left-0 w-full z-50"
        style={{ height: NAVBAR_HEIGHT }}
      >
        <NavbarComponent />
      </div>

      {/* 2. Layout utama (sidebar + konten) di bawah Navbar */}
      <div
        className="flex"
        style={{
          paddingTop: NAVBAR_HEIGHT, // Agar konten tidak tertutup navbar
        }}
      >
        {/* 3. Sidebar fixed di sisi kiri, menempel di bawah Navbar */}
        <div
          className="fixed left-0 bottom-0 bg-gray-100 overflow-y-auto z-40"
          style={{
            top: NAVBAR_HEIGHT,
            width: "16rem", // Lebar sidebar
          }}
        >
          <SidebarComponent />
        </div>

        {/* 4. Konten utama di kanan, beri margin-left agar tidak tertutup sidebar */}
        <main
          className="flex-1 p-4 overflow-x-hidden" 
          style={{ marginLeft: "16rem" }}
        >
          <Router>
            <Routes>
              <Route path="/" element={<Navigate to="/dashboard" />} />
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/container_rotation" element={
                <RotationContainer/>
              }/>
              <Route path="/manalagi_rotation" element={
                <RotationKKM/>
              }/>
              <Route path="/search_on_duty" element={
                <SearchOnDuty/>
              }/>
              <Route path="/search_off_duty" element={
                <SearchOffDuty/>
              }/>

              {/* Kalau mau dipake, buka lagi aja */}
              {/* <Route path="/promotion_nahkoda" element={
                <PromotionNahkoda/>
              }/>
              <Route path="/promotion_kkm" element={
                <PromotionKKM/>
              }/> */}
            </Routes>
          </Router>
        </main>
      </div>
    </div>
  );
}
