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
import api from "@/api/axios";

const Login = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userEmail, setUserEmail] = useState("");
  const [userPassword, setUserPassword] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  console.log("API URL:", api.defaults.baseURL);

  // ---------------------- USER (Patient) Login ----------------------
  // const handleUserLogin = async (e) => {
  //   e.preventDefault();

  //   try {
  //     const res = await api.post("/auth/login", {
  //       email: userEmail,
  //       password: userPassword,
  //     });

  //     if (res.data?.role !== "Patient") {
  //       toast({
  //         title: "Access Denied",
  //         description: "This account is not a Patient account.",
  //         variant: "destructive",
  //       });
  //       return;
  //     }

  //     // 🔥 Save access token + session
  //     localStorage.setItem("accessToken", res.data.accessToken);
  //     localStorage.setItem(
  //       "userSession",
  //       JSON.stringify({
  //         email: res.data.email,
  //         type: "patient",
  //       })
  //     );

  //     api.defaults.headers.common["Authorization"] =
  //       "Bearer " + res.data.accessToken;

  //     navigate("/dashboard");
  //     setTimeout(() => {
  //       toast({
  //         title: "Welcome!",
  //         description: "Patient login successful",
  //       });
  //     }, 100);
  //   } catch (error) {
  //     toast({
  //       title: "Login Failed",
  //       description: error?.response?.data?.message || "Something went wrong",
  //       variant: "destructive",
  //     });
  //   }
  // };
  const handleUserLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email: userEmail,
        password: userPassword,
      });

      console.log("USER LOGIN RESPONSE:", res.data);

      // Check for correct role
      if (res.data?.role !== "Patient") {
        toast({
          title: "Access Denied",
          description: "This account is not a Patient account.",
          variant: "destructive",
        });
        return;
      }

      if (!res.data.accessToken) {
        console.log("❌ No accessToken received");
        toast({
          title: "Token Missing",
          description: "Backend did not return an access token.",
          variant: "destructive",
        });
        return;
      }

      // Save session
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          email: res.data.email,
          type: "patient",
        })
      );

      console.log("➡ Redirecting to patient dashboard...");
      localStorage.setItem("userId", res.data._id); // <-- REQUIRED
      localStorage.setItem("role", res.data.role); // OPTIONAL but useful
      api.defaults.headers.common["Authorization"] =
        "Bearer " + res.data.accessToken;

      navigate("/dashboard");

      setTimeout(() => {
        toast({
          title: "Welcome!",
          description: "Patient login successful.",
        });
      }, 150);
    } catch (error) {
      console.log("USER LOGIN ERROR:", error);

      toast({
        title: "Login Failed",
        description: error?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
  };

  // ---------------------- ADMIN (Doctor) Login ----------------------
  const handleAdminLogin = async (e) => {
    e.preventDefault();

    try {
      const res = await api.post("/auth/login", {
        email: adminEmail,
        password: adminPassword,
      });

      console.log("LOGIN SUCCESS RESPONSE:", res.data);

      if (res.data?.role !== "Doctor") {
        toast({
          title: "Access Denied",
          description: "This is not a Doctor/Admin account.",
          variant: "destructive",
        });
        return;
      }

      if (!res.data.accessToken) {
        console.log("❌ No accessToken received from backend");
        toast({
          title: "Token Missing",
          description: "Backend did not return an access token.",
          variant: "destructive",
        });
        return;
      }

      // 🔥 Save access token + session
      localStorage.setItem("accessToken", res.data.accessToken);
      localStorage.setItem(
        "userSession",
        JSON.stringify({
          email: res.data.email,
          type: "admin",
        })
      );

      console.log("Navigating to /admin ...");
      localStorage.setItem("userId", res.data._id); // <-- REQUIRED
      localStorage.setItem("role", res.data.role); // OPTIONAL
      api.defaults.headers.common["Authorization"] =
        "Bearer " + res.data.accessToken;

      navigate("/admin");

      setTimeout(() => {
        toast({
          title: "Welcome Doctor!",
          description: "Admin login successful",
        });
      }, 150);
    } catch (error) {
      console.log("LOGIN ERROR:", error);

      toast({
        title: "Login Failed",
        description: error?.response?.data?.message || "Something went wrong",
        variant: "destructive",
      });
    }
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

          {/* ---------------- USER LOGIN ---------------- */}
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
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      placeholder="your.email@example.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={userPassword}
                      onChange={(e) => setUserPassword(e.target.value)}
                      placeholder="Enter your password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-orange text-white"
                  >
                    Sign In
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ---------------- ADMIN LOGIN ---------------- */}
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
                    <label className="block text-sm font-medium mb-2">
                      Email
                    </label>
                    <Input
                      type="email"
                      value={adminEmail}
                      onChange={(e) => setAdminEmail(e.target.value)}
                      placeholder="admin@horizonfit.com"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Password
                    </label>
                    <Input
                      type="password"
                      value={adminPassword}
                      onChange={(e) => setAdminPassword(e.target.value)}
                      placeholder="Enter admin password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full gradient-orange text-white"
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
