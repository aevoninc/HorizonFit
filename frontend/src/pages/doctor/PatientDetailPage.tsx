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
import { getZoneName } from "@/lib/zoneUtils";
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
      const res = await doctorApi.getHabitGuides({ patientId: id } as any);
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
        patientId: id,
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
          <Badge variant="outline" className="px-4 py-1 text-sm font-semibold">
            {getZoneName(patient?.zone || 1)}
          </Badge>
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

      {/* ─── REDESIGNED HABIT GUIDE SECTION ─── */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* FORM SIDE */}
        <Card className="card-elevated h-full border-secondary/20 shadow-lg shadow-secondary/5" id="guide-form">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2 text-lg font-bold text-foreground">
              <div className="bg-secondary/10 p-2 rounded-lg">
                <BookOpen className="h-5 w-5 text-secondary" />
              </div>
              Assign Habit Guide
            </CardTitle>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Create personalised instructions for this patient. Select a zone and habit to begin.
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Zone Selection (Button Group) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold flex items-center justify-between">
                Step 1: Select Zone
                <span className="text-[10px] text-muted-foreground font-normal">Only one zone at a time</span>
              </Label>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((z) => {
                  const hasGuidesInZone = habitGuides?.some(g => g.zone === z);
                  const isSelected = Number(newGuide.zone) === z;
                  return (
                    <Button
                      key={z}
                      variant={isSelected ? "secondary" : "outline"}
                      className={`flex-1 relative h-12 transition-all duration-200 ${isSelected
                        ? "ring-2 ring-secondary/50 shadow-md scale-105"
                        : "hover:border-secondary/50"
                        }`}
                      onClick={() => setNewGuide({ ...newGuide, zone: z.toString() })}
                    >
                      {getZoneName(z)}
                      {hasGuidesInZone && (
                        <div className={`absolute -top-1 -right-1 h-3 w-3 rounded-full border-2 border-white ${isSelected ? 'bg-white' : 'bg-secondary'}`} />
                      )}
                    </Button>
                  );
                })}
              </div>
            </div>

            {/* Habit Selection (Dropdown) */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Step 2: Select Habit</Label>
              <Select
                value={newGuide.habitCode}
                onValueChange={(v) => setNewGuide({ ...newGuide, habitCode: v as HabitCode })}
              >
                <SelectTrigger className="h-11 border-border/60">
                  <SelectValue placeholder="Which habit is this for?" />
                </SelectTrigger>
                <SelectContent>
                  {HABIT_CODES.map((code) => {
                    const hasGuideForThisHabitInZone = habitGuides?.some(
                      g => g.habitCode === code && g.zone === Number(newGuide.zone)
                    );
                    return (
                      <SelectItem key={code} value={code} className="py-2">
                        <div className="flex items-center gap-2">
                          {code}
                          {hasGuideForThisHabitInZone && (
                            <span className="text-[10px] bg-secondary/10 text-secondary px-1.5 py-0.5 rounded-full font-medium">
                              Already Saved
                            </span>
                          )}
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Content Textarea */}
            <div className="space-y-3">
              <Label className="text-sm font-semibold">Step 3: Instructions Content</Label>
              <div className="relative">
                <Textarea
                  rows={8}
                  placeholder="Enter detailed, step-by-step instructions for the patient..."
                  className="resize-none border-border/60 focus:border-secondary/50 focus:ring-secondary/20 rounded-xl"
                  value={newGuide.content}
                  onChange={(e) => setNewGuide({ ...newGuide, content: e.target.value })}
                  maxLength={2000}
                />
                <div className="absolute bottom-3 right-3 text-[10px] font-medium text-muted-foreground bg-white/80 px-2 py-1 rounded-md backdrop-blur-sm">
                  {newGuide?.content?.length} / 2000
                </div>
              </div>
            </div>

            <Button
              variant="secondary"
              className="w-full h-12 text-sm font-bold shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
              onClick={handleAssignGuide}
              disabled={isSubmittingGuide}
            >
              {isSubmittingGuide ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <CheckCircle className="mr-2 h-4 w-4" />
              )}
              {habitGuides?.some(g => g.habitCode === newGuide.habitCode && g.zone === Number(newGuide.zone))
                ? "Update Existing Guide"
                : "Save New Guide"}
            </Button>
          </CardContent>
        </Card>

        {/* LIST SIDE */}
        <Card className="card-elevated flex flex-col h-[650px]">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-bold flex items-center justify-between">
              Saved Guides Library
              <div className="text-[10px] text-muted-foreground bg-muted px-2 py-1 rounded-md">
                {habitGuides?.length} active guides
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto pr-2 custom-scrollbar space-y-3 pb-6">
            {isLoadingGuides ? (
              <div className="flex flex-col items-center justify-center py-24 gap-3 text-muted-foreground">
                <Loader2 className="h-8 w-8 animate-spin text-secondary" />
                <p className="text-sm animate-pulse">Fetching your guides...</p>
              </div>
            ) : habitGuides?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-32 text-center space-y-4">
                <div className="bg-muted p-6 rounded-full">
                  <BookOpen className="h-10 w-10 text-muted-foreground/40" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">No guides yet</p>
                  <p className="text-xs text-muted-foreground max-w-[200px] mx-auto">
                    Start by filling out the form to create your first personalised instructions.
                  </p>
                </div>
              </div>
            ) : (
              habitGuides ?
                .sort((a, b) => a.zone - b.zone)
                  .map((guide) => (
                    <div
                      key={guide._id}
                      className="group relative flex flex-col gap-3 rounded-2xl border border-border/60 bg-white p-4 transition-all hover:border-secondary/40 hover:shadow-md"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="bg-secondary text-primary-foreground text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-wider">
                            {getZoneName(guide.zone)}
                          </div>
                          <h4 className="font-bold text-sm text-foreground">
                            {guide.habitCode}
                          </h4>
                        </div>
                        <div className="flex gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full hover:bg-secondary/10 hover:text-secondary"
                            onClick={() => {
                              setNewGuide({
                                habitCode: guide.habitCode,
                                zone: guide.zone.toString(),
                                content: guide.content
                              });
                              window.scrollTo({ top: document.getElementById('guide-form')?.offsetTop || 0, behavior: 'smooth' });
                            }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 rounded-full hover:bg-destructive/10 hover:text-destructive"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="rounded-2xl border-none shadow-2xl">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-xl">Delete this guide?</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                  This will permanently remove the <strong>{guide.habitCode}</strong> instructions for <strong>Zone {guide.zone}</strong>. This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="pt-4">
                                <AlertDialogCancel className="rounded-xl border-border">Keep it</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDeleteGuide(guide._id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90 rounded-xl"
                                >
                                  Yes, Delete Guide
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                      <div className="relative">
                        <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 bg-muted/30 p-2.5 rounded-xl border border-transparent group-hover:border-border/40 min-h-[60px]">
                          {guide.content}
                        </p>
                      </div>
                    </div>
                  ))
            )}
          </CardContent>
        </Card>
      </div>

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
