'use client';

import { useState } from 'react';
import { Button, Navbar, Avatar, Dropdown, Modal } from 'flowbite-react';
import { HiLogout, HiExclamationCircle } from 'react-icons/hi';
import { useAuth } from '../../context/AuthContext';

export function NavbarComponent() {
  const { user, logout } = useAuth();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const handleLogoutConfirm = () => {
    setShowLogoutModal(false);
    logout();
  };

  const username = user?.username || 'User';
  const email = user?.email || 'user@example.com';
  const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(
    username
  )}&background=dc2626&color=fff`;

  return (
    <>
      <Navbar fluid className="bg-red-800 shadow-lg border-red-950">
        <Navbar.Brand href="/" className="hover:opacity-90 transition-opacity">
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
              label={<Avatar alt="User" img={avatarUrl} rounded />}
            >
              <Dropdown.Header>
                <span className="block text-sm font-semibold">{username}</span>
                <span className="block truncate text-sm text-gray-500">
                  {email}
                </span>
              </Dropdown.Header>
              <Dropdown.Item
                icon={HiLogout}
                onClick={() => setShowLogoutModal(true)}
              >
                Logout
              </Dropdown.Item>
            </Dropdown>
          </div>

          {/* Logout Button - Mobile */}
          <Button
            color="failure"
            size="sm"
            className="md:hidden"
            onClick={() => setShowLogoutModal(true)}
          >
            <HiLogout className="h-4 w-4" />
          </Button>

          <Navbar.Toggle className="text-white hover:bg-red-800" />
        </div>
      </Navbar>

      {/* Logout Confirmation Modal */}
      <Modal
        show={showLogoutModal}
        size="md"
        onClose={() => setShowLogoutModal(false)}
        popup
      >
        <Modal.Header />
        <Modal.Body>
          <div className="text-center">
            <HiExclamationCircle className="mx-auto mb-4 h-14 w-14 text-red-600" />
            <h3 className="mb-2 text-lg font-semibold text-gray-800">
              Konfirmasi Logout
            </h3>
            <p className="mb-6 text-sm text-gray-500">
              Apakah Anda yakin ingin keluar dari aplikasi?
            </p>
            <div className="flex justify-center gap-3">
              <Button color="failure" onClick={handleLogoutConfirm}>
                Ya, Logout
              </Button>
              <Button color="gray" onClick={() => setShowLogoutModal(false)}>
                Batal
              </Button>
            </div>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
