'use client';

import Select, { MultiValue, SingleValue, components } from 'react-select';

interface CadanganItem {
  seamancode: string;
  name: string;
  last_location: string;
}

interface InputComponentProps {
  cadanganData: CadanganItem[];
  value: string[];
  onChange: (selectedValues: string[]) => void;
  isSingle?: boolean;
  lockedRelieverCodes?: string[];
}

export function InputComponent({
  cadanganData,
  value,
  onChange,
  isSingle = false,
  lockedRelieverCodes = [],
}: InputComponentProps) {
  // Ubah data cadangan menjadi opsi Select dengan informasi reliever
  const options = cadanganData.map(item => ({
    value: item.seamancode,
    label: `${item.seamancode} - ${item.name} - ${item.last_location}`,
    isReliever: lockedRelieverCodes.includes(item.seamancode),
  }));

  // Filter data yang dipilih berdasarkan value prop
  const selectedValues = options.filter(option => value.includes(option.value));

  // Custom Option component to show reliever badge
  const CustomOption = (props: any) => {
    return (
      <components.Option {...props}>
        <div className="flex items-center justify-between w-full">
          <span>{props.data.label}</span>
          {props.data.isReliever && (
            <span className="ml-2 px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              RELIEVER
            </span>
          )}
        </div>
      </components.Option>
    );
  };

  // Custom SingleValue component to show reliever badge in selected value
  const CustomSingleValue = (props: any) => {
    return (
      <components.SingleValue {...props}>
        <div className="flex items-center gap-2">
          <span>{props.data.label}</span>
          {props.data.isReliever && (
            <span className="px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              RELIEVER
            </span>
          )}
        </div>
      </components.SingleValue>
    );
  };

  // Custom MultiValue component to show reliever badge in selected values
  const CustomMultiValueLabel = (props: any) => {
    return (
      <components.MultiValueLabel {...props}>
        <div className="flex items-center gap-1">
          <span>{props.data.label}</span>
          {props.data.isReliever && (
            <span className="px-1.5 py-0.5 text-xs font-medium bg-blue-100 text-blue-800 rounded">
              R
            </span>
          )}
        </div>
      </components.MultiValueLabel>
    );
  };

  return (
    <Select
      isMulti={!isSingle}
      options={options}
      value={isSingle ? selectedValues[0] || null : selectedValues}
      onChange={selected => {
        if (isSingle) {
          const selectedOption = selected as SingleValue<{
            value: string;
            label: string;
          }>;
          onChange(selectedOption ? [selectedOption.value] : []);
        } else {
          const selectedOptions = selected as MultiValue<{
            value: string;
            label: string;
          }>;
          onChange(selectedOptions.map(item => item.value));
        }
      }}
      components={{
        Option: CustomOption,
        SingleValue: CustomSingleValue,
        MultiValueLabel: CustomMultiValueLabel,
      }}
      placeholder="Pilih atau ketik nama..."
      noOptionsMessage={() => 'Tidak ada pilihan'}
      className="react-select-container"
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: '44px',
          boxShadow: 'none',
          borderColor: state.isFocused ? '#d1d5db' : '#e5e7eb',
          '&:hover': {
            borderColor: '#d1d5db',
          },
        }),
        multiValue: base => ({
          ...base,
          backgroundColor: '#f3f4f6',
          borderRadius: '6px',
        }),
        multiValueLabel: base => ({
          ...base,
          color: '#374151',
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? '#f3f4f6' : base.backgroundColor,
          color: state.isFocused ? '#111827' : base.color,
        }),
      }}
    />
  );
}
