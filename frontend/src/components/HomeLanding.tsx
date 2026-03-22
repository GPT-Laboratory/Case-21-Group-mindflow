import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, FileText, Network, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';

const HomeLanding: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="h-full overflow-y-auto bg-gradient-to-br from-background via-background to-muted/30">
      <div className="max-w-5xl mx-auto px-6 py-16">
        <div className="text-center mb-14">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <Network className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-4xl font-bold tracking-tight mb-3">Agentic Content Flow</h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Build, manage, and evaluate mindmap-based exercises with AI-assisted workflows.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-3xl mx-auto">
          <button
            onClick={() => navigate('/flows')}
            className="group text-left border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Open Flows</h2>
              <ArrowRight className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground">Browse existing flows, open an editor, or manage your exercises.</p>
          </button>

          <button
            onClick={() => navigate('/documents')}
            className="group text-left border rounded-xl p-5 bg-card hover:border-primary/40 hover:shadow-sm transition-all"
          >
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-lg font-semibold">Documents</h2>
              <FileText className="w-4 h-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
            <p className="text-sm text-muted-foreground">Manage source documents used by evaluation and retrieval workflows.</p>
          </button>
        </div>

        <div className="flex justify-center mt-10">
          <Button size="lg" className="gap-2" onClick={() => navigate('/flows/new')}>
            <Plus className="w-5 h-5" />
            Create New Flow
          </Button>
        </div>
      </div>
    </div>
  );
};

export default HomeLanding;