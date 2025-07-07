"use client";
import React, { useState, useEffect, useRef } from "react";
import { SearchIcon, XIcon } from "lucide-react";

interface CustomerDropdownProps {
  value: string;
  onChange: (value: string) => void;
  customers: Record<string, string>;
}

export default function CustomerDropdown({ value, onChange, customers }: CustomerDropdownProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [filteredCustomers, setFilteredCustomers] = useState<Array<{id: string, name: string}>>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Convert customers object to array and filter based on search term
  useEffect(() => {
    const customerArray = Object.entries(customers).map(([id, name]) => ({ id, name }));
    
    if (searchTerm.trim()) {
      const filtered = customerArray.filter(customer =>
        customer.name.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredCustomers(filtered.slice(0, 20)); // Limit to 20 results for performance
      setIsOpen(filtered.length > 0);
    } else {
      setFilteredCustomers([]);
      setIsOpen(false);
    }
  }, [customers, searchTerm]);

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

  // Handle input changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setSearchTerm(newValue);
    
    // If the input is cleared, also clear the filter
    if (!newValue.trim()) {
      onChange("");
    }
  };

  // Handle customer selection
  const handleSelect = (customerName: string) => {
    onChange(customerName);
    setSearchTerm(customerName);
    setIsOpen(false);
  };

  // Handle clear button
  const handleClear = () => {
    setSearchTerm("");
    onChange("");
    inputRef.current?.focus();
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  const hasValue = Boolean(value);
  const placeholder = hasValue ? value : "Search customers...";

  return (
    <div className="relative z-[25000]" ref={dropdownRef}>
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          placeholder={placeholder}
          className="font-body text-body px-3 py-2 pl-10 pr-10 rounded-md bg-logoWhite text-logoBlack w-64 focus:outline-none focus:ring-2 focus:ring-logoBlue focus:border-transparent border border-darkWhite"
          value={searchTerm}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (searchTerm.trim() && filteredCustomers.length > 0) {
              setIsOpen(true);
            }
          }}
        />
        
        {/* Search Icon */}
        <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-darkWhite" />
        
        {/* Clear Button */}
        {(hasValue || searchTerm) && (
          <button
            type="button"
            className="bg-logoWhite absolute right-3 top-1/2 transform -translate-y-1/2"
            onClick={handleClear}
          >
            <XIcon className="w-4 h-4 text-darkWhite hover:text-logoRed cursor-pointer" />
          </button>
        )}
      </div>

      {/* Suggestions Dropdown */}
      {isOpen && filteredCustomers.length > 0 && (
        <div className="absolute z-[25000] mt-1 w-full bg-opacity-0 border-0 rounded-md shadow-lg max-h-60 overflow-hidden">
          <div className="max-h-60 overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.id}
                type="button"
                className="w-full text-left px-3 py-2 font-body text-caption bg-logoBlack bg-opacity-70 backdrop-blur-sm rounded-none hover:bg-logoBlue transition-colors text-logoWhite focus:outline-none"
                onClick={() => handleSelect(customer.name)}
                title={customer.name}
              >
                <div className="truncate">
                  {/* Highlight matching text */}
                  {customer.name.split(new RegExp(`(${searchTerm})`, 'gi')).map((part, index) => (
                    <span
                      key={index}
                      className={
                        part.toLowerCase() === searchTerm.toLowerCase()
                          ? "bg-lightYellow font-medium"
                          : ""
                      }
                    >
                      {part}
                    </span>
                  ))}
                </div>
              </button>
            ))}
          </div>
          
          {/* Show result count */}
          <div className="px-3 py-2 font-body text-caption-sm text-logoWhite border-t-0 bg-logoBlack bg-opacity-30 backdrop-blur-sm">
            {filteredCustomers.length} customer{filteredCustomers.length !== 1 ? 's' : ''} found
            {filteredCustomers.length === 20 && " (showing first 20)"}
          </div>
        </div>
      )}
    </div>
  );
}