import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
    ChevronDown,
    ArrowRight,
    Calendar,
    CheckCircle,
    Droplets,
    Utensils,
    Dumbbell,
    Moon,
    Brain,
    BookOpen,
    Video,
    FileText,
    BarChart2,
    Phone,
    LayoutDashboard,
    Stethoscope,
    Users,
    Laptop,
    Clock,
    ShieldCheck,
} from "lucide-react";

// ─── Animation Variants ──────────────────────────────────────────────────────
const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};

const itemVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};

const fadeUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

// ─── Data ─────────────────────────────────────────────────────────────────────
const ZONES = [
    {
        zone: 1,
        title: "Foundation",
        days: "Days 1–21",
        desc: "Build the base. Establish core daily habits and understand your personal health baseline.",
    },
    {
        zone: 2,
        title: "Momentum",
        days: "Days 22–42",
        desc: "Deepen your habits. Unlock new zone content and begin seeing early results.",
    },
    {
        zone: 3,
        title: "Transformation",
        days: "Days 43–63",
        desc: "Your body and mind begin to change. Advanced habit guides and doctor-curated resources unlock.",
    },
    {
        zone: 4,
        title: "Mastery",
        days: "Days 64–84",
        desc: "Refine your lifestyle. Maximise performance with personalised zone-level guidance.",
    },
    {
        zone: 5,
        title: "Freedom",
        days: "Days 85–105",
        desc: "Achieve lasting health. Sustain your results with the knowledge to maintain them for life.",
    },
];

const HABITS = [
    { icon: Droplets, code: "Hydration", color: "text-sky-500", bg: "bg-sky-50" },
    { icon: Utensils, code: "Nutrition", color: "text-green-600", bg: "bg-green-50" },
    { icon: Dumbbell, code: "Exercise", color: "text-primary", bg: "bg-orange-50" },
    { icon: Moon, code: "Sleep", color: "text-indigo-500", bg: "bg-indigo-50" },
    { icon: Brain, code: "Mindset", color: "text-purple-500", bg: "bg-purple-50" },
];

const PORTAL_FEATURES = [
    {
        icon: CheckCircle,
        title: "Daily Habit Tracking",
        desc: "Check off your 5 daily habits every day — Hydration, Nutrition, Exercise, Sleep, and Mindset. Each habit has personalised sub-tasks assigned by the doctor.",
    },
    {
        icon: BookOpen,
        title: "Doctor-Assigned Habit Guides",
        desc: "Each zone unlocks personalised habit guides written specifically for your health goal category by Dr. Jabaarrul.",
    },
    {
        icon: Video,
        title: "Zone Videos",
        desc: "Educational videos released zone by zone so you learn at the right pace and never feel overwhelmed.",
    },
    {
        icon: FileText,
        title: "Downloadable PDF Resources",
        desc: "Zone-specific PDF guides and reference materials you can download and refer to offline at any time.",
    },
    {
        icon: BarChart2,
        title: "Weekly Progress Logs",
        desc: "Log key body metrics every week. Watch your numbers change over the 15 weeks to measure your real progress.",
    },
    {
        icon: Phone,
        title: "Consultation Booking",
        desc: "Book a paid 1-on-1 consultation with Dr. Jabaarrul directly from your dashboard whenever you need guidance.",
    },
    {
        icon: LayoutDashboard,
        title: "Personal Dashboard",
        desc: "Your central hub — current zone, day counter, zone progress bar, and quick access to every feature in one place.",
    },
];

const GETTING_STARTED = [
    { step: 1, text: "Purchase a program on this website" },
    { step: 2, text: "Receive your login credentials by email immediately after payment is confirmed" },
    { step: 3, text: "Log in to your personal dashboard from any device — phone, tablet, or laptop" },
    { step: 4, text: "See your current zone and begin your daily habit checklist" },
    { step: 5, text: "Watch zone videos and download zone PDF resources at your own pace" },
    { step: 6, text: "Submit your daily habits and weekly progress log to track your transformation" },
    { step: 7, text: "Book a consultation with Dr. Jabaarrul whenever you need personal guidance" },
    { step: 8, text: "Complete all 5 zones and achieve your health transformation" },
];

