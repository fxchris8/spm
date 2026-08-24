'use client';

import { Sidebar } from 'flowbite-react';
import {
  HiOutlineChartPie,
  HiOutlineMagnifyingGlassCircle,
  HiOutlineBriefcase,
  HiOutlineUserMinus,
  HiOutlineArrowPath,
  HiOutlineCube,
  HiOutlineShieldCheck,
  HiOutlineEnvelope,
  HiOutlineArrowDownCircle,
  HiOutlineArrowUpCircle,
  HiOutlineUserGroup,
  HiOutlineUser,
} from 'react-icons/hi2';
import { GiShipWheel } from 'react-icons/gi';
import { useLocation, useNavigate } from 'react-router-dom';

import { useState, useEffect } from 'react';
import type { ComponentProps } from 'react';

// Theme for parent Rotation collapse list spacing & consistent darker text-gray-900
const parentCollapseTheme: ComponentProps<typeof Sidebar.Collapse>['theme'] = {
  icon: {
    base: 'h-6 w-6 flex-shrink-0 text-gray-900 transition duration-75',
    open: {
      off: 'text-gray-900',
      on: 'text-gray-900',
    },
  },
  label: {
    icon: {
      base: 'h-5 w-5 flex-shrink-0 text-gray-900 transition-transform duration-200',
      open: {
        off: 'text-gray-900',
        on: 'text-gray-900 rotate-180',
      },
    },
  },
  list: 'space-y-2 py-1.5 pl-1',
};

// Theme for sub-level collapse (Container, Manalagi, BC) - Level 2 (15px) text-gray-900
const subCollapseTheme: ComponentProps<typeof Sidebar.Collapse>['theme'] = {
  button:
    'flex items-center justify-between w-full py-2 px-2.5 text-[15px] font-medium text-gray-900 rounded-lg hover:bg-gray-100 dark:text-gray-100 dark:hover:bg-gray-700 group transition duration-75 my-0.5',
  icon: {
    base: 'h-4.5 w-4.5 flex-shrink-0 text-gray-900 transition duration-75 group-hover:text-gray-900 dark:text-gray-100',
    open: {
      off: 'text-gray-900',
      on: 'text-gray-900',
    },
  },
  label: {
    base: 'ml-2.5 flex-1 text-left whitespace-nowrap text-[15px] font-medium text-gray-900 dark:text-gray-100',
    icon: {
      base: 'h-4 w-4 flex-shrink-0 text-gray-900 transition-transform duration-200',
      open: {
        off: 'rotate-180 text-gray-900',
        on: 'rotate-0 text-gray-900',
      },
    },
  },
  list: 'space-y-1 py-1 pl-1',
};

// Theme for leaf items (Senior, Junior) - Level 3 (14px) text-gray-900
const subItemTheme: ComponentProps<typeof Sidebar.Item>['theme'] = {
  base: 'flex items-center justify-start rounded-lg py-1.5 px-2.5 text-[14px] font-normal text-gray-900 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-200 dark:hover:bg-gray-700 group transition duration-75',
  active:
    'bg-blue-50 text-blue-600 font-semibold dark:bg-gray-700 dark:text-blue-400',
  content: {
    base: 'flex-1 whitespace-nowrap px-2 text-[14px]',
  },
  icon: {
    base: 'h-4 w-4 flex-shrink-0 text-gray-900 group-hover:text-gray-900 dark:text-gray-200',
    active: 'text-blue-600 dark:text-blue-400',
  },
};

const ROTATION_PATHS = [
  '/senior-rotation',
  '/junior-rotation',
  '/manalagi-senior-rotation',
  '/manalagi-junior-rotation',
  '/bc-senior-rotation',
  '/bc-junior-rotation',
];

interface SidebarOpenState {
  search: boolean;
  rotation: boolean;
  rotation_container: boolean;
  rotation_manalagi: boolean;
  rotation_bc: boolean;
  messages: boolean;
}

const STORAGE_KEY = 'spm_sidebar_open_state';

function getInitialOpenState(pathname: string): SidebarOpenState {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      return {
        search: parsed.search ?? pathname.startsWith('/search'),
        rotation: parsed.rotation ?? true,
        rotation_container: parsed.rotation_container ?? true,
        rotation_manalagi: parsed.rotation_manalagi ?? true,
        rotation_bc: parsed.rotation_bc ?? true,
        messages: parsed.messages ?? pathname.endsWith('-message'),
      };
    }
  } catch (e) {
    console.error('Failed to load sidebar state', e);
  }

  return {
    search: pathname.startsWith('/search'),
    rotation: true,
    rotation_container: true,
    rotation_manalagi: true,
    rotation_bc: true,
    messages: pathname.endsWith('-message'),
  };
}

