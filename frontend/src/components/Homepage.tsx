import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, ArrowRight, Brain, Loader2, Trash2, Globe, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useFlowsStore, Flow } from '../AgenticContentFlow/stores/useFlowsStore';
import { useAuthStore } from '@/stores/useAuthStore';
import { RenameFlowDialog } from '../AgenticContentFlow/FlowsPanel/components/RenameFlowDialog';
import { useNotifications } from '../AgenticContentFlow/Notifications/hooks/useNotifications';

const Homepage: React.FC = () => {
  const navigate = useNavigate();
  const { loading, fetchFlows, getAllFlows, deleteFlow, renameFlow } = useFlowsStore();
  const { authenticated, isInstructor, userId } = useAuthStore();
  const { showSuccessToast, showErrorToast } = useNotifications();
  const [flowToRename, setFlowToRename] = useState<Flow | null>(null);

  const handleRenamePersist = useCallback(
    async (flowId: string, name: string) => {
      const updated = await renameFlow(flowId, name);
      if (updated) {
        showSuccessToast('Flow renamed', `Saved as "${name}"`);
        return true;
      }
      showErrorToast('Rename failed', 'Could not save the new name');
      return false;
    },
    [renameFlow, showSuccessToast, showErrorToast]
  );

  useEffect(() => {
    fetchFlows().catch(console.warn);
  }, [fetchFlows]);

  const allFlows = getAllFlows();

  // Split flows for instructors: own/collab vs published-by-others
  const ownFlows = isInstructor
    ? allFlows.filter((f) => f.owner_id === `google:${userId}` || f.owner_id === `lti:${userId}` || !f.owner_id)
    : [];
  const publishedFlows = isInstructor
    ? allFlows.filter((f) => f.is_published && f.owner_id && f.owner_id !== `google:${userId}` && f.owner_id !== `lti:${userId}`)
    : allFlows;

  const FlowCard = ({ flow, canDelete }: { flow: Flow; canDelete: boolean }) => (
    <Card
      key={flow.id}
      className="group hover:shadow-md transition-all cursor-pointer border hover:border-primary/30"
      onClick={() => navigate(`/flows/${flow.id}`)}
    >
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 min-w-0">
            <CardTitle className="text-base truncate">{flow.name}</CardTitle>
            {isInstructor && flow.is_published && (
              <Badge variant="secondary" className="shrink-0 text-[10px] px-1.5 py-0">
                <Globe className="w-3 h-3 mr-1" />
                Published
              </Badge>
            )}
          </div>
          {canDelete && (
            <div className="flex items-center shrink-0 -mt-1 -mr-2">
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                title="Rename flow"
                onClick={(e) => {
                  e.stopPropagation();
                  setFlowToRename(flow);
                }}
              >
                <Pencil className="w-4 h-4 text-muted-foreground" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                title="Delete flow"
                onClick={(e) => {
                  e.stopPropagation();
                  if (confirm(`Delete "${flow.name}"?`)) {
                    deleteFlow(flow.id);
                  }
                }}
              >
                <Trash2 className="w-4 h-4 text-muted-foreground hover:text-destructive" />
              </Button>
            </div>
          )}
        </div>
        {flow.description && (
          <CardDescription className="text-xs line-clamp-2">
            {flow.description}
          </CardDescription>
        )}
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>{flow.nodeCount || 0} nodes &middot; {flow.edgeCount || 0} edges</span>
          <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 py-12">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Brain className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">
            Mindflow
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            {isInstructor
              ? 'Create and evaluate mindmap exercises with AI-powered content analysis. Build topic hierarchies, group related concepts, and get automated feedback.'
              : 'Build mindmaps from course materials and get automated feedback on your work.'}
          </p>
        </div>

        {/* Quick Actions - instructors only */}
        {isInstructor && (
          <div className="flex justify-center gap-4 mb-12">
            <Button
              size="lg"
              onClick={() => navigate('/flows/new')}
              className="gap-2"
            >
              <Plus className="w-5 h-5" />
              Create New Flow
            </Button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {/* Instructor's own flows */}
            {isInstructor && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold mb-4">Your Flows</h2>
                {ownFlows.length === 0 ? (
                  <Card className="border-dashed">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Brain className="w-12 h-12 text-muted-foreground/40 mb-4" />
                      <p className="text-muted-foreground text-center max-w-sm">
                        No flows yet. Use <span className="font-medium text-foreground">Create New Flow</span> above to add your first mindmap.
                      </p>
                    </CardContent>
                  </Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {ownFlows.map((flow) => (
                      <FlowCard key={flow.id} flow={flow} canDelete />
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Published flows (shown to everyone; for instructors only "by others") */}
            {publishedFlows.length > 0 && (
              <div>
                <h2 className="text-xl font-semibold mb-4">
                  {isInstructor ? 'Other Published Flows' : 'Available Exercises'}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {publishedFlows.map((flow) => (
                    <FlowCard key={flow.id} flow={flow} canDelete={false} />
                  ))}
                </div>
              </div>
            )}

            {/* Student with no published flows */}
            {!isInstructor && publishedFlows.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="flex flex-col items-center justify-center py-12">
                  <Brain className="w-12 h-12 text-muted-foreground/40 mb-4" />
                  <p className="text-muted-foreground">
                    {authenticated
                      ? 'No exercises available yet. Your instructor will publish them when ready.'
                      : 'Sign in through your LMS to see available exercises.'}
                  </p>
                </CardContent>
              </Card>
            )}
          </>
        )}

        <RenameFlowDialog
          open={Boolean(flowToRename)}
          onOpenChange={(open) => {
            if (!open) setFlowToRename(null);
          }}
          flow={flowToRename}
          onRename={handleRenamePersist}
        />
      </div>
    </div>
  );
};

export default Homepage;
