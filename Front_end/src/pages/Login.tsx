import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Activity } from "lucide-react";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");

  const handleUserLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!userEmail || !userPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    // Store user session
    localStorage.setItem(
      "userSession",
      JSON.stringify({ email: userEmail, type: "user" })
    );
    toast({
      title: "Welcome!",
      description: "Login successful",
    });
    navigate("/dashboard");
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminEmail || !adminPassword) {
      toast({
        title: "Error",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }
    // Store admin session
    localStorage.setItem(
      "userSession",
      JSON.stringify({ email: adminEmail, type: "admin" })
    );
    toast({
      title: "Welcome Doctor!",
      description: "Admin login successful",
    });
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-gradient-orange-subtle flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md animate-scale-in">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <img
              src="/logo.png"
              alt="Horizon Fit Logo"
              className="h-16 w-auto md:h-18"
            />
          </div>
        </div>

        <Tabs defaultValue="user" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="user">User Login</TabsTrigger>
            <TabsTrigger value="admin">Admin Login</TabsTrigger>
          </TabsList>

          <TabsContent value="user" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>User Login</CardTitle>
                <CardDescription>
                  Sign in to access your personalized diet plan
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleUserLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="user-email"
                      className="block text-sm font-medium mb-2"
                    >
                      Email
                    </label>
                    <Input
                      id="user-email"
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="user-password"
                      className="block text-sm font-medium mb-2"
                    >
                      Password
                    </label>
                    <Input
                      id="user-password"
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-orange text-white hover:opacity-90 transition-smooth"
                  >
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="admin" className="animate-fade-in">
            <Card>
              <CardHeader>
                <CardTitle>Admin Login</CardTitle>
                <CardDescription>
                  Sign in to manage user diet plans
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleAdminLogin} className="space-y-4">
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-sm font-medium mb-2"
                    >
                      Email
                    </label>
                    <Input
                      id="admin-email"
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@horizonfit.com"
                      required
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="admin-password"
                      className="block text-sm font-medium mb-2"
                    >
                      Password
                    </label>
                    <Input
                      id="admin-password"
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-orange text-white hover:opacity-90 transition-smooth"
                  >
                    Admin Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="text-center mt-6">
          <Button variant="ghost" onClick={() => navigate("/")}>
            Back to Home
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Login;
