import { useState, useMemo } from 'react';
import courseData from '../../deafult.coursedata.json';

export const useCourseData = () => {
    const [selectedDocumentId, setSelectedDocumentId] = useState<number | null>(null);
    return {
        selectedDocumentId,
        setSelectedDocumentId
    };
};
