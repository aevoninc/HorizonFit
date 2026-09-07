import React, { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
    ShieldAlert,
    ShieldCheck,
    FileText,
    ArrowLeft,
    Search,
    Printer,
    ChevronRight,
    Sparkles,
    Lock,
    Building2,
    Mail,
    CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import logo from "../../public/logo.png";

export type LegalTab = "disclaimer" | "privacy-policy" | "terms-and-conditions";

interface LegalPageProps {
    defaultTab?: LegalTab;
}

export const LegalPage: React.FC<LegalPageProps> = ({ defaultTab }) => {
    const location = useLocation();
    const navigate = useNavigate();

    // Determine active tab from URL path or prop
    const getInitialTab = (): LegalTab => {
        if (defaultTab) return defaultTab;
        const path = location.pathname.toLowerCase();
        if (path.includes("privacy")) return "privacy-policy";
        if (path.includes("terms")) return "terms-and-conditions";
        if (path.includes("disclaimer")) return "disclaimer";
        return "disclaimer";
    };

    const [activeTab, setActiveTab] = useState<LegalTab>(getInitialTab());
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        const path = location.pathname.toLowerCase();
        if (path.includes("privacy")) setActiveTab("privacy-policy");
        else if (path.includes("terms")) setActiveTab("terms-and-conditions");
        else if (path.includes("disclaimer")) setActiveTab("disclaimer");
    }, [location.pathname]);

    const handleTabChange = (tab: LegalTab) => {
        setActiveTab(tab);
        setSearchQuery("");
        navigate(`/${tab}`, { replace: true });
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    // ---------------------------------------------------------------------------
    // DATA STRUCTURES
    // ---------------------------------------------------------------------------

    const disclaimerData = {
        title: "HORIZON FIT — DISCLAIMER",
        lastUpdated: "13 August 2026",
        preamble:
            "Please read this Disclaimer carefully before using the Horizon Fit website, programs, assessments, educational resources, or services.",
        sections: [
            {
                num: 1,
                title: "GENERAL PURPOSE",
                content: [
                    "Horizon Fit is a doctor-led metabolic health platform providing structured health education, assessment, lifestyle guidance, weight management support, and related services.",
                    "The nature of each service may differ.",
                    "Some Horizon Fit services are educational and self-guided, while others may involve personalised support or healthcare professionals.",
                ],
            },
            {
                num: 2,
                title: "EDUCATIONAL CONTENT",
                content: [
                    "Information provided through the Horizon Fit website, digital programs, articles, videos, guides, workbooks, trackers, and other educational resources is intended to support health awareness, education, and lifestyle management.",
                    "Educational content should not be interpreted as a substitute for professional medical evaluation where medical evaluation is required.",
                ],
            },
            {
                num: 3,
                title: "MEDICAL SERVICES",
                content: [
                    "Where Horizon Fit specifically provides a healthcare service through a qualified healthcare professional, the service will be provided within the scope of that professional's qualifications and applicable requirements.",
                    "However, information displayed elsewhere on the website or within general educational content should not automatically be interpreted as a medical consultation.",
                ],
            },
            {
                num: 4,
                title: "NO UNIVERSAL MEDICAL ADVICE",
                content: [
                    "Health information cannot be assumed to be appropriate for every individual.",
                    "A person's age, medical history, medications, existing conditions, pregnancy status, laboratory findings, lifestyle, and other circumstances may affect what is appropriate for them.",
                    "Users should seek appropriate professional medical advice when necessary.",
                ],
            },
            {
                num: 5,
                title: "WEIGHT MANAGEMENT",
                content: [
                    "Horizon Fit may provide structured support for weight management, including weight loss, weight gain, or weight maintenance depending on the service or pathway.",
                    "Individual results vary.",
                    "No specific amount of weight change or timeframe is guaranteed.",
                ],
            },
            {
                num: 6,
                title: "METABOLIC HEALTH",
                content: [
                    "Horizon Fit may address areas such as:",
                    "• Prediabetes and glucose health",
                    "• Weight management",
                    "• Fatty liver and liver health",
                    "• Cardiometabolic health",
                    "• Lifestyle-related metabolic risk factors",
                    "• Nutrition",
                    "• Physical activity",
                    "• Sleep",
                    "• Hydration",
                    "• Behaviour and lifestyle change",
                    "Information regarding these areas is provided within the scope of the relevant Horizon Fit service.",
                ],
            },
            {
                num: 7,
                title: "ASSESSMENTS AND HEALTH INFORMATION",
                content: [
                    "A Horizon Fit assessment may help identify health markers, lifestyle factors, risk factors, or areas that may require further attention.",
                    "An assessment result does not by itself establish a diagnosis unless specifically provided as part of an appropriate clinical service by a qualified healthcare professional.",
                    "Users may be advised to seek further medical evaluation or investigation where appropriate.",
                ],
            },
            {
                num: 8,
                title: "INDIVIDUAL RESULTS VARY",
                content: [
                    "Health outcomes depend on numerous factors.",
                    "Horizon Fit does not guarantee specific results relating to: Weight, Blood glucose, HbA1c, Cholesterol, Liver markers, Blood pressure, Fitness, Energy levels, or Other health measurements.",
                    "Individual results may differ significantly.",
                ],
            },
            {
                num: 9,
                title: "MEDICATIONS AND TREATMENT",
                content: [
                    "Horizon Fit educational content should not be used to start, stop, modify, or replace prescription medication or other medical treatment without appropriate medical advice.",
                    "Users taking prescription medications should consult their treating healthcare professional before making significant changes to diet, exercise, supplements, or other lifestyle practices where medically relevant.",
                ],
            },
            {
                num: 10,
                title: "PRE-EXISTING CONDITIONS",
                content: [
                    "Individuals with existing medical conditions, those taking prescription medications, pregnant or breastfeeding individuals, and individuals with other specific health circumstances should seek appropriate professional advice before making significant lifestyle changes.",
                ],
            },
            {
                num: 11,
                title: "EMERGENCY SITUATIONS",
                content: [
                    "Horizon Fit services and educational materials are not intended for emergency medical situations.",
                    "If you experience symptoms that may represent a medical emergency, seek immediate medical attention through an appropriate emergency medical service or healthcare facility.",
                ],
            },
            {
                num: 12,
                title: "NO GUARANTEE OF OUTCOMES",
                content: [
                    "Horizon Fit makes no guarantee regarding any particular health, weight, metabolic, fitness, or lifestyle outcome.",
                    "Testimonials, examples, educational cases, or illustrations, where provided, should not be interpreted as a guarantee of similar results.",
                ],
            },
            {
                num: 13,
                title: "THIRD-PARTY INFORMATION",
                content: [
                    "The Horizon Fit website may contain references or links to third-party websites, services, products, or resources.",
                    "Such references do not necessarily constitute an endorsement.",
                    "Horizon Fit is not responsible for information, services, products, or practices independently provided by third parties.",
                ],
            },
            {
                num: 14,
                title: "LIMITATION OF LIABILITY",
                content: [
                    "To the maximum extent permitted by applicable law, Horizon Fit Health Management Private Limited shall not be liable for damages arising from reliance upon general educational information, inability to access a service, individual health outcomes, or use of third-party services.",
                    "Nothing in this Disclaimer is intended to exclude or limit liability where such exclusion or limitation is not permitted by applicable law.",
                ],
            },
            {
                num: 15,
                title: "USER RESPONSIBILITY",
                content: [
                    "Users remain responsible for:",
                    "• Providing accurate information.",
                    "• Making informed decisions.",
                    "• Following appropriate professional advice.",
                    "• Seeking medical attention when necessary.",
                    "• Not using general educational information as a substitute for necessary medical care.",
                ],
            },
            {
                num: 16,
                title: "CHANGES TO THIS DISCLAIMER",
                content: [
                    "Horizon Fit may update this Disclaimer from time to time.",
                    "The updated version will be published on the Horizon Fit website with the revised \"Last Updated\" date.",
                ],
            },
            {
                num: 17,
                title: "ACCEPTANCE",
                content: [
                    "By accessing or using the Horizon Fit website, programs, assessments, or services, you acknowledge that you have read and understood this Disclaimer and agree to use Horizon Fit services appropriately.",
                ],
            },
        ],
    };

    const privacyData = {
        title: "HORIZON FIT — PRIVACY POLICY",
        lastUpdated: "13 August 2026",
        preamble:
            'Horizon Fit Health Management Private Limited ("Horizon Fit", "Company", "We", "Our", or "Us") respects your privacy and is committed to protecting the personal information you provide while using our website, programs, assessments, digital platforms, and related services.\nThis Privacy Policy explains how Horizon Fit may collect, use, store, protect, and disclose information in connection with the Horizon Fit platform and its services.',
        sections: [
            {
                num: 1,
                title: "INFORMATION WE COLLECT",
                content: [
                    "Depending on the services you use, we may collect information including:",
                    "Personal Information:",
                    "• Name",
                    "• Mobile number",
                    "• Email address",
                    "• Age",
                    "• Gender",
                    "• City or location",
                    "• Communication preferences",
                    "Health and Assessment Information:",
                    "Where voluntarily provided for an assessment or health-related service, we may collect information such as: Height, Weight, Waist circumference, Blood pressure, Physical activity information, Lifestyle information, Sleep information, Nutrition-related information, Relevant medical history, Family history, Existing health conditions, Medications or supplements, Health assessment responses, Laboratory or investigation results where provided, and Other information relevant to the service being requested.",
                    "Account and Program Information:",
                    "Where applicable: Username or account details, Login activity, Program access records, Assessment records, Program participation, Progress information, and Communications with Horizon Fit.",
                    "Payment Information:",
                    "We may receive transaction details, payment status, and payment reference numbers. Payment credentials such as card numbers, CVV, UPI PINs, passwords, or banking credentials are NOT stored by Horizon Fit where payment processing is handled by third-party payment providers.",
                ],
            },
            {
                num: 2,
                title: "HOW WE USE YOUR INFORMATION",
                content: [
                    "We may use information provided to us to:",
                    "• Provide requested Horizon Fit services",
                    "• Conduct health and lifestyle assessments",
                    "• Understand individual health and lifestyle information",
                    "• Provide personalised guidance where applicable",
                    "• Provide access to programs and digital resources",
                    "• Create and manage user accounts",
                    "• Process and verify payments",
                    "• Communicate with users regarding services",
                    "• Provide technical and customer support",
                    "• Maintain service and program records",
                    "• Improve our programs, systems, and user experience",
                    "• Maintain security and prevent misuse",
                    "• Comply with applicable legal and regulatory requirements",
                ],
            },
            {
                num: 3,
                title: "HEALTH INFORMATION",
                content: [
                    "Certain Horizon Fit services may involve the collection of health, lifestyle, assessment, or medical information voluntarily provided by the user.",
                    "Such information may be used only for the purposes reasonably necessary to provide the requested service, assessment, guidance, or healthcare-related support.",
                    "Users should provide accurate information and inform Horizon Fit where information previously provided is inaccurate or has changed.",
                ],
            },
            {
                num: 4,
                title: "COMMUNICATIONS",
                content: [
                    "Depending on the services you use, Horizon Fit may communicate with you through Email, Phone, SMS, WhatsApp, Website or platform notifications, and Other communication channels used to provide the requested service.",
                    "Communications may include account information, assessment-related communication, program updates, service information, technical support, and other relevant communications.",
                ],
            },
            {
                num: 5,
                title: "INFORMATION SHARING",
                content: [
                    "Horizon Fit does not sell your personal information.",
                    "Information may be shared with service providers where reasonably necessary to operate and provide Horizon Fit services, including: Payment service providers, Hosting and cloud service providers, Learning management or digital platform providers, Communication service providers, Technology and software providers, Professional service providers, Healthcare professionals or service partners involved in providing a requested service, and Government, regulatory, or law-enforcement authorities where required by applicable law.",
                    "Information shared with third parties will be limited to what is reasonably necessary for the relevant purpose.",
                ],
            },
            {
                num: 6,
                title: "DATA SECURITY",
                content: [
                    "Horizon Fit takes reasonable administrative, technical, and organisational measures to protect personal information against unauthorised access, misuse, loss, alteration, disclosure, or destruction.",
                    "However, no electronic transmission, website, or internet-based storage system can be guaranteed to be completely secure.",
                ],
            },
            {
                num: 7,
                title: "DATA RETENTION",
                content: [
                    "We may retain information for as long as reasonably necessary for: Providing services, Maintaining user and program records, Transaction and accounting purposes, Legal and regulatory requirements, Security and fraud prevention, Resolving disputes, and Maintaining legitimate business records.",
                    "Where information is no longer required for a legitimate purpose or legal requirement, it may be deleted or securely disposed of in accordance with applicable requirements.",
                ],
            },
            {
                num: 8,
                title: "COOKIES AND ANALYTICS",
                content: [
                    "The Horizon Fit website and digital platforms may use cookies, analytics tools, and similar technologies to: Improve website functionality, Understand website usage, Improve user experience, Monitor platform performance, Maintain security, and Understand general traffic and engagement patterns.",
                    "You may manage available cookie controls through your browser or applicable website settings.",
                ],
            },
            {
                num: 9,
                title: "THIRD-PARTY SERVICES",
                content: [
                    "Horizon Fit may use third-party platforms and services for payment processing, hosting, communications, analytics, learning management, scheduling, and other operational purposes.",
                    "Third-party services may operate under their own privacy policies and terms.",
                    "Horizon Fit is not responsible for privacy practices independently applied by third-party platforms.",
                ],
            },
            {
                num: 10,
                title: "YOUR RIGHTS AND REQUESTS",
                content: [
                    "Subject to applicable law, users may request assistance regarding their personal information, including: Correction of inaccurate information, Updating personal information, Access-related assistance, Withdrawal of consent where applicable, and Other rights available under applicable data protection law.",
                    "Requests may be submitted through the official Horizon Fit communication channels.",
                ],
            },
            {
                num: 11,
                title: "CHILDREN",
                content: [
                    "Horizon Fit services are generally intended for adults.",
                    "Where a service involves an individual who has not attained the applicable age of majority, appropriate consent or involvement of a parent or lawful guardian may be required.",
                ],
            },
            {
                num: 12,
                title: "POLICY UPDATES",
                content: [
                    "Horizon Fit may update this Privacy Policy from time to time to reflect changes in our services, technology, legal requirements, or privacy practices.",
                    "The updated version will be published on the Horizon Fit website with the revised \"Last Updated\" date.",
                ],
            },
            {
                num: 13,
                title: "CONTACT",
                content: [
                    "For privacy-related questions, requests, or concerns:",
                    "Horizon Fit Health Management Private Limited",
                    "Email: info@horizonfit.in",
                ],
            },
            {
                num: 14,
                title: "ACCEPTANCE",
                content: [
                    "By accessing or using the Horizon Fit website, assessments, programs, or services, you acknowledge that you have read and understood this Privacy Policy.",
                ],
            },
        ],
    };

    const termsData = {
        title: "HORIZON FIT — TERMS & CONDITIONS",
        lastUpdated: "13 August 2026",
        preamble:
            'These Terms & Conditions govern access to and use of the Horizon Fit website, digital programs, assessments, educational resources, and related services provided by Horizon Fit Health Management Private Limited ("Horizon Fit", "Company", "We", "Our", or "Us").\nBy accessing or using Horizon Fit services, you agree to these Terms & Conditions.',
        sections: [
            {
                num: 1,
                title: "ABOUT HORIZON FIT",
                content: [
                    "Horizon Fit is a doctor-led metabolic health platform designed to provide structured health education, assessment, lifestyle guidance, weight management support, and related metabolic health services.",
                    "Depending on the service selected, Horizon Fit may provide self-guided educational programs, digital resources, assessments, or personalised doctor-led services.",
                ],
            },
            {
                num: 2,
                title: "SERVICES",
                content: [
                    "Horizon Fit may provide services relating to areas including: Weight management, Prediabetes and glucose health, Fatty liver and liver health, Cardiometabolic health, Metabolic health assessment, Nutrition and lifestyle management, Physical activity and exercise guidance, Sleep and hydration, Behaviour and lifestyle change, and Other related metabolic health services.",
                    "The exact services available may vary depending on the program or service selected.",
                ],
            },
            {
                num: 3,
                title: "MEDICAL AND HEALTHCARE SERVICES",
                content: [
                    "Certain Horizon Fit services may involve healthcare professionals and may include health assessment, clinical evaluation, or personalised guidance.",
                    "Where a service involves a doctor or other qualified healthcare professional, that service will be provided within the scope of the professional's qualifications and applicable laws and regulations.",
                    "Not every Horizon Fit service constitutes a medical consultation or establishes a doctor-patient relationship.",
                    "The nature of the relationship will depend on the specific service purchased or provided.",
                ],
            },
            {
                num: 4,
                title: "USER RESPONSIBILITIES",
                content: [
                    "Users agree to:",
                    "• Provide accurate and complete information.",
                    "• Provide relevant health information honestly where requested.",
                    "• Follow reasonable instructions associated with the selected service.",
                    "• Maintain confidentiality of account credentials.",
                    "• Use Horizon Fit services lawfully.",
                    "• Not misuse the website, platform, content, or services.",
                    "Users are responsible for informing Horizon Fit or the relevant healthcare professional if important information changes.",
                ],
            },
            {
                num: 5,
                title: "PROGRAM ACCESS",
                content: [
                    "Access to a particular program, assessment, digital resource, or service will depend on the applicable program terms.",
                    "Where a program has a specified access period, the access period will be communicated before purchase or activation.",
                ],
            },
            {
                num: 6,
                title: "FEES AND PAYMENTS",
                content: [
                    "Fees applicable to Horizon Fit services will be displayed or communicated before purchase.",
                    "Payment must be successfully completed where payment is required before access or service delivery.",
                    "Applicable payment, cancellation, or refund terms may vary depending on the specific service.",
                    "Where a separate refund or cancellation policy applies to a particular service, that policy will govern the relevant transaction.",
                ],
            },
            {
                num: 7,
                title: "DIGITAL CONTENT",
                content: [
                    "Horizon Fit may provide Videos, Educational materials, Guides, Workbooks, Trackers, Assessments, Digital resources, and Other educational content.",
                    "Such materials are provided for the purpose for which they are made available and may not be reproduced, redistributed, resold, or commercially exploited without written permission from Horizon Fit.",
                ],
            },
            {
                num: 8,
                title: "INTELLECTUAL PROPERTY",
                content: [
                    "All Horizon Fit branding, logos, names, text, graphics, videos, educational materials, program structures, documents, designs, systems, and other proprietary content remain the property of Horizon Fit Health Management Private Limited or its applicable licensors.",
                    "No ownership rights are transferred to the user by accessing or purchasing a service.",
                ],
            },
            {
                num: 9,
                title: "PROHIBITED USE",
                content: [
                    "Users must not:",
                    "• Copy or reproduce Horizon Fit content without permission.",
                    "• Resell or commercially exploit Horizon Fit materials.",
                    "• Share restricted account access.",
                    "• Upload proprietary materials to external platforms.",
                    "• Attempt to bypass platform security.",
                    "• Attempt unauthorised access to Horizon Fit systems.",
                    "• Use Horizon Fit content to misrepresent themselves as Horizon Fit or its representatives.",
                    "• Use the website or services for unlawful purposes.",
                ],
            },
            {
                num: 10,
                title: "THIRD-PARTY SERVICES",
                content: [
                    "Horizon Fit may integrate or use third-party services including payment providers, scheduling platforms, communication platforms, hosting providers, learning platforms, analytics services, and other technology providers.",
                    "Third-party services may be governed by their own terms and policies.",
                ],
            },
            {
                num: 11,
                title: "WEBSITE AND PLATFORM AVAILABILITY",
                content: [
                    "Horizon Fit will make reasonable efforts to maintain website and platform availability.",
                    "However, uninterrupted or error-free access cannot be guaranteed.",
                    "Temporary interruptions may occur because of maintenance, technical issues, upgrades, security measures, internet connectivity, or circumstances beyond Horizon Fit's reasonable control.",
                ],
            },
            {
                num: 12,
                title: "HEALTH OUTCOMES",
                content: [
                    "Individual health and lifestyle outcomes vary.",
                    "Horizon Fit does not guarantee specific Weight outcomes, Blood glucose outcomes, Laboratory results, Fitness outcomes, Health improvements, Timelines, or Disease-related outcomes.",
                    "Results may depend on individual circumstances, adherence, medical conditions, lifestyle factors, and other variables.",
                ],
            },
            {
                num: 13,
                title: "EMERGENCY SITUATIONS",
                content: [
                    "Horizon Fit services are not intended to replace emergency medical care.",
                    "Users experiencing an emergency should seek immediate medical attention from an appropriate emergency healthcare service or facility.",
                ],
            },
            {
                num: 14,
                title: "ACCOUNT SUSPENSION",
                content: [
                    "Horizon Fit may suspend or terminate access where reasonably necessary if a user: Violates these Terms & Conditions, Misuses the platform, Shares unauthorised access, Infringes intellectual property rights, Engages in fraudulent or unlawful activity, or Creates a security or operational risk.",
                ],
            },
            {
                num: 15,
                title: "PRIVACY",
                content: [
                    "Use of Horizon Fit services is also subject to the Horizon Fit Privacy Policy.",
                ],
            },
            {
                num: 16,
                title: "DISCLAIMER",
                content: [
                    "Use of Horizon Fit services is also subject to the Horizon Fit Disclaimer.",
                ],
            },
            {
                num: 17,
                title: "LIMITATION OF LIABILITY",
                content: [
                    "To the maximum extent permitted by applicable law, Horizon Fit Health Management Private Limited shall not be liable for indirect, incidental, consequential, special, or punitive damages arising from or relating to the use of the website, platform, content, or services.",
                    "Nothing in these Terms & Conditions is intended to exclude or limit liability where such exclusion or limitation is not permitted by applicable law.",
                ],
            },
            {
                num: 18,
                title: "MODIFICATIONS",
                content: [
                    "Horizon Fit may modify these Terms & Conditions from time to time.",
                    "Updated Terms & Conditions will become effective upon publication on the website unless otherwise required by applicable law.",
                ],
            },
            {
                num: 19,
                title: "GOVERNING LAW",
                content: [
                    "These Terms & Conditions shall be governed by and interpreted in accordance with the laws of India.",
                ],
            },
            {
                num: 20,
                title: "JURISDICTION",
                content: [
                    "Subject to applicable law, disputes arising from or relating to these Terms & Conditions shall be subject to the jurisdiction of the competent courts having jurisdiction over the registered office of Horizon Fit Health Management Private Limited.",
                ],
            },
            {
                num: 21,
                title: "ACCEPTANCE",
                content: [
                    "By accessing or using the Horizon Fit website, programs, assessments, or services, you acknowledge that you have read, understood, and agreed to these Terms & Conditions.",
                ],
            },
        ],
    };

    const getActiveDocumentData = () => {
        switch (activeTab) {
            case "privacy-policy":
                return privacyData;
            case "terms-and-conditions":
                return termsData;
            case "disclaimer":
            default:
                return disclaimerData;
        }
    };

    const currentDoc = getActiveDocumentData();

    const filteredSections = currentDoc.sections.filter((sec) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase();
        return (
            sec.title.toLowerCase().includes(q) ||
            sec.content.some((c) => c.toLowerCase().includes(q))
        );
    });

    return (
        <div className="min-h-screen bg-gradient-to-b from-muted/30 via-background to-muted/20 text-foreground">
            {/* TOP NAVIGATION HEADER */}
            <nav className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur-md shadow-sm">
                <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-8">
                    <Link to="/" className="flex items-center group">
                        <img
                            src={logo}
                            alt="HorizonFit Logo"
                            className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-105"
                            style={{ mixBlendMode: "multiply" }}
                        />
                    </Link>

                    <div className="flex items-center gap-3">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.print()}
                            className="hidden sm:flex items-center gap-2 text-xs font-semibold"
                        >
                            <Printer className="h-4 w-4 text-muted-foreground" />
                            Print Document
                        </Button>
                        <Link to="/">
                            <Button variant="ghost" size="sm" className="font-semibold text-xs sm:text-sm">
                                <ArrowLeft className="mr-1.5 h-4 w-4" />
                                Back to Home
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>

            {/* HERO BANNER */}
            <div className="relative border-b border-border/50 bg-gradient-to-r from-primary/10 via-secondary/10 to-teal-500/10 py-12 sm:py-16 overflow-hidden">
                <div className="absolute -top-24 -right-24 h-72 w-72 rounded-full bg-teal-500/15 blur-3xl pointer-events-none" />
                <div className="absolute -bottom-24 -left-24 h-72 w-72 rounded-full bg-primary/15 blur-3xl pointer-events-none" />

                <div className="container mx-auto max-w-5xl px-4 sm:px-8 relative">
                    <div className="flex items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-teal-500/15 px-3 py-1 text-xs font-bold text-teal-700 dark:text-teal-400 border border-teal-500/30">
                            <Sparkles className="h-3.5 w-3.5" />
                            Official Compliance & Governance
                        </span>
                        <span className="text-xs text-muted-foreground font-medium">
                            Last Updated: {currentDoc.lastUpdated}
                        </span>
                    </div>

                    <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl">
                        {currentDoc.title}
                    </h1>

                    <p className="mt-4 text-sm sm:text-base text-muted-foreground max-w-3xl leading-relaxed whitespace-pre-line">
                        {currentDoc.preamble}
                    </p>

                    {/* TAB SWITCHER */}
                    <div className="mt-8 flex flex-wrap gap-2 sm:gap-3 p-1.5 bg-background/80 backdrop-blur border border-border/70 rounded-xl shadow-inner max-w-2xl">
                        <button
                            onClick={() => handleTabChange("disclaimer")}
                            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "disclaimer"
                                    ? "bg-teal-600 text-white shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            <ShieldAlert className="h-4 w-4" />
                            Disclaimer
                        </button>
                        <button
                            onClick={() => handleTabChange("privacy-policy")}
                            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "privacy-policy"
                                    ? "bg-teal-600 text-white shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            <Lock className="h-4 w-4" />
                            Privacy Policy
                        </button>
                        <button
                            onClick={() => handleTabChange("terms-and-conditions")}
                            className={`flex-1 min-w-[130px] flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-xs sm:text-sm font-bold transition-all ${activeTab === "terms-and-conditions"
                                    ? "bg-teal-600 text-white shadow-md"
                                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                                }`}
                        >
                            <FileText className="h-4 w-4" />
                            Terms & Conditions
                        </button>
                    </div>
                </div>
            </div>

            {/* MAIN CONTENT AREA */}
            <div className="container mx-auto max-w-6xl px-4 sm:px-8 py-10">
                <div className="grid gap-8 lg:grid-cols-4 items-start">
                    {/* SIDEBAR NAVIGATION / SEARCH */}
                    <div className="lg:col-span-1 space-y-6 sticky top-24">
                        {/* Search Input */}
                        <div className="relative">
                            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search within document..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 bg-card border-border/80 h-10 text-xs sm:text-sm"
                            />
                        </div>

                        {/* Table of Contents */}
                        <div className="hidden lg:block rounded-2xl border border-border/80 bg-card p-5 shadow-sm">
                            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4 flex items-center gap-1.5">
                                <FileText className="h-3.5 w-3.5 text-teal-600" />
                                Table of Contents
                            </h3>

                            <div className="space-y-1 max-h-[60vh] overflow-y-auto pr-1 text-xs">
                                {currentDoc.sections.map((sec) => (
                                    <a
                                        key={sec.num}
                                        href={`#section-${sec.num}`}
                                        className="block py-1.5 px-2 rounded-md hover:bg-muted font-medium text-muted-foreground hover:text-teal-700 transition-colors truncate"
                                    >
                                        <span className="font-bold text-teal-600 mr-1.5">{sec.num}.</span>
                                        {sec.title}
                                    </a>
                                ))}
                            </div>
                        </div>

                        {/* Entity Badge */}
                        <div className="rounded-2xl border border-teal-200/60 bg-teal-50/50 dark:bg-teal-950/20 p-4 text-xs space-y-2">
                            <div className="flex items-center gap-2 font-bold text-teal-900 dark:text-teal-200">
                                <Building2 className="h-4 w-4 text-teal-600 shrink-0" />
                                Horizon Fit Health Management Pvt. Ltd.
                            </div>
                            <p className="text-muted-foreground text-[11px] leading-relaxed">
                                Doctor-Led Metabolic Health Transformation Platform. All rights reserved.
                            </p>
                            <div className="flex items-center gap-1.5 text-teal-700 dark:text-teal-400 font-semibold pt-1">
                                <Mail className="h-3.5 w-3.5" />
                                <a href="mailto:info@horizonfit.in" className="hover:underline">
                                    info@horizonfit.in
                                </a>
                            </div>
                        </div>
                    </div>

                    {/* DOCUMENT BODY */}
                    <div className="lg:col-span-3 space-y-6">
                        <AnimatePresence mode="wait">
                            <motion.div
                                key={activeTab}
                                initial={{ opacity: 0, y: 12 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -12 }}
                                transition={{ duration: 0.2 }}
                                className="space-y-6"
                            >
                                {filteredSections.length === 0 ? (
                                    <div className="rounded-2xl border border-border/80 bg-card p-12 text-center space-y-3">
                                        <Search className="mx-auto h-10 w-10 text-muted-foreground opacity-50" />
                                        <p className="text-base font-semibold text-foreground">
                                            No matching sections found
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            Try searching for a different keyword or clear the search query.
                                        </p>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setSearchQuery("")}
                                            className="mt-2 text-xs"
                                        >
                                            Clear Search
                                        </Button>
                                    </div>
                                ) : (
                                    filteredSections.map((sec) => (
                                        <div
                                            key={sec.num}
                                            id={`section-${sec.num}`}
                                            className="rounded-2xl border border-border/80 bg-card p-6 sm:p-8 shadow-sm transition-all hover:border-teal-500/30 hover:shadow-md"
                                        >
                                            <div className="flex items-start gap-4">
                                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-teal-500/10 font-black text-teal-700 dark:text-teal-400 text-base border border-teal-500/20">
                                                    {sec.num}
                                                </div>
                                                <div className="flex-1">
                                                    <h2 className="text-base sm:text-lg font-extrabold text-foreground tracking-tight mb-3">
                                                        {sec.title}
                                                    </h2>

                                                    <div className="space-y-2.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                        {sec.content.map((paragraph, pIdx) => {
                                                            const isBullet = paragraph.startsWith("•");
                                                            const isSubHeader =
                                                                paragraph.endsWith(":") && paragraph.length < 50;

                                                            if (isSubHeader) {
                                                                return (
                                                                    <h3
                                                                        key={pIdx}
                                                                        className="font-bold text-foreground pt-2 text-xs sm:text-sm"
                                                                    >
                                                                        {paragraph}
                                                                    </h3>
                                                                );
                                                            }

                                                            if (isBullet) {
                                                                return (
                                                                    <div
                                                                        key={pIdx}
                                                                        className="flex items-start gap-2 pl-2 text-foreground/90 font-medium"
                                                                    >
                                                                        <ChevronRight className="h-4 w-4 text-teal-600 shrink-0 mt-0.5" />
                                                                        <span>{paragraph.replace(/^•\s*/, "")}</span>
                                                                    </div>
                                                                );
                                                            }

                                                            return (
                                                                <p key={pIdx} className="leading-relaxed">
                                                                    {paragraph}
                                                                </p>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                )}
                            </motion.div>
                        </AnimatePresence>

                        {/* END OF DOCUMENT SIGN-OFF CARD */}
                        <div className="rounded-2xl border border-teal-200 bg-gradient-to-r from-teal-50 via-card to-emerald-50/60 dark:from-teal-950/30 dark:to-emerald-950/20 p-8 text-center space-y-3">
                            <CheckCircle2 className="mx-auto h-10 w-10 text-teal-600" />
                            <h3 className="text-base font-bold text-foreground">
                                Horizon Fit Health Management Private Limited
                            </h3>
                            <p className="text-xs text-teal-800 dark:text-teal-300 font-semibold">
                                Horizon Fit &ndash; Doctor-Led Metabolic Health Transformation
                            </p>
                            <p className="text-[11px] text-muted-foreground pt-2">
                                For any legal, privacy, or compliance inquiries, please contact:{" "}
                                <a
                                    href="mailto:info@horizonfit.in"
                                    className="font-bold text-teal-600 hover:underline"
                                >
                                    info@horizonfit.in
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* FOOTER */}
            <footer className="border-t border-border/60 bg-gradient-to-b from-card to-muted/40 py-10 mt-16">
                <div className="container mx-auto px-6 max-w-6xl">
                    <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
                        <div className="font-semibold">
                            &copy; {new Date().getFullYear()} Horizon Fit Health Management Pvt. Ltd. All rights reserved.
                        </div>
                        <div className="flex items-center gap-4">
                            <button onClick={() => handleTabChange("privacy-policy")} className="hover:text-teal-600 transition-colors">
                                Privacy Policy
                            </button>
                            <span>|</span>
                            <button onClick={() => handleTabChange("terms-and-conditions")} className="hover:text-teal-600 transition-colors">
                                Terms & Conditions
                            </button>
                            <span>|</span>
                            <button onClick={() => handleTabChange("disclaimer")} className="hover:text-teal-600 transition-colors">
                                Disclaimer
                            </button>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default LegalPage;