const FAQS = [
    {
        q: "What exactly is HorizonFit and what am I buying?",
        a: "HorizonFit is a doctor-designed, self-paced digital health coaching program. When you purchase, you get permanent access to your personal patient portal for 15 weeks — including zone content, habit tracking tools, educational videos, PDF resources, weekly progress logs, and the ability to book consultations with Dr. Jabaarrul.",
    },
    {
        q: "How do I access the program after purchase?",
        a: "Immediately after a successful payment, you will receive an email with your login credentials. Log in at horizonfit.in/auth from any device and your dashboard will be ready.",
    },
    {
        q: "Do I need to download an app?",
        a: "No. HorizonFit is a web application. It works entirely in your browser on any device — smartphone, tablet, or desktop. No app store download required.",
    },
    {
        q: "Is this a live class or pre-recorded?",
        a: "All content is pre-recorded and self-paced. You are not required to attend anything live. You log in when it suits you, complete your habits, watch videos, and progress through the zones at your own schedule.",
    },
    {
        q: "What are the 5 zones and how do they work?",
        a: "The program is divided into 5 zones — Foundation, Momentum, Transformation, Mastery, and Freedom. Each zone covers 21 days. You progress sequentially from Zone 1 to Zone 5. Each zone unlocks new videos, PDFs, and personalised habit guides.",
    },
    {
        q: "What are the 5 daily habits?",
        a: "The 5 daily habits are Hydration, Nutrition, Exercise, Sleep, and Mindset. Each habit has personalised sub-tasks assigned by Dr. Jabaarrul. You check them off every day inside your dashboard.",
    },
    {
        q: "Can I book a consultation with the doctor?",
        a: "Yes. The patient dashboard includes a consultation booking feature. You can book a 1-on-1 paid session with Dr. Jabaarrul directly through the portal whenever you need personal guidance.",
    },
    {
        q: "How long does the program last?",
        a: "The program spans 15 weeks (105 days) across 5 zones of 21 days each. You control your pace within the program.",
    },
    {
        q: "What devices can I use?",
        a: "Any device with a web browser and an internet connection — smartphone, tablet, laptop, or desktop. The dashboard is fully responsive.",
    },
    {
        q: "Is this suitable if I have a medical condition?",
        a: "HorizonFit is designed by a qualified doctor. However, if you have a serious pre-existing medical condition, consult your primary care physician before starting. The program is educational and self-paced, not a substitute for emergency or specialist medical care.",
    },
    {
        q: "What payment methods are accepted?",
        a: "Payments are processed via Razorpay, which supports UPI, debit cards, credit cards, net banking, and popular wallets.",
    },
    {
        q: "What is the refund policy?",
        a: "There is no refund once access is activated and login credentials are issued. Please review the full Refund Policy before purchase. If you do not receive access within 72 hours of payment due to a technical error on our side, contact us at info@horizonfit.in.",
    },
];

// ─── Sub-section heading component ───────────────────────────────────────────
const SectionHeading = ({
    label,
    title,
    subtitle,
}: {
    label: string;
    title: string;
    subtitle?: string;
}) => (
    <motion.div
        variants={fadeUp}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true }}
        className="mb-12 text-center"
    >
        <span className="mb-3 inline-block rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            {label}
        </span>
        <h2 className="mb-4 text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
        {subtitle && (
            <p className="mx-auto max-w-2xl text-lg text-muted-foreground">{subtitle}</p>
        )}
    </motion.div>
);

