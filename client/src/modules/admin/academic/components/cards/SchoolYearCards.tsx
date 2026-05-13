// SchoolYearCards Component
// Displays school year cards for selection when no active year exists

import React from 'react';
import type { SchoolYear } from '../../types/school-year.types';

export interface SchoolYearCardsProps {
  schoolYears: SchoolYear[];
  onSelect: (schoolYear: SchoolYear) => void;
  isLoading?: boolean;
  className?: string;
}

const SchoolYearCards: React.FC<SchoolYearCardsProps> = ({
  schoolYears,
  onSelect,
  isLoading = false,
  className = '',
}) => {
  if (isLoading) {
    return (
      <div className={`school-year-cards-loading ${className}`}>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
              <div className="h-6 bg-gray-200 rounded mb-4 w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded mb-2 w-1/2"></div>
              <div className="h-4 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (schoolYears.length === 0) {
    return (
      <div className={`school-year-cards-empty ${className}`}>
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg
              className="mx-auto h-12 w-12"
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
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No School Years Found</h3>
          <p className="text-gray-500">Create a school year to get started with academic management.</p>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'inactive':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Active';
      case 'inactive':
        return 'Inactive';
      case 'archived':
        return 'Archived';
      default:
        return status;
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  return (
    <div className={`school-year-cards ${className}`}>
      <div className="mb-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Select School Year</h2>
        <p className="text-gray-600">Choose a school year to manage its academic programs.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {schoolYears.map((schoolYear) => (
          <div
            key={schoolYear.id}
            onClick={() => onSelect(schoolYear)}
            className="bg-white rounded-lg border border-gray-200 p-6 cursor-pointer hover:border-blue-500 hover:shadow-md transition-all duration-200"
          >
            <div className="flex justify-between items-start mb-4">
              <h3 className="text-lg font-semibold text-gray-900">{schoolYear.name}</h3>
              <span
                className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusColor(
                  schoolYear.status
                )}`}
              >
                {getStatusText(schoolYear.status)}
              </span>
            </div>

            {(schoolYear.start_date || schoolYear.end_date) && (
              <div className="text-sm text-gray-600 space-y-1">
                {schoolYear.start_date && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Starts: {formatDate(schoolYear.start_date)}
                  </div>
                )}
                {schoolYear.end_date && (
                  <div className="flex items-center">
                    <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    Ends: {formatDate(schoolYear.end_date)}
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex items-center justify-between">
                <span className="text-sm text-blue-600 font-medium">View Programs</span>
                <svg
                  className="w-4 h-4 text-blue-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default SchoolYearCards;
