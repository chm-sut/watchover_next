"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";

interface DateDropdownProps {
  value: string;
  onChange: (value: string) => void;
  type: "day" | "month" | "year";
}

const dateOptions = {
  day: Array.from({ length: 31 }, (_, i) => {
    const dayNum = (i + 1).toString().padStart(2, "0");
    return { value: dayNum, label: dayNum };
  }),
  month: [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" }
  ],
  year: ["2023", "2024", "2025"].map(year => ({ value: year, label: year }))
};

export default function DateDropdown({ value, onChange, type }: DateDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (dateValue: string) => {
    onChange(dateValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const options = [
    { value: "", label: `${type.charAt(0).toUpperCase() + type.slice(1)}s` },
    ...dateOptions[type]
  ];

  const selectedOption = options.find(option => option.value === value) || options[0];
  const hasValue = Boolean(value);

  return (
    <div className="relative z-[10000]" ref={dropdownRef}>
      <button
        type="button"
        className="font-body text-body px-3 py-2 rounded-md bg-logoWhite text-logoBlack flex items-center justify-between w-40 transition-colors border border-darkWhite"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasValue && (
            <span className="px-2 py-1 rounded-full text-xs font-semibold text-logoBlack">
              {selectedOption.label}
            </span>
          )}
          {!hasValue && (
            <span className="text-darkWhite">{selectedOption.label}</span>
          )}
        </div>
        <div className="flex items-center gap-1 ml-2">
          {hasValue && (
            <XIcon
              className="w-4 h-4 text-darkWhite hover:text-logoRed cursor-pointer"
              onClick={handleClear}
            />
          )}
          <ChevronDownIcon
            className={`w-4 h-4 text-darkWhite transition-transform ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {isOpen && (
        <div className="absolute z-[10000] mt-1 w-full bg-opacity-0 border-0 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`w-full text-left px-3 py-2 font-body text-caption bg-logoBlack bg-opacity-70 backdrop-blur-sm rounded-none hover:bg-logoBlue transition-colors text-logoWhite focus:outline-none ${
                value === option.value ? "" : ""
              }`}
              onClick={() => handleSelect(option.value)}
            >
              <div className="flex items-center gap-2">
                {option.value ? (
                  <span className="px-2 py-1 rounded-full text-xs font-semibold text-logoWhite">
                    {option.label}
                  </span>
                ) : (
                  <span className="text-logoWhite px-2 py-1">{option.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}