// ─── FAQ Accordion ───────────────────────────────────────────────────────────
const FaqItem = ({
    question,
    answer,
    isOpen,
    onToggle,
}: {
    question: string;
    answer: string;
    isOpen: boolean;
    onToggle: () => void;
}) => (
    <div
        className={`rounded-xl border transition-all duration-200 ${isOpen
            ? "border-primary/30 shadow-sm"
            : "border-border/50"
            } overflow-hidden`}
    >
        <button
            className={`flex w-full items-center justify-between gap-4 px-6 py-5 text-left transition-colors ${isOpen ? "bg-primary/5" : "bg-background hover:bg-muted/40"
                }`}
            onClick={onToggle}
        >
            <span
                className={`text-base font-semibold ${isOpen ? "text-primary" : "text-foreground"
                    }`}
            >
                {question}
            </span>
            <ChevronDown
                className={`h-5 w-5 shrink-0 transition-transform duration-300 ${isOpen ? "rotate-180 text-primary" : "text-muted-foreground"
                    }`}
            />
        </button>
        <AnimatePresence initial={false}>
            {isOpen && (
                <motion.div
                    key="content"
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.28, ease: "easeInOut" }}
                    className="overflow-hidden"
                >
                    <div className="border-t border-border/40 bg-background px-6 py-5">
                        <p className="leading-relaxed text-muted-foreground">{answer}</p>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    </div>
);

