import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Activity,
  ShieldCheck,
  Lock,
  Building2,
  Stethoscope,
  UserRound,
  UserCog,
  ArrowRight,
  CheckCircle2,
  Phone,
  Mail,
  MapPin,
  HeartPulse,
  Sparkles
} from "lucide-react";
import { checkAdminExists } from "../../services/auth.service";

const glass = "bg-white/10 backdrop-blur-md shadow-xl rounded-2xl border border-white/20";
const sections = ["hero", "about", "services", "why", "how", "testimonials", "contact"];

const trustItems = [
  "HIPAA-Inspired Architecture",
  "End-to-End Encryption",
  "Multi-Role Authentication",
  "Real-Time Clinical Logs",
  "Data Privacy Compliance"
];

const testimonials = [
  { name: "CityCare Physio", quote: "Reduced admin overhead by 43% with cleaner appointment workflows." },
  { name: "OrthoMotion Clinic", quote: "Nurse-to-consultant vitals handoff is now immediate and traceable." },
  { name: "WellTrack Rehab", quote: "Patient records and treatment history are finally centralized." }
];

const services = [
  "Patient Approval Workflow",
  "Role-based EMR Dashboards",
  "Clinical Vitals and Consultation",
  "Appointment Kanban Lifecycle"
];

export default function LandingPage() {
  const [adminExists, setAdminExists] = useState(null);
  const [activeSection, setActiveSection] = useState("hero");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await checkAdminExists();
        setAdminExists(Boolean(res?.data?.data?.exists));
      } catch {
        setAdminExists(true);
      }
    };
    load();
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const current = sections.find((id) => {
        const el = document.getElementById(id);
        if (!el) return false;
        const rect = el.getBoundingClientRect();
        return rect.top <= 120 && rect.bottom >= 120;
      });
      if (current) setActiveSection(current);
    };

    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const setupHref = useMemo(() => (adminExists ? "/staff/login" : "/setup-admin"), [adminExists]);

  const scrollTo = (id) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-teal-50 to-indigo-100 text-slate-900">
      <style>{`html { scroll-behavior: smooth; }`}</style>
      <div className="pointer-events-none fixed left-12 top-24 text-cyan-300/50"><HeartPulse size={28} /></div>
      <div className="pointer-events-none fixed right-12 top-40 text-blue-300/50"><Activity size={26} /></div>
      <div className="pointer-events-none fixed left-1/3 bottom-20 text-indigo-300/40"><Sparkles size={24} /></div>

      <header className="sticky top-0 z-40 border-b border-white/30 bg-white/30 backdrop-blur-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3 lg:px-10">
          <button onClick={() => scrollTo("hero")} className="text-sm font-bold tracking-widest text-cyan-700">SMAART EMR</button>
          <nav className="hidden gap-2 md:flex">
            {sections.map((id) => (
              <button
                key={id}
                onClick={() => scrollTo(id)}
                className={`rounded-lg px-3 py-1 text-xs font-semibold uppercase tracking-wide ${activeSection === id ? "bg-cyan-100 text-cyan-800" : "text-slate-600 hover:bg-white/50"}`}
              >
                {id}
              </button>
            ))}
          </nav>
          <div className="flex gap-2">
            <Link to="/staff/login" className="rounded-lg bg-white/70 px-3 py-2 text-xs font-semibold text-slate-800">Login</Link>
            <Link to="/patient/register" className="rounded-lg bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-3 py-2 text-xs font-semibold text-white">Register</Link>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <motion.section id="hero" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} className="grid items-center gap-8 lg:grid-cols-2">
          <div className="space-y-8">
            <span className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-cyan-50 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-cyan-700">
              <ShieldCheck size={14} /> Enterprise Healthcare SaaS
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                SMAART EMR
                <span className="block text-2xl font-semibold text-slate-700 sm:text-3xl">Advanced Clinical & Physiotherapy Management Platform</span>
              </h1>
              <p className="text-lg text-slate-600">Secure • Scalable • Role-Based Healthcare Workflow</p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link to="/request-appointment" className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-6 py-3 text-sm font-semibold text-white transition-all duration-300 hover:scale-105">Book Appointment</Link>
              <Link to="/staff/login" className="rounded-xl border border-slate-300 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:scale-105">Login</Link>
              <Link to="/patient/register" className="rounded-xl border border-slate-300 bg-white/60 px-6 py-3 text-sm font-semibold text-slate-800 transition-all duration-300 hover:scale-105">Register</Link>
            </div>
            <Link to={setupHref} className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-700">
              Initial System Setup <ArrowRight size={16} />
            </Link>
          </div>

          <div className={`${glass} p-8`}>
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-lg font-semibold tracking-tight">Live Dashboard Preview</h3>
              <div className="flex gap-2 text-cyan-600"><HeartPulse size={18} /><Activity size={18} /><Lock size={18} /></div>
            </div>
            <div className="space-y-4">
              {[{ label: "Admin Operations", value: "24 Active Workflows", icon: UserCog }, { label: "Nurse Monitoring", value: "16 Vitals Pending", icon: HeartPulse }, { label: "Consultant Panel", value: "11 Cases Today", icon: Stethoscope }].map((item) => (
                <motion.div key={item.label} whileHover={{ scale: 1.02 }} className="rounded-xl border border-white/30 bg-white/40 p-4">
                  <p className="text-xs uppercase text-slate-500">{item.label}</p>
                  <p className="mt-1 flex items-center gap-2 text-sm font-semibold text-slate-800"><item.icon size={16} /> {item.value}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.section>

        <section id="about" className={`mt-10 ${glass} p-6`}>
          <h2 className="mb-4 text-2xl font-semibold tracking-tight">About</h2>
          <p className="text-sm text-slate-700">SMAART EMR unifies admin, nursing, consultant, and patient operations into a secure role-based platform built for physiotherapy care delivery.</p>
        </section>

        <section id="services" className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Services</h2>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {services.map((s) => <div key={s} className={`${glass} p-5 text-sm font-medium text-slate-700`}>{s}</div>)}
          </div>
        </section>

        <section id="why" className={`mt-12 ${glass} p-6`}>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Why Choose Us</h2>
          <div className="grid gap-4 md:grid-cols-5">
            {trustItems.map((item) => (
              <div key={item} className="flex items-center gap-2 text-sm font-medium text-slate-700">
                <CheckCircle2 size={16} className="text-emerald-600" /> {item}
              </div>
            ))}
          </div>
        </section>

        <section id="how" className="mt-12 grid gap-6 lg:grid-cols-2">
          <div className={`${glass} p-8`}>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">How It Works</h2>
            <p className="mb-3 text-sm text-slate-700">1. Public request or walk-in intake</p>
            <p className="mb-3 text-sm text-slate-700">2. Admin approval and scheduling</p>
            <p className="mb-3 text-sm text-slate-700">3. Nurse vitals and EMR updates</p>
            <p className="mb-3 text-sm text-slate-700">4. Consultant diagnosis and treatment plan</p>
          </div>
          <div className={`${glass} p-8`}>
            <h2 className="mb-6 text-2xl font-semibold tracking-tight">Who It Supports</h2>
            <div className="space-y-3 text-sm text-slate-700">
              <p className="flex items-center gap-2"><Building2 size={16} /> Hospital Administrators</p>
              <p className="flex items-center gap-2"><Activity size={16} /> Nurses & Staff</p>
              <p className="flex items-center gap-2"><Stethoscope size={16} /> Consultants</p>
              <p className="flex items-center gap-2"><UserRound size={16} /> Patients</p>
            </div>
          </div>
        </section>

        <section id="testimonials" className="mt-12">
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Testimonials</h2>
          <div className="grid gap-6 md:grid-cols-3">
            {testimonials.map((t) => (
              <div key={t.name} className={`${glass} p-6`}>
                <p className="text-sm text-slate-700">“{t.quote}”</p>
                <p className="mt-3 text-xs font-semibold uppercase tracking-wide text-cyan-700">{t.name}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="contact" className={`mt-12 ${glass} p-8`}>
          <h2 className="mb-6 text-2xl font-semibold tracking-tight">Contact</h2>
          <div className="grid gap-4 md:grid-cols-4">
            <Link to="/request-appointment" className="rounded-xl bg-gradient-to-r from-blue-600 via-teal-500 to-indigo-700 px-4 py-3 text-center text-sm font-semibold text-white transition-all duration-300 hover:scale-105">Book Appointment</Link>
            <p className="flex items-center gap-2 text-sm text-slate-700"><Mail size={16} /> contact@smaartemr.com</p>
            <p className="flex items-center gap-2 text-sm text-slate-700"><Phone size={16} /> +1 (555) 012-4400</p>
            <p className="flex items-center gap-2 text-sm text-slate-700"><MapPin size={16} /> Austin, Texas</p>
          </div>
        </section>
      </div>

      <footer className="border-t border-white/20 bg-white/20">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-4 px-6 py-6 text-xs text-slate-600 lg:px-10">
          <p>About Platform</p>
          <p>Security Policy</p>
          <p>Terms & Compliance</p>
          <p>Contact</p>
          <p>Version v1.1.0</p>
        </div>
      </footer>
    </div>
  );
}
