"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";

interface PriorityDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const priorities = [
  { value: "", label: "Priorities", color: "logoWhite" },
  { value: "CRITICAL", label: "CRITICAL", color: "bg-logoBlack text-logoWhite border border-logoWhite" },
  { value: "HIGH", label: "HIGH", color: "bg-lightRed text-darkRed" },
  { value: "MEDIUM", label: "MEDIUM", color: "bg-lightOrange text-darkRed" },
  { value: "LOW", label: "LOW", color: "bg-lightYellow text-darkRed" }
];

export default function PriorityDropdown({ value, onChange }: PriorityDropdownProps) {
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

  const handleSelect = (priorityValue: string) => {
    onChange(priorityValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedPriority = priorities.find(p => p.value === value) || priorities[0];
  const hasValue = Boolean(value);

  return (
    <div className="relative z-[20000]" ref={dropdownRef}>
      <button
        type="button"
        className="font-body text-body px-3 py-2 rounded-md bg-logoWhite text-logoBlack flex items-center justify-between w-40 transition-colors border border-darkWhite"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-2 flex-1 min-w-0">
          {hasValue && (
            <span className={`px-2 py-1 rounded-full text-xs font-semibold ${selectedPriority.color}`}>
              {selectedPriority.label}
            </span>
          )}
          {!hasValue && (
            <span className="text-darkWhite">{selectedPriority.label}</span>
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
        <div className="absolute z-[20000] mt-1 w-full bg-opacity-0 border-0 rounded-md shadow-lg max-h-60 overflow-hidden">
          {priorities.map((priority) => (
            <button
              key={priority.value}
              type="button"
              className={`w-full text-left px-3 py-2 font-body text-caption bg-logoBlack bg-opacity-70 backdrop-blur-sm rounded-none hover:bg-logoBlue transition-colors text-logoWhite focus:outline-none ${
                value === priority.value ? "" : ""
              }`}
              onClick={() => handleSelect(priority.value)}
            >
              <div className="flex items-center gap-2">
                {priority.value ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${priority.color}`}>
                    {priority.label}
                  </span>
                ) : (
                  <span className="text-logoWhite px-2 py-1">{priority.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}