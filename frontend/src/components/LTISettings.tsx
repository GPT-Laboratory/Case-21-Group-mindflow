import React, { useEffect, useMemo, useState } from 'react';
import { Copy, KeyRound, RefreshCcw, LogIn } from 'lucide-react';
import { ltiApi, LTICredential } from '@/services/apiClient';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';

const LTISettings: React.FC = () => {
  const [credentials, setCredentials] = useState<LTICredential | null>(null);
  const [loading, setLoading] = useState(true);
  const [regenerating, setRegenerating] = useState(false);
  const { authenticated, provider, startGoogleLogin, fetchSession } = useAuthStore();

  const origin = useMemo(() => (typeof window !== 'undefined' ? window.location.origin : ''), []);
  const launchUrl = `${origin}/api/lti/launch`;
  const exerciseTemplate = `${origin}/api/lti/exercise/{exercise_id}`;

  const loadCredentials = async () => {
    try {
      setLoading(true);
      const credential = await ltiApi.getCredentials();
      setCredentials(credential);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load credentials');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSession();
  }, [fetchSession]);

  useEffect(() => {
    if (authenticated) {
      loadCredentials();
    } else {
      setCredentials(null);
      setLoading(false);
    }
  }, [authenticated]);

  const handleRegenerate = async () => {
    try {
      setRegenerating(true);
      const updated = await ltiApi.regenerateCredential();
      setCredentials(updated);
      toast.success('LTI consumer secret regenerated');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to regenerate credential');
    } finally {
      setRegenerating(false);
    }
  };

  const copy = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copied`);
  };

  return (
    <div className="h-full overflow-y-auto">
      <div className="mx-auto w-full max-w-5xl p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <KeyRound className="h-4 w-4" /> LTI 1.0 Credentials
            </CardTitle>
            <CardDescription>
              Credentials are private and tied to your logged-in profile.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {!authenticated ? (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">
                  Sign in with Google to create or manage your own LTI credentials.
                </p>
                <Button onClick={startGoogleLogin} className="gap-2">
                  <LogIn className="h-4 w-4" />
                  Sign in with Google
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    Signed in via {provider === 'google' ? 'Google' : 'LTI'}
                  </p>
                  <Button variant="outline" onClick={handleRegenerate} disabled={regenerating}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    {regenerating ? 'Regenerating...' : 'Regenerate Secret'}
                  </Button>
                </div>

                {loading ? (
                  <p className="text-sm text-muted-foreground">Loading your credentials...</p>
                ) : credentials ? (
                  <div className="space-y-3 border rounded-md p-3">
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <Input readOnly value={`Key: ${credentials.consumerKey}`} className="text-xs" />
                      <Button variant="outline" size="icon" onClick={() => copy(credentials.consumerKey, 'Consumer key')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-2 md:grid-cols-[1fr_auto]">
                      <Input readOnly value={`Secret: ${credentials.consumerSecret}`} className="text-xs" />
                      <Button variant="outline" size="icon" onClick={() => copy(credentials.consumerSecret, 'Consumer secret')}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Unable to load credential.</p>
                )}
              </div>
            )}

            <div className="text-sm text-muted-foreground space-y-1">
              <p>Launch URL: {launchUrl}</p>
              <p>Exercise Launch Template: {exerciseTemplate}</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default LTISettings;
