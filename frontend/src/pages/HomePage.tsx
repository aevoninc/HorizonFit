import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  ArrowRight,
  Calendar,
  Activity,
  HeartPulse,
  Scale,
  ShieldCheck,
  Stethoscope,
  ChevronRight,
  User,
  Sparkles,
  Flame,
  Award,
  CheckCircle2,
} from "lucide-react";
import logo from "../../public/logo.png";

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export const HomePage: React.FC = () => {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-primary/20 selection:text-primary overflow-hidden">
      {/* Header / Navigation */}
      <header className="fixed top-0 z-50 w-full border-b border-border/50 bg-background/85 backdrop-blur-xl">
        <div className="container mx-auto flex h-20 items-center justify-between px-6 lg:px-12">
          <Link to="/" className="flex items-center gap-3 group">
            <img
              src={logo}
              alt="HorizonFit Logo"
              className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
          <div className="flex items-center gap-4">
            <Button variant="ghost" className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50" asChild>
              <Link to="/auth">Client Login</Link>
            </Button>
            <Button variant="phoenix" size="default" className="hidden sm:inline-flex shadow-phoenix font-semibold" asChild>
              <Link to="/book-consultation">
                <Calendar className="mr-2 h-4 w-4" />
                Book Assessment
              </Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="pt-20">
        {/* HERO SECTION */}
        <section className="relative overflow-hidden py-24 lg:py-32 bg-gradient-to-b from-secondary-dark/5 via-background to-background">
          {/* Glowing background ambient lights */}
          <div className="absolute top-12 left-1/2 -translate-x-1/2 h-[400px] w-[600px] rounded-full bg-gradient-to-tr from-primary/15 via-secondary/15 to-transparent blur-[140px] pointer-events-none" />
          <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />
          <div className="absolute top-1/2 -left-20 h-80 w-80 rounded-full bg-secondary/15 blur-[100px] pointer-events-none" />

          <div className="container relative mx-auto px-6 lg:px-12">
            <motion.div
              initial={{ opacity: 0, y: 25 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="mx-auto max-w-4xl text-center"
            >
              {/* Badge */}
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-secondary/30 bg-secondary/10 px-4 py-2 text-xs font-bold uppercase tracking-wider text-secondary shadow-sm backdrop-blur-sm">
                <Stethoscope className="h-4 w-4 text-secondary" />
                <span>Doctor-Led Metabolic Health Transformation</span>
              </div>

              {/* Main Headline */}
              <h1 className="text-5xl font-black tracking-tight sm:text-6xl lg:text-7xl leading-[1.1] text-foreground">
                <span className="block">HORIZON FIT</span>
                <span className="block text-gradient-phoenix mt-2">
                  Metabolic Health Transformation
                </span>
              </h1>

              <p className="mt-6 text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto font-normal leading-relaxed">
                A structured approach to understanding, improving and sustaining better metabolic health.
              </p>

              {/* Action Buttons */}
              <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
                <Button size="xl" variant="phoenix" className="shadow-phoenix rounded-full px-8 font-semibold group" asChild>
                  <Link to="/self-guided-system">
                    Explore Weight Management System
                    <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
                <Button size="xl" variant="teal" className="shadow-teal rounded-full px-8 font-semibold" asChild>
                  <Link to="/book-consultation">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Metabolic Health Assessment
                  </Link>
                </Button>
              </div>
            </motion.div>
          </div>
        </section>

        {/* COMPREHENSIVE APPROACH & AREAS OF FOCUS */}
        <section className="py-24 border-t border-border/40 relative">
          <div className="container mx-auto px-6 lg:px-12">
            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="max-w-3xl mx-auto text-center mb-16"
            >
              <motion.span variants={itemVariants} className="text-xs font-bold tracking-widest text-primary uppercase">
                Holistic Care
              </motion.span>
              <motion.h2 variants={itemVariants} className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                A Comprehensive Approach to Metabolic Health
              </motion.h2>
              <motion.p variants={itemVariants} className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
                Metabolic health influences how the body manages energy, glucose, body weight and other interconnected health functions. Horizon Fit brings these areas together through structured assessment, education, personalised guidance and progressive health management.
              </motion.p>
            </motion.div>

            <motion.div
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              variants={containerVariants}
              className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 max-w-6xl mx-auto"
            >
              {[
                {
                  title: "Weight Management",
                  desc: "Structured support for healthy and sustainable weight management.",
                  icon: Scale,
                  gradient: "from-amber-500/10 via-primary/5 to-transparent",
                  iconBg: "gradient-phoenix text-white shadow-phoenix",
                },
                {
                  title: "Prediabetes & Glucose Health",
                  desc: "Assessment, guidance and structured management of glucose health.",
                  icon: Activity,
                  gradient: "from-teal-500/10 via-secondary/5 to-transparent",
                  iconBg: "gradient-teal text-white shadow-teal",
                },
                {
                  title: "Fatty Liver & Liver Health",
                  desc: "A structured approach to metabolic factors associated with liver health.",
                  icon: ShieldCheck,
                  gradient: "from-emerald-500/10 via-teal-500/5 to-transparent",
                  iconBg: "bg-emerald-600 text-white shadow-md",
                },
                {
                  title: "Cardiometabolic Health",
                  desc: "Supporting the management of key metabolic and cardiovascular risk factors.",
                  icon: HeartPulse,
                  gradient: "from-rose-500/10 via-primary/5 to-transparent",
                  iconBg: "bg-rose-500 text-white shadow-md",
                },
                {
                  title: "Metabolic Health Assessment",
                  desc: "Understanding individual health markers, risk factors and priorities.",
                  icon: Stethoscope,
                  gradient: "from-cyan-500/10 via-secondary/5 to-transparent",
                  iconBg: "gradient-teal text-white shadow-teal",
                },
              ].map((area, idx) => (
                <motion.div
                  key={idx}
                  variants={itemVariants}
                  className="group relative rounded-3xl border border-border/70 bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-secondary/40 hover:shadow-xl overflow-hidden"
                >
                  {/* Subtle card glow overlay */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${area.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none`} />

                  <div className={`relative mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${area.iconBg}`}>
                    <area.icon className="h-6 w-6" />
                  </div>
                  <h3 className="relative text-xl font-bold text-foreground group-hover:text-secondary transition-colors">
                    {area.title}
                  </h3>
                  <p className="relative mt-2 text-sm text-muted-foreground leading-relaxed">
                    {area.desc}
                  </p>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* THE HORIZON FIT APPROACH */}
        <section className="py-20 relative overflow-hidden bg-gradient-to-r from-secondary-dark via-secondary to-secondary-dark text-secondary-foreground shadow-teal">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.1),transparent_50%)] pointer-events-none" />
          <div className="container relative mx-auto px-6 lg:px-12 text-center max-w-4xl">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
            >
              <span className="inline-block rounded-full bg-white/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-white/90 mb-4 backdrop-blur-md border border-white/20">
                Core Methodology
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white">
                The Horizon Fit Approach
              </h2>

              <div className="mt-8 flex flex-wrap justify-center items-center gap-3 sm:gap-6 text-white font-bold text-lg sm:text-2xl tracking-wide">
                <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">Assess</span>
                <span className="text-primary-glow">•</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">Understand</span>
                <span className="text-primary-glow">•</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">Personalise</span>
                <span className="text-primary-glow">•</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">Implement</span>
                <span className="text-primary-glow">•</span>
                <span className="px-3 py-1 rounded-lg bg-white/10 backdrop-blur-sm border border-white/10">Progress</span>
              </div>

              <p className="mt-8 text-white/90 text-base sm:text-lg leading-relaxed max-w-2xl mx-auto font-normal">
                Every individual begins from a different health position. Horizon Fit uses a structured approach to understand the individual's health profile, identify priorities and establish an appropriate pathway forward.
              </p>
            </motion.div>
          </div>
        </section>

        {/* TWO WAYS TO BEGIN YOUR JOURNEY */}
        <section className="py-24 border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">Customized Pathways</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Two Ways to Begin Your Horizon Fit Journey
              </h2>
            </div>

            <div className="grid gap-8 lg:grid-cols-2">
              {/* Pathway 1 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="group flex flex-col justify-between rounded-3xl border border-border/80 bg-card p-8 sm:p-10 transition-all duration-300 hover:border-primary/50 hover:shadow-lg relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-bl-full pointer-events-none group-hover:bg-primary/10 transition-colors" />

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-primary uppercase">
                    <span>01</span>
                    <span>—</span>
                    <span>Self-Guided Pathway</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-foreground">
                    15-Week Self-Guided Weight Management System
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
                    A comprehensive self-guided program designed to help you understand weight management, learn the Horizon Fit framework, work through the accompanying workbook and follow a structured 15-week journey.
                  </p>

                  <div className="mt-6 p-4 rounded-2xl bg-muted/60 border border-border/50 flex flex-wrap items-center justify-between gap-2 text-xs font-bold text-foreground">
                    <span className="text-primary">Learn</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-primary">Plan</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-primary">Implement</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-primary">Track</span>
                    <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
                    <span className="text-primary">Progress</span>
                  </div>
                </div>

                <div className="mt-8 pt-6 border-t border-border/40">
                  <Button variant="outline" className="w-full sm:w-auto rounded-full font-semibold border-primary/30 text-primary hover:bg-primary/10 hover:text-primary" asChild>
                    <Link to="/self-guided-system">
                      Explore the Weight Management System
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </motion.div>

              {/* Pathway 2 */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="group flex flex-col justify-between rounded-3xl border border-secondary/40 bg-gradient-to-b from-secondary/5 via-card to-card p-8 sm:p-10 transition-all duration-300 hover:border-secondary hover:shadow-xl relative overflow-hidden"
              >
                <div className="absolute top-0 right-0 w-32 h-32 bg-secondary/10 rounded-bl-full pointer-events-none group-hover:bg-secondary/20 transition-colors" />

                <div>
                  <div className="inline-flex items-center gap-2 rounded-full bg-secondary/15 px-3 py-1 text-xs font-bold tracking-wider text-secondary uppercase">
                    <span>02</span>
                    <span>—</span>
                    <span>Doctor-Led Personalised Pathway</span>
                  </div>
                  <h3 className="mt-4 text-2xl font-bold text-foreground">
                    A Personalised Journey Built Around Your Health
                  </h3>
                  <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
                    For individuals seeking personalised support for weight management, prediabetes, fatty liver, cardiometabolic health or other metabolic health concerns.
                  </p>
                  <p className="mt-3 text-muted-foreground leading-relaxed text-sm sm:text-base font-medium text-foreground/90">
                    Your journey begins with a Metabolic Health Assessment, followed by individualised planning, implementation and ongoing guidance based on your health profile and goals.
                  </p>
                </div>

                <div className="mt-8 pt-6 border-t border-border/40">
                  <Button variant="teal" className="w-full sm:w-auto rounded-full font-semibold shadow-teal" asChild>
                    <Link to="/book-consultation">
                      <Calendar className="mr-2 h-4 w-4" />
                      Book Metabolic Health Assessment
                    </Link>
                  </Button>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* DESIGNED AROUND THE INDIVIDUAL */}
        <section className="py-20 bg-muted/30 border-t border-border/40 relative">
          <div className="container mx-auto px-6 lg:px-12 text-center max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-bold tracking-widest text-secondary uppercase">Tailored Care</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Designed Around the Individual
              </h2>
              <p className="mt-3 text-xl font-bold text-gradient-phoenix">Your Health. Your Profile. Your Pathway.</p>
              <p className="mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed">
                Horizon Fit recognises that metabolic health is individual. Your age, body composition, health history, lifestyle, measurements and clinical information can all contribute to understanding your health priorities.
              </p>
              <div className="mt-6 inline-block rounded-2xl bg-card border border-border/60 p-4 text-foreground font-semibold text-base sm:text-lg shadow-sm">
                Our approach is designed to translate that understanding into a clear, structured pathway for action.
              </div>
            </motion.div>
          </div>
        </section>

        {/* THE HORIZON FIT FRAMEWORK */}
        <section className="py-24 border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
            <div className="text-center mb-16 max-w-2xl mx-auto">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">Progressive System</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The Horizon Fit Framework
              </h2>
              <p className="mt-3 text-muted-foreground font-medium">A Progressive Pathway From Understanding to Action</p>
            </div>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
              {[
                { step: "ASSESS", desc: "Understand your current health profile.", color: "border-primary/40 text-primary" },
                { step: "UNDERSTAND", desc: "Identify the factors that matter most.", color: "border-secondary/40 text-secondary" },
                { step: "PERSONALISE", desc: "Establish the appropriate health pathway.", color: "border-emerald-500/40 text-emerald-600" },
                { step: "IMPLEMENT", desc: "Put the plan into practice.", color: "border-amber-500/40 text-amber-600" },
                { step: "PROGRESS", desc: "Review, refine and build sustainable progress.", color: "border-primary/40 text-primary" },
              ].map((item, idx) => (
                <motion.div
                  key={idx}
                  initial={{ opacity: 0, y: 15 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: idx * 0.08 }}
                  className={`group relative rounded-3xl border ${item.color.split(" ")[0]} bg-card p-6 text-left shadow-sm hover:shadow-md transition-all hover:-translate-y-1`}
                >
                  <div className={`text-xs font-extrabold tracking-widest ${item.color.split(" ")[1]} mb-2`}>
                    ZONE 0{idx + 1}
                  </div>
                  <h3 className="text-lg font-bold text-foreground tracking-tight group-hover:text-secondary transition-colors">
                    {item.step}
                  </h3>
                  <p className="mt-2 text-xs text-muted-foreground leading-relaxed">{item.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* MEET THE FOUNDER */}
        <section className="py-20 bg-gradient-to-b from-muted/30 to-background border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
            <div className="rounded-3xl border border-secondary/30 bg-gradient-to-br from-card via-card to-secondary/5 p-8 sm:p-12 shadow-lg relative overflow-hidden">
              <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                <div className="flex-shrink-0">
                  <div className="h-32 w-32 rounded-3xl gradient-teal p-1 shadow-teal flex items-center justify-center">
                    <div className="h-full w-full rounded-[22px] bg-card flex items-center justify-center text-secondary">
                      <User className="h-14 w-14" />
                    </div>
                  </div>
                </div>
                <div>
                  <span className="inline-block rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold tracking-widest text-secondary uppercase">
                    Meet the Founder
                  </span>
                  <h2 className="mt-3 text-3xl font-extrabold text-foreground">Dr. M. Jabaarrul</h2>
                  <p className="text-sm font-semibold text-muted-foreground mt-1">
                    MBBS, AFIH, Fellowship in Clinical Diabetology
                  </p>
                  <p className="text-sm font-bold text-primary mt-0.5">Founder – Horizon Fit</p>

                  <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
                    Horizon Fit was created to bring a structured, doctor-led approach to metabolic health — combining clinical understanding with practical health management to help individuals take meaningful steps toward better long-term health.
                  </p>

                  <div className="mt-6">
                    <Button variant="teal" className="rounded-full shadow-teal font-semibold text-xs" asChild>
                      <Link to="/book-consultation">
                        Meet Dr. Jabaarrul
                        <ArrowRight className="ml-2 h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* THE HORIZON FIT VISION */}
        <section className="py-24 border-t border-border/40 text-center">
          <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <span className="text-xs font-bold tracking-widest text-secondary uppercase">Our Mission</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                The Horizon Fit Vision
              </h2>
              <p className="mt-2 text-lg font-semibold text-primary">
                Building a Comprehensive Metabolic Health Platform
              </p>
              <p className="mt-6 text-muted-foreground text-base sm:text-lg leading-relaxed">
                Horizon Fit is being developed as an integrated platform for metabolic health, with structured pathways that can evolve across different areas of health and different stages of an individual's journey.
              </p>

              <div className="mt-10 flex flex-col sm:flex-row justify-center items-center gap-3 text-sm sm:text-base font-bold text-foreground">
                <span className="px-5 py-3 rounded-2xl bg-card border border-border/80 shadow-sm">Understand your health.</span>
                <span className="hidden sm:inline text-primary font-black text-xl">→</span>
                <span className="px-5 py-3 rounded-2xl bg-card border border-border/80 shadow-sm">Choose the right pathway.</span>
                <span className="hidden sm:inline text-primary font-black text-xl">→</span>
                <span className="px-5 py-3 rounded-2xl gradient-phoenix text-white shadow-phoenix">Progress with purpose.</span>
              </div>
            </motion.div>
          </div>
        </section>

        {/* FREQUENTLY ASKED QUESTIONS */}
        <section className="py-24 bg-muted/30 border-t border-border/40">
          <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
            <div className="text-center mb-12">
              <span className="text-xs font-bold tracking-widest text-primary uppercase">Got Questions?</span>
              <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                Frequently Asked Questions
              </h2>
            </div>

            <Accordion type="single" collapsible className="w-full space-y-4">
              {[
                {
                  q: "What is Horizon Fit?",
                  a: "Horizon Fit is a doctor-led metabolic health platform designed to help individuals understand their health, identify key priorities and follow a structured pathway toward better metabolic health.",
                },
                {
                  q: "What areas of metabolic health does Horizon Fit address?",
                  a: "Horizon Fit addresses weight management, prediabetes and glucose health, fatty liver and liver health, cardiometabolic health, and other areas of metabolic health.",
                },
                {
                  q: "What is the difference between the Self-Guided and Personalised pathways?",
                  a: "The Self-Guided Pathway enables you to learn and work through the Horizon Fit Weight Management System independently using structured videos, workbooks, guided activities and progress tracking. The Personalised Pathway begins with a doctor-led assessment, followed by guidance and a structured plan based on your health profile, priorities and goals.",
                },
                {
                  q: "Is the Weight Management System self-guided?",
                  a: "Yes. The 15-Week Self-Guided Weight Management System provides structured videos, Zone-specific workbooks, guided calculations, activities and progress tracking to help you work through your own weight-management journey.",
                },
                {
                  q: "How do I know which pathway is right for me?",
                  a: "If you are looking for a structured, self-guided approach to weight management, you can explore the 15-Week Self-Guided Weight Management System. If you are seeking personalised guidance for weight management or another metabolic health concern, you can begin with a Metabolic Health Assessment.",
                },
                {
                  q: "What happens during the Metabolic Health Assessment?",
                  a: "Dr. M. Jabaarrul reviews your current health status, concerns, relevant health information and goals to understand your individual needs. Based on this assessment, you receive clear guidance, practical recommendations and a structured plan aligned with your health priorities.",
                },
              ].map((faq, idx) => (
                <AccordionItem key={idx} value={`item-${idx}`} className="rounded-2xl border border-border/70 bg-card px-6 py-1 shadow-sm transition-all hover:border-secondary/40">
                  <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline hover:text-secondary text-base py-4">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground text-sm leading-relaxed pb-4">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </section>

        {/* BEGIN YOUR HORIZON FIT JOURNEY */}
        <section className="py-24 border-t border-border/40 text-center relative overflow-hidden">
          <div className="container mx-auto px-6 lg:px-12 max-w-4xl relative">
            <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-10 sm:p-16 shadow-xl relative overflow-hidden">
              <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

              <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                Begin Your Horizon Fit Journey
              </h2>
              <p className="mt-3 text-xl font-bold text-gradient-phoenix">
                Better Health Begins With Understanding.
              </p>

              <div className="mt-6 space-y-1 text-muted-foreground text-base sm:text-lg">
                <p>Understand where you are.</p>
                <p>Identify what matters.</p>
                <p className="pt-2 font-bold text-foreground">
                  Begin with the pathway aligned with your goals and health priorities.
                </p>
              </div>

              <div className="mt-10 flex flex-wrap justify-center gap-4">
                <Button size="xl" variant="teal" className="shadow-teal rounded-full px-8 font-semibold" asChild>
                  <Link to="/book-consultation">
                    <Calendar className="mr-2 h-5 w-5" />
                    Book Metabolic Health Assessment
                  </Link>
                </Button>
                <Button size="xl" variant="phoenix" className="shadow-phoenix rounded-full px-8 font-semibold" asChild>
                  <Link to="/self-guided-system">
                    Explore Weight Management System
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-border/60 bg-gradient-to-b from-card to-muted/40 py-12">
        <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <div className="text-2xl font-black tracking-tight text-foreground flex items-center justify-center md:justify-start gap-2">
                <span className="text-primary">HORIZON</span> FIT
              </div>
              <p className="text-xs font-semibold text-muted-foreground mt-1">Doctor-Led Metabolic Health Transformation</p>
            </div>

            <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
              <Link to="/" className="hover:text-secondary transition-colors">About Horizon Fit</Link>
              <Link to="/enroll" className="hover:text-secondary transition-colors">Programs</Link>
              <Link to="/self-guided-system" className="hover:text-secondary transition-colors">Weight Management</Link>
              <Link to="/book-consultation" className="hover:text-secondary transition-colors">Metabolic Health Assessment</Link>
              <Link to="/auth" className="hover:text-secondary transition-colors">FAQs</Link>
              <Link to="/book-consultation" className="hover:text-secondary transition-colors">Contact</Link>
              <span className="hover:text-secondary cursor-pointer">Privacy</span>
              <span className="hover:text-secondary cursor-pointer">Terms</span>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-border/40 text-center text-xs text-muted-foreground font-medium">
            © {new Date().getFullYear()} Horizon Fit. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
};

export default HomePage;
