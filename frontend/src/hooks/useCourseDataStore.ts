import { useState, useMemo } from 'react';
import courseData from '../../deafult.coursedata.json';

export interface Exercise {
    id: number;
    name: string;
}

export interface Module {
    id: number;
    name: string;
    exercises: Exercise[];
}

export interface CourseData {
    courseId: number;
    modules: Module[];
}

export const useCourseData = () => {
    const data = courseData as CourseData;
    const [selectedModuleId, setSelectedModuleId] = useState<number | null>(null);
    const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);

    const modules = data.modules;

    const currentModule = useMemo(() => {
        return modules.find(m => m.id === selectedModuleId) || null;
    }, [modules, selectedModuleId]);

    const exercises = useMemo(() => {
        return currentModule?.exercises || [];
    }, [currentModule]);

    const currentExercise = useMemo(() => {
        return exercises.find(e => e.id === selectedExerciseId) || null;
    }, [exercises, selectedExerciseId]);

    const selectModule = (id: number) => {
        setSelectedModuleId(id);
        setSelectedExerciseId(null); // Reset exercise when module changes
    };

    const selectExercise = (id: number) => {
        setSelectedExerciseId(id);
    };

    return {
        courseId: data.courseId,
        modules,
        exercises,
        selectedModuleId,
        selectedExerciseId,
        currentModule,
        currentExercise,
        selectModule,
        selectExercise
    };
};
