// hooks/CourseDataContext.tsx
import React, { createContext, useContext, ReactNode } from 'react';
import { useCourseData as useBaseCourseData } from './useCourseDataStore';
import type { CourseData, Module, Exercise } from './useCourseDataStore';

interface CourseDataContextType {
    selectedDocumentId: number | null;
    setSelectedDocumentId: (id: number | null) => void;
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