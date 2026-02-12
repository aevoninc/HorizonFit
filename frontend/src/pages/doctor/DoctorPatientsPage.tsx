import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, Plus, User, TrendingUp, Filter, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { Link } from 'react-router-dom';
import { doctorApi, Patient } from '@/lib/api';

export const DoctorPatientsPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newPatient, setNewPatient] = useState({ 
    name: '', 
    email: '', 
    mobileNumber: '', 
    assignedCategory: '', // Now used for the dropdown
    password: '', 
    confirmPassword: '',
    assignFixedMatrix: false 
  });
  const [patients, setPatients] = useState<Patient[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch patients on mount
  useEffect(() => {
    fetchPatients();
  }, []);

  const fetchPatients = async () => {
    try {
      setIsLoading(true);
      const response = await doctorApi.getPatients();
      console.log('Fetched patients:', response.data.patients);
      setPatients(response.data.patients);
    } catch (error) {
      console.error('Failed to fetch patients:', error);
      toast({
        title: 'Error',
        description: 'Failed to load patients. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

const filteredPatients = (patients ?? []).filter(
  (patient) =>
    patient.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    patient.email.toLowerCase().includes(searchQuery.toLowerCase())
);

const handleAddPatient = async () => {
    // Basic Validations
    if (!newPatient.name || !newPatient.email || !newPatient.assignedCategory || !newPatient.password) {
      toast({ title: 'Validation Error', description: 'Please fill all required fields.', variant: 'destructive' });
      return;
    }
    if (newPatient.password !== newPatient.confirmPassword) {
      toast({ title: 'Password Mismatch', description: 'Passwords do not match.', variant: 'destructive' });
      return;
    }

    try {
      setIsSubmitting(true);
      const response = await doctorApi.createPatient({
        name: newPatient.name.trim(),
        email: newPatient.email.trim(),
        mobileNumber: newPatient.mobileNumber.trim(),
        assignedCategory: newPatient.assignedCategory,
        password: newPatient.password,
        assignFixedMatrix: newPatient.assignFixedMatrix,
      });

      // KEY FIX: Extract the patient object from the response
      const createdPatient = response.data.patient;

      if (createdPatient) {
        setPatients((prev) => [...prev, createdPatient]);
        toast({ title: 'Success', description: 'Patient created successfully.' });
        setIsAddDialogOpen(false);
        setNewPatient({ 
          name: '', email: '', mobileNumber: '', assignedCategory: '', 
          password: '', confirmPassword: '', assignFixedMatrix: false 
        });
      }
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to add patient.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const avgProgress = patients.length > 0
    ? Math.round(patients.reduce((acc, p) => acc + p.progress, 0) / patients.length)
    : 0;

  const zone5Completions = patients.filter((p) => p.zone === 5 && p.progress === 100).length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-8"
    >
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Manage Patients</h1>
          <p className="mt-1 text-muted-foreground">View and manage all enrolled patients</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="teal" size="lg">
              <Plus className="mr-2 h-4 w-4" />
              Add Patient
            </Button>
          </DialogTrigger>
<DialogContent className="sm:max-w-2lg">
  <DialogHeader>
    <DialogTitle>Add New Patient</DialogTitle>
  </DialogHeader>
  <div className="space-y-4 pt-4">
    {/* Full Name */}
    <div className="space-y-2">
      <Label htmlFor="patientName">Full Name <span className="text-destructive">*</span></Label>
      <Input
        id="patientName"
        placeholder="Enter patient name"
        value={newPatient.name}
        onChange={(e) => setNewPatient({ ...newPatient, name: e.target.value })}
      />
    </div>

    {/* Email */}
    <div className="space-y-2">
      <Label htmlFor="patientEmail">Email Address <span className="text-destructive">*</span></Label>
      <Input
        id="patientEmail"
        type="email"
        placeholder="patient@example.com"
        value={newPatient.email}
        onChange={(e) => setNewPatient({ ...newPatient, email: e.target.value })}
      />
    </div>

    {/* Phone Number */}
    <div className="space-y-2">
      <Label htmlFor="patientNumber">Phone Number <span className="text-destructive">*</span></Label>
      <Input
        id="patientNumber"
        type="tel"
        placeholder="Enter phone number"
        value={newPatient.mobileNumber}
        onChange={(e) => setNewPatient({ ...newPatient, mobileNumber: e.target.value })}
      />
    </div>

    {/* Assigned Category - Fixed Dropdown */}
    <div className="space-y-2">
      <Label>Assigned Category <span className="text-destructive">*</span></Label>
      <Select 
        value={newPatient.assignedCategory} 
        onValueChange={(value) => setNewPatient({ ...newPatient, assignedCategory: value })}
      >
        <SelectTrigger>
          <SelectValue placeholder="Select a health program" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="Weight Loss">Weight Loss</SelectItem>
          <SelectItem value="Diabetes Management">Diabetes Management</SelectItem>
          <SelectItem value="General Wellness">General Wellness</SelectItem>
          <SelectItem value="Cardiac Care">Cardiac Care</SelectItem>
          <SelectItem value="Physiotherapy">Physiotherapy</SelectItem>
        </SelectContent>
      </Select>
    </div>

    {/* Password */}
    <div className="space-y-2">
      <Label htmlFor="password">Login Password <span className="text-destructive">*</span></Label>
      <Input
        id="password"
        type="password"
        placeholder="Create password"
        value={newPatient.password}
        onChange={(e) => setNewPatient({ ...newPatient, password: e.target.value })}
      />
    </div>

    {/* Confirm Password */}
    <div className="space-y-2">
  <Label htmlFor="confirmPassword">Confirm Password <span className="text-destructive">*</span></Label>
  <Input
    id="confirmPassword"
    type="password"
    placeholder="Repeat password"
    value={newPatient.confirmPassword}
    onChange={(e) => setNewPatient({ ...newPatient, confirmPassword: e.target.value })}
  />
  {/* Real-time visual feedback (Optional) */}
  {newPatient.confirmPassword && newPatient.password !== newPatient.confirmPassword && (
    <p className="text-xs text-destructive">Passwords do not match</p>
  )}
    </div>
    {/* Matrix Checkbox */}
    <div className="flex items-center space-x-2">
      <Checkbox
        id="assignMatrix"
        checked={newPatient.assignFixedMatrix}
        onCheckedChange={(checked) =>
          setNewPatient({ ...newPatient, assignFixedMatrix: checked as boolean })
        }
      />
      <Label htmlFor="assignMatrix" className="text-sm">
        Assign fixed task matrix
      </Label>
    </div>

<Button 
  variant="teal" 
  className="w-full" 
  onClick={handleAddPatient}
  disabled={
    isSubmitting || 
    !newPatient.password || 
    newPatient.password !== newPatient.confirmPassword
  }
>
  {isSubmitting ? 'Adding...' : 'Add Patient'}
</Button>
  </div>
</DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Patients</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{patients.length}</div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-secondary">{patients.filter((p) => p.status === 'active').length}</div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg. Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{avgProgress}%</div>
          </CardContent>
        </Card>
        <Card className="card-elevated">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Zone 5 Completions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-foreground">{zone5Completions}</div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex flex-col gap-4 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search patients..."
            className="pl-10"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Button variant="outline">
          <Filter className="mr-2 h-4 w-4" />
          Filter
        </Button>
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
                key={patient._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link to={`/doctor/patients/${patient._id}`}>
                  <Card className="card-elevated cursor-pointer transition-all duration-200 hover:-translate-y-1 hover:shadow-lg">
                    <CardContent className="p-6">
                      <div className="mb-4 flex items-start justify-between">
                        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                          <User className="h-6 w-6 text-secondary" />
                        </div>
                        <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                          Zone {patient.zone}
                        </span>
                      </div>
                      <h3 className="mb-1 text-lg font-semibold text-foreground">{patient.name}</h3>
                      <p className="mb-4 text-sm text-muted-foreground">{patient.email}</p>
                      <p className="mb-4 text-sm text-muted-foreground">Started: {new Date(patient.programStartDate).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })}</p>
                      <p className="mb-4 text-sm text-muted-foreground">{patient.assignedCategory}</p>
                      
                      <div className="space-y-2">
                        {/* <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">Progress</span>
                          <span className="font-semibold text-foreground">{patient.progress}%</span>
                        </div> */}
                        <div className="h-2 overflow-hidden rounded-full bg-muted">
                          <div
                            className="h-full rounded-full gradient-phoenix transition-all duration-500"
                            style={{ width: `${patient.progress}%` }}
                          />
                        </div>
                      </div>
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
              <p className="text-lg text-muted-foreground">No patients found</p>
            </div>
          )}
        </>
      )}
    </motion.div>
  );
};
