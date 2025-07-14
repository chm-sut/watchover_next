"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";

interface ProgressDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const progressSteps = [
  { value: "", label: "Progress", color: "logoWhite" },
  { value: "create", label: "Create Ticket", color: "text-logoWhite" },
  { value: "acknowledge", label: "Acknowledge", color: "text-logoWhite" },
  { value: "investigate", label: "Investigate", color: "text-logoWhite" },
  { value: "resolve", label: "Resolve", color: "text-logoWhite" },
  { value: "complete", label: "Complete", color: "text-logoWhite" }
];

export default function ProgressDropdown({ value, onChange }: ProgressDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (progressValue: string) => {
    onChange(progressValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedProgress = progressSteps.find(p => p.value === value) || progressSteps[0];
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
            <span className="px-2 py-1 rounded-full text-xs font-semibold text-logoBlack">
              {selectedProgress.label}
            </span>
          )}
          {!hasValue && (
            <span className="text-darkWhite">{selectedProgress.label}</span>
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
        <div className="absolute z-[20000] mt-1 w-full bg-opacity-0 border-0 rounded-md shadow-lg max-h-60 overflow-auto">
          {progressSteps.map((progress) => (
            <button
              key={progress.value}
              type="button"
              className={`w-full text-left px-3 py-2 font-body text-caption bg-logoBlack bg-opacity-70 backdrop-blur-sm rounded-none hover:bg-logoBlue transition-colors text-logoWhite focus:outline-none ${
                value === progress.value ? "" : ""
              }`}
              onClick={() => handleSelect(progress.value)}
            >
              <div className="flex items-center gap-2">
                {progress.value ? (
                  <span className={`px-2 py-1 rounded-full text-xs font-semibold ${progress.color}`}>
                    {progress.label}
                  </span>
                ) : (
                  <span className="text-logoWhite px-2 py-1">{progress.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}