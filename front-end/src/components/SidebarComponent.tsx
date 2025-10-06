"use client";

import { Sidebar } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import { FaSearch } from "react-icons/fa";
import { GiClockwiseRotation } from "react-icons/gi";
import { GoDotFill } from "react-icons/go";
import { useLocation, useNavigate } from "react-router-dom";

export function SidebarComponent() {
  const location = useLocation();
  const navigate = useNavigate();
  const pathname = location.pathname;

  const isActive = (path: string): boolean => pathname === path;
  const isParentActive = (paths: string[]): boolean =>
    paths.some((path) => pathname.startsWith(path));

  const handleNavigation = (path: string) => {
    navigate(path);
  };

  return (
    <Sidebar aria-label="Sidebar">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item 
            onClick={() => handleNavigation("/dashboard")}
            icon={HiChartPie} 
            active={isActive("/dashboard")}
            className="cursor-pointer"
          >
            Dashboard
          </Sidebar.Item>

          <Sidebar.Collapse
            icon={FaSearch}
            label="Search"
            open={isParentActive(["/search_on_duty", "/search_off_duty"])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation("/search_on_duty")}
              icon={GoDotFill}
              active={isActive("/search_on_duty")}
              className="cursor-pointer"
            >
              On Duty
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation("/search_off_duty")}
              icon={GoDotFill}
              active={isActive("/search_off_duty")}
              className="cursor-pointer"
            >
              Off Duty
            </Sidebar.Item>
          </Sidebar.Collapse>

          <Sidebar.Collapse
            icon={GiClockwiseRotation}
            label="Rotation"
            open={isParentActive(["/container_rotation", "/manalagi_rotation"])}
          >
            <Sidebar.Item
              onClick={() => handleNavigation("/container_rotation")}
              icon={GoDotFill}
              active={isActive("/container_rotation")}
              className="cursor-pointer"
            >
              Container Rotation
            </Sidebar.Item>
            <Sidebar.Item
              onClick={() => handleNavigation("/manalagi_rotation")}
              icon={GoDotFill}
              active={isActive("/manalagi_rotation")}
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