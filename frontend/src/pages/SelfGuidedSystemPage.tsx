import React, { useEffect } from "react";
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
    ArrowLeft,
    ArrowRight,
    Video,
    FileSpreadsheet,
    CheckCircle2,
    Calendar,
    Sparkles,
    ShieldAlert,
    Compass,
    Check,
    Target,
    BarChart3,
    BookOpen,
    Award,
    Layers,
    Activity,
    Flame,
    Scale,
    Clock,
    UserCheck,
    HelpCircle,
    HelpCircleIcon,
    ChevronRight,
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

export const SelfGuidedSystemPage: React.FC = () => {
    useEffect(() => {
        window.scrollTo(0, 0);
    }, []);

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
                        <Button
                            variant="ghost"
                            className="font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50"
                            asChild
                        >
                            <Link to="/">
                                <ArrowLeft className="mr-2 h-4 w-4" />
                                Back to Home
                            </Link>
                        </Button>
                        <Button
                            variant="phoenix"
                            size="default"
                            className="shadow-phoenix font-semibold rounded-full px-6"
                            asChild
                        >
                            <Link to="/enroll">
                                Enrol Now
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </Link>
                        </Button>
                    </div>
                </div>
            </header>

            <main className="pt-20">
                {/* HERO SECTION */}
                <section className="relative overflow-hidden py-20 lg:py-28 bg-gradient-to-b from-primary/5 via-background to-background">
                    {/* Glowing background elements */}
                    <div className="absolute top-12 left-1/2 -translate-x-1/2 h-[450px] w-[650px] rounded-full bg-gradient-to-tr from-primary/20 via-secondary/15 to-transparent blur-[140px] pointer-events-none" />
                    <div className="absolute -top-20 -right-20 h-80 w-80 rounded-full bg-primary/10 blur-[100px] pointer-events-none" />

                    <div className="container relative mx-auto px-6 lg:px-12">
                        <motion.div
                            initial={{ opacity: 0, y: 25 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6 }}
                            className="mx-auto max-w-4xl text-center"
                        >
                            {/* Brand Pill */}
                            <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-2 text-xs font-bold uppercase tracking-widest text-primary shadow-sm backdrop-blur-sm">
                                <Sparkles className="h-4 w-4 text-primary" />
                                <span>HORIZON FIT</span>
                            </div>

                            {/* Main Title */}
                            <h1 className="text-4xl font-black tracking-tight sm:text-5xl lg:text-6xl leading-[1.15] text-foreground">
                                15-Week Self-Guided Weight Loss System
                            </h1>

                            {/* Tagline */}
                            <p className="mt-6 text-xl sm:text-2xl font-semibold text-gradient-phoenix max-w-3xl mx-auto tracking-wide">
                                Learn the framework. Build your plan. Follow your journey. Track your progress.
                            </p>

                            {/* System Intro Description */}
                            <p className="mt-6 text-base sm:text-lg text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                                A structured digital system that gives you the learning, tools, workbooks and tracking framework to work through your own weight-management journey over 15 weeks.
                            </p>

                            {/* Enrol Now CTA */}
                            <div className="mt-10 flex items-center justify-center">
                                <Button
                                    size="xl"
                                    variant="phoenix"
                                    className="shadow-phoenix rounded-full px-10 font-bold text-lg group"
                                    asChild
                                >
                                    <Link to="/enroll">
                                        Enrol Now
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* YOUR JOURNEY STARTS IN YOUR PERSONAL DASHBOARD */}
                <section className="py-24 border-t border-border/40 relative bg-muted/20">
                    <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-100px" }}
                            variants={containerVariants}
                            className="max-w-3xl mx-auto text-center mb-16"
                        >
                            <motion.span variants={itemVariants} className="text-xs font-bold tracking-widest text-primary uppercase">
                                Digital Hub
                            </motion.span>
                            <motion.h2 variants={itemVariants} className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                YOUR JOURNEY STARTS IN YOUR PERSONAL DASHBOARD
                            </motion.h2>
                            <motion.p variants={itemVariants} className="mt-4 text-muted-foreground text-base sm:text-lg leading-relaxed">
                                After enrolment, you receive your Horizon Fit login credentials and access your personal dashboard.
                            </motion.p>
                        </motion.div>

                        {/* Features Card Grid */}
                        <motion.div
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true, margin: "-50px" }}
                            variants={containerVariants}
                            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
                        >
                            {[
                                {
                                    title: "Horizon Guide Videos",
                                    desc: "Understand where and how to begin your transformation step by step.",
                                    icon: Compass,
                                    color: "gradient-phoenix text-white shadow-phoenix",
                                },
                                {
                                    title: "Learning Videos",
                                    desc: "Learn each part of the Horizon Fit framework through clear educational content.",
                                    icon: Video,
                                    color: "gradient-teal text-white shadow-teal",
                                },
                                {
                                    title: "Zone Workbooks",
                                    desc: "Download the dedicated workbook PDF for each of the 5 program stages.",
                                    icon: BookOpen,
                                    color: "bg-amber-500 text-white shadow-md",
                                },
                                {
                                    title: "Daily Tracking",
                                    desc: "Record your Horizon Fit Code completion every day inside your portal.",
                                    icon: Calendar,
                                    color: "bg-emerald-600 text-white shadow-md",
                                },
                                {
                                    title: "Weekly Tracking",
                                    desc: "Record your key progress measurements week by week to observe your evolution.",
                                    icon: BarChart3,
                                    color: "bg-cyan-600 text-white shadow-md",
                                },
                            ].map((item, idx) => (
                                <motion.div
                                    key={idx}
                                    variants={itemVariants}
                                    className="group relative rounded-3xl border border-border/80 bg-card p-8 transition-all duration-300 hover:-translate-y-1 hover:border-primary/50 hover:shadow-xl"
                                >
                                    <div className={`mb-6 inline-flex h-12 w-12 items-center justify-center rounded-2xl ${item.color}`}>
                                        <item.icon className="h-6 w-6" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground group-hover:text-primary transition-colors">
                                        {item.title}
                                    </h3>
                                    <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                                        {item.desc}
                                    </p>
                                </motion.div>
                            ))}
                        </motion.div>
                    </div>
                </section>

                {/* LEARN. WRITE. CALCULATE. APPLY. */}
                <section className="py-24 border-t border-border/40 relative overflow-hidden bg-gradient-to-br from-card via-card to-secondary/5">
                    <div className="container mx-auto px-6 lg:px-12 max-w-5xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="text-center"
                        >
                            <span className="inline-block rounded-full bg-secondary/10 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-secondary mb-4 backdrop-blur-md border border-secondary/20">
                                Interactive Learning Method
                            </span>

                            <h2 className="text-3xl font-extrabold tracking-tight sm:text-5xl text-foreground">
                                LEARN. WRITE. CALCULATE. APPLY.
                            </h2>
                            <p className="mt-3 text-xl font-bold text-gradient-phoenix">
                                Your Workbook Is an Essential Part of the System
                            </p>
                        </motion.div>

                        <div className="mt-12 grid gap-8 md:grid-cols-2 items-center">
                            {/* Method Explanation */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="space-y-6 text-muted-foreground text-base leading-relaxed"
                            >
                                <div className="rounded-2xl border border-border/60 bg-muted/40 p-6 space-y-4">
                                    <p className="font-semibold text-foreground text-lg">
                                        The videos teach you what to do and how to do it.
                                    </p>
                                    <p>
                                        You then download the relevant Zone workbook PDF and work through it using your own information and measurements.
                                    </p>
                                </div>

                                {/* Workflow pill steps */}
                                <div className="rounded-2xl border border-secondary/30 bg-secondary/5 p-6">
                                    <p className="text-xs font-bold uppercase tracking-wider text-secondary mb-3">
                                        Your Workbook Action Steps:
                                    </p>
                                    <div className="flex flex-wrap items-center gap-2 text-xs font-bold text-foreground">
                                        <span className="bg-card px-3 py-1.5 rounded-lg border border-border/60">Enter information</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-secondary" />
                                        <span className="bg-card px-3 py-1.5 rounded-lg border border-border/60">Write measurements</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-secondary" />
                                        <span className="bg-card px-3 py-1.5 rounded-lg border border-border/60">Follow instructions</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-secondary" />
                                        <span className="bg-card px-3 py-1.5 rounded-lg border border-border/60">Perform calculations</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-secondary" />
                                        <span className="bg-card px-3 py-1.5 rounded-lg border border-border/60">Work out requirements</span>
                                        <ChevronRight className="h-3.5 w-3.5 text-secondary" />
                                        <span className="gradient-phoenix text-white px-3 py-1.5 rounded-lg shadow-phoenix">Apply to journey</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* Highlight callout box */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-3xl border border-primary/40 bg-gradient-to-b from-primary/10 via-card to-card p-8 sm:p-10 shadow-lg text-center"
                            >
                                <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl gradient-phoenix text-white shadow-phoenix mb-6">
                                    <FileSpreadsheet className="h-8 w-8" />
                                </div>
                                <h3 className="text-2xl font-bold text-foreground mb-4">Working Tool for Results</h3>
                                <p className="text-foreground/90 font-medium text-lg leading-relaxed">
                                    "The workbook is your working tool throughout the program. The videos teach the method. The workbook helps you work it out for yourself."
                                </p>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* 15 WEEKS. 5 ZONES. */}
                <section className="py-24 border-t border-border/40">
                    <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                        <div className="text-center mb-16 max-w-3xl mx-auto">
                            <span className="text-xs font-bold tracking-widest text-primary uppercase">Program Architecture</span>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                15 WEEKS. 5 ZONES.
                            </h2>
                            <p className="mt-3 text-muted-foreground text-base sm:text-lg">
                                Your journey progresses through five 3-week Zones:
                            </p>
                        </div>

                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-5">
                            {[
                                { zone: "01", name: "FOUNDATION", weeks: "Weeks 1–3", desc: "Build core health principles and establish your baseline.", color: "border-primary/40 text-primary" },
                                { zone: "02", name: "MOMENTUM", weeks: "Weeks 4–6", desc: "Accelerate habits and refine daily execution routines.", color: "border-secondary/40 text-secondary" },
                                { zone: "03", name: "TRANSFORMATION", weeks: "Weeks 7–9", desc: "Deepen metabolic changes and elevate physical output.", color: "border-emerald-500/40 text-emerald-600" },
                                { zone: "04", name: "MASTERY", weeks: "Weeks 10–12", desc: "Master your requirements and overcome plateaus.", color: "border-amber-500/40 text-amber-600" },
                                { zone: "05", name: "FREEDOM", weeks: "Weeks 13–15", desc: "Consolidate long-term lifestyle freedom and sustainability.", color: "border-cyan-500/40 text-cyan-600" },
                            ].map((z, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.08 }}
                                    className={`group rounded-3xl border ${z.color.split(" ")[0]} bg-card p-6 flex flex-col justify-between hover:shadow-xl transition-all duration-300 hover:-translate-y-1`}
                                >
                                    <div>
                                        <div className="flex items-center justify-between">
                                            <span className={`text-xs font-black tracking-widest ${z.color.split(" ")[1]}`}>
                                                ZONE {z.zone}
                                            </span>
                                            <span className="text-xs font-bold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                                                {z.weeks}
                                            </span>
                                        </div>
                                        <h3 className="mt-4 text-md font-black text-foreground tracking-tight group-hover:text-primary transition-colors">
                                            {z.name}
                                        </h3>
                                        <p className="mt-3 text-xs text-muted-foreground leading-relaxed">
                                            {z.desc}
                                        </p>
                                    </div>
                                    <div className="mt-6 pt-4 border-t border-border/40 text-[11px] font-semibold text-muted-foreground flex items-center justify-between">
                                        <span>Content + Workbook</span>
                                        <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                                    </div>
                                </motion.div>
                            ))}
                        </div>

                        {/* Zone Progression Note */}
                        <div className="mt-12 text-center max-w-2xl mx-auto rounded-2xl border border-border/60 bg-muted/30 p-6 text-sm text-muted-foreground font-medium">
                            Each Zone has its own learning content and dedicated workbook. You complete the current Zone, work through its workbook and activities, and then progress to the next stage.
                        </div>
                    </div>
                </section>

                {/* THE 5 HORIZON FIT CODES & TRACK YOUR PROGRESS */}
                <section className="py-24 border-t border-border/40 bg-muted/20">
                    <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                        <div className="grid gap-12 lg:grid-cols-2">
                            {/* THE 5 HORIZON FIT CODES */}
                            <motion.div
                                initial={{ opacity: 0, x: -20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-3xl border border-secondary/40 bg-card p-8 sm:p-10 shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-secondary/10 px-3 py-1 text-xs font-bold tracking-wider text-secondary uppercase">
                                        <Flame className="h-4 w-4 text-secondary" />
                                        <span>Daily Framework</span>
                                    </div>
                                    <h2 className="mt-4 text-3xl font-extrabold text-foreground">
                                        THE 5 HORIZON FIT CODES
                                    </h2>
                                    <p className="mt-4 text-muted-foreground leading-relaxed">
                                        Your daily journey is organised around the 5 Horizon Fit Codes. Each day, you complete the required Codes and record your completion in your dashboard.
                                    </p>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border/40">
                                    <div className="flex items-center justify-center gap-3 p-4 rounded-2xl bg-gradient-to-r from-secondary/10 via-secondary/20 to-secondary/10 border border-secondary/30 font-extrabold text-foreground tracking-wide text-sm sm:text-base">
                                        <span className="text-secondary">Complete</span>
                                        <ArrowRight className="h-4 w-4 text-secondary" />
                                        <span className="text-secondary">Record</span>
                                        <ArrowRight className="h-4 w-4 text-secondary" />
                                        <span className="text-secondary">Progress</span>
                                    </div>
                                </div>
                            </motion.div>

                            {/* TRACK YOUR PROGRESS */}
                            <motion.div
                                initial={{ opacity: 0, x: 20 }}
                                whileInView={{ opacity: 1, x: 0 }}
                                viewport={{ once: true }}
                                className="rounded-3xl border border-primary/40 bg-card p-8 sm:p-10 shadow-sm flex flex-col justify-between"
                            >
                                <div>
                                    <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-3 py-1 text-xs font-bold tracking-wider text-primary uppercase">
                                        <Activity className="h-4 w-4 text-primary" />
                                        <span>Weekly Metrics</span>
                                    </div>
                                    <h2 className="mt-4 text-3xl font-extrabold text-foreground">
                                        TRACK YOUR PROGRESS
                                    </h2>
                                    <p className="mt-2 text-sm font-semibold text-primary">
                                        Your Progress, Recorded Week by Week
                                    </p>
                                    <p className="mt-4 text-muted-foreground leading-relaxed text-sm">
                                        Every week, you record three key measurements:
                                    </p>

                                    <div className="mt-4 space-y-2.5">
                                        {[
                                            "Body Weight",
                                            "Body Fat %",
                                            "Visceral Fat",
                                        ].map((metric, idx) => (
                                            <div key={idx} className="flex items-center gap-3 rounded-xl border border-border/60 bg-muted/40 px-4 py-2.5 font-bold text-foreground text-sm">
                                                <CheckCircle2 className="h-4 w-4 text-primary" />
                                                <span>{metric}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>

                                <div className="mt-8 pt-6 border-t border-border/40 text-xs text-muted-foreground font-medium">
                                    Your dashboard keeps your entries organised so you can follow your progress throughout the 15 weeks.
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* YOUR COMPLETE DIGITAL SYSTEM & A SELF-GUIDED EXPERIENCE */}
                <section className="py-24 border-t border-border/40">
                    <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                        <div className="grid gap-12 lg:grid-cols-12 items-center">
                            {/* Checklist column */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="lg:col-span-7 rounded-3xl border border-primary/30 bg-gradient-to-br from-card via-card to-primary/5 p-8 sm:p-12 shadow-xl"
                            >
                                <span className="text-xs font-bold tracking-widest text-primary uppercase">Full System Package</span>
                                <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
                                    YOUR COMPLETE DIGITAL SYSTEM
                                </h2>
                                <p className="mt-2 text-base font-semibold text-gradient-phoenix">
                                    One Dashboard. One Workbook at a Time. One Structured Journey.
                                </p>

                                <p className="mt-6 text-sm font-bold text-muted-foreground uppercase tracking-wider">
                                    You Receive:
                                </p>

                                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                                    {[
                                        "Personal Horizon Fit dashboard",
                                        "Horizon Guide videos",
                                        "Learning videos",
                                        "5 Zone-specific workbooks",
                                        "Guided calculations and activities",
                                        "5 Horizon Fit Codes",
                                        "Daily Code tracking",
                                        "Weekly progress tracking",
                                        "15-week structured journey",
                                    ].map((item, idx) => (
                                        <div key={idx} className="flex items-center gap-3 rounded-xl border border-border/60 bg-card p-3 shadow-sm text-xs font-bold text-foreground">
                                            <div className="h-5 w-5 rounded-full bg-emerald-500/15 text-emerald-600 flex items-center justify-center shrink-0">
                                                <Check className="h-3.5 w-3.5" />
                                            </div>
                                            <span>{item}</span>
                                        </div>
                                    ))}
                                </div>
                            </motion.div>

                            {/* Self-guided experience description column */}
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                className="lg:col-span-5 rounded-3xl border border-border/80 bg-card p-8 sm:p-10 shadow-sm"
                            >
                                <span className="text-xs font-bold tracking-widest text-secondary uppercase">Autonomy & Action</span>
                                <h2 className="mt-2 text-2xl font-bold text-foreground">
                                    A SELF-GUIDED EXPERIENCE
                                </h2>
                                <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
                                    Horizon Fit provides the framework, learning content, instructions, workbooks and tracking tools.
                                </p>
                                <p className="mt-4 text-muted-foreground leading-relaxed text-sm sm:text-base">
                                    You actively work through the system, complete the required calculations and activities, apply what you learn and track your progress.
                                </p>
                                <div className="mt-6 p-4 rounded-2xl bg-secondary/10 border border-secondary/30 text-secondary font-bold text-sm text-center">
                                    Your journey is built through your own participation.
                                </div>
                            </motion.div>
                        </div>
                    </div>
                </section>

                {/* IS THIS RIGHT FOR YOU? */}
                <section className="py-20 bg-muted/30 border-t border-border/40">
                    <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            whileInView={{ opacity: 1, y: 0 }}
                            viewport={{ once: true }}
                            className="rounded-3xl border border-border/80 bg-card p-8 sm:p-12 shadow-lg"
                        >
                            <div className="text-center">
                                <span className="text-xs font-bold tracking-widest text-primary uppercase">Candidate Profile</span>
                                <h2 className="mt-2 text-3xl font-extrabold text-foreground sm:text-4xl">
                                    IS THIS RIGHT FOR YOU?
                                </h2>
                                <p className="mt-2 text-muted-foreground font-medium text-base">
                                    Designed for individuals who:
                                </p>
                            </div>

                            <div className="mt-8 space-y-4">
                                {[
                                    "Want a structured approach to weight loss",
                                    "Prefer to learn and work through a system independently",
                                    "Want practical tools to apply what they learn",
                                    "Are ready to work with their own measurements and information",
                                    "Want to actively track their progress",
                                ].map((point, idx) => (
                                    <div key={idx} className="flex items-start gap-4 rounded-2xl border border-border/60 bg-muted/40 p-4 transition-colors hover:border-primary/40">
                                        <div className="h-7 w-7 rounded-full gradient-phoenix text-white flex items-center justify-center shrink-0 mt-0.5 shadow-phoenix">
                                            <UserCheck className="h-4 w-4" />
                                        </div>
                                        <p className="text-sm font-semibold text-foreground leading-relaxed pt-1">
                                            {point}
                                        </p>
                                    </div>
                                ))}
                            </div>
                        </motion.div>
                    </div>
                </section>

                {/* WHAT HAPPENS AFTER ENROLMENT? */}
                <section className="py-24 border-t border-border/40 text-center">
                    <div className="container mx-auto px-6 lg:px-12 max-w-6xl">
                        <div className="max-w-3xl mx-auto mb-16">
                            <span className="text-xs font-bold tracking-widest text-primary uppercase">Onboarding Pathway</span>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                WHAT HAPPENS AFTER ENROLMENT?
                            </h2>
                        </div>

                        {/* Timeline horizontal steps */}
                        <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-9">
                            {[
                                "Purchase",
                                "Receive Login",
                                "Enter Dashboard",
                                "Watch & Learn",
                                "Download Workbook",
                                "Write & Calculate",
                                "Apply",
                                "Track",
                                "Progress Through 5 Zones",
                            ].map((stepName, idx) => (
                                <motion.div
                                    key={idx}
                                    initial={{ opacity: 0, scale: 0.9 }}
                                    whileInView={{ opacity: 1, scale: 1 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: idx * 0.05 }}
                                    className="rounded-2xl border border-border/70 bg-card p-3 flex flex-col items-center justify-center text-center shadow-sm hover:border-primary/40 hover:shadow-md transition-all"
                                >
                                    <span className="h-6 w-6 rounded-full bg-primary/10 text-primary text-[10px] font-black flex items-center justify-center mb-2">
                                        {idx + 1}
                                    </span>
                                    <span className="text-xs font-bold text-foreground leading-tight">
                                        {stepName}
                                    </span>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* BEGIN YOUR 15-WEEK JOURNEY */}
                <section className="py-24 border-t border-border/40 text-center relative overflow-hidden">
                    <div className="container mx-auto px-6 lg:px-12 max-w-4xl relative">
                        <div className="rounded-3xl border border-primary/30 bg-gradient-to-b from-primary/10 via-card to-card p-10 sm:p-16 shadow-xl relative overflow-hidden">
                            <div className="absolute -top-24 -right-24 h-64 w-64 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

                            <h2 className="text-3xl font-extrabold tracking-tight text-foreground sm:text-5xl">
                                BEGIN YOUR 15-WEEK JOURNEY
                            </h2>
                            <p className="mt-3 text-xl font-bold text-gradient-phoenix">
                                Learn the framework. Build your plan. Follow your journey.
                            </p>
                            <p className="mt-4 text-base font-semibold text-muted-foreground">
                                Horizon Fit 15-Week Self-Guided Weight Loss System
                            </p>

                            <div className="mt-8 flex justify-center">
                                <Button size="xl" variant="phoenix" className="shadow-phoenix rounded-full px-10 font-bold text-lg group" asChild>
                                    <Link to="/enroll">
                                        Enrol Now
                                        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
                                    </Link>
                                </Button>
                            </div>
                        </div>
                    </div>
                </section>

                {/* FREQUENTLY ASKED QUESTIONS */}
                <section className="py-24 bg-muted/30 border-t border-border/40">
                    <div className="container mx-auto px-6 lg:px-12 max-w-3xl">
                        <div className="text-center mb-12">
                            <span className="text-xs font-bold tracking-widest text-primary uppercase">Program Details</span>
                            <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
                                FAQ
                            </h2>
                        </div>

                        <Accordion type="single" collapsible className="w-full space-y-4">
                            {[
                                {
                                    q: "What do I receive after enrolment?",
                                    a: "You receive login credentials to your personal Horizon Fit dashboard, where you can access the learning videos, workbooks and progress-tracking features.",
                                },
                                {
                                    q: "Do I need to complete the workbook?",
                                    a: "Yes. The workbook is an essential working component of the system. You use it to record your information, work through the required calculations and activities, and build your own journey.",
                                },
                                {
                                    q: "How does the 15-week journey work?",
                                    a: "The journey is divided into 5 Zones of 3 weeks each. Each Zone has its own learning content, workbook and activities.",
                                },
                                {
                                    q: "Do I need any special equipment?",
                                    a: "The specific requirements are explained within the relevant learning content and workbooks. You follow the instructions provided for each stage.",
                                },
                                {
                                    q: "Is this a self-guided program?",
                                    a: "Yes. The system is designed for you to learn and work through the framework independently using the videos, workbooks, dashboard and tracking tools.",
                                },
                                {
                                    q: "Is this a medical consultation or treatment program?",
                                    a: "No. This is a self-guided educational and lifestyle-management program for weight loss. It does not replace individual medical diagnosis or treatment.",
                                },
                            ].map((faq, idx) => (
                                <AccordionItem key={idx} value={`item-${idx}`} className="rounded-2xl border border-border/70 bg-card px-6 py-1 shadow-sm transition-all hover:border-primary/40">
                                    <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline hover:text-primary text-base py-4">
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

                {/* IMPORTANT INFORMATION */}
                <section className="py-16 border-t border-border/40 bg-amber-500/5 text-center">
                    <div className="container mx-auto px-6 lg:px-12 max-w-4xl">
                        <div className="rounded-3xl border border-amber-500/30 bg-card p-8 shadow-sm">
                            <div className="inline-flex items-center gap-2 text-amber-600 font-extrabold text-sm uppercase tracking-widest mb-3">
                                <ShieldAlert className="h-5 w-5" />
                                <span>IMPORTANT INFORMATION</span>
                            </div>
                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                This is a self-guided educational and lifestyle-management program for weight loss. It provides structured learning, workbooks, tools and tracking features and does not replace individual medical diagnosis or treatment. If you have a medical condition, significant symptoms or specific healthcare needs, seek appropriate medical advice.
                            </p>
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
                            <p className="text-xs font-semibold text-muted-foreground mt-1">15-Week Self-Guided Weight Loss System</p>
                        </div>

                        <div className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-xs font-semibold text-muted-foreground">
                            <Link to="/" className="hover:text-primary transition-colors">Home</Link>
                            <Link to="/self-guided-system" className="hover:text-primary transition-colors">Weight Loss System</Link>
                            <Link to="/enroll" className="hover:text-primary transition-colors">Enrol Now</Link>
                            <Link to="/book-consultation" className="hover:text-primary transition-colors">Book Assessment</Link>
                            <Link to="/auth" className="hover:text-primary transition-colors">Client Login</Link>
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

export default SelfGuidedSystemPage;
