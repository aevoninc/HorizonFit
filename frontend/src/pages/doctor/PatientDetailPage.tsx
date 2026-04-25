import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Plus,
  Trash2,
  Target,
  CheckCircle,
  UserX,
  Loader2,
  BookOpen,
  Pencil,
  X,
} from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger 
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { doctorApi, PatientProgress, HabitCode, HabitGuide, HABIT_CODES } from "@/lib/api";
import { AssignProgramModal } from "@/pages/doctor/AssignProgramModal";

const zones = [1, 2, 3, 4, 5];

export const PatientDetailPage: React.FC = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(true);
  const [patientData, setPatientData] = useState<PatientProgress | null>(null);

  // Habit Guide state
  const [habitGuides, setHabitGuides] = useState<HabitGuide[]>([]);
  const [isLoadingGuides, setIsLoadingGuides] = useState(false);
  const [isSubmittingGuide, setIsSubmittingGuide] = useState(false);
  const [newGuide, setNewGuide] = useState({
    habitCode: '' as HabitCode | '',
    zone: '1',
    content: '',
  });
  const [editingGuide, setEditingGuide] = useState<HabitGuide | null>(null);
  const [isEditGuideOpen, setIsEditGuideOpen] = useState(false);
  const [editContent, setEditContent] = useState('');

  // Deactivate Dialog
  const [isDeactivateOpen, setIsDeactivateOpen] = useState(false);
  const [deactivationReason, setDeactivationReason] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Assign Program Modal
  const [isAssignProgramOpen, setIsAssignProgramOpen] = useState(false);
  // Fetch patient data + habit guides
  useEffect(() => {
    if (id) {
      fetchPatientProgress();
      fetchHabitGuides();
    }
  }, [id]);

  const fetchHabitGuides = async () => {
    setIsLoadingGuides(true);
    try {
      const res = await doctorApi.getHabitGuides();
      setHabitGuides(res.data.guides);
    } catch {
      // silently fail
    } finally {
      setIsLoadingGuides(false);
    }
  };

  const fetchPatientProgress = async () => {
    try {
      setIsLoading(true);
      const response = await doctorApi.getPatientProgress(id!);
      setPatientData(response.data);
    } catch (error) {
      console.error('Failed to fetch patient progress:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patient data. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignGuide = async () => {
    if (!newGuide.habitCode || !newGuide.zone || !newGuide.content.trim()) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in all fields.',
        variant: 'destructive',
      });
      return;
    }
    try {
      setIsSubmittingGuide(true);
      await doctorApi.assignHabitGuide({
        habitCode: newGuide.habitCode as HabitCode,
        zone: Number(newGuide.zone),
        content: newGuide.content.trim(),
      });
      toast({ title: 'Habit guide saved!' });
      setNewGuide({ habitCode: '', zone: '1', content: '' });
      fetchHabitGuides();
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to save guide.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmittingGuide(false);
    }
  };

  const handleEditGuide = async () => {
    if (!editingGuide || !editContent.trim()) return;
    try {
      setIsSubmittingGuide(true);
      await doctorApi.updateHabitGuide(editingGuide._id, editContent.trim());
      setHabitGuides(prev =>
        prev.map(g => g._id === editingGuide._id ? { ...g, content: editContent.trim() } : g)
      );
      toast({ title: 'Guide updated' });
      setIsEditGuideOpen(false);
      setEditingGuide(null);
    } catch {
      toast({ title: 'Failed to update guide', variant: 'destructive' });
    } finally {
      setIsSubmittingGuide(false);
    }
  };

  const handleDeleteGuide = async (guideId: string) => {
    try {
      await doctorApi.deleteHabitGuide(guideId);
      setHabitGuides(prev => prev.filter(g => g._id !== guideId));
      toast({ title: 'Guide removed' });
    } catch {
      toast({ title: 'Failed to delete guide', variant: 'destructive' });
    }
  };

  const handleDeactivatePatient = async () => {
    try {
      setIsSubmitting(true);
      await doctorApi.deactivatePatient(id!, deactivationReason.trim() || undefined);
      toast({ title: 'Patient Deactivated', description: 'The patient has been deactivated from the program.' });
      navigate('/doctor/patients');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to deactivate patient.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
      setIsDeactivateOpen(false);
    }
  };

  const handleDeletePatient = async () => {
    try {
      await doctorApi.deletePatient(id!);
      toast({ title: 'Patient Deleted', description: 'All patient records have been removed.' });
      navigate('/doctor/patients');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to delete patient.',
        variant: 'destructive',
      });
    }
  };


  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  const patient = patientData?.patient;
  const progressData = patientData?.weeklyProgress || [];
  const zoneData = patientData?.zoneProgress || [];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link to="/doctor/patients">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-foreground">
            {patient?.name || "Patient"}
          </h1>
          <p className="text-muted-foreground">{patient?.email}</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full gradient-phoenix px-4 py-1 text-sm font-semibold text-primary-foreground">
            Zone {patient?.zone || 1}
          </span>
          <span className="text-2xl font-bold text-foreground">
            {patient?.progress || 0}%
          </span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap gap-3">
        <Dialog open={isDeactivateOpen} onOpenChange={setIsDeactivateOpen}>
          <DialogTrigger asChild>
            <Button
              variant="outline"
              className="text-yellow-600 hover:bg-yellow-50 hover:text-yellow-700"
            >
              <UserX className="mr-2 h-4 w-4" />
              Deactivate Patient
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Deactivate Patient</DialogTitle>
              <DialogDescription>
                Are you sure you want to deactivate this patient? They will be
                moved to the deactivated list.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Reason (optional)</Label>
                <Textarea
                  placeholder="Enter reason for deactivation..."
                  value={deactivationReason}
                  onChange={(e) => setDeactivationReason(e.target.value)}
                  maxLength={500}
                />
              </div>
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setIsDeactivateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="phoenix"
                  className="flex-1"
                  onClick={handleDeactivatePatient}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : null}
                  Deactivate
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button
              variant="outline"
              className="text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Patient
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Patient</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete all
                records associated with this patient including tasks, progress
                data, and bookings.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={handleDeletePatient}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
        <Button variant="teal" onClick={() => setIsAssignProgramOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Assign Program
        </Button>
      </div>
      {/* Assign Program Modal */}
      <AssignProgramModal
        patientId={id || ""}
        patientName={patientData?.patient?.name || "Patient"}
        isOpen={isAssignProgramOpen}
        onClose={() => setIsAssignProgramOpen(false)}
        onSuccess={fetchPatientProgress}
      />
      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Weekly Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={progressData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="week"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="completion"
                    stroke="hsl(var(--secondary))"
                    strokeWidth={3}
                    dot={{ fill: "hsl(var(--secondary))", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card className="card-elevated">
          <CardHeader>
            <CardTitle className="text-lg">Zone Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={zoneData}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis
                    dataKey="zone"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={12}
                  />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar
                    dataKey="tasks"
                    fill="hsl(var(--muted))"
                    name="Total Tasks"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="completed"
                    fill="hsl(var(--secondary))"
                    name="Completed"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Assign Habit Guide */}
      <Card className="card-elevated" id="guide-form">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="h-5 w-5 text-secondary" />
            Assign Habit Guide Content
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Assign personalised instructions for each habit per zone. Patients see this when they tap "View Guide".
          </p>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Form */}
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-2">
              <Label>Habit Code <span className="text-destructive">*</span></Label>
              <Select
                value={newGuide.habitCode}
                onValueChange={v => setNewGuide({ ...newGuide, habitCode: v as HabitCode })}
              >
                <SelectTrigger><SelectValue placeholder="Select habit" /></SelectTrigger>
                <SelectContent>
                  {HABIT_CODES.map(code => (
                    <SelectItem key={code} value={code}>{code}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Zone <span className="text-destructive">*</span></Label>
              <Select
                value={newGuide.zone}
                onValueChange={v => setNewGuide({ ...newGuide, zone: v })}
              >
                <SelectTrigger><SelectValue placeholder="Select zone" /></SelectTrigger>
                <SelectContent>
                  {[1,2,3,4,5].map(z => (
                    <SelectItem key={z} value={z.toString()}>Zone {z}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end">
              <Button
                variant="teal"
                className="w-full"
                onClick={handleAssignGuide}
                disabled={isSubmittingGuide}
              >
                {isSubmittingGuide ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                Save Guide
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Guide Content <span className="text-destructive">*</span></Label>
            <Textarea
              rows={5}
              placeholder={`Enter detailed instructions for this habit in Zone ${newGuide.zone}...\n\nExample:\n- Warm-up: 5 min walk\n- 3 sets x 12 reps squats\n- Cool down: stretch 5 min`}
              value={newGuide.content}
              onChange={e => setNewGuide({ ...newGuide, content: e.target.value })}
              maxLength={2000}
            />
            <p className="text-xs text-muted-foreground text-right">{newGuide?.content?.length}/2000</p>
          </div>

          {/* Existing Guides Table */}
          <div className="border-t border-border pt-4 space-y-3">
            <h3 className="text-sm font-semibold text-foreground">All Assigned Guides</h3>
            {isLoadingGuides ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-6 w-6 animate-spin text-secondary" />
              </div>
            ) : habitGuides?.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No habit guides assigned yet.
              </p>
            ) : (
              <div className="space-y-2">
                {habitGuides?.map(guide => (
                  <div
                    key={guide._id}
                    className="flex items-start justify-between gap-4 rounded-lg border border-border bg-muted/30 px-4 py-3"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-semibold text-sm text-foreground">{guide.habitCode}</span>
                        <span className="text-xs bg-secondary/10 text-secondary px-2 py-0.5 rounded-full">Zone {guide.zone}</span>
                        <span className="text-[10px] text-muted-foreground ml-auto">
                          Updated: {new Date(guide.updatedAt || Date.now()).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-2">{guide.content}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={() => {
                          setNewGuide({
                            habitCode: guide.habitCode,
                            zone: guide.zone.toString(),
                            content: guide.content
                          });
                          // Scroll to form or just notify
                          window.scrollTo({ top: document.getElementById('guide-form')?.offsetTop || 0, behavior: 'smooth' });
                        }}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive/60 hover:text-destructive">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Delete Guide</AlertDialogTitle>
                            <AlertDialogDescription>
                              Remove the {guide.habitCode} guide for Zone {guide.zone}? Patients will no longer see this content.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleDeleteGuide(guide._id)}
                              className="bg-destructive text-destructive-foreground"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Edit Guide Dialog */}
      <Dialog open={isEditGuideOpen} onOpenChange={setIsEditGuideOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Habit Guide</DialogTitle>
            <DialogDescription>
              {editingGuide && `${editingGuide.habitCode} â€” Zone ${editingGuide.zone}`}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <Textarea
              rows={7}
              value={editContent}
              onChange={e => setEditContent(e.target.value)}
              maxLength={2000}
            />
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setIsEditGuideOpen(false)}>
                <X className="mr-2 h-4 w-4" /> Cancel
              </Button>
              <Button variant="teal" className="flex-1" onClick={handleEditGuide} disabled={isSubmittingGuide}>
                {isSubmittingGuide ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save Changes
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
};
