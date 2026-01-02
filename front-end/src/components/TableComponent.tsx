import { Table } from 'flowbite-react';

interface TableJson {
  columns: string[];
  data: Record<string, any>[];
}

export function TableComponent({ table }: { table: TableJson }) {
  // Mapping huruf A-J ke kelas warna Tailwind
  const colorMap: Record<string, string> = {
    A: 'bg-blue-400',
    B: 'bg-orange-400',
    C: 'bg-green-400',
    D: 'bg-red-400',
    E: 'bg-yellow-400',
    F: 'bg-purple-400',
    G: 'bg-pink-400',
    H: 'bg-teal-400',
    I: 'bg-sky-400',
    J: 'bg-indigo-400',
    K: 'bg-lime-400',
    L: 'bg-amber-400',
    M: 'bg-emerald-400',
    N: 'bg-cyan-400',
    Z0: 'bg-gray-200',
  };

  const { columns, data } = table;

  return (
    <div className="overflow-x-auto">
      <Table hoverable>
        <Table.Head>
          {columns.map(col => (
            <Table.HeadCell key={col}>{col}</Table.HeadCell>
          ))}
        </Table.Head>

        <Table.Body className="divide-y">
          {data.map((row, rowIndex) => (
            <Table.Row
              key={rowIndex}
              className="bg-white dark:border-gray-700 dark:bg-gray-800"
            >
              {columns.map(col => {
                const cellValue = row[col];
                // Only apply color to columns that have values that are letters (A-N) or Z0
                const cellValueStr =
                  typeof cellValue === 'string'
                    ? cellValue.trim().toUpperCase()
                    : '';

                let colorKey = '';
                if (/^[A-N]$/.test(cellValueStr)) {
                  colorKey = cellValueStr;
                } else if (cellValueStr === 'Z0') {
                  colorKey = 'Z0';
                }

                // If key is found in colorMap, apply the color
                const colorClass = colorKey ? colorMap[colorKey] : '';

                // Exclude certain columns from getting the color
                const shouldColor =
                  col !== 'last_location' && colorClass !== ''; // Exclude "last_location" and empty cells

                return (
                  <Table.Cell
                    key={col}
                    className={`whitespace-nowrap font-medium text-gray-900 dark:text-white ${
                      shouldColor ? colorClass : ''
                    }`}
                  >
                    {cellValue}
                  </Table.Cell>
                );
              })}
            </Table.Row>
          ))}
        </Table.Body>
      </Table>
    </div>
  );
}
