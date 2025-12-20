import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Edit,
  Trash2,
  Save,
  Loader2,
  ChevronLeft,
  Grid3X3,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
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
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { doctorApi } from "@/lib/api";
import {
  ProgramTemplate,
  TemplateListItem,
  GridTask,
  WEEKS,
  ZONES,
} from "@/lib/templateTypes";
import { WeeklyAllocationGrid } from "./WeeklyAllocationGrid";

export const ProgramTemplatesPage: React.FC = () => {
  const { toast } = useToast();
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingTemplate, setEditingTemplate] =
    useState<ProgramTemplate | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newTemplateName, setNewTemplateName] = useState("");
  const [newTemplateDescription, setNewTemplateDescription] = useState("");
  const [newTemplateCategory, setNewTemplateCategory] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Grid filter state
  const [selectedWeek, setSelectedWeek] = useState<number>(1);
  const [selectedZone, setSelectedZone] = useState<number>(1);

  // Grid tasks state
  const [gridTasks, setGridTasks] = useState<GridTask[]>([]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const fetchTemplates = async () => {
    try {
      const data = await doctorApi.getTemplates();
      console.log(data);
      setTemplates(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch templates",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateTemplate = async () => {
    if (!newTemplateName.trim() || !newTemplateCategory) {
      toast({
        title: "Error",
        description: "Please enter a name and select a category",
        variant: "destructive",
      });
      return;
    }
    if (!newTemplateName.trim()) {
      toast({
        title: "Error",
        description: "Please enter a template name",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const newTemplate = await doctorApi.createTemplate({
        name: newTemplateName,
        category: newTemplateCategory, // This maps to metricType in your backend
        tasks: [], // Match backend field name
      });
      setTemplates([...templates, newTemplate]);
      setIsCreateDialogOpen(false);
      setNewTemplateName("");
      setNewTemplateDescription("");
      setNewTemplateCategory("");
      toast({ title: "Success", description: "Template created successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create template",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditTemplate = async (templateId: string) => {
    try {
      const template = await doctorApi.getTemplate(templateId);
      setEditingTemplate(template);

const normalizedTemplate = {
      ...template,
      category: template.category || template.metricType,
      metricType: template.metricType || template.category
    };
    
    setEditingTemplate(normalizedTemplate);

    // ... existing mapping logic for gridTasks
    const backendTasks = template.tasks || [];
    const mappedTasks: GridTask[] = backendTasks.map((t: any) => ({
      id: t._id || crypto.randomUUID(),
      taskName: t.description,
      day: t.daysApplicable?.[0] || "Mon",
      timeSlot: t.timeOfDay,
      zone: t.zone,
      week: t.programWeek,
    }));

      setGridTasks(mappedTasks);
      setSelectedWeek(1);
      setSelectedZone(1);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load tasks",
        variant: "destructive",
      });
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    try {
      await doctorApi.deleteTemplate(templateId);
      setTemplates(templates.filter((t) => t.id !== templateId));
      toast({ title: "Success", description: "Template deleted successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete template",
        variant: "destructive",
      });
    }
  };

  const handleSaveTemplate = async () => {
    if (!editingTemplate) return;

    setIsSubmitting(true);
    try {
      const tasksForBackend = gridTasks.map((gt) => ({
        description: gt.taskName,
        programWeek: gt.week,
        zone: gt.zone,
        frequency: "SpecificDays",
        daysApplicable: [gt.day],
        timeOfDay: gt.timeSlot,
        // Ensure each task also has the metric required if your schema needs it
        metricRequired:
          editingTemplate.metricType || (editingTemplate as any).category,
      }));

      // LOG THIS to check your console before the API call
      console.log(
        "Saving with Category:",
        editingTemplate.metricType || (editingTemplate as any).category
      );

      await doctorApi.updateTemplate(editingTemplate._id, {
        name: editingTemplate.name,
        // CRITICAL: Make sure 'category' is explicitly passed here
        category:
          editingTemplate.metricType || (editingTemplate as any).category,
        tasks: tasksForBackend,
      });

      await fetchTemplates();
      setEditingTemplate(null);
      toast({ title: "Success", description: "Template updated successfully" });
    } catch (error) {
      toast({
        title: "Error",
        description: "Update failed",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddTask = (task: Omit<GridTask, "id">) => {
    const newTask: GridTask = {
      ...task,
      id: crypto.randomUUID(),
    };
    setGridTasks([...gridTasks, newTask]);
  };

  const handleDeleteTask = (taskId: string) => {
    setGridTasks(gridTasks.filter((t) => t.id !== taskId));
  };

  const getTaskCountForWeekZone = (week: number, zone: number) => {
    return gridTasks.filter((t) => t.week === week && t.zone === zone).length;
  };

  const getTotalTaskCount = () => {
    return gridTasks.length;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-secondary" />
      </div>
    );
  }

  // Editing view with Weekly Allocation Grid
  if (editingTemplate) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditingTemplate(null)}
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-foreground">
                {editingTemplate.name}
              </h1>
              <p className="text-muted-foreground">
                {editingTemplate.description}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-sm">
              {getTotalTaskCount()} total tasks
            </Badge>
            <Button
              variant="teal"
              onClick={handleSaveTemplate}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <Save className="mr-2 h-4 w-4" />
              )}
              Save Template
            </Button>
          </div>
        </div>

        {/* Week/Zone Filter */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Grid3X3 className="h-5 w-5 text-secondary" />
              Weekly Allocation Grid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">
                  Week:
                </Label>
                <Select
                  value={selectedWeek.toString()}
                  onValueChange={(v) => setSelectedWeek(parseInt(v))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {WEEKS.map((week) => (
                      <SelectItem key={week} value={week.toString()}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span>Week {week}</span>
                          {getTaskCountForWeekZone(week, selectedZone) > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {getTaskCountForWeekZone(week, selectedZone)}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-3">
                <Label className="text-sm font-medium whitespace-nowrap">
                  Zone:
                </Label>
                <Select
                  value={selectedZone.toString()}
                  onValueChange={(v) => setSelectedZone(parseInt(v))}
                >
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ZONES.map((zone) => (
                      <SelectItem key={zone} value={zone.toString()}>
                        <div className="flex items-center justify-between w-full gap-3">
                          <span>Zone {zone}</span>
                          {getTaskCountForWeekZone(selectedWeek, zone) > 0 && (
                            <Badge variant="outline" className="text-xs">
                              {getTaskCountForWeekZone(selectedWeek, zone)}
                            </Badge>
                          )}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1" />
              <Badge variant="secondary" className="self-center">
                {getTaskCountForWeekZone(selectedWeek, selectedZone)} tasks in
                Week {selectedWeek}, Zone {selectedZone}
              </Badge>
            </div>

            {/* Weekly Allocation Grid */}
            <WeeklyAllocationGrid
              tasks={gridTasks}
              week={selectedWeek}
              zone={selectedZone}
              onAddTask={handleAddTask}
              onDeleteTask={handleDeleteTask}
            />
          </CardContent>
        </Card>

        {/* Quick Overview */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">Quick Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {WEEKS.map((week) => (
                <div key={week} className="space-y-2">
                  <div className="text-sm font-medium text-muted-foreground">
                    Week {week}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {ZONES.map((zone) => {
                      const count = getTaskCountForWeekZone(week, zone);
                      return (
                        <button
                          key={zone}
                          onClick={() => {
                            setSelectedWeek(week);
                            setSelectedZone(zone);
                          }}
                          className={`px-2 py-1 text-xs rounded transition-all ${
                            selectedWeek === week && selectedZone === zone
                              ? "bg-secondary text-secondary-foreground"
                              : count > 0
                              ? "bg-secondary/20 text-secondary hover:bg-secondary/30"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          Z{zone}: {count}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </motion.div>
    );
  }

  // List view
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Program Templates
          </h1>
          <p className="text-muted-foreground">
            Create and manage program templates with weekly task allocation
          </p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="teal">
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  placeholder="e.g., Weight Loss Program"
                  value={newTemplateName}
                  onChange={(e) => setNewTemplateName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Textarea
                  placeholder="Describe the program..."
                  value={newTemplateDescription}
                  onChange={(e) => setNewTemplateDescription(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Category</Label>
                <Select
                  value={newTemplateCategory}
                  onValueChange={setNewTemplateCategory}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select Metric Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Weight Loss">Weight Loss</SelectItem>
                    <SelectItem value="Weight Gain">Weight Gain</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <Button
                variant="teal"
                onClick={handleCreateTemplate}
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Create Template
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Templates Grid */}
      {templates.length === 0 ? (
        <Card className="py-12">
          <CardContent className="flex flex-col items-center justify-center text-center">
            <Grid3X3 className="h-12 w-12 text-muted-foreground/50 mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No templates yet
            </h3>
            <p className="text-muted-foreground mb-4">
              Create your first program template to get started
            </p>
            <Button variant="teal" onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {templates.map((template) => (
            <Card
              key={template._id}
              className="group hover:border-secondary/50 transition-colors"
            >
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    {template.category && (
                      <Badge variant="outline" className="mt-1">
                        {template.category}
                      </Badge>
                    )}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTemplate(template._id)}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Delete Template</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to delete "{template.name}"?
                            This action cannot be undone.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            onClick={() => handleDeleteTemplate(template._id)}
                            className="bg-destructive hover:bg-destructive/90"
                          >
                            Delete
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {template.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {template.description}
                  </p>
                )}
                <Button
                  variant="outline"
                  className="w-full"
                  onClick={() => handleEditTemplate(template._id)}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Template
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </motion.div>
  );
};
