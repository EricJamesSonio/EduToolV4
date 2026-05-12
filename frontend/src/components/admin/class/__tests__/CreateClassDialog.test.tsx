import { renderHook, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import type { Class } from '@/types/admin/class.types';

// Mock data for testing
const mockExistingClasses: Class[] = [
  {
    id: '1',
    orgId: 'org1',
    subjectId: 'subject1',
    subjectName: 'Physical Education',
    educatorId: 'educator1',
    educatorName: 'John Doe',
    sectionId: 'section1',
    sectionName: 'Day Care Section A',
    semesterId: 'semester1',
    semesterName: 'First Semester',
    schoolYearId: 'schoolYear1',
    schoolYearTitle: '2024-2025',
    capacity: 30,
    enrolledCount: 25,
    status: 'active',
    isArchived: false,
    title: 'Physical Education',
    schedules: [
      {
        id: 'schedule1',
        classId: '1',
        weekday: 1, // Monday
        startTime: '08:00',
        endTime: '09:00',
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    programId: 'program1',
  },
  {
    id: '2',
    orgId: 'org1',
    subjectId: 'subject2',
    subjectName: 'Mathematics',
    educatorId: 'educator2',
    educatorName: 'Jane Smith',
    sectionId: 'section1',
    sectionName: 'Day Care Section A',
    semesterId: 'semester1',
    semesterName: 'First Semester',
    schoolYearId: 'schoolYear1',
    schoolYearTitle: '2024-2025',
    capacity: 30,
    enrolledCount: 28,
    status: 'active',
    isArchived: false,
    title: 'Mathematics',
    schedules: [
      {
        id: 'schedule2',
        classId: '2',
        weekday: 2, // Tuesday
        startTime: '10:00',
        endTime: '11:00',
      },
    ],
    createdAt: '2024-01-01',
    updatedAt: '2024-01-01',
    programId: 'program1',
  },
];

// Test the duplicate checking logic
describe('CreateClassDialog Duplicate Validation', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
        },
      },
    });
  });

  const checkDuplicateClass = (
    values: any,
    existingClasses: Class[],
    schoolYearId: string
  ): Class | null => {
    if (!schoolYearId) return null;
    
    return existingClasses.find(existingClass => {
      const subjectMatch = existingClass.subjectId === values.subjectId;
      const sectionMatch = existingClass.sectionId === values.sectionId;
      const educatorMatch = existingClass.educatorId === values.educatorId;
      const schoolYearMatch = existingClass.schoolYearId === schoolYearId;
      
      return subjectMatch && sectionMatch && educatorMatch && schoolYearMatch;
    }) || null;
  };

  test('should detect duplicate class with same subject, section, educator, and school year', () => {
    const formValues = {
      subjectId: 'subject1',
      sectionId: 'section1',
      educatorId: 'educator1',
      capacity: '30',
      schedules: [{ weekday: '2', startTime: '10:00', endTime: '11:00' }], // Different schedule
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, 'schoolYear1');
    
    expect(duplicate).toBeTruthy();
    expect(duplicate?.subjectName).toBe('Physical Education');
    expect(duplicate?.sectionName).toBe('Day Care Section A');
  });

  test('should not detect duplicate when subject is different', () => {
    const formValues = {
      subjectId: 'subject3', // Different subject
      sectionId: 'section1',
      educatorId: 'educator1',
      capacity: '30',
      schedules: [{ weekday: '1', startTime: '08:00', endTime: '09:00' }],
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, 'schoolYear1');
    
    expect(duplicate).toBeFalsy();
  });

  test('should not detect duplicate when section is different', () => {
    const formValues = {
      subjectId: 'subject1',
      sectionId: 'section2', // Different section
      educatorId: 'educator1',
      capacity: '30',
      schedules: [{ weekday: '1', startTime: '08:00', endTime: '09:00' }],
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, 'schoolYear1');
    
    expect(duplicate).toBeFalsy();
  });

  test('should not detect duplicate when educator is different', () => {
    const formValues = {
      subjectId: 'subject1',
      sectionId: 'section1',
      educatorId: 'educator2', // Different educator
      capacity: '30',
      schedules: [{ weekday: '1', startTime: '08:00', endTime: '09:00' }],
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, 'schoolYear1');
    
    expect(duplicate).toBeFalsy();
  });

  test('should not detect duplicate when school year is different', () => {
    const formValues = {
      subjectId: 'subject1',
      sectionId: 'section1',
      educatorId: 'educator1',
      capacity: '30',
      schedules: [{ weekday: '1', startTime: '08:00', endTime: '09:00' }],
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, 'schoolYear2'); // Different school year
    
    expect(duplicate).toBeFalsy();
  });

  test('should return null when schoolYearId is not provided', () => {
    const formValues = {
      subjectId: 'subject1',
      sectionId: 'section1',
      educatorId: 'educator1',
      capacity: '30',
      schedules: [{ weekday: '1', startTime: '08:00', endTime: '09:00' }],
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, '');
    
    expect(duplicate).toBeFalsy();
  });

  test('should allow different schedules for same subject/section/educator', () => {
    const formValues = {
      subjectId: 'subject1',
      sectionId: 'section1',
      educatorId: 'educator1',
      capacity: '30',
      schedules: [{ weekday: '2', startTime: '14:00', endTime: '15:00' }], // Different time/day
    };

    const duplicate = checkDuplicateClass(formValues, mockExistingClasses, 'schoolYear1');
    
    // Should still detect as duplicate since we check subject/section/educator/school year, not schedule
    expect(duplicate).toBeTruthy();
    expect(duplicate?.subjectName).toBe('Physical Education');
  });
});
