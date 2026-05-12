// SchoolYearSelector Component
// Reusable selector for school years with auto-selection and loading states

import React, { useEffect } from 'react';
import { cn } from '../../utils/helpers';
import type { SchoolYear } from '../../types/school-year.types';

export interface SchoolYearSelectorProps {
  schoolYears: SchoolYear[];
  isLoading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  className?: string;
}

const SchoolYearSelector: React.FC<SchoolYearSelectorProps> = ({
  schoolYears,
  isLoading,
  selectedId,
  onSelect,
  className
}) => {
  // Auto-select the active year (or first) when no selection exists yet
  useEffect(() => {
    if (!selectedId && schoolYears.length > 0) {
      const defaultId =
        schoolYears.find((sy) => sy.status === "active")?.id ??
        schoolYears[0].id;
      onSelect(defaultId);
    }
  }, [schoolYears, selectedId, onSelect]);

  if (isLoading) {
    return (
      <div className={cn("flex items-center gap-2", className)}>
        <div className="w-5 h-5 bg-gray-200 rounded animate-pulse" />
        <div className="h-11 w-64 bg-gray-200 rounded animate-pulse" />
      </div>
    );
  }

  if (schoolYears.length === 0) {
    return (
      <p className="text-sm text-gray-500">No school years found.</p>
    );
  }

  const selected = schoolYears.find((sy) => sy.id === selectedId);

  return (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Calendar Icon */}
      <svg 
        className="w-5 h-5 text-gray-500 flex-shrink-0" 
        fill="none" 
        stroke="currentColor" 
        viewBox="0 0 24 24"
      >
        <path 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth={2} 
          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" 
        />
      </svg>

      {/* Custom Select */}
      <div className="relative">
        <select
          value={selectedId ?? ""}
          onChange={(e) => {
            if (e.target.value) onSelect(e.target.value);
          }}
          className={cn(
            "w-64 h-11 px-3 pr-8 text-base border-2 border-blue-500 bg-gray-50",
            "rounded-md appearance-none cursor-pointer",
            "focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent",
            "hover:bg-gray-100 transition-colors"
          )}
        >
          <option value="" disabled>
            Select school year
          </option>
          {schoolYears.map((sy) => (
            <option key={sy.id} value={sy.id} className="py-2">
              {sy.name}
            </option>
          ))}
        </select>

        {/* Custom Dropdown Arrow */}
        <div className="absolute inset-y-0 right-0 flex items-center pr-2 pointer-events-none">
          <svg 
            className="w-4 h-4 text-gray-400" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M19 9l-7 7-7-7" 
            />
          </svg>
        </div>
      </div>

      {/* Active Badge */}
      {selected?.status === "active" && (
        <span className="inline-flex items-center px-2 py-1 text-xs font-semibold text-white bg-green-600 rounded-full">
          Active
        </span>
      )}
    </div>
  );
};

export default SchoolYearSelector;
