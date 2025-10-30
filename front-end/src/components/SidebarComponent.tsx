'use client';

import { Sidebar } from 'flowbite-react';
import {
  HiOutlineChartPie,
  HiOutlineMagnifyingGlassCircle,
  HiOutlineBriefcase,
  HiOutlineUserMinus,
  HiOutlineArrowPath,
  HiOutlineCube,
} from 'react-icons/hi2';
import { GiShipWheel } from 'react-icons/gi';
import { MdAutorenew } from 'react-icons/md';
import { useLocation, useNavigate } from 'react-router-dom';

export function SidebarComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const isActive = (path: string): boolean => pathname === path;
  const isParentActive = (paths: string[]): boolean =>
    paths.some(path => pathname.startsWith(path));

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar aria-label="Sidebar">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item
            onClick={() => handleNavigation('/')}
            icon={() => <HiOutlineChartPie className="w-6 h-6" />}
            active={isActive('/')}
            className="cursor-pointer"
          >
            Dashboard
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={() => <HiOutlineMagnifyingGlassCircle className="w-6 h-6" />}
            label="Search"
            open={isParentActive(['/search_on_duty', '/search_off_duty'])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/search_on_duty')}
              icon={() => <HiOutlineBriefcase className="w-6 h-6" />}
              active={isActive('/search_on_duty')}
              className="cursor-pointer"
            >
              On Duty
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/search_off_duty')}
              icon={() => <HiOutlineUserMinus className="w-6 h-6" />}
              active={isActive('/search_off_duty')}
              className="cursor-pointer"
            >
              Off Duty
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Collapse
            icon={() => <HiOutlineArrowPath className="w-6 h-6" />}
            label="Rotation"
            open={isParentActive([
              '/container_rotation',
              '/schedule_rotation',
              '/manalagi_rotation',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/container_rotation')}
              icon={() => <HiOutlineCube className="w-6 h-6" />}
              active={isActive('/container_rotation')}
              className="cursor-pointer"
            >
              Senior Rotation
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/schedule_rotation')}
              icon={() => <GiShipWheel className="w-6 h-6" />}
              active={isActive('/schedule_rotation')}
              className="cursor-pointer"
            >
              Junior Rotation
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/manalagi_rotation')}
              icon={() => <MdAutorenew className="w-6 h-6" />}
              active={isActive('/manalagi_rotation')}
              className="cursor-pointer"
            >
              Manalagi Rotation
            </Sidebar.Item>
          </Sidebar.Collapse>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
