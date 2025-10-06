"use client";

import { Button, Navbar, Avatar, Dropdown } from "flowbite-react";
import { HiLogout } from "react-icons/hi";

export function NavbarComponent() {
  const handleLogout = () => {
    // logout logic
    alert("Logout Clicked");
    console.log("Logout clicked");
  };

  return (
    <Navbar 
      fluid 
      className="bg-gradient-to-r from-red-700 to-red-900 shadow-lg border-red-950"
    >
      <Navbar.Brand href="/dashboard" className="hover:opacity-90 transition-opacity">
        <img 
          src="/logo.ico" 
          className="mr-4 h-8 sm:h-10" 
          alt="SPIL Fleet Logo" 
        />
        <div className="flex flex-col">
          <span className="text-white text-xl sm:text-2xl font-bold tracking-tight">
            SPIL - Fleet
          </span>
          <span className="text-red-200 text-xs sm:text-sm font-medium -mt-1">
            Ship Personnel Management
          </span>
        </div>
      </Navbar.Brand>

      <div className="flex items-center gap-3 md:order-2">
        {/* User Dropdown - Desktop */}
        <div className="hidden md:block">
          <Dropdown
            arrowIcon={false}
            inline
            label={
              <Avatar 
                alt="User" 
                img="https://ui-avatars.com/api/?name=Admin&background=dc2626&color=fff"
                rounded
              />
            }
          >
            <Dropdown.Header>
              <span className="block text-sm font-semibold">Admin</span>
              <span className="block truncate text-sm text-gray-500">
                admin@spil.com
              </span>
            </Dropdown.Header>
            <Dropdown.Item icon={HiLogout} onClick={handleLogout}>
              Logout
            </Dropdown.Item>
          </Dropdown>
        </div>

        {/* Logout Button - Mobile */}
        <Button 
          color="failure"
          size="sm"
          className="md:hidden"
          onClick={handleLogout}
        >
          <HiLogout className="h-4 w-4" />
        </Button>

        <Navbar.Toggle className="text-white hover:bg-red-800" />
      </div>
    </Navbar>
  );
}