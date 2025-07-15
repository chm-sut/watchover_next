"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import StatusBadge from "./StatusBadge";

interface StatusDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const statuses = [
  { value: "", label: "Statuses" },
  { value: "Ongoing", label: "Ongoing" },
  { value: "Closed", label: "Closed" }
];

export default function StatusDropdown({ value, onChange }: StatusDropdownProps) {
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

  const handleSelect = (statusValue: string) => {
    onChange(statusValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedStatus = statuses.find(s => s.value === value) || statuses[0];
  const hasValue = Boolean(value);

  return (
    <div className="relative z-[20000]" ref={dropdownRef}>
      <button
        type="button"
        className="font-body text-body px-3 py-2 rounded-md bg-logoWhite text-logoBlack flex items-center justify-between w-48 transition-colors border border-darkWhite"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasValue && (
            <StatusBadge status={selectedStatus.label} />
          )}
          {!hasValue && (
            <span className="text-darkWhite">{selectedStatus.label}</span>
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
        <div className="absolute z-[20000] mt-1 w-full bg-opacity-0 border-0 rounded-md shadow-lg max-h-60 overflow-y-auto">
          {statuses.map((status) => (
            <button
              key={status.value}
              type="button"
              className={`w-full text-left px-3 py-2 font-body text-caption bg-logoBlack bg-opacity-70 backdrop-blur-sm rounded-none hover:bg-logoBlue transition-colors text-logoWhite focus:outline-none ${
                value === status.value ? "" : ""
              }`}
              onClick={() => handleSelect(status.value)}
            >
              <div className="flex items-center gap-2">
                {status.value ? (
                  <StatusBadge status={status.label} />
                ) : (
                  <span className="text-logoWhite px-2 py-1">{status.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}