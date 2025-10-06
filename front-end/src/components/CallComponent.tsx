'use client';

import { Popover, Button } from 'flowbite-react';

interface CallProps {
  phone1?: string;
  phone2?: string;
  phone3?: string;
  phone4?: string;
}

export function CallComponent({ phone1, phone2, phone3, phone4 }: CallProps) {
  const content = (
    <div className="w-64 text-sm text-gray-500 dark:text-gray-400">
      <div className="border-b border-gray-200 bg-gray-100 px-3 py-2 dark:border-gray-600 dark:bg-gray-700">
        <h3 className="font-semibold text-gray-900 dark:text-white">
          Nomor Handphone
        </h3>
      </div>
      <div className="px-3 py-2 space-y-1">
        {phone1 && <p>{phone1}</p>}
        {phone2 && <p>{phone2}</p>}
        {phone3 && <p>{phone3}</p>}
        {phone4 && <p>{phone4}</p>}
      </div>
    </div>
  );

  return (
    <Popover content={content} placement="left">
      <Button size="xs">Call</Button>
    </Popover>
  );
}
