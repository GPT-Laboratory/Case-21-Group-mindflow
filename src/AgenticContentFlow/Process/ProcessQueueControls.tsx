import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, SkipForward, RotateCcw, Clock, CheckCircle, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import { cn } from '@/lib/utils';
import { ProcessQueue } from '../ProcessQueue';
import { ProcessStatus } from '../types';

interface ProcessQueueControlsProps {
    className?: string;
}

interface QueueItem {
    id: string;
    nodeId: string;
    nodeType: string;
    status: ProcessStatus;
    priority: number;
    payload?: any;
    startTime?: number;
    endTime?: number;
    error?: string;
}

/**
 * ProcessQueueControls Component
 * 
 * Provides UI controls for managing the global process queue.
 * Shows queue status, allows manual control of processing, and displays queue contents.
 */
export const ProcessQueueControls: React.FC<ProcessQueueControlsProps> = ({ className }) => {
    const [queue, setQueue] = useState<QueueItem[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [isPaused, setIsPaused] = useState(false);
    const [stats, setStats] = useState({
        total: 0,
        completed: 0,
        failed: 0,
        pending: 0
    });

    // Subscribe to queue updates
    useEffect(() => {
        const handleQueueUpdate = (newQueue: QueueItem[]) => {
            setQueue(newQueue);
            
            // Update stats
            const stats = newQueue.reduce((acc, item) => {
                acc.total++;
                switch (item.status) {
                    case 'completed':
                        acc.completed++;
                        break;
                    case 'error':
                        acc.failed++;
                        break;
                    case 'pending':
                    case 'running':
                        acc.pending++;
                        break;
                }
                return acc;
            }, { total: 0, completed: 0, failed: 0, pending: 0 });
            
            setStats(stats);
        };

        const handleProcessingStateChange = (processing: boolean) => {
            setIsProcessing(processing);
        };

        // Subscribe to ProcessQueue events
        ProcessQueue.subscribe('queueUpdate', handleQueueUpdate);
        ProcessQueue.subscribe('processingStateChange', handleProcessingStateChange);

        // Initial state
        setQueue(ProcessQueue.getQueue());
        setIsProcessing(ProcessQueue.isProcessing());

        return () => {
            ProcessQueue.unsubscribe('queueUpdate', handleQueueUpdate);
            ProcessQueue.unsubscribe('processingStateChange', handleProcessingStateChange);
        };
    }, []);

    const handleStartQueue = () => {
        ProcessQueue.start();
        setIsPaused(false);
    };

    const handlePauseQueue = () => {
        ProcessQueue.pause();
        setIsPaused(true);
    };

    const handleStopQueue = () => {
        ProcessQueue.stop();
        setIsPaused(false);
    };

    const handleSkipCurrent = () => {
        ProcessQueue.skipCurrent();
    };

    const handleClearCompleted = () => {
        ProcessQueue.clearCompleted();
    };

    const handleRetryFailed = () => {
        ProcessQueue.retryFailed();
    };

    const getStatusIcon = (status: ProcessStatus) => {
        switch (status) {
            case 'completed':
                return <CheckCircle className="w-4 h-4 text-green-600" />;
            case 'error':
                return <AlertTriangle className="w-4 h-4 text-red-600" />;
            case 'running':
                return <Clock className="w-4 h-4 text-blue-600 animate-spin" />;
            case 'pending':
            default:
                return <Clock className="w-4 h-4 text-gray-400" />;
        }
    };

    const getStatusColor = (status: ProcessStatus) => {
        switch (status) {
            case 'completed':
                return 'bg-green-50 text-green-700 border-green-200';
            case 'error':
                return 'bg-red-50 text-red-700 border-red-200';
            case 'running':
                return 'bg-blue-50 text-blue-700 border-blue-200';
            case 'pending':
            default:
                return 'bg-gray-50 text-gray-700 border-gray-200';
        }
    };

    const progressPercentage = stats.total > 0 ? (stats.completed / stats.total) * 100 : 0;

    return (
        <Card className={cn("w-full max-w-md", className)}>
            <CardHeader className="pb-3">
                <CardTitle className="text-base flex items-center gap-2">
                    <Clock className="w-4 h-4" />
                    Process Queue
                </CardTitle>
                <div className="text-sm text-gray-600">
                    {stats.total} total • {stats.completed} completed • {stats.failed} failed
                </div>
                {stats.total > 0 && (
                    <Progress value={progressPercentage} className="h-2" />
                )}
            </CardHeader>
            
            <CardContent className="space-y-4">
                {/* Queue Controls */}
                <div className="flex gap-2">
                    {!isProcessing || isPaused ? (
                        <Button 
                            size="sm" 
                            onClick={handleStartQueue}
                            disabled={queue.length === 0}
                        >
                            <Play className="w-3 h-3 mr-1" />
                            Start
                        </Button>
                    ) : (
                        <Button 
                            size="sm" 
                            variant="outline" 
                            onClick={handlePauseQueue}
                        >
                            <Pause className="w-3 h-3 mr-1" />
                            Pause
                        </Button>
                    )}
                    
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleStopQueue}
                        disabled={!isProcessing}
                    >
                        <Square className="w-3 h-3 mr-1" />
                        Stop
                    </Button>
                    
                    <Button 
                        size="sm" 
                        variant="outline" 
                        onClick={handleSkipCurrent}
                        disabled={!isProcessing}
                    >
                        <SkipForward className="w-3 h-3 mr-1" />
                        Skip
                    </Button>
                </div>

                {/* Management Controls */}
                <div className="flex gap-2">
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleClearCompleted}
                        disabled={stats.completed === 0}
                    >
                        Clear Completed
                    </Button>
                    
                    <Button 
                        size="sm" 
                        variant="ghost" 
                        onClick={handleRetryFailed}
                        disabled={stats.failed === 0}
                    >
                        <RotateCcw className="w-3 h-3 mr-1" />
                        Retry Failed
                    </Button>
                </div>

                {/* Queue Items */}
                {queue.length > 0 ? (
                    <ScrollArea className="h-48">
                        <div className="space-y-2">
                            {queue.map((item, index) => (
                                <div 
                                    key={item.id}
                                    className={cn(
                                        "flex items-center gap-2 p-2 rounded text-xs border",
                                        getStatusColor(item.status)
                                    )}
                                >
                                    <div className="flex items-center gap-1">
                                        <span className="text-xs text-gray-500">#{index + 1}</span>
                                        {getStatusIcon(item.status)}
                                    </div>
                                    
                                    <div className="flex-1 min-w-0">
                                        <div className="font-medium truncate">
                                            {item.nodeType} ({item.nodeId.slice(0, 8)})
                                        </div>
                                        {item.error && (
                                            <div className="text-red-600 truncate">
                                                {item.error}
                                            </div>
                                        )}
                                    </div>
                                    
                                    <Badge variant="outline" className="text-xs">
                                        {item.status}
                                    </Badge>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                ) : (
                    <div className="text-sm text-gray-500 text-center py-4">
                        Queue is empty
                    </div>
                )}

                {/* Queue Status */}
                <div className="text-xs text-gray-500 border-t pt-2">
                    Status: {isPaused ? 'Paused' : isProcessing ? 'Processing' : 'Idle'}
                </div>
            </CardContent>
        </Card>
    );
};

export default ProcessQueueControls;