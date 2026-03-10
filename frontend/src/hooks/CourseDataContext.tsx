// hooks/CourseDataContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useCourseData as useBaseCourseData } from './useCourseDataStore';
import type { CourseData, Module, Exercise } from './useCourseDataStore';

interface CourseDataContextType {
    courseId: number;
    modules: Module[];
    exercises: Exercise[];
    selectedModuleId: number | null;
    selectedExerciseId: number | null;
    currentModule: Module | null;
    currentExercise: Exercise | null;
    selectModule: (id: number) => void;
    selectExercise: (id: number) => void;
}

const CourseDataContext = createContext<CourseDataContextType | undefined>(undefined);

export const CourseDataProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const courseData = useBaseCourseData();
    
    return (
        <CourseDataContext.Provider value={courseData}>
            {children}
        </CourseDataContext.Provider>
    );
};

export const useCourseData = () => {
    const context = useContext(CourseDataContext);
    if (context === undefined) {
        throw new Error('useCourseData must be used within a CourseDataProvider');
    }
    return context;
};