export function SidebarComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const [openState, setOpenState] = useState<SidebarOpenState>(() =>
    getInitialOpenState(pathname)
  );

  const isActive = (path: string): boolean => pathname === path;
  const isParentActive = (paths: string[]): boolean =>
    paths.some(path => pathname.startsWith(path));

  const toggleSection = (key: keyof SidebarOpenState) => {
    setOpenState(prev => {
      const next = { ...prev, [key]: !prev[key] };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch (e) {
        console.error('Failed to save sidebar state', e);
      }
      return next;
    });
  };

  // Ensure active route parent sections are open without collapsing others
  useEffect(() => {
    setOpenState(prev => {
      let changed = false;
      const next = { ...prev };

      if (
        isParentActive(['/search-onduty', '/search-offduty']) &&
        !prev.search
      ) {
        next.search = true;
        changed = true;
      }
      if (isParentActive(ROTATION_PATHS) && !prev.rotation) {
        next.rotation = true;
        changed = true;
      }
      if (
        isParentActive(['/all-message', '/in-message', '/out-message']) &&
        !prev.messages
      ) {
        next.messages = true;
        changed = true;
      }

      if (changed) {
        try {
          localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        } catch (e) {
          console.error('Failed to save sidebar state', e);
        }
        return next;
      }
      return prev;
    });
  }, [pathname]);

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar aria-label="Sidebar" className="w-full">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item
            onClick={() => handleNavigation('/')}
            icon={() => <HiOutlineChartPie className="w-6 h-6 flex-shrink-0" />}
            active={isActive('/')}
            className="cursor-pointer"
          >
            Dashboard
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={() => (
              <HiOutlineMagnifyingGlassCircle className="w-6 h-6 flex-shrink-0" />
            )}
            label="Search"
            open={openState.search}
            onClick={() => toggleSection('search')}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/search-onduty')}
              icon={() => <HiOutlineBriefcase className="w-6 h-6 flex-shrink-0" />}
              active={isActive('/search-onduty')}
              className="cursor-pointer"
            >
              On Duty
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/search-offduty')}
              icon={() => <HiOutlineUserMinus className="w-6 h-6 flex-shrink-0" />}
              active={isActive('/search-offduty')}
              className="cursor-pointer"
            >
              Off Duty
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Item
            onClick={() => handleNavigation('/vessel-management')}
            icon={() => <HiOutlineShieldCheck className="w-6 h-6 flex-shrink-0" />}
            active={isActive('/vessel-management')}
            className="cursor-pointer"
          >
            Vessel Management
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={() => <HiOutlineArrowPath className="w-6 h-6 flex-shrink-0" />}
            label="Rotation"
            open={openState.rotation}
            onClick={() => toggleSection('rotation')}
            theme={parentCollapseTheme}
          >
            <Sidebar.Collapse
              icon={() => <HiOutlineCube className="w-4.5 h-4.5 flex-shrink-0" />}
              label="Container, Free Cargo, RORO"
              open={openState.rotation_container}
              onClick={() => toggleSection('rotation_container')}
              theme={subCollapseTheme}
              className="pl-3"
            >
              <Sidebar.Item
                onClick={() => handleNavigation('/senior-rotation')}
                icon={() => <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0" />}
                active={isActive('/senior-rotation')}
                theme={subItemTheme}
                className="cursor-pointer pl-6"
              >
                Senior
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleNavigation('/junior-rotation')}
                icon={() => <HiOutlineUser className="w-4 h-4 flex-shrink-0" />}
                active={isActive('/junior-rotation')}
                theme={subItemTheme}
                className="cursor-pointer pl-6"
              >
                Junior
              </Sidebar.Item>
            </Sidebar.Collapse>

            <Sidebar.Collapse
              icon={() => <GiShipWheel className="w-4.5 h-4.5 flex-shrink-0" />}
              label="Manalagi"
              open={openState.rotation_manalagi}
              onClick={() => toggleSection('rotation_manalagi')}
              theme={subCollapseTheme}
              className="pl-3"
            >
              <Sidebar.Item
                onClick={() => handleNavigation('/manalagi-senior-rotation')}
                icon={() => <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0" />}
                active={isActive('/manalagi-senior-rotation')}
                theme={subItemTheme}
                className="cursor-pointer pl-6"
              >
                Senior
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleNavigation('/manalagi-junior-rotation')}
                icon={() => <HiOutlineUser className="w-4 h-4 flex-shrink-0" />}
                active={isActive('/manalagi-junior-rotation')}
                theme={subItemTheme}
                className="cursor-pointer pl-6"
              >
                Junior
              </Sidebar.Item>
            </Sidebar.Collapse>

            <Sidebar.Collapse
              icon={() => <HiOutlineArrowPath className="w-4.5 h-4.5 flex-shrink-0" />}
              label="BC, TB, TK, Service"
              open={openState.rotation_bc}
              onClick={() => toggleSection('rotation_bc')}
              theme={subCollapseTheme}
              className="pl-3"
            >
              <Sidebar.Item
                onClick={() => handleNavigation('/bc-senior-rotation')}
                icon={() => <HiOutlineUserGroup className="w-4 h-4 flex-shrink-0" />}
                active={isActive('/bc-senior-rotation')}
                theme={subItemTheme}
                className="cursor-pointer pl-6"
              >
                Senior
              </Sidebar.Item>
              <Sidebar.Item
                onClick={() => handleNavigation('/bc-junior-rotation')}
                icon={() => <HiOutlineUser className="w-4 h-4 flex-shrink-0" />}
                active={isActive('/bc-junior-rotation')}
                theme={subItemTheme}
                className="cursor-pointer pl-6"
              >
                Junior
              </Sidebar.Item>
            </Sidebar.Collapse>
          </Sidebar.Collapse>
          <Sidebar.Collapse
            icon={() => <HiOutlineEnvelope className="w-6 h-6 flex-shrink-0" />}
            label="Messages"
            open={openState.messages}
            onClick={() => toggleSection('messages')}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/all-message')}
              icon={() => <HiOutlineEnvelope className="w-6 h-6 flex-shrink-0" />}
              active={isActive('/all-message')}
              className="cursor-pointer"
            >
              All - Message
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/in-message')}
              icon={() => <HiOutlineArrowDownCircle className="w-6 h-6 flex-shrink-0" />}
              active={isActive('/in-message')}
              className="cursor-pointer"
            >
              In - Message
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/out-message')}
              icon={() => <HiOutlineArrowUpCircle className="w-6 h-6 flex-shrink-0" />}
              active={isActive('/out-message')}
              className="cursor-pointer"
            >
              Out - Message
            </Sidebar.Item>
          </Sidebar.Collapse>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
