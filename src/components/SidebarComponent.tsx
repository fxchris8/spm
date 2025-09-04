"use client";

import { Sidebar } from "flowbite-react";
import { HiChartPie } from "react-icons/hi";
import { FaSearch } from "react-icons/fa";
import { GiClockwiseRotation } from "react-icons/gi";
import { GoDotFill } from "react-icons/go";
export function SidebarComponent() {
  return (
    <Sidebar aria-label="Sidebar">
      <Sidebar.Items>
        <Sidebar.ItemGroup>
          <Sidebar.Item href="/" icon={HiChartPie}>
            Dashboard
          </Sidebar.Item>
          <Sidebar.Collapse icon={FaSearch} label="Search">
            <Sidebar.Item href="/search_on_duty" icon={GoDotFill}>On Duty</Sidebar.Item>
            <Sidebar.Item href="search_off_duty" icon={GoDotFill}>Off Duty</Sidebar.Item>
          </Sidebar.Collapse>
          <Sidebar.Collapse icon={GiClockwiseRotation} label="Rotation">
            <Sidebar.Item href="/container_rotation" icon={GoDotFill}>Container Rotation</Sidebar.Item>
            <Sidebar.Item href="/manalagi_rotation" icon={GoDotFill}>Manalagi Rotation</Sidebar.Item>
          </Sidebar.Collapse>
          <Sidebar.Collapse icon={GiClockwiseRotation} label="Promotion">
            <Sidebar.Item href="/promotion_nahkoda" icon={GoDotFill}>Nahkoda</Sidebar.Item>
            <Sidebar.Item href="/promotion_kkm" icon={GoDotFill}>KKM</Sidebar.Item>
          </Sidebar.Collapse>
        </Sidebar.ItemGroup>
      </Sidebar.Items>
    </Sidebar>
  );
}