// ─── Main Component ───────────────────────────────────────────────────────────
export const ProductEducationSection: React.FC = () => {
    const [openFaq, setOpenFaq] = useState<number | null>(null);

    const toggleFaq = (index: number) =>
        setOpenFaq((prev) => (prev === index ? null : index));

    return (
        <div className="overflow-hidden">
            {/* ── 1. What Is HorizonFit ─────────────────────────────────────────── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <SectionHeading
                        label="What Is HorizonFit"
                        title="A Doctor-Led Health Program With Your Own Personal Portal"
                        subtitle="Not a gym. Not a live class. Not a generic app. HorizonFit is a structured, doctor-designed health transformation program — delivered entirely through your own secure digital dashboard."
                    />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-6 md:grid-cols-3"
                    >
                        {[
                            {
                                icon: Stethoscope,
                                title: "Doctor-Designed",
                                desc: "Every zone, every habit, every resource has been designed by Dr. M. Jabaarrul based on years of clinical experience in metabolic health.",
                            },
                            {
                                icon: LayoutDashboard,
                                title: "Your Personal Portal",
                                desc: "After purchase you get your own secure patient dashboard. Everything is tracked — your zone, your daily habits, your weekly progress, your entire journey.",
                            },
                            {
                                icon: Clock,
                                title: "Fully Self-Paced",
                                desc: "Work through the program on your schedule. Log your habits at midnight if you want. There are no live sessions, no fixed appointment windows, no waiting.",
                            },
                        ].map((card) => (
                            <motion.div
                                key={card.title}
                                variants={itemVariants}
                                className="card-elevated group p-8 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
                                    <card.icon className="h-6 w-6 text-primary-foreground" />
                                </div>
                                <h3 className="mb-3 text-xl font-bold text-foreground">{card.title}</h3>
                                <p className="text-muted-foreground">{card.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── 2. Programs Available ─────────────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <SectionHeading
                        label="Programs Available"
                        title="The HorizonFit 15-Week Program"
                        subtitle="One structured program with three health goal pathways. Choose the category that matches your health objective — the zone structure, habits, and content adapt to your goal."
                    />

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mx-auto max-w-3xl"
                    >
                        <div className="card-elevated overflow-hidden">
                            {/* Header */}
                            <div className="gradient-teal p-8 text-center">
                                <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-secondary-foreground/70">
                                    Self-Learning Program
                                </p>
                                <h3 className="mb-2 text-3xl font-bold text-secondary-foreground">
                                    15-Week Health Transformation
                                </h3>
                                <p className="mb-4 text-secondary-foreground/80">
                                    Doctor-designed · 5 zones · 21 days each · Personal portal
                                </p>
                                <div className="inline-flex items-baseline gap-1">
                                    <span className="text-5xl font-extrabold text-secondary-foreground">
                                        ₹7,000 <span className="text-2xl font-medium">+ GST</span>
                                    </span>
                                    <span className="text-secondary-foreground/70">/ one-time</span>
                                </div>
                            </div>

                            {/* Categories */}
                            <div className="border-t border-border p-8">
                                <p className="mb-5 text-center text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                                    Available for all three health goal categories
                                </p>
                                <div className="grid gap-4 sm:grid-cols-3">
                                    {[
                                        { label: "Weight Loss", emoji: "⚖️" },
                                        { label: "Weight Gain", emoji: "💪" },
                                        { label: "Pre-Diabetic", emoji: "🩺" },
                                    ].map((cat) => (
                                        <div
                                            key={cat.label}
                                            className="flex flex-col items-center gap-2 rounded-xl border border-border/60 bg-muted/30 px-4 py-5"
                                        >
                                            <span className="text-3xl">{cat.emoji}</span>
                                            <span className="font-semibold text-foreground">{cat.label}</span>
                                        </div>
                                    ))}
                                </div>

                                {/* Features */}
                                <div className="mt-8 grid gap-3 sm:grid-cols-2">
                                    {[
                                        "15 weeks of structured doctor-designed content",
                                        "Access to all 5 progressive zones",
                                        "Daily habit tracking with doctor-assigned guides",
                                        "Zone videos and downloadable PDF resources",
                                        "Weekly progress log and body metrics tracking",
                                        "Personal dashboard with zone counter and progress",
                                        "Consultation booking with Dr. Jabaarrul",
                                        "Instant account access after payment",
                                    ].map((f) => (
                                        <div key={f} className="flex items-start gap-3 text-sm text-foreground">
                                            <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-green-500" />
                                            {f}
                                        </div>
                                    ))}
                                </div>

                                <div className="mt-8 flex justify-center">
                                    <Link to="/enroll">
                                        <Button variant="phoenix" size="lg">
                                            Purchase This Program
                                            <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── 3. Zone System ────────────────────────────────────────────────── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <SectionHeading
                        label="The Zone System"
                        title="5 Zones. 21 Days Each. One Progressive Journey."
                        subtitle="The entire HorizonFit program is built on a 5-zone structure. You move through each zone sequentially — each one unlocks new content, habits, and resources."
                    />

                    {/* Zone cards — desktop: horizontal flow */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-4 md:grid-cols-5"
                    >
                        {ZONES.map((z, i) => (
                            <motion.div key={z.zone} variants={itemVariants} className="relative">
                                <div className="card-elevated group h-full p-6 text-center transition-all duration-300 hover:-translate-y-1">
                                    {/* Zone number circle */}
                                    <div
                                        className={`mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-lg font-extrabold ${i === 4
                                            ? "gradient-phoenix text-primary-foreground shadow-phoenix"
                                            : "border-2 border-primary/30 bg-primary/5 text-primary"
                                            }`}
                                    >
                                        {z.zone}
                                    </div>
                                    <p className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                                        {z.days}
                                    </p>
                                    <h3 className="mb-2 text-base font-bold text-foreground">{z.title}</h3>
                                    <p className="text-xs leading-relaxed text-muted-foreground">{z.desc}</p>
                                </div>

                                {/* Connecting line between zones */}
                                {i < 4 && (
                                    <div className="absolute right-0 top-9 hidden h-0.5 w-4 -translate-y-px translate-x-full bg-primary/20 md:block" />
                                )}
                            </motion.div>
                        ))}
                    </motion.div>

                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mt-10 rounded-xl border border-primary/15 bg-primary/5 p-6 text-center"
                    >
                        <p className="text-muted-foreground">
                            <strong className="text-foreground">How zoning works:</strong> Each zone covers
                            exactly 21 days. As you complete your daily habits and progress through the days,
                            your dashboard advances you to the next zone — automatically unlocking new videos,
                            PDF resources, and habit guides prepared by Dr. Jabaarrul for that zone.
                        </p>
                    </motion.div>
                </div>
            </section>

            {/* ── 4. What the Patient Gets ──────────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <SectionHeading
                        label="What You Get Access To"
                        title="Everything Inside Your Patient Portal"
                        subtitle="Your dashboard is your complete health command centre. Here is exactly what you get access to from Day 1."
                    />

                    {/* 5 Daily Habits highlight */}
                    <motion.div
                        variants={fadeUp}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mb-10 overflow-hidden rounded-2xl border border-border/50 bg-background shadow-sm"
                    >
                        <div className="border-b border-border/50 bg-muted/40 px-8 py-5">
                            <h3 className="text-lg font-bold text-foreground">
                                Your 5 Daily Habits — Tracked Every Day
                            </h3>
                            <p className="mt-1 text-sm text-muted-foreground">
                                These are the core of the program. Every day you log how well you followed each
                                habit. The doctor assigns personalised sub-tasks within each habit for every zone.
                            </p>
                        </div>
                        <div className="grid gap-4 p-8 sm:grid-cols-5">
                            {HABITS.map((h) => (
                                <div
                                    key={h.code}
                                    className={`flex flex-col items-center gap-3 rounded-xl border border-border/40 ${h.bg} px-4 py-5`}
                                >
                                    <h.icon className={`h-8 w-8 ${h.color}`} />
                                    <span className="text-sm font-semibold text-foreground">{h.code}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Portal features grid */}
                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4"
                    >
                        {PORTAL_FEATURES.map((f) => (
                            <motion.div
                                key={f.title}
                                variants={itemVariants}
                                className="card-elevated flex flex-col gap-3 p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg"
                            >
                                <div className="flex h-12 w-12 items-center justify-center rounded-xl gradient-teal">
                                    <f.icon className="h-5 w-5 text-secondary-foreground" />
                                </div>
                                <h4 className="font-bold text-foreground">{f.title}</h4>
                                <p className="text-sm leading-relaxed text-muted-foreground">{f.desc}</p>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </section>

            {/* ── 5. How to Get Started ─────────────────────────────────────────── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <SectionHeading
                        label="Getting Started"
                        title="What Happens After You Purchase"
                        subtitle="From payment to your first zone — here is the exact journey step by step."
                    />

                    <motion.div
                        variants={containerVariants}
                        initial="hidden"
                        whileInView="visible"
                        viewport={{ once: true }}
                        className="mx-auto max-w-3xl"
                    >
                        <div className="relative space-y-0">
                            {GETTING_STARTED.map((item, i) => (
                                <motion.div
                                    key={item.step}
                                    variants={itemVariants}
                                    className="relative flex gap-6 pb-8 last:pb-0"
                                >
                                    {/* Vertical line */}
                                    {i < GETTING_STARTED.length - 1 && (
                                        <div className="absolute left-5 top-12 h-full w-0.5 bg-border" />
                                    )}
                                    {/* Step circle */}
                                    <div
                                        className={`relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-sm font-bold ${item.step <= 2
                                            ? "gradient-phoenix text-primary-foreground shadow-phoenix"
                                            : item.step <= 5
                                                ? "gradient-teal text-secondary-foreground shadow-teal"
                                                : "border-2 border-primary/30 bg-primary/5 text-primary"
                                            }`}
                                    >
                                        {item.step}
                                    </div>
                                    {/* Content */}
                                    <div className="flex-1 pt-2">
                                        <p className="text-base text-foreground">{item.text}</p>
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </section>

            {/* ── 6 & 7. Who This Is For + Who Designed This (side by side) ───── */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <div className="grid gap-8 lg:grid-cols-2">
                        {/* Who This Is For */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="card-elevated p-8"
                        >
                            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-phoenix shadow-phoenix">
                                <Users className="h-6 w-6 text-primary-foreground" />
                            </div>
                            <h3 className="mb-4 text-2xl font-bold text-foreground">Who This Is For</h3>
                            <p className="mb-6 text-muted-foreground leading-relaxed">
                                HorizonFit is designed for anyone who needs a structured, doctor-backed health
                                program they can follow without fixed appointment schedules or clinic visits.
                            </p>
                            <div className="space-y-3">
                                {[
                                    "Busy professionals who cannot commit to fixed class times",
                                    "Homemakers who need flexibility within their daily schedule",
                                    "Entrepreneurs and shift workers with irregular hours",
                                    "Individuals managing weight issues or pre-diabetes",
                                    "Anyone who has tried generic programs and wants a medically-designed alternative",
                                ].map((item) => (
                                    <div key={item} className="flex items-start gap-3 text-sm text-foreground">
                                        <CheckCircle className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                        {item}
                                    </div>
                                ))}
                            </div>
                        </motion.div>

                        {/* Who Designed This */}
                        <motion.div
                            variants={fadeUp}
                            initial="hidden"
                            whileInView="visible"
                            viewport={{ once: true }}
                            className="card-elevated p-8"
                        >
                            <div className="mb-5 inline-flex h-14 w-14 items-center justify-center rounded-xl gradient-teal shadow-teal">
                                <Stethoscope className="h-6 w-6 text-secondary-foreground" />
                            </div>
                            <h3 className="mb-2 text-2xl font-bold text-foreground">Who Designed This</h3>
                            <p className="mb-1 text-lg font-semibold text-gradient-phoenix">
                                Dr. M. Jabaarrul
                            </p>
                            <p className="mb-1 text-sm font-medium text-muted-foreground">MBBS · AFIH</p>
                            <p className="mb-4 text-sm italic text-muted-foreground">
                                Fellowship in Clinical Diabetology
                            </p>
                            <p className="mb-6 text-muted-foreground leading-relaxed">
                                Every zone, every habit task, every guide, and every piece of content in
                                HorizonFit has been structured by Dr. Jabaarrul based on over 15 years of
                                clinical experience in metabolic health and lifestyle transformation.
                            </p>
                            <div className="flex items-center gap-3 rounded-lg border border-primary/15 bg-primary/5 p-4">
                                <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
                                <p className="text-sm text-foreground">
                                    The program carries the medical authority of a qualified MBBS physician
                                    specialised in diabetology — not a fitness influencer.
                                </p>
                            </div>
                            <p className="mt-5 text-sm text-muted-foreground">
                                You can read Dr. Jabaarrul's full profile in the{" "}
                                <span className="font-medium text-primary">Meet Your Specialist</span> section
                                below.
                            </p>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* ── 8. FAQ ────────────────────────────────────────────────────────── */}
            <section className="py-20">
                <div className="container mx-auto px-4">
                    <SectionHeading
                        label="Frequently Asked Questions"
                        title="Everything You Need to Know"
                        subtitle="These are the most common questions from people exploring HorizonFit. If your question is not here, email us at info@horizonfit.in."
                    />

                    <div className="mx-auto max-w-3xl space-y-3">
                        {FAQS.map((faq, i) => (
                            <motion.div
                                key={i}
                                variants={fadeUp}
                                initial="hidden"
                                whileInView="visible"
                                viewport={{ once: true, margin: "-40px" }}
                            >
                                <FaqItem
                                    question={faq.q}
                                    answer={faq.a}
                                    isOpen={openFaq === i}
                                    onToggle={() => toggleFaq(i)}
                                />
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* ── 9. Section CTA ────────────────────────────────────────────────── */}
            <section className="bg-muted/30 py-20">
                <div className="container mx-auto px-4">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.97 }}
                        whileInView={{ opacity: 1, scale: 1 }}
                        viewport={{ once: true }}
                        className="overflow-hidden rounded-2xl gradient-phoenix p-12 text-center shadow-phoenix"
                    >
                        <div className="mx-auto mb-3 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary-foreground/15">
                            <Laptop className="h-7 w-7 text-primary-foreground" />
                        </div>
                        <h2 className="mb-4 text-3xl font-bold text-primary-foreground md:text-4xl">
                            Ready to Begin Your Health Transformation?
                        </h2>
                        <p className="mx-auto mb-10 max-w-xl text-primary-foreground/85">
                            Purchase your program today and receive immediate access to your personal
                            dashboard. Your 15-week journey starts the moment you log in.
                        </p>
                        <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
                            <Link to="/enroll">
                                <Button
                                    size="xl"
                                    className="bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
                                >
                                    Purchase Program
                                    <ArrowRight className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                            <Link to="/book-consultation">
                                <Button
                                    size="xl"
                                    variant="outline"
                                    className="border-primary-foreground/40 text-primary-foreground bg-transparent hover:bg-primary-foreground/10 font-semibold"
                                >
                                    Book a Consultation
                                    <Calendar className="ml-2 h-5 w-5" />
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </section>
        </div>
    );
};
