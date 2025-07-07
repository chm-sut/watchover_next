"use client";
import React, { useState, useEffect, useRef } from "react";
import { ChevronDownIcon, XIcon } from "lucide-react";
import EscalationBadge from "./EscalationBadge";

interface EscalationDropdownProps {
  value: string;
  onChange: (value: string) => void;
}

const escalationLevels = [
  { value: "", label: "Escalation" },
  { value: "None", label: "None" },
  { value: "Lv.1", label: "Lv.1" },
  { value: "Lv.2", label: "Lv.2" },
];

export default function EscalationDropdown({ value, onChange }: EscalationDropdownProps) {
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

  const handleSelect = (escalationValue: string) => {
    onChange(escalationValue);
    setIsOpen(false);
  };

  const handleClear = (e: React.MouseEvent) => {
    e.stopPropagation();
    onChange("");
  };

  const selectedEscalation = escalationLevels.find((e: { value: string; label: string }) => e.value === value) || escalationLevels[0];
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
            <EscalationBadge 
              ticket={{ escalationLevel: selectedEscalation.value } as { escalationLevel: string }} 
              size="sm" 
            />
          )}
          {!hasValue && (
            <span className="text-darkWhite">{selectedEscalation.label}</span>
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
          {escalationLevels.map((escalation: { value: string; label: string }) => (
            <button
              key={escalation.value}
              type="button"
              className={`w-full text-left px-3 py-2 font-body text-caption bg-logoBlack bg-opacity-70 backdrop-blur-sm rounded-none hover:bg-logoBlue transition-colors text-logoWhite focus:outline-none ${
                value === escalation.value ? "" : ""
              }`}
              onClick={() => handleSelect(escalation.value)}
            >
              <div className="flex items-center gap-2">
                {escalation.value ? (
                  <EscalationBadge 
                    ticket={{ escalationLevel: escalation.value } as { escalationLevel: string }} 
                    size="sm" 
                  />
                ) : (
                  <span className="text-logoWhite px-2 py-1">{escalation.label}</span>
                )}
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}