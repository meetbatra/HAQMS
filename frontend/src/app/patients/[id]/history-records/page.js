'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from '@/components/common/Navbar';
import { useRouter, useParams } from 'next/navigation';
import { User, Calendar, Activity, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function HistoryRecords() {
  const { user, token, API_BASE_URL } = useAuth();
  const router = useRouter();
  const params = useParams();
  
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Show loading spinner while context initializes
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  useEffect(() => {
    if (!token || !params.id) return;

    const fetchPatientData = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/patients/${params.id}`, {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to fetch patient history');
        }

        setPatient(data.patient || data.data?.patient || data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchPatientData();
  }, [token, params.id, API_BASE_URL]);

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col font-sans transition-colors duration-300">
      <Navbar />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Link 
          href="/dashboard" 
          className="inline-flex items-center text-sm font-medium text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-1" />
          Back to Dashboard
        </Link>

        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : error ? (
          <div className="bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 p-4 rounded-xl text-center">
            {error}
          </div>
        ) : patient ? (
          <div className="space-y-6">
            {/* Patient Header */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-slate-900 dark:text-slate-100 flex items-center">
                  <User className="w-6 h-6 mr-2 text-blue-500" />
                  {patient.name}
                </h1>
                <p className="text-slate-600 dark:text-slate-400 mt-1">
                  ID: {patient.id} | Age: {patient.age} | Gender: {patient.gender}
                </p>
              </div>
              <div className="bg-slate-100 dark:bg-slate-800 px-4 py-2 rounded-lg text-sm font-medium text-slate-700 dark:text-slate-300">
                Contact: {patient.phoneNumber}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Medical History */}
              <div className="lg:col-span-1 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <Activity className="w-5 h-5 mr-2 text-blue-500" />
                  Medical History
                </h2>
                <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl text-slate-700 dark:text-slate-300 text-sm leading-relaxed whitespace-pre-wrap">
                  {patient.medicalHistory || 'No medical history recorded.'}
                </div>
              </div>

              {/* Appointment History */}
              <div className="lg:col-span-2 bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-6">
                <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-4 flex items-center">
                  <Calendar className="w-5 h-5 mr-2 text-blue-500" />
                  Appointment Records
                </h2>
                
                {patient.appointments && patient.appointments.length > 0 ? (
                  <div className="space-y-4">
                    {patient.appointments.map((apt) => (
                      <div key={apt.id} className="border border-slate-200 dark:border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row justify-between gap-4 transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50">
                        <div>
                          <p className="font-semibold text-slate-900 dark:text-slate-100">
                            {new Date(apt.appointmentDate).toLocaleString()}
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
                            Doctor: <span className="font-medium text-slate-700 dark:text-slate-300">{apt.doctor?.name || 'Unknown'}</span> ({apt.doctor?.specialization || 'General'})
                          </p>
                          <p className="text-sm text-slate-600 dark:text-slate-400 mt-2">
                            Reason: {apt.reason}
                          </p>
                        </div>
                        <div className="flex sm:flex-col items-center sm:items-end justify-between sm:justify-start">
                          <span className={`px-2.5 py-1 rounded-full text-xs font-bold tracking-wide ${
                            apt.status === 'COMPLETED' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400' :
                            apt.status === 'CANCELLED' ? 'bg-rose-100 text-rose-700 dark:bg-rose-500/20 dark:text-rose-400' :
                            'bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400'
                          }`}>
                            {apt.status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-8 text-slate-600 dark:text-slate-400 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
                    No past appointments found for this patient.
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </main>
    </div>
  );
}
