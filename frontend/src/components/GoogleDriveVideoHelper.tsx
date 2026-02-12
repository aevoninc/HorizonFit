import React, { useState } from 'react';
import { ChevronDown, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

export const GoogleDriveVideoHelper: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);

  const steps = [
    {
      number: 1,
      title: 'Upload to Google Drive',
      description: 'Upload your video file to Google Drive',
      icon: '📤'
    },
    {
      number: 2,
      title: 'Share with Link',
      description: 'Right-click → Share → "Anyone with the link"',
      icon: '🔗'
    },
    {
      number: 3,
      title: 'Copy Link',
      description: 'Copy the sharing URL from Google Drive',
      icon: '📋'
    },
    {
      number: 4,
      title: 'Paste & Save',
      description: 'Paste in HorizonFit and click Save',
      icon: '✅'
    }
  ];

  return (
    <Card className="border-green-200 bg-green-50 overflow-hidden">
      <CardHeader 
        className="pb-3 cursor-pointer hover:bg-green-100/50 transition-colors"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <HelpCircle className="h-5 w-5 text-green-600" />
            <CardTitle className="text-base text-green-900">
              Quick Guide: Adding Google Drive Videos
            </CardTitle>
          </div>
          <ChevronDown 
            className={`h-5 w-5 text-green-600 transition-transform ${
              isExpanded ? 'rotate-180' : ''
            }`}
          />
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pt-0 space-y-4">
          {/* Steps */}
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 py-4">
            {steps.map((step) => (
              <div key={step.number} className="text-center">
                <div className="text-2xl mb-1">{step.icon}</div>
                <div className="text-xs font-semibold text-green-900">
                  Step {step.number}
                </div>
                <div className="text-xs text-green-700 mt-1">
                  {step.title}
                </div>
              </div>
            ))}
          </div>

          {/* Key Info */}
          <div className="space-y-2 border-t border-green-200 pt-4">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-600 mt-0.5 shrink-0" />
              <div className="text-sm text-green-800">
                <strong>Correct URL format:</strong> https://drive.google.com/file/d/<code className="bg-white px-1">FILE_ID</code>/view
              </div>
            </div>

            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-amber-600 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900">
                <strong>Important:</strong> Make sure sharing is set to <Badge variant="outline" className="ml-1 text-xs">Anyone with the link</Badge>
              </div>
            </div>
          </div>

          {/* CTA Button */}
          <div className="pt-2">
            <Button 
              asChild
              size="sm"
              className="w-full bg-green-600 hover:bg-green-700"
            >
              <a 
                href="https://drive.google.com/drive/my-drive" 
                target="_blank"
                rel="noopener noreferrer"
              >
                Open Google Drive
              </a>
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );
};
