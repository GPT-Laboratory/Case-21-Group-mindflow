import React from 'react';
import { useCourseData } from '@/hooks/CourseDataContext';

const GlobalSelector: React.FC = () => {
    const {
        courseId,
        modules,
        exercises,
        selectedModuleId,
        selectedExerciseId,
        selectModule,
        selectExercise
    } = useCourseData();

    return (
        <div className="flex items-center gap-3 px-2 py-1 bg-secondary/20 rounded-lg border border-border">
            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Course</span>
                <select
                    className="h-8 bg-background border border-input rounded px-2 text-xs outline-none focus:ring-1 focus:ring-primary opacity-70 cursor-not-allowed"
                    disabled
                    value={courseId}
                >
                    <option value={courseId}>{courseId}</option>
                </select>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Module</span>
                <select
                    className="h-8 bg-background border border-input rounded px-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    value={selectedModuleId || ''}
                    onChange={(e) => selectModule(Number(e.target.value))}
                >
                    <option value="">Select Module</option>
                    {modules.map(m => (
                        <option key={m.id} value={m.id}>{m.name}</option>
                    ))}
                </select>
            </div>

            <div className="w-px h-6 bg-border mx-1" />

            <div className="flex items-center gap-2">
                <span className="text-[10px] text-muted-foreground uppercase font-bold">Exercise</span>
                <select
                    className="h-8 bg-background border border-input rounded px-2 text-xs outline-none focus:ring-1 focus:ring-primary"
                    value={selectedExerciseId || ''}
                    onChange={(e) => selectExercise(Number(e.target.value))}
                    disabled={!selectedModuleId}
                >
                    <option value="">Select Exercise</option>
                    {exercises.map(ex => (
                        <option key={ex.id} value={ex.id}>{ex.name}</option>
                    ))}
                </select>
            </div>
        </div>
    );
};

export default GlobalSelector;
