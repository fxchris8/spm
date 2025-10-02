"use client";
import React from "react";
import Select, { MultiValue, SingleValue } from "react-select";

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
}

export function InputComponent({
  cadanganData,
  value,
  onChange,
  isSingle = false,
}: InputComponentProps) {
  // Ubah data cadangan menjadi opsi Select
  const options = cadanganData.map((item) => ({
    value: item.seamancode,
    label: `${item.seamancode} - ${item.name} - ${item.last_location}`,
  }));

  // Filter data yang dipilih berdasarkan value prop
  const selectedValues = options.filter((option) => value.includes(option.value));

  return (
    <Select
      isMulti={!isSingle}
      options={options}
      value={isSingle ? selectedValues[0] || null : selectedValues}
      onChange={(selected) => {
        if (isSingle) {
          const selectedOption = selected as SingleValue<{ value: string; label: string }>;
          onChange(selectedOption ? [selectedOption.value] : []);
        } else {
          const selectedOptions = selected as MultiValue<{ value: string; label: string }>;
          onChange(selectedOptions.map((item) => item.value));
        }
      }}
      placeholder="Pilih atau ketik nama nahkoda..."
      noOptionsMessage={() => "Tidak ada pilihan"}
      className="react-select-container"
      classNamePrefix="react-select"
      styles={{
        control: (base, state) => ({
          ...base,
          minHeight: "44px",
          boxShadow: "none",
          borderColor: state.isFocused ? "#d1d5db" : "#e5e7eb",
          "&:hover": {
            borderColor: "#d1d5db",
          },
        }),
        multiValue: (base) => ({
          ...base,
          backgroundColor: "#f3f4f6",
          borderRadius: "6px",
        }),
        multiValueLabel: (base) => ({
          ...base,
          color: "#374151",
        }),
        option: (base, state) => ({
          ...base,
          backgroundColor: state.isFocused ? "#f3f4f6" : base.backgroundColor,
          color: state.isFocused ? "#111827" : base.color,
        }),
      }}
    />
  );
}
