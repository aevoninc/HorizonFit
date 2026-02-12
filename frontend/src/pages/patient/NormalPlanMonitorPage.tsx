import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Users, 
  TrendingUp, 
  Calendar,
  CheckCircle,
  AlertCircle,
  Eye,
  Search,
  Filter,
  ChevronRight,
  Loader2,
  BarChart3,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { WeeklyLog, ZONE_DEFINITIONS, COMPLIANCE_OPTIONS } from '@/lib/normalPlanTypes';

// Mock patient data for demo
interface NormalPlanPatient {
  id: string;
  name: string;
  email: string;
  currentZone: number;
  totalWeeksCompleted: number;
  lastLogDate: string;
  complianceRate: number;
  status: 'active' | 'at-risk' | 'completed';
  weeklyLogs: WeeklyLog[];
}

const mockPatients: NormalPlanPatient[] = [
  {
    id: '1',
    name: 'John Smith',
    email: 'john@example.com',
    currentZone: 3,
    totalWeeksCompleted: 6,
    lastLogDate: '2026-01-10',
    complianceRate: 85,
    status: 'active',
    weeklyLogs: [
      {
        id: 'log-1',
        weekNumber: 6,
        zoneNumber: 3,
        metrics: { weight: 78.5, bodyFatPercentage: 22.3, visceralFat: 9, loggedAt: '2026-01-10', zoneNumber: 3 },
        compliance: 'good',
        completedTasks: 4,
        totalTasks: 5,
        notes: 'Feeling stronger this week!',
        submittedAt: '2026-01-10T10:30:00Z',
      },
    ],
  },
  {
    id: '2',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    currentZone: 2,
    totalWeeksCompleted: 3,
    lastLogDate: '2026-01-05',
    complianceRate: 60,
    status: 'at-risk',
    weeklyLogs: [],
  },
  {
    id: '3',
    name: 'Mike Davis',
    email: 'mike@example.com',
    currentZone: 5,
    totalWeeksCompleted: 11,
    lastLogDate: '2026-01-11',
    complianceRate: 95,
    status: 'active',
    weeklyLogs: [],
  },
  {
    id: '4',
    name: 'Emily Chen',
    email: 'emily@example.com',
    currentZone: 5,
    totalWeeksCompleted: 15,
    lastLogDate: '2026-01-09',
    complianceRate: 92,
    status: 'completed',
    weeklyLogs: [],
  },
];

