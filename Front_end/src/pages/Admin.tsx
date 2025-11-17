import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Activity, LogOut, Users, Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface User {
  email: string;
  name: string;
  dietType: "loss" | "gain";
  progress: string;
}

const Admin = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [adminEmail, setAdminEmail] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [newUserEmail, setNewUserEmail] = useState("");
  const [newUserName, setNewUserName] = useState("");
  const [newDietType, setNewDietType] = useState<"loss" | "gain">("loss");
  const [newProgress, setNewProgress] = useState("");

  useEffect(() => {
    const session = localStorage.getItem("userSession");
    if (!session) {
      navigate("/login");
      return;
    }
    const parsedSession = JSON.parse(session);
    if (parsedSession.type !== "admin") {
      navigate("/login");
      return;
    }
    setAdminEmail(parsedSession.email);

    // Load users from localStorage
    const savedUsers = localStorage.getItem("users");
    if (savedUsers) {
      setUsers(JSON.parse(savedUsers));
    } else {
      // Initialize with sample users
      const sampleUsers: User[] = [
        {
          email: "user1@example.com",
          name: "John Doe",
          dietType: "loss",
          progress: "Week 1: -2kg, following plan consistently",
        },
        {
          email: "user2@example.com",
          name: "Jane Smith",
          dietType: "gain",
          progress: "Week 1: +1.5kg, good muscle development",
        },
      ];
      setUsers(sampleUsers);
      localStorage.setItem("users", JSON.stringify(sampleUsers));
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem("userSession");
    toast({
      title: "Logged out",
      description: "Admin session ended",
    });
    navigate("/");
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUserEmail || !newUserName) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const newUser: User = {
      email: newUserEmail,
      name: newUserName,
      dietType: newDietType,
      progress: newProgress || "Just started",
    };

    const updatedUsers = [...users, newUser];
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));

    toast({
      title: "Success!",
      description: `User ${newUserName} added successfully`,
    });

    // Reset form
    setNewUserEmail("");
    setNewUserName("");
    setNewProgress("");
  };

  const handleUpdateProgress = (email: string, newProgressText: string) => {
    const updatedUsers = users.map((user) =>
      user.email === email ? { ...user, progress: newProgressText } : user
    );
    setUsers(updatedUsers);
    localStorage.setItem("users", JSON.stringify(updatedUsers));
    toast({
      title: "Updated!",
      description: "User progress updated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-6 w-6 text-primary" />
              <h1 className="text-xl font-bold text-gradient">Horizon Fit - Admin Panel</h1>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{adminEmail}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-3xl font-bold mb-2 animate-fade-in">
            User <span className="text-gradient">Management</span>
          </h2>
          <p className="text-muted-foreground mb-8 animate-fade-in">
            Manage diet plans and track user progress
          </p>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Add New User */}
            <Card className="animate-slide-up">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Add New User
                </CardTitle>
                <CardDescription>Create a diet plan for a new user</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAddUser} className="space-y-4">
                  <div>
                    <label htmlFor="userName" className="block text-sm font-medium mb-2">
                      Name
                    </label>
                    <Input
                      id="userName"
                      value={newUserName}
                      onChange={(e) => setNewUserName(e.target.value)}
                      placeholder="User's full name"
                      required
                    />
                  </div>

                  <div>
                    <label htmlFor="userEmail" className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      id="userEmail"
                      type="email"
                      value={newUserEmail}
                      onChange={(e) => setNewUserEmail(e.target.value)}
                      placeholder="user@example.com"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-2">Diet Plan Type</label>
                    <div className="flex gap-4">
                      <Button
                        type="button"
                        variant={newDietType === "loss" ? "default" : "outline"}
                        onClick={() => setNewDietType("loss")}
                        className={newDietType === "loss" ? "gradient-orange text-white" : ""}
                      >
                        Weight Loss
                      </Button>
                      <Button
                        type="button"
                        variant={newDietType === "gain" ? "default" : "outline"}
                        onClick={() => setNewDietType("gain")}
                        className={newDietType === "gain" ? "gradient-orange text-white" : ""}
                      >
                        Weight Gain
                      </Button>
                    </div>
                  </div>

                  <div>
                    <label htmlFor="progress" className="block text-sm font-medium mb-2">
                      Initial Notes
                    </label>
                    <Textarea
                      id="progress"
                      value={newProgress}
                      onChange={(e) => setNewProgress(e.target.value)}
                      placeholder="Add any initial notes or goals..."
                      rows={3}
                    />
                  </div>

                  <Button
                    type="submit"
                    className="w-full gradient-orange text-white hover:opacity-90 transition-smooth"
                  >
                    Add User
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* User List */}
            <div className="space-y-4 animate-slide-up">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Active Users ({users.length})
                  </CardTitle>
                  <CardDescription>View and manage user diet plans</CardDescription>
                </CardHeader>
              </Card>

              {users.map((user) => (
                <Card key={user.email} className="hover:border-primary transition-smooth">
                  <CardHeader>
                    <CardTitle className="text-lg">{user.name}</CardTitle>
                    <CardDescription>{user.email}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <span className="text-sm font-medium">Diet Plan: </span>
                      <span
                        className={`inline-flex px-2 py-1 rounded text-xs ${
                          user.dietType === "loss"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-green-100 text-green-800"
                        }`}
                      >
                        {user.dietType === "loss" ? "Weight Loss" : "Weight Gain"}
                      </span>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">Progress Notes</label>
                      <Textarea
                        value={user.progress}
                        onChange={(e) => handleUpdateProgress(user.email, e.target.value)}
                        rows={3}
                        placeholder="Track user progress..."
                      />
                    </div>
                  </CardContent>
                </Card>
              ))}

              {users.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <p className="text-muted-foreground">No users yet. Add your first user!</p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Admin;
