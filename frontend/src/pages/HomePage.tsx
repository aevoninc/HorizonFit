import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Calendar, Dumbbell, Users, ArrowRight, CheckCircle, Flame, Heart, Award, Stethoscope, ShieldCheck, UserCheck } from 'lucide-react';
import logo from "../../public/logo.png";

const features = [
  {
    icon: Dumbbell,
    title: 'Doctor-Personalized Program',
    description: 'A medically-supervised 15-week fitness journey designed specifically for your body and goals by certified specialists.',
  },
  {
    icon: Calendar,
    title: 'Personal Consultations',
    description: 'One-on-one sessions with certified fitness professionals to guide your transformation.',
  },
  {
    icon: Users,
    title: 'Expert Medical Guidance',
    description: 'Our doctors create customized workout plans based on your fitness level, health conditions, and goals.',
  },
];

const programSteps = [
  {
    zone: 1,
    title: "Foundation",
    description: "Build core strength and establish healthy habits",
  },
  {
    zone: 2,
    title: "Progression",
    description: "Increase intensity and expand your capabilities",
  },
  {
    zone: 3,
    title: "Endurance",
    description: "Push your limits and build lasting stamina",
  },
  {
    zone: 4,
    title: "Mastery",
    description: "Refine techniques and maximize performance",
  },
  {
    zone: 5,
    title: "Excellence",
    description: "Achieve peak fitness and maintain results",
  },
];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/80 backdrop-blur-lg">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center group">
            <div className="relative flex items-center py-2">
              <img
                src={logo}
                alt="HorizonFit Logo"
                className="h-14 w-auto object-contain transition-all duration-300 group-hover:scale-105"
                style={{
                  // Optional: if the logo has a white background you want to blend
                  mixBlendMode: "multiply",
                }}
              />
            </div>
          </Link>
          <div className="flex items-center gap-4">
            <Link to="/auth">
              <Button variant="ghost">Login</Button>
            </Link>
            <Link to="/book-consultation">
              <Button variant="phoenix">Book Consultation</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20">
        <div className="absolute inset-0 bg-gradient-to-b from-muted/50 to-background" />
        <div className="absolute -top-40 -right-40 h-80 w-80 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 h-80 w-80 rounded-full bg-secondary/10 blur-3xl" />
        
        <div className="container relative mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-4xl text-center"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-2"
            >
              <Stethoscope className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Doctor-Supervised Fitness Program</span>
            </motion.div>

            <h1 className="mb-6 text-5xl font-extrabold leading-tight tracking-tight text-foreground md:text-6xl lg:text-7xl">
              Medically-Personalized{' '}
              <span className="text-gradient-phoenix">Fitness Journey</span>
            </h1>

            <p className="mx-auto mb-10 max-w-2xl text-lg text-muted-foreground md:text-xl">
              Experience a revolutionary 15-week program crafted by <strong className="text-foreground">certified medical professionals</strong>. Your transformation is backed by expert doctors who understand your unique health needs.
            </p>

            {/* Trust Badges */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mb-10 flex flex-wrap items-center justify-center gap-6"
            >
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="h-5 w-5 text-green-500" />
                <span>Medically Approved</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <UserCheck className="h-5 w-5 text-secondary" />
                <span>Specialist Consultation</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Award className="h-5 w-5 text-primary" />
                <span>Certified Professionals</span>
              </div>
            </motion.div>

            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/enroll">
                <Button variant="phoenix" size="xl">
                  Enroll Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/book-consultation">
                <Button variant="teal" size="xl">
                  Book Consultation
                  <Calendar className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-8 md:grid-cols-3"
          >
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                variants={itemVariants}
                className="card-elevated group p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
              >
                <div className={`mb-6 inline-flex h-14 w-14 items-center justify-center rounded-xl ${index === 0 ? 'gradient-phoenix shadow-phoenix' : 'gradient-teal shadow-teal'}`}>
                  <feature.icon className="h-6 w-6 text-primary-foreground" />
                </div>
                <h3 className="mb-3 text-xl font-bold text-foreground">{feature.title}</h3>
                <p className="text-muted-foreground">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* 15-Week Program Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground">The 15-Week Doctor-Designed Journey</h2>
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">
              Our proven 5-zone system, designed by medical professionals, progressively builds your fitness ensuring sustainable results.
            </p>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-4 md:grid-cols-5"
          >
            {programSteps.map((step, index) => (
              <motion.div
                key={step.zone}
                variants={itemVariants}
                className="relative"
              >
                <div className="card-elevated group p-6 text-center transition-all duration-300 hover:-translate-y-1">
                  <div className={`mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full ${index === 4 ? 'gradient-phoenix' : 'bg-secondary/20'}`}>
                    <span className={`text-lg font-bold ${index === 4 ? 'text-primary-foreground' : 'text-secondary'}`}>
                      {step.zone}
                    </span>
                  </div>
                  <h3 className="mb-2 font-bold text-foreground">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.description}</p>
                </div>
                {index < 4 && (
                  <div className="absolute right-0 top-1/2 hidden h-0.5 w-4 -translate-y-1/2 translate-x-full bg-border md:block" />
                )}
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Doctor Profile Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl gradient-teal shadow-teal"
          >
            <div className="grid items-center md:grid-cols-2">
              <div className="p-12">
                <span className="mb-4 inline-block rounded-full bg-secondary-foreground/20 px-3 py-1 text-sm font-medium text-secondary-foreground">
                  Meet Your Specialist
                </span>
                <h2 className="mb-4 text-3xl font-bold text-secondary-foreground md:text-4xl">
                  DR.M.JABAARRUL
                </h2>
                <p className="mb-6 text-secondary-foreground/80">
                  With over 15 years of experience in sports medicine and fitness coaching, Dr. Mitchell has helped thousands of clients achieve their health goals through personalized programs.
                </p>
                <div className="mb-8 grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary-foreground">15+</div>
                    <div className="text-sm text-secondary-foreground/70">Years Experience</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary-foreground">2000+</div>
                    <div className="text-sm text-secondary-foreground/70">Clients Transformed</div>
                  </div>
                  <div className="text-center">
                    <div className="text-3xl font-bold text-secondary-foreground">98%</div>
                    <div className="text-sm text-secondary-foreground/70">Success Rate</div>
                  </div>
                </div>
                <Link to="/book-consultation">
                  <Button variant="phoenix" size="lg">
                    Book a Session
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </div>
              <div className="hidden h-full items-center justify-center bg-secondary-dark/20 p-12 md:flex">
                <div className="flex h-48 w-48 items-center justify-center rounded-full bg-secondary-foreground/10">
                  <Heart className="h-24 w-24 text-secondary-foreground/50" />
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="bg-muted/30 py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="mb-12 text-center"
          >
            <h2 className="mb-4 text-4xl font-bold text-foreground">Why Choose HorizonFit?</h2>
          </motion.div>

          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-4"
          >
            {[
              { icon: Stethoscope, text: 'Medical Supervision' },
              { icon: Award, text: 'Certified Professionals' },
              { icon: Flame, text: 'Proven Results' },
              { icon: Heart, text: 'Holistic Approach' },
            ].map((item) => (
              <motion.div
                key={item.text}
                variants={itemVariants}
                className="flex items-center gap-4 rounded-xl bg-background p-6 shadow-sm"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-lg gradient-phoenix">
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <span className="font-semibold text-foreground">{item.text}</span>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="overflow-hidden rounded-2xl gradient-phoenix p-12 text-center shadow-phoenix"
          >
            <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
              Ready to Start Your Transformation?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-primary-foreground/90">
              Join thousands of others who have already transformed their lives with HorizonFit's doctor-personalized programs.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/enroll">
                <Button size="xl" className="bg-background text-foreground hover:bg-background/90">
                  Start Your Journey
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg gradient-phoenix">
                <Flame className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="font-bold text-foreground">HorizonFit</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2024 HorizonFit. All rights reserved.
            </p>
            <p className="text-xs text-secondary">
              Developed by <span className="font-medium">Javid Shariff</span> (Technical Lead) @ Aevon Inc
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};
