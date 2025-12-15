import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, User, TrendingUp, Filter, UserX, Loader2, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Link } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { doctorApi, Patient } from '@/lib/api';

export const DoctorDeactivatedPatientsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('date');
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchDeactivatedPatients();
  }, []);

  const fetchDeactivatedPatients = async () => {
    try {
      setIsLoading(true);
      const response = await doctorApi.getDeactivatedPatients();
      setPatients(response.data);
    } catch (error) {
      console.error('Failed to fetch deactivated patients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load deactivated patients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredPatients = patients
    .filter(
      (patient) =>
        patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        patient.email.toLowerCase().includes(searchQuery.toLowerCase())
    )
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.deactivatedDate || '').getTime() - new Date(a.deactivatedDate || '').getTime();
      }
      return a.name.localeCompare(b.name);
    });

  // Calculate stats
  const thisMonthCount = patients.filter((p) => {
    const deactivatedDate = new Date(p.deactivatedDate || '');
    const now = new Date();
    return deactivatedDate.getMonth() === now.getMonth() && deactivatedDate.getFullYear() === now.getFullYear();
  }).length;

  const avgProgress = patients.length > 0
    ? Math.round(patients.reduce((acc, p) => acc + p.progress, 0) / patients.length)
    : 0;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Deactivated Patients</h1>
        <p className="mt-1 text-muted-foreground">Patients who have left or been deactivated from the program</p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Deactivated</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <UserX className="h-6 w-6 text-destructive" />
              <span className="text-3xl font-bold text-foreground">{patients.length}</span>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{thisMonthCount}</div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Progress at Exit</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-muted-foreground">{avgProgress}%</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search deactivated patients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="mr-2 h-4 w-4" />
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Deactivation Date</SelectItem>
            <SelectItem value="name">Name (A-Z)</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Loading State */}
      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-secondary" />
        </div>
      ) : (
        <>
          {/* Patients Grid */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredPatients.map((patient, index) => (
              <motion.div
                key={patient.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/doctor/patients/${patient.id}`}>
                  <Card className="card-elevated cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg opacity-80 hover:opacity-100">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                          <UserX className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <span className="rounded-full bg-destructive/10 px-3 py-1 text-xs font-semibold text-destructive">
                          Deactivated
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-foreground">{patient.name}</h3>
                      <p className="mb-2 text-sm text-muted-foreground">{patient.email}</p>
                      {patient.deactivationReason && (
                        <p className="mb-4 text-xs text-muted-foreground italic">
                          Reason: {patient.deactivationReason}
                        </p>
                      )}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress at Exit</span>
                          <span className="font-semibold text-muted-foreground">{patient.progress}%</span>
                        </div>
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full bg-muted-foreground/50 transition-all duration-500"
                            style={{ width: `${patient.progress}%` }}
                          />
                        </div>
                      </div>
                      {patient.deactivatedDate && (
                        <p className="mt-4 text-xs text-muted-foreground">
                          Deactivated on: {new Date(patient.deactivatedDate).toLocaleDateString()}
                        </p>
                      )}
                      <div className="mt-4 flex items-center gap-2 text-sm text-secondary">
                        <TrendingUp className="h-4 w-4" />
                        <span>View Details</span>
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              </motion.div>
            ))}
          </div>

          {filteredPatients.length === 0 && (
            <div className="py-12 text-center">
              <User className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
              <p className="text-lg text-muted-foreground">No deactivated patients found</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
