import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Activity, Calendar, LineChart, Menu, X } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.message) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    toast({
      title: "Success!",
      description: "We'll get back to you soon.",
    });
    setFormData({ name: "", email: "", phone: "", message: "" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 w-full bg-background/95 backdrop-blur-sm border-b border-border z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Activity className="h-8 w-8 text-primary" />
              <div>
                <h1 className="text-2xl font-bold text-gradient">Horizon Fit</h1>
                <p className="text-xs text-muted-foreground">Live Fit, Dream Big, Go Beyond</p>
              </div>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-6">
              <a href="#home" className="text-foreground hover:text-primary transition-smooth">
                Home
              </a>
              <a href="#about" className="text-foreground hover:text-primary transition-smooth">
                About
              </a>
              <a href="#programs" className="text-foreground hover:text-primary transition-smooth">
                Programs
              </a>
              <a href="#contact" className="text-foreground hover:text-primary transition-smooth">
                Contact
              </a>
              <Button
                variant="outline"
                onClick={() => navigate("/login")}
                className="transition-smooth hover:border-primary"
              >
                Login
              </Button>
            </nav>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <nav className="md:hidden mt-4 pb-4 flex flex-col gap-4 animate-fade-in">
              <a
                href="#home"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setMobileMenuOpen(false)}
              >
                Home
              </a>
              <a
                href="#about"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setMobileMenuOpen(false)}
              >
                About
              </a>
              <a
                href="#programs"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setMobileMenuOpen(false)}
              >
                Programs
              </a>
              <a
                href="#contact"
                className="text-foreground hover:text-primary transition-smooth"
                onClick={() => setMobileMenuOpen(false)}
              >
                Contact
              </a>
              <Button variant="outline" onClick={() => navigate("/login")}>
                Login
              </Button>
            </nav>
          )}
        </div>
      </header>

      {/* Hero Section */}
      <section id="home" className="pt-24 pb-20 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in-up">
              Transform Your <span className="text-gradient">Fitness Journey</span>
            </h2>
            <p className="text-xl text-muted-foreground mb-8 animate-fade-in delay-100">
              Personalized diet plans, expert consultations, and progress tracking to help you achieve your fitness goals
            </p>
            <Button
              size="lg"
              className="gradient-orange text-white hover:opacity-90 transition-smooth animate-scale-in text-lg px-8 py-6"
              onClick={() => {
                document.getElementById("contact")?.scrollIntoView({ behavior: "smooth" });
              }}
            >
              Book Appointment
            </Button>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="programs" className="py-20 px-4 bg-gradient-orange-subtle">
        <div className="container mx-auto">
          <h3 className="text-4xl font-bold text-center mb-12 animate-fade-in">
            Our <span className="text-gradient">Programs</span>
          </h3>
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-smooth hover:scale-105 animate-slide-up">
              <div className="bg-gradient-orange w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Activity className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Online Consultation</h4>
              <p className="text-muted-foreground">
                Get personalized advice from expert nutritionists and fitness coaches from the comfort of your home
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-smooth hover:scale-105 animate-slide-up" style={{ animationDelay: "0.1s" }}>
              <div className="bg-gradient-orange w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <Calendar className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Personalized Diet Plan</h4>
              <p className="text-muted-foreground">
                Custom 3-week meal plans tailored to your goals, whether it's weight loss or muscle gain
              </p>
            </div>

            <div className="bg-card p-8 rounded-lg border border-border hover:border-primary transition-smooth hover:scale-105 animate-slide-up" style={{ animationDelay: "0.2s" }}>
              <div className="bg-gradient-orange w-16 h-16 rounded-full flex items-center justify-center mb-6">
                <LineChart className="h-8 w-8 text-white" />
              </div>
              <h4 className="text-2xl font-bold mb-4">Progress Tracking</h4>
              <p className="text-muted-foreground">
                Monitor your journey with detailed analytics and regular check-ins with your coach
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section id="about" className="py-20 px-4">
        <div className="container mx-auto max-w-4xl text-center">
          <h3 className="text-4xl font-bold mb-6 animate-fade-in">
            About <span className="text-gradient">Horizon Fit</span>
          </h3>
          <p className="text-lg text-muted-foreground mb-6 animate-fade-in">
            At Horizon Fit, we believe that fitness is not just about physical transformation—it's about building a lifestyle that empowers you to dream big and go beyond your limits.
          </p>
          <p className="text-lg text-muted-foreground animate-fade-in">
            Our team of certified nutritionists and fitness experts work together to create personalized plans that fit your unique needs, goals, and lifestyle.
          </p>
        </div>
      </section>

      {/* Contact Form Section */}
      <section id="contact" className="py-20 px-4 bg-gradient-orange-subtle">
        <div className="container mx-auto max-w-2xl">
          <h3 className="text-4xl font-bold text-center mb-12 animate-fade-in">
            Get <span className="text-gradient">Started Today</span>
          </h3>
          <form onSubmit={handleSubmit} className="bg-card p-8 rounded-lg border border-border animate-scale-in">
            <div className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium mb-2">
                  Name *
                </label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your full name"
                  required
                />
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium mb-2">
                  Email *
                </label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="your.email@example.com"
                  required
                />
              </div>

              <div>
                <label htmlFor="phone" className="block text-sm font-medium mb-2">
                  Phone Number
                </label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="Your phone number"
                />
              </div>

              <div>
                <label htmlFor="message" className="block text-sm font-medium mb-2">
                  Message *
                </label>
                <Textarea
                  id="message"
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Tell us about your fitness goals..."
                  rows={5}
                  required
                />
              </div>

              <Button
                type="submit"
                className="w-full gradient-orange text-white hover:opacity-90 transition-smooth"
                size="lg"
              >
                Submit Inquiry
              </Button>
            </div>
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border py-12 px-4">
        <div className="container mx-auto text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Activity className="h-6 w-6 text-primary" />
            <h1 className="text-xl font-bold text-gradient">Horizon Fit</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-6">Live Fit, Dream Big, Go Beyond</p>
          <p className="text-sm text-muted-foreground">
            © 2024 Horizon Fit. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
