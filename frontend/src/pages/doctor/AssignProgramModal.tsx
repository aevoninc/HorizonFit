import { useState, useEffect } from 'react';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { doctorApi } from '@/lib/api';
import { TemplateListItem } from '@/lib/templateTypes';

interface AssignProgramModalProps {
  patientId: string;
  patientName: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const AssignProgramModal: React.FC<AssignProgramModalProps> = ({
  patientId,
  patientName,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchTemplates();
    }
  }, [isOpen]);

  const fetchTemplates = async () => {
    setIsLoading(true);
    try {
      const data = await doctorApi.getTemplates();
      setTemplates(data);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to fetch templates',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedTemplateId) {
      toast({
        title: 'Error',
        description: 'Please select a program template',
        variant: 'destructive',
      });
      return;
    }

    setIsSubmitting(true);
    try {
      await doctorApi.assignProgram(patientId, selectedTemplateId);
      toast({
        title: 'Success',
        description: `Program assigned to ${patientName} successfully`,
      });
      onClose();
      onSuccess?.();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to assign program',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setSelectedTemplateId('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Assign Program</DialogTitle>
          <DialogDescription>
            Select a program template to assign to {patientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-secondary" />
            </div>
          ) : templates.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No templates available.</p>
              <p className="text-sm text-muted-foreground">Create a template first.</p>
            </div>
          ) : (
            <>
              <div className="space-y-2">
                <Label>Program Template</Label>
                <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a template" />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((template) => (
                      <SelectItem key={template._id} value={template._id}>
                        <div className="flex flex-col">
                          <span>{template.name}</span>
                          {template.category && (
                            <span className="text-xs text-muted-foreground">{template.category}</span>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" onClick={handleClose} className="flex-1">
                  Cancel
                </Button>
                <Button
                  variant="teal"
                  onClick={handleAssign}
                  disabled={isSubmitting || !selectedTemplateId}
                  className="flex-1"
                >
                  {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                  Assign Program
                </Button>
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
