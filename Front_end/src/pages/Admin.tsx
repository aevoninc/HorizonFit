import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { LogOut, Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import api from "../api/axios";
import { Label } from "recharts";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@radix-ui/react-select";

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [adminEmail, setAdminEmail] = useState("");
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [openIndex, setOpenIndex] = useState(null);
  const [progress, setProgress] = useState(null);
  const [loadingProgress, setLoadingProgress] = useState(false);
  const [patientData, setPatientData] = useState({
    name: "",
    age: "",
    gender: "",
    email: "",
    weight: "",
    height: "",
    dietPlanWeeks: "",
  });
  // const toggle = (index: number) => {
  //   setOpenIndex(openIndex === index ? null : index);
  // };
  const toggle = (index: number, patientId: string) => {
    if (openIndex === index) {
      setOpenIndex(null);
      return;
    }

    setOpenIndex(index);
    fetchPatientProgress(patientId);
  };

  const fetchPatientProgress = async (patientId) => {
    try {
      setLoadingProgress(true);

      const token = localStorage.getItem("accessToken");

      const res = await api.get(`/doctor/patient-progress/${patientId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      setProgress(res.data);
    } catch (err) {
      console.error("Progress fetch error:", err);
      toast({
        title: "Error",
        description: "Unable to load patient progress",
        variant: "destructive",
      });
    } finally {
      setLoadingProgress(false);
    }
  };

  useEffect(() => {
    const sessionStr = localStorage.getItem("userSession");
    const token = localStorage.getItem("accessToken");

    if (!sessionStr || !token) {
      navigate("/login");
      return;
    }

    const session = JSON.parse(sessionStr);

    if (session.type !== "admin" && session.type !== "doctor") {
      navigate("/login");
      return;
    }

    setAdminEmail(session.email);

    const fetchPatients = async () => {
      try {
        const res = await api.get("/doctor/patients");
        setPatients(res.data.patients || []);
      } catch (err) {
        console.error(err);
        toast({
          title: "Error fetching patients",
          description: "Please try again or re-login.",
          variant: "destructive",
        });
      } finally {
        setLoading(false); // 🔥 Fix 1: ensure loading stops
      }
    };

    fetchPatients();
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    localStorage.removeItem("accessToken");

    toast({ title: "Logged out" });
    navigate("/");
  };
  const handleChange = (e) => {
    setPatientData({ ...patientData, [e.target.name]: e.target.value });
  };

  const handleCreatePatient = async (e) => {
    e.preventDefault();

    try {
      const token = localStorage.getItem("accessToken");

      const res = await api.post("/patients", patientData, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      toast({
        title: "Patient Added",
        description: "New patient has been created successfully!",
      });

      console.log("CREATED PATIENT:", res.data);
    } catch (error) {
      toast({
        title: "Error",
        description:
          error.response?.data?.message || "Failed to create patient",
        variant: "destructive",
      });
    }
  };
  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex justify-between">
          <img src="/logo.png" className="h-14" />
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground">{adminEmail}</span>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <h2 className="text-3xl font-bold mb-2">
          Patient <span className="text-gradient">Management</span>
        </h2>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Dummy UI Left (Add Patient Disabled for Now) */}
          <Card className="max-w-xl">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Plus className="h-5 w-5" /> Add New Patient
              </CardTitle>
              <CardDescription>
                Fill out the details to create a new patient.
              </CardDescription>
            </CardHeader>

            <CardContent>
              <form className="grid gap-4" onSubmit={handleCreatePatient}>
                {/* NAME */}
                <div className="grid gap-2">
                  <Label>Name</Label>
                  <Input
                    name="name"
                    placeholder="Enter patient name"
                    value={patientData.name}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* AGE */}
                <div className="grid gap-2">
                  <Label>Age</Label>
                  <Input
                    name="age"
                    type="number"
                    placeholder="Enter age"
                    value={patientData.age}
                    onChange={handleChange}
                    required
                  />
                </div>

    


                {/* EMAIL */}
                <div className="grid gap-2">
                  <Label>Email</Label>
                  <Input
                    name="email"
                    type="email"
                    placeholder="Enter email"
                    value={patientData.email}
                    onChange={handleChange}
                    required
                  />
                </div>

                {/* WEIGHT */}
                <div className="grid gap-2">
                  <Label>Weight (kg)</Label>
                  <Input
                    name="weight"
                    type="number"
                    placeholder="Enter weight"
                    value={patientData.weight}
                    onChange={handleChange}
                  />
                </div>

                {/* HEIGHT */}
                <div className="grid gap-2">
                  <Label>Height (cm)</Label>
                  <Input
                    name="height"
                    type="number"
                    placeholder="Enter height"
                    value={patientData.height}
                    onChange={handleChange}
                  />
                </div>

                {/* DIET PLAN WEEKS */}
                <div className="grid gap-2">
                  <Label>Diet Plan Weeks</Label>
                  <Input
                    name="dietPlanWeeks"
                    type="number"
                    placeholder="Enter number of weeks"
                    value={patientData.dietPlanWeeks}
                    onChange={handleChange}
                  />
                </div>

                {/* SUBMIT BUTTON */}
                <Button type="submit" className="w-full">
                  Create Patient
                </Button>
              </form>
            </CardContent>
          </Card>

          {/* Patient List */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Active Patients ({patients.length})
                </CardTitle>
              </CardHeader>
            </Card>

            {loading ? (
              <p className="text-center text-muted-foreground">Loading...</p>
            ) : patients.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <Users className="h-12 w-12 mx-auto text-muted-foreground" />
                  <p>No patients found</p>
                </CardContent>
              </Card>
            ) : (
              patients.map((p, index) => (
                <div
                  key={p._id}
                  className="border rounded-lg shadow-sm bg-white"
                >
                  <button
                    onClick={() => toggle(index, p._id)}
                    className="w-full flex items-center justify-between p-4"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src="/default.png"
                        className="h-10 w-10 rounded-full border"
                      />
                      <span className="font-semibold">{p.name}</span>
                    </div>
                    <span className="text-xl">
                      {openIndex === index ? "−" : "+"}
                    </span>
                  </button>

                  {openIndex === index && (
                    <div className="px-4 pb-4 text-sm text-gray-700 space-y-2">
                      <p>
                        <strong>Email:</strong> {p.email}
                      </p>
                      <p>
                        <strong>Category:</strong>{" "}
                        {p.assignedCategory || "Not Assigned"}
                      </p>
                      <p>
                        <strong>Status:</strong>{" "}
                        {p.isActive ? "Active" : "Deactivated"}
                      </p>
                      <p>
                        <strong>Program Start:</strong>{" "}
                        {p.programStartDate
                          ? new Date(p.programStartDate).toDateString()
                          : "Not Started"}
                      </p>
                      {/* Patient Progress */}
                      <div className="mt-3 p-3 border rounded bg-gray-50">
                        <h4 className="font-semibold mb-2">Progress</h4>

                        {loadingProgress ? (
                          <p className="text-muted-foreground">
                            Loading progress...
                          </p>
                        ) : progress ? (
                          <div className="space-y-1">
                            <p>
                              <strong>Week:</strong> {progress.week}
                            </p>
                            <p>
                              <strong>Current Weight:</strong> {progress.weight}{" "}
                              kg
                            </p>
                            <p>
                              <strong>BMI:</strong> {progress.bmi}
                            </p>
                            <p>
                              <strong>Calories:</strong> {progress.calories}
                            </p>
                            <p>
                              <strong>Status:</strong> {progress.status}
                            </p>
                          </div>
                        ) : (
                          <p className="text-muted-foreground">
                            No progress data
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
