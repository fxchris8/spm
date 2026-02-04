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
            open={isParentActive(['/search-onduty', '/search-offduty'])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/search-onduty')}
              icon={() => <HiOutlineBriefcase className="w-6 h-6" />}
              active={isActive('/search-onduty')}
              className="cursor-pointer"
            >
              On Duty
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/search-offduty')}
              icon={() => <HiOutlineUserMinus className="w-6 h-6" />}
              active={isActive('/search-offduty')}
              className="cursor-pointer"
            >
              Off Duty
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Item
            onClick={() => handleNavigation('/vessel-management')}
            icon={() => <HiOutlineShieldCheck className="w-6 h-6" />}
            active={isActive('/vessel-management')}
            className="cursor-pointer"
          >
            Vessel Management
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={() => <HiOutlineCube className="w-6 h-6" />}
            label="Container Rotation"
            open={isParentActive(['/senior-rotation', '/junior-rotation'])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/senior-rotation')}
              icon={() => <HiOutlineUserGroup className="w-6 h-6" />}
              active={isActive('/senior-rotation')}
              className="cursor-pointer"
            >
              Senior
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/junior-rotation')}
              icon={() => <HiOutlineUser className="w-6 h-6" />}
              active={isActive('/junior-rotation')}
              className="cursor-pointer"
            >
              Junior
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Collapse
            icon={() => <GiShipWheel className="w-6 h-6" />}
            label="Manalagi Rotation"
            open={isParentActive([
              '/manalagi-senior-rotation',
              '/manalagi-junior-rotation',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/manalagi-senior-rotation')}
              icon={() => <HiOutlineUserGroup className="w-6 h-6" />}
              active={isActive('/manalagi-senior-rotation')}
              className="cursor-pointer"
            >
              Senior
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/manalagi-junior-rotation')}
              icon={() => <HiOutlineUser className="w-6 h-6" />}
              active={isActive('/manalagi-junior-rotation')}
              className="cursor-pointer"
            >
              Junior
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Collapse
            icon={() => <HiOutlineArrowPath className="w-6 h-6" />}
            label="Barge Crane Rotation"
            open={isParentActive([
              '/bc-senior-rotation',
              '/bc-junior-rotation',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/bc-senior-rotation')}
              icon={() => <HiOutlineUserGroup className="w-6 h-6" />}
              active={isActive('/bc-senior-rotation')}
              className="cursor-pointer"
            >
              Senior
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/bc-junior-rotation')}
              icon={() => <HiOutlineUser className="w-6 h-6" />}
              active={isActive('/bc-junior-rotation')}
              className="cursor-pointer"
            >
              Junior
            </Sidebar.Item>
          </Sidebar.Collapse>
          <Sidebar.Collapse
            icon={() => <HiOutlineEnvelope className="w-6 h-6" />}
            label="Messages"
            open={isParentActive([
              '/all-message',
              '/in-message',
              '/out-message',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/all-message')}
              icon={() => <HiOutlineEnvelope className="w-6 h-6" />}
              active={isActive('/all-message')}
              className="cursor-pointer"
            >
              All - Message
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/in-message')}
              icon={() => <HiOutlineArrowDownCircle className="w-6 h-6" />}
              active={isActive('/in-message')}
              className="cursor-pointer"
            >
              In - Message
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/out-message')}
              icon={() => <HiOutlineArrowUpCircle className="w-6 h-6" />}
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
