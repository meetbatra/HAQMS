'use client';

import Link from 'next/link';
import { Activity, ShieldAlert, MonitorPlay, Users, CalendarDays, ArrowRight } from 'lucide-react';

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] py-8 px-6 lg:px-8">
      <div className="max-w-4xl mx-auto w-full text-center my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-600 dark:text-blue-400 text-sm font-medium mb-6 animate-pulse">
          <Activity className="h-4 w-4" />
          Live Queue Tracking Enabled
        </div>
        
        <h1 className="text-5xl sm:text-7xl font-extrabold tracking-tight bg-gradient-to-br from-blue-700 via-indigo-600 to-cyan-500 bg-clip-text text-transparent drop-shadow-sm pb-2">
          HAQMS
        </h1>
        <p className="text-xl sm:text-3xl font-bold mt-2 text-slate-800 dark:text-slate-100">
          Hospital Appointment & Queue Management System
        </p>
        
        <p className="mt-6 text-lg text-slate-700 dark:text-slate-300 max-w-xl mx-auto font-medium">
          Welcome to the HAQMS testing environment. This portal serves as a
          fully functional reference application designed to evaluate software engineering candidates.
        </p>

        {/* Action Cards */}
        <div className="mt-12 grid gap-8 sm:grid-cols-2 max-w-2xl mx-auto">
          {/* Card 1: Staff Portal */}
          <Link href="/dashboard" className="group">
            <div className="glass p-8 rounded-2xl border-t border-l border-white/40 dark:border-white/10 text-left hover:border-blue-500/50 hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-3 bg-blue-600/10 text-blue-700 dark:text-blue-400 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <Users className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Staff Portal
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </h2>
              <p className="mt-3 text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed">
                Access your specialized dashboard. Supports role-based workflows for Administrators, Doctors, and Receptionists.
              </p>
            </div>
          </Link>

          {/* Card 2: Public Queue Monitor */}
          <Link href="/queue" className="group">
            <div className="glass p-8 rounded-2xl border-t border-l border-white/40 dark:border-white/10 text-left hover:border-blue-500/50 hover:shadow-blue-500/20 transition-all duration-300 transform hover:-translate-y-2">
              <div className="p-3 bg-blue-600/10 text-blue-700 dark:text-blue-400 rounded-xl w-fit group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300 shadow-inner">
                <MonitorPlay className="h-6 w-6" />
              </div>
              <h2 className="mt-6 text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 group-hover:text-blue-700 transition-colors">
                Live Public Monitor
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1.5 transition-transform" />
              </h2>
              <p className="mt-3 text-slate-700 dark:text-slate-300 text-sm font-medium leading-relaxed">
                Real-time active queue board tracking patient check-ins and calling tokens by physician. Built with live refresh.
              </p>
            </div>
          </Link>
        </div>


      </div>

      <footer className="text-center text-slate-600 dark:text-slate-400 text-xs mt-8">
        HAQMS v1.0.0 &copy; {new Date().getFullYear()}
      </footer>
    </div>
  );
}
