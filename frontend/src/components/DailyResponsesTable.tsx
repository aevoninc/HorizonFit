import { useState, useEffect } from 'react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import * as XLSX from 'xlsx';

interface DailyResponse {
  _id: string;
  date: string;
  breakfast: string;
  lunch: string;
  dinner: string;
  meditationMinutes: number;
  waterLitres: number;
  exerciseMinutes: number;
  sleepFrom: string;
  sleepTo: string;
}

interface DailyResponsesTableProps {
  patientId: string;
}

export const DailyResponsesTable = ({ patientId }: DailyResponsesTableProps) => {
  const [responses, setResponses] = useState<DailyResponse[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDailyResponses();
  }, [patientId]);

  const fetchDailyResponses = async () => {
    try {
      setIsLoading(true);
      const response = await api.get(`/patients/daily-responses/${patientId}`);
      
      // Handle both array and object responses
      const data = Array.isArray(response.data) ? response.data : response.data?.responses || [];
      setResponses(data);
    } catch (error: any) {
      console.error('Failed to fetch daily responses:', error);
      // If 404 or no data, set empty array instead of showing error
      if (error.response?.status === 404) {
        setResponses([]);
      } else {
        toast({
          title: 'Error',
          description: 'Failed to load daily responses.',
          variant: 'destructive',
        });
      }
    } finally {
      setIsLoading(false);
    }
  };

  const exportToExcel = () => {
    if (responses.length === 0) {
      toast({
        title: 'No Data',
        description: 'There are no responses to export.',
      });
      return;
    }

    const exportData = responses.map((response) => ({
      Date: new Date(response.date).toLocaleDateString(),
      Breakfast: response.breakfast || 'N/A',
      Lunch: response.lunch || 'N/A',
      Dinner: response.dinner || 'N/A',
      'Meditation (min)': response.meditationMinutes || 0,
      'Water Intake (L)': response.waterLitres || 0,
      'Exercise (min)': response.exerciseMinutes || 0,
      'Sleep From': response.sleepFrom || 'N/A',
      'Sleep To': response.sleepTo || 'N/A',
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Daily Responses');
    XLSX.writeFile(workbook, `Patient_Daily_Responses_${new Date().toISOString().split('T')[0]}.xlsx`);

    toast({
      title: 'Success',
      description: 'Excel file downloaded successfully.',
    });
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  if (isLoading) {
    return (
      <Card className="card-elevated">
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-secondary" />
        </CardContent>
      </Card>
    );
  }

  // Ensure responses is always an array
  const responsesList = Array.isArray(responses) ? responses : [];

  return (
    <Card className="card-elevated">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">Daily Questionnaire Responses</CardTitle>
        {responsesList.length > 0 && (
          <Button
            variant="teal"
            size="sm"
            onClick={exportToExcel}
            className="flex gap-2"
          >
            <Download className="h-4 w-4" />
            Export to Excel
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {responsesList.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            No daily responses submitted yet.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Breakfast</TableHead>
                  <TableHead>Lunch</TableHead>
                  <TableHead>Dinner</TableHead>
                  <TableHead>Meditation (min)</TableHead>
                  <TableHead>Water (L)</TableHead>
                  <TableHead>Exercise (min)</TableHead>
                  <TableHead>Sleep</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {responsesList.map((response) => (
                  <TableRow key={response._id}>
                    <TableCell className="font-medium">
                      {formatDate(response.date)}
                    </TableCell>
                    <TableCell className="text-sm">
                      {response.breakfast || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {response.lunch || 'N/A'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {response.dinner || 'N/A'}
                    </TableCell>
                    <TableCell className="text-center">
                      {response.meditationMinutes || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {response.waterLitres || 0}
                    </TableCell>
                    <TableCell className="text-center">
                      {response.exerciseMinutes || 0}
                    </TableCell>
                    <TableCell className="text-sm">
                      {response.sleepFrom && response.sleepTo
                        ? `${response.sleepFrom} - ${response.sleepTo}`
                        : 'N/A'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
