import React from 'react';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle, RefreshCw, ThumbsUp, ThumbsDown } from 'lucide-react';

// Import the approval status type from ProcessContext
type ApprovalStatus = 'pending' | 'approved' | 'declined';

interface ApprovalActionsProps {
  approvalStatus: ApprovalStatus;
  onApprove: () => void;
  onDecline: () => void;
  onReset: () => void;
  hasData: boolean;
}

export const ApprovalActions: React.FC<ApprovalActionsProps> = ({
  approvalStatus,
  onApprove,
  onDecline,
  onReset,
  hasData
}) => {
  if (!hasData) return null;

  return (
    <div className="space-y-3">
      {/* Approval Status Display */}
      {approvalStatus !== 'pending' && (
        <div className={`p-3 rounded-md border ${
          approvalStatus === 'approved' 
            ? 'bg-green-50 border-green-200' 
            : 'bg-red-50 border-red-200'
        }`}>
          <div className="flex items-center gap-2">
            {approvalStatus === 'approved' ? (
              <CheckCircle className="w-4 h-4 text-green-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span className={`text-sm font-medium ${
              approvalStatus === 'approved' ? 'text-green-800' : 'text-red-800'
            }`}>
              Content {approvalStatus === 'approved' ? 'Approved' : 'Declined'}
            </span>
          </div>
          {approvalStatus === 'declined' && (
            <p className="text-xs text-red-700 mt-1">
              This content needs review or reconfiguration before use.
            </p>
          )}
        </div>
      )}

      <h4 className="text-xs font-medium text-gray-700">Review Actions:</h4>
      <div className="flex items-center gap-2">
        <Button 
          variant={approvalStatus === 'approved' ? 'default' : 'outline'} 
          size="sm" 
          onClick={onApprove} 
          disabled={approvalStatus === 'approved'}
          className="flex items-center gap-2"
        >
          <ThumbsUp className="w-4 h-4" />
          {approvalStatus === 'approved' ? 'Approved' : 'Approve'}
        </Button>
        <Button 
          variant={approvalStatus === 'declined' ? 'destructive' : 'outline'} 
          size="sm" 
          onClick={onDecline} 
          disabled={approvalStatus === 'declined'}
          className="flex items-center gap-2"
        >
          <ThumbsDown className="w-4 h-4" />
          {approvalStatus === 'declined' ? 'Declined' : 'Decline'}
        </Button>
        {approvalStatus !== 'pending' && (
          <Button variant="ghost" size="sm" onClick={onReset} className="flex items-center gap-2">
            <RefreshCw className="w-4 h-4" />
            Reset
          </Button>
        )}
      </div>
      {approvalStatus === 'pending' && (
        <p className="text-xs text-gray-500">
          Review the rendered component above and approve or decline based on how the data looks.
        </p>
      )}
    </div>
  );
};