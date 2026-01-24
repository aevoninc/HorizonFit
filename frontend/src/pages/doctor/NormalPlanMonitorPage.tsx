import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
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
  RefreshCw,
  Edit2,
  MessageSquare,
  Settings,
  Play,
  Pause,
  AlertTriangle,
  FileText,
  ArrowUp,
  ArrowDown,
  Clock,
  Activity,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ZONE_DEFINITIONS, COMPLIANCE_OPTIONS } from "@/lib/normalPlanTypes";
import {
  normalPlanDoctorApi,
  NormalPlanPatientSummary,
  NormalPlanPatientDetail,
  DailyActivityReport,
} from "@/lib/normalPlanApi";

export const NormalPlanMonitorPage: React.FC = () => {
  const { toast } = useToast();
  const [patients, setPatients] = useState<NormalPlanPatientSummary[]>([]);
  const [dailyReport, setDailyReport] = useState<DailyActivityReport | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [zoneFilter, setZoneFilter] = useState("all");
  const [selectedPatient, setSelectedPatient] =
    useState<NormalPlanPatientSummary | null>(null);
  const [patientDetail, setPatientDetail] =
    useState<NormalPlanPatientDetail | null>(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Action modals
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isZoneOverrideModalOpen, setIsZoneOverrideModalOpen] = useState(false);
  const [actionNote, setActionNote] = useState("");
  const [newStatus, setNewStatus] = useState("");
  const [newZone, setNewZone] = useState("");
  const [overrideReason, setOverrideReason] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [patientsRes, reportRes] = await Promise.all([
        normalPlanDoctorApi.getPatients(),
        normalPlanDoctorApi.getDailyActivityReport(),
      ]);
      setPatients(patientsRes.data);
      setDailyReport(reportRes.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load patient data.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchData();
    setRefreshing(false);
  };

  const fetchPatientDetail = async (patientId: string) => {
    try {
      setLoadingDetail(true);
      const response = await normalPlanDoctorApi.getPatientDetail(patientId);
      console.log(response);
      setPatientDetail(response.data);
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to load patient details.",
        variant: "destructive",
      });
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleViewPatient = async (patient: NormalPlanPatientSummary) => {
    console.log(patient);
    setSelectedPatient(patient);
    setIsDetailOpen(true);
    await fetchPatientDetail(patient.id);
  };

  const handleAddNote = async () => {
    if (!selectedPatient || !actionNote.trim()) return;

    setIsSaving(true);
    try {
      await normalPlanDoctorApi.addDoctorNote(selectedPatient.id, actionNote);
      toast({
        title: "Note Added",
        description: "Doctor note has been saved.",
      });
      setIsNoteModalOpen(false);
      setActionNote("");
      await fetchPatientDetail(selectedPatient.id);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.response?.data?.message || "Failed to add note.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedPatient || !newStatus) return;

    setIsSaving(true);
    try {
      await normalPlanDoctorApi.updatePatientStatus(
        selectedPatient.id,
        newStatus,
        actionNote || undefined,
      );
      toast({
        title: "Status Updated",
        description: `Patient status changed to ${newStatus}.`,
      });
      setIsStatusModalOpen(false);
      setNewStatus("");
      setActionNote("");
      await fetchData();
      if (patientDetail) {
        await fetchPatientDetail(selectedPatient.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to update status.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleOverrideZone = async () => {
    if (!selectedPatient || !newZone || !overrideReason.trim()) return;
    console.log(selectedPatient);
    setIsSaving(true);
    try {
      await normalPlanDoctorApi.overridePatientZone(
        selectedPatient.id,
        parseInt(newZone),
        overrideReason,
      );
      toast({
        title: "Zone Override Applied",
        description: `Patient moved to Zone ${newZone}.`,
      });
      setIsZoneOverrideModalOpen(false);
      setNewZone("");
      setOverrideReason("");
      await fetchData();
      if (patientDetail) {
        await fetchPatientDetail(selectedPatient.id);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to override zone.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const filteredPatients = patients.filter((patient) => {
    const matchesSearch =
      patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      patient.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus =
      statusFilter === "all" || patient.status === statusFilter;
    const matchesZone =
      zoneFilter === "all" || patient.currentZone === parseInt(zoneFilter);
    return matchesSearch && matchesStatus && matchesZone;
  });

  const stats = {
    total: patients.length,
    active: patients.filter((p) => p.status === "active").length,
    atRisk: patients.filter((p) => p.status === "at-risk").length,
    completed: patients.filter((p) => p.status === "completed").length,
    avgCompliance:
      patients.length > 0
        ? Math.round(
            patients.reduce((acc, p) => acc + p.complianceRate, 0) /
              patients.length,
          )
        : 0,
    activeToday: dailyReport?.activeToday || 0,
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-700";
      case "at-risk":
        return "bg-yellow-100 text-yellow-700";
      case "paused":
        return "bg-gray-100 text-gray-700";
      case "completed":
        return "bg-blue-100 text-blue-700";
      default:
        return "bg-gray-100 text-gray-700";
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 80) return "text-green-600";
    if (rate >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">
            Normal Plan Monitor
          </h1>
          <p className="mt-1 text-muted-foreground">
            Track patient progress, daily activity, and manage compliance
          </p>
        </div>
        <Button
          variant="outline"
          onClick={handleRefresh}
          disabled={refreshing}
          className="gap-2"
        >
          <RefreshCw
            className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
          />
          Refresh
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
        <Card className="card-elevated">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary/10">
                <Users className="h-5 w-5 text-secondary" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.total}</p>
                <p className="text-xs text-muted-foreground">Total</p>
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
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-500/10">
                <Activity className="h-5 w-5 text-purple-500" />
              </div>
              <div>
                <p className="text-2xl font-bold">{stats.activeToday}</p>
                <p className="text-xs text-muted-foreground">Active Today</p>
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

      {/* Daily Activity Alert */}
      {dailyReport && dailyReport.atRisk > 0 && (
        <Card className="border-amber-200 bg-amber-50/50">
          <CardContent className="flex items-center gap-4 p-4">
            <AlertTriangle className="h-6 w-6 shrink-0 text-amber-600" />
            <div className="flex-1">
              <p className="font-medium text-amber-800">
                Patients Need Attention
              </p>
              <p className="text-sm text-amber-700">
                {dailyReport.atRisk} patient(s) haven't logged activity in 3+
                days and may need follow-up.
              </p>
            </div>
            <Button
              variant="outline"
              className="shrink-0 border-amber-400 text-amber-700 hover:bg-amber-100"
              onClick={() => setStatusFilter("at-risk")}
            >
              View At-Risk
            </Button>
          </CardContent>
        </Card>
      )}

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
                <SelectItem value="paused">Paused</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={zoneFilter} onValueChange={setZoneFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Zone" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Zones</SelectItem>
                {ZONE_DEFINITIONS.map((zone) => (
                  <SelectItem
                    key={zone.zoneNumber}
                    value={zone.zoneNumber.toString()}
                  >
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
                  <TableHead>Last Daily Log</TableHead>
                  <TableHead>Active Days</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPatients.map((patient) => (
                  <TableRow key={patient._id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{patient.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {patient.email}
                        </p>
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
                        <Progress
                          value={patient.complianceRate}
                          className="h-2 w-16"
                        />
                        <span
                          className={`text-sm font-medium ${getComplianceColor(patient.complianceRate)}`}
                        >
                          {patient.complianceRate}%
                        </span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        {patient.lastDailyLogDate ? (
                          <span
                            className={
                              patient.daysSinceLastDailyLog >= 3
                                ? "text-red-600 font-medium"
                                : ""
                            }
                          >
                            {patient.daysSinceLastDailyLog === 0
                              ? "Today"
                              : `${patient.daysSinceLastDailyLog}d ago`}
                          </span>
                        ) : (
                          <span className="text-muted-foreground">Never</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {patient.activeDaysThisWeek}/7
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(patient.status)}>
                        {patient.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleViewPatient(patient)}
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setIsNoteModalOpen(true);
                          }}
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPatient(patient);
                            setNewStatus(patient.status);
                            setIsStatusModalOpen(true);
                          }}
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredPatients.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8">
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Patient Details</DialogTitle>
          </DialogHeader>

          {loadingDetail ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-secondary" />
            </div>
          ) : patientDetail ? (
            <div className="space-y-6 py-4">
              {/* Patient Info */}
              <div className="flex items-center gap-4">
                <div className="flex h-16 w-16 items-center justify-center rounded-full gradient-teal">
                  <span className="text-xl font-bold text-white">
                    {patientDetail.patient.name.charAt(0)}
                  </span>
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-semibold">
                    {patientDetail.patient.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {patientDetail.patient.email}
                  </p>
                </div>
                <Badge className={getStatusColor(patientDetail.patient.status)}>
                  {patientDetail.patient.status}
                </Badge>
              </div>

              {/* Quick Actions */}
              <div className="flex flex-wrap gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setIsNoteModalOpen(true);
                  }}
                >
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Add Note
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewStatus(patientDetail.patient.status);
                    setIsStatusModalOpen(true);
                  }}
                >
                  <Settings className="mr-2 h-4 w-4" />
                  Change Status
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setNewZone(patientDetail.patient.currentZone.toString());
                    setIsZoneOverrideModalOpen(true);
                  }}
                >
                  <ArrowUp className="mr-2 h-4 w-4" />
                  Override Zone
                </Button>
              </div>

              {/* Stats */}
              <div className="grid gap-4 sm:grid-cols-4">
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-secondary">
                      Zone {patientDetail.patient.currentZone}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Current Zone
                    </p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold text-primary">
                      {patientDetail.patient.totalWeeksCompleted}
                    </p>
                    <p className="text-sm text-muted-foreground">Weeks</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">
                      {patientDetail.dailyLogs?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Daily Logs</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4 text-center">
                    <p className="text-3xl font-bold">
                      {patientDetail.weeklyLogs?.length || 0}
                    </p>
                    <p className="text-sm text-muted-foreground">Weekly Logs</p>
                  </CardContent>
                </Card>
              </div>

              {/* Tabs */}
              <Tabs defaultValue="metrics">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="metrics">Metrics</TabsTrigger>
                  <TabsTrigger value="daily">Daily Logs</TabsTrigger>
                  <TabsTrigger value="weekly">Weekly Logs</TabsTrigger>
                  <TabsTrigger value="notes">Doctor Notes</TabsTrigger>
                </TabsList>

                <TabsContent value="metrics" className="mt-4">
                  {patientDetail.metricsHistory?.length > 0 ? (
                    <div className="space-y-3">
                      {patientDetail.metricsHistory
                        .slice(0, 10)
                        .map((metric, index) => (
                          <Card
                            key={metric._id || index}
                            className="border-l-4 border-l-secondary"
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div className="grid gap-2 sm:grid-cols-3 text-sm flex-1">
                                  <div>
                                    <span className="text-muted-foreground">
                                      Weight:
                                    </span>{" "}
                                    <span className="font-medium">
                                      {patientDetail.normalizedMetrics
                                        ?.weight ?? "--"}{" "}
                                      kg
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Body Fat:
                                    </span>{" "}
                                    <span className="font-medium">
                                      {patientDetail.normalizedMetrics
                                        ?.bodyFatPercentage ?? "--"}
                                      %
                                    </span>
                                  </div>
                                  <div>
                                    <span className="text-muted-foreground">
                                      Visceral:
                                    </span>{" "}
                                    <span className="font-medium">
                                      {patientDetail.normalizedMetrics
                                        ?.visceralFat ?? "--"}
                                    </span>
                                  </div>
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(
                                    metric.loggedAt,
                                  ).toLocaleDateString()}
                                </span>
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No metrics recorded yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="daily" className="mt-4">
                  {patientDetail.dailyLogs?.length > 0 ? (
                    <div className="space-y-3">
                      {patientDetail.dailyLogs
                        .slice(0, 14)
                        .map((log, index) => (
                          <Card
                            key={log._id}
                            className="border-l-4 border-l-primary"
                          >
                            <CardContent className="p-4">
                              <div className="flex justify-between items-start">
                                <div>
                                  <p className="font-medium">
                                    {new Date(
                                      log.completionDate,
                                    ).toLocaleDateString("en-US", {
                                      weekday: "short",
                                      month: "short",
                                      day: "numeric",
                                    })}
                                  </p>
                                  <p className="text-sm text-muted-foreground">
                                    {log.completedTasks?.length || "All"} tasks
                                    completed
                                  </p>
                                  {log.notes && (
                                    <p className="text-sm italic mt-1">
                                      "{log.notes}"
                                    </p>
                                  )}
                                </div>
                                {log.mood && (
                                  <Badge variant="outline">{log.mood}</Badge>
                                )}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No daily logs recorded yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="weekly" className="mt-4">
                  {patientDetail.weeklyLogs?.length > 0 ? (
                    <div className="space-y-3">
                      {patientDetail.weeklyLogs.map((log) => (
                        <Card
                          key={log._id}
                          className="border-l-4 border-l-secondary"
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <p className="font-medium">
                                  Week {log.weekNumber} - Zone {log.zoneNumber}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {new Date(
                                    log.submittedAt,
                                  ).toLocaleDateString()}
                                </p>
                              </div>
                              <Badge
                                className={
                                  COMPLIANCE_OPTIONS.find(
                                    (c) => c.value === log.compliance,
                                  )?.color
                                }
                              >
                                {log.compliance}
                              </Badge>
                            </div>
                            <div className="mt-3 grid gap-2 text-sm sm:grid-cols-4">
                              <div>
                                <span className="text-muted-foreground">
                                  Weight:
                                </span>{" "}
                                <span className="font-medium">
                                  {patientDetail.normalizedMetrics?.weight ??
                                    "--"}{" "}
                                  kg
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Body Fat:
                                </span>{" "}
                                <span className="font-medium">
                                  {patientDetail.normalizedMetrics
                                    ?.bodyFatPercentage ?? "--"}
                                  %
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Visceral:
                                </span>{" "}
                                <span className="font-medium">
                                  {patientDetail.normalizedMetrics
                                    ?.visceralFat ?? "--"}
                                </span>
                              </div>
                              <div>
                                <span className="text-muted-foreground">
                                  Tasks:
                                </span>{" "}
                                <span className="font-medium">
                                  {log.completedTasks}/{log.totalTasks}
                                </span>
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
                    <p className="text-center text-muted-foreground py-8">
                      No weekly logs submitted yet
                    </p>
                  )}
                </TabsContent>

                <TabsContent value="notes" className="mt-4">
                  {patientDetail.patient.doctorNotes?.length > 0 ? (
                    <div className="space-y-3">
                      {patientDetail.patient.doctorNotes.map((note, index) => (
                        <Card
                          key={index}
                          className="border-l-4 border-l-amber-500"
                        >
                          <CardContent className="p-4">
                            <div className="flex justify-between items-start">
                              <p className="text-sm">{note.note}</p>
                              <span className="text-xs text-muted-foreground shrink-0 ml-4">
                                {new Date(note.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">
                      No doctor notes yet
                    </p>
                  )}
                </TabsContent>
              </Tabs>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>

      {/* Add Note Modal */}
      <Dialog open={isNoteModalOpen} onOpenChange={setIsNoteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Doctor Note</DialogTitle>
            <DialogDescription>
              Add a note for {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="note">Note</Label>
              <Textarea
                id="note"
                placeholder="Enter your note..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsNoteModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleAddNote}
              disabled={isSaving || !actionNote.trim()}
              className="gradient-phoenix text-primary-foreground"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Note
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Change Status Modal */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Patient Status</DialogTitle>
            <DialogDescription>
              Update status for {selectedPatient?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Status</Label>
              <Select value={newStatus} onValueChange={setNewStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="at-risk">At Risk</SelectItem>
                  <SelectItem value="paused">Paused</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="statusNote">Reason (Optional)</Label>
              <Textarea
                id="statusNote"
                placeholder="Enter reason for status change..."
                value={actionNote}
                onChange={(e) => setActionNote(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateStatus}
              disabled={isSaving || !newStatus}
              className="gradient-phoenix text-primary-foreground"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Update Status
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Zone Override Modal */}
      <Dialog
        open={isZoneOverrideModalOpen}
        onOpenChange={setIsZoneOverrideModalOpen}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-amber-600">
              <AlertTriangle className="h-5 w-5" />
              Override Patient Zone
            </DialogTitle>
            <DialogDescription>
              Manually move {selectedPatient?.name} to a different zone. This
              action will be logged.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Target Zone</Label>
              <Select value={newZone} onValueChange={setNewZone}>
                <SelectTrigger>
                  <SelectValue placeholder="Select zone" />
                </SelectTrigger>
                <SelectContent>
                  {ZONE_DEFINITIONS.map((zone) => (
                    <SelectItem
                      key={zone.zoneNumber}
                      value={zone.zoneNumber.toString()}
                    >
                      Zone {zone.zoneNumber}: {zone.zoneName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="overrideReason">Reason (Required)</Label>
              <Textarea
                id="overrideReason"
                placeholder="Enter reason for zone override..."
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsZoneOverrideModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleOverrideZone}
              disabled={isSaving || !newZone || !overrideReason.trim()}
              className="gradient-phoenix text-primary-foreground"
            >
              {isSaving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Override Zone
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
