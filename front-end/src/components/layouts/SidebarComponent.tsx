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

          <Sidebar.Item
            onClick={() => handleNavigation('/vessel_management')}
            icon={() => <HiOutlineShieldCheck className="w-6 h-6" />}
            active={isActive('/vessel_management')}
            className="cursor-pointer"
          >
            Vessel Management
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={() => <HiOutlineCube className="w-6 h-6" />}
            label="Container Rotation"
            open={isParentActive(['/senior_rotation', '/junior_rotation'])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/senior_rotation')}
              icon={() => <HiOutlineUserGroup className="w-6 h-6" />}
              active={isActive('/senior_rotation')}
              className="cursor-pointer"
            >
              Senior
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/junior_rotation')}
              icon={() => <HiOutlineUser className="w-6 h-6" />}
              active={isActive('/junior_rotation')}
              className="cursor-pointer"
            >
              Junior
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Collapse
            icon={() => <GiShipWheel className="w-6 h-6" />}
            label="Manalagi Rotation"
            open={isParentActive([
              '/manalagi_senior_rotation',
              '/manalagi_junior_rotation',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/manalagi_senior_rotation')}
              icon={() => <HiOutlineUserGroup className="w-6 h-6" />}
              active={isActive('/manalagi_senior_rotation')}
              className="cursor-pointer"
            >
              Senior
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/manalagi_junior_rotation')}
              icon={() => <HiOutlineUser className="w-6 h-6" />}
              active={isActive('/manalagi_junior_rotation')}
              className="cursor-pointer"
            >
              Junior
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Collapse
            icon={() => <HiOutlineArrowPath className="w-6 h-6" />}
            label="Barge Crane Rotation"
            open={isParentActive([
              '/barge_crane_senior_rotation',
              '/barge_crane_junior_rotation',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/barge_crane_senior_rotation')}
              icon={() => <HiOutlineUserGroup className="w-6 h-6" />}
              active={isActive('/barge_crane_senior_rotation')}
              className="cursor-pointer"
            >
              Senior
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/barge_crane_junior_rotation')}
              icon={() => <HiOutlineUser className="w-6 h-6" />}
              active={isActive('/barge_crane_junior_rotation')}
              className="cursor-pointer"
            >
              Junior
            </Sidebar.Item>
          </Sidebar.Collapse>
          <Sidebar.Collapse
            icon={() => <HiOutlineEnvelope className="w-6 h-6" />}
            label="Messages"
            open={isParentActive([
              '/all_message',
              '/in_message',
              '/out_message',
            ])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation('/all_message')}
              icon={() => <HiOutlineEnvelope className="w-6 h-6" />}
              active={isActive('/all_message')}
              className="cursor-pointer"
            >
              All - Message
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/in_message')}
              icon={() => <HiOutlineArrowDownCircle className="w-6 h-6" />}
              active={isActive('/in_message')}
              className="cursor-pointer"
            >
              In - Message
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation('/out_message')}
              icon={() => <HiOutlineArrowUpCircle className="w-6 h-6" />}
              active={isActive('/out_message')}
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