export const NormalPlanMonitorPage: React.FC = () => {
  const [patients, setPatients] = useState<NormalPlanPatient[]>(mockPatients);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [zoneFilter, setZoneFilter] = useState('all');
  const [selectedPatient, setSelectedPatient] = useState<NormalPlanPatient | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);

  useEffect(() => {
    // Simulate API call
    const timer = setTimeout(() => setLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const filteredPatients = patients.filter(patient => {
    const matchesSearch = patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || patient.status === statusFilter;
    const matchesZone = zoneFilter === 'all' || patient.currentZone === parseInt(zoneFilter);
    return matchesSearch && matchesStatus && matchesZone;
  });

  const stats = {
    total: patients.length,
    active: patients.filter(p => p.status === 'active').length,
    atRisk: patients.filter(p => p.status === 'at-risk').length,
    completed: patients.filter(p => p.status === 'completed').length,
    avgCompliance: Math.round(patients.reduce((acc, p) => acc + p.complianceRate, 0) / patients.length),
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-700';
      case 'at-risk': return 'bg-yellow-100 text-yellow-700';
      case 'completed': return 'bg-blue-100 text-blue-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return 'text-green-600';
    if (rate >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-foreground">Normal Plan Monitor</h1>
        <p className="mt-1 text-muted-foreground">
          Track patient progress, weekly logs, and compliance
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total Patients</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-500/10">
                <CheckCircle className="h-5 w-5 text-green-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.active}</p>
                <p className="text-xs text-muted-foreground">Active</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-500/10">
                <AlertCircle className="h-5 w-5 text-yellow-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.atRisk}</p>
                <p className="text-xs text-muted-foreground">At Risk</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-500/10">
                <TrendingUp className="h-5 w-5 text-blue-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.completed}</p>
                <p className="text-xs text-muted-foreground">Completed</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg gradient-phoenix">
                <BarChart3 className="h-5 w-5 text-white" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.avgCompliance}%</p>
                <p className="text-xs text-muted-foreground">Avg Compliance</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="card-elevated">
        <CardContent className="p-4">
          <div className="flex flex-col gap-4 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search patients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="mr-2 h-4 w-4" />
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="at-risk">At Risk</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {ZONE_DEFINITIONS.map(zone => (
                  <SelectItem key={zone.zoneNumber} value={zone.zoneNumber.toString()}>
                    Zone {zone.zoneNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Patient Table */}
      <Card className="card-elevated">
        <CardHeader>
          <CardTitle className="text-lg">Patient Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Patient</TableHead>
                  <TableHead>Zone</TableHead>
                  <TableHead>Weeks</TableHead>
                  <TableHead>Compliance</TableHead>
                  <TableHead>Last Log</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">{patient.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        Zone {patient.currentZone}
                      </Badge>
                    </TableCell>
                    <TableCell>{patient.totalWeeksCompleted}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={patient.complianceRate} className="h-2 w-16" />
                        <span className={`text-sm font-medium ${getComplianceColor(patient.complianceRate)}`}>
                          {patient.complianceRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        {new Date(patient.lastLogDate).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedPatient(patient);
                          setIsDetailOpen(true);
                        }}
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPatients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <p className="text-muted-foreground">No patients found</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Patient Detail Modal */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>
          
          {selectedPatient && (
            <div className="space-y-6 py-4">
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-teal">
                  <span className="text-xl font-bold text-white">
                    {selectedPatient.name.charAt(0)}
                  </span>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">{selectedPatient.name}</h3>
                  <p className="text-muted-foreground">{selectedPatient.email}</p>
                </div>
                <Badge className={`ml-auto ${getStatusColor(selectedPatient.status)}`}>
                  {selectedPatient.status}
                </Badge>
              </div>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-3">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-secondary">
                      Zone {selectedPatient.currentZone}
                    </p>
                    <p className="text-sm text-muted-foreground">Current Zone</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {selectedPatient.totalWeeksCompleted}
                    </p>
                    <p className="text-sm text-muted-foreground">Weeks Completed</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className={`text-3xl font-bold ${getComplianceColor(selectedPatient.complianceRate)}`}>
                      {selectedPatient.complianceRate}%
                    </p>
                    <p className="text-sm text-muted-foreground">Compliance Rate</p>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Logs */}
              <div>
                <h4 className="font-semibold mb-3">Recent Weekly Logs</h4>
                {selectedPatient.weeklyLogs.length > 0 ? (
                  <div className="space-y-3">
                    {selectedPatient.weeklyLogs.map((log) => (
                      <Card key={log.id} className="border-l-4 border-l-secondary">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-medium">Week {log.weekNumber} - Zone {log.zoneNumber}</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(log.submittedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <Badge className={COMPLIANCE_OPTIONS.find(c => c.value === log.compliance)?.color}>
                              {log.compliance}
                            </Badge>
                          </div>
                          <div className="mt-3 grid gap-2 text-sm sm:grid-cols-3">
                            <div>
                              <span className="text-muted-foreground">Weight:</span>{' '}
                              <span className="font-medium">{log.metrics.weight} kg</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Body Fat:</span>{' '}
                              <span className="font-medium">{log.metrics.bodyFatPercentage}%</span>
                            </div>
                            <div>
                              <span className="text-muted-foreground">Tasks:</span>{' '}
                              <span className="font-medium">{log.completedTasks}/{log.totalTasks}</span>
                            </div>
                          </div>
                          {log.notes && (
                            <p className="mt-2 text-sm italic text-muted-foreground">
                              "{log.notes}"
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-4">
                    No weekly logs submitted yet
                  </p>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
