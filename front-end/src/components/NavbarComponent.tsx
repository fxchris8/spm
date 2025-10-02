"use client";

import { Button, Navbar } from "flowbite-react";

export function NavbarComponent() {
  return (
    <Navbar fluid className="bg-red-800">
      <Navbar.Brand href="https://flowbite-react.com">
        <img src="logo.ico" className="mr-3 h-6 sm:h-9" alt="Flowbite React Logo" />
        <span className="self-center whitespace-nowrap text-xl font-semibold dark:text-white"><strong>SPIL</strong>| FLEET</span>
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Button>Logout</Button>
        <Navbar.Toggle />
      </div>
    </Navbar>
  );
}
