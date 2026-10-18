/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Citizen, VerificationStatus, LoginAudit } from './types/citizen';
import { INITIAL_ADMIN, INITIAL_AUDIT_LOGS, INITIAL_CITIZENS } from './data/seedData';
import { DashboardView } from './components/DashboardView';
import { CitizenListView } from './components/CitizenListView';
import { CitizenRegistrationForm } from './components/CitizenRegistrationForm';
import { QrScannerView } from './components/QrScannerView';
import { GeographicMapView } from './components/GeographicMapView';
import { EKtpCard } from './components/EKtpCard';
import { FamilyCardModal } from './components/FamilyCardModal';
import { KkUploadDispendukcapilView } from './components/KkUploadDispendukcapilView';
import { OfficialKecamatanReportModal } from './components/OfficialKecamatanReportModal';
import { Auth2FAModal } from './components/Auth2FAModal';
import { AdminSecurityView } from './components/AdminSecurityView';
import {
  ShieldCheck,
  LayoutDashboard,
  Users,
  UserPlus,
  QrCode,
  MapPin,
  Lock,
  LogOut,
  CheckCircle2,
  Bell,
  Menu,
  X,
  FileCheck2,
} from 'lucide-react';

const STORAGE_KEY_CITIZENS = 'sipenduk_citizens_v2';
const STORAGE_KEY_LOGS = 'sipenduk_audit_logs_v2';

export default function App() {
  // Persistence via localStorage
  const [citizens, setCitizens] = useState<Citizen[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_CITIZENS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_CITIZENS;
  });

  const [auditLogs, setAuditLogs] = useState<LoginAudit[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_LOGS);
      if (saved) return JSON.parse(saved);
    } catch {
      // fallback
    }
    return INITIAL_AUDIT_LOGS;
  });

  const [admin] = useState(INITIAL_ADMIN);
  const [isLoggedIn, setIsLoggedIn] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  // Active navigation tab
  const [activeTab, setActiveTab] = useState<'dashboard' | 'citizens' | 'register' | 'scanner' | 'upload-kk' | 'map' | 'security'>('dashboard');

  // Modal for e-KTP physical card preview
  const [selectedCitizenForCard, setSelectedCitizenForCard] = useState<Citizen | null>(null);

  // Modal for Kartu Keluarga preview
  const [selectedFamilyKk, setSelectedFamilyKk] = useState<string | null>(null);

  // Modal for Official Kecamatan PDF Report
  const [isOfficialReportModalOpen, setIsOfficialReportModalOpen] = useState(false);

  // Notification toast
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Mobile menu toggle
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_CITIZENS, JSON.stringify(citizens));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [citizens]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_LOGS, JSON.stringify(auditLogs));
    } catch (e) {
      console.warn('Storage error', e);
    }
  }, [auditLogs]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  // Add new citizen
  const handleAddCitizen = (newCitizen: Citizen) => {
    setCitizens((prev) => [newCitizen, ...prev]);
    showToast(`Warga baru ${newCitizen.namaLengkap} berhasil didaftarkan dan e-KTP digital diterbitkan.`);
    setSelectedCitizenForCard(newCitizen);
    setActiveTab('citizens');
  };

  // Update verification status
  const handleUpdateStatus = (citizenId: string, newStatus: VerificationStatus, note?: string) => {
    setCitizens((prev) =>
      prev.map((c) => {
        if (c.id === citizenId) {
          const newLog = {
            id: `act-${Date.now()}`,
            tanggal: new Date().toLocaleString('id-ID'),
            aksi: `Pembaruan Status e-KTP: ${newStatus.toUpperCase()}`,
            petugas: admin.nama,
            keterangan: note,
          };
          return {
            ...c,
            statusVerifikasi: newStatus,
            catatanVerifikasi: note || c.catatanVerifikasi,
            terakhirDiverifikasi:
              newStatus === 'terverifikasi'
                ? new Date().toISOString().split('T')[0]
                : c.terakhirDiverifikasi,
            petugasVerifikator: admin.nama,
            riwayatAktivitas: [newLog, ...(c.riwayatAktivitas || [])],
          };
        }
        return c;
      })
    );
    showToast('Status verifikasi e-KTP warga berhasil diperbarui.');
  };

  // Field verification action (from QR scanner)
  const handleVerifyFieldPresence = (citizenId: string, actionName: string) => {
    setCitizens((prev) =>
      prev.map((c) => {
        if (c.id === citizenId) {
          const newLog = {
            id: `act-${Date.now()}`,
            tanggal: new Date().toLocaleString('id-ID'),
            aksi: `Pemindaian QR: ${actionName}`,
            petugas: admin.nama,
            keterangan: 'Terekam via Pemindai Real-Time Lapangan',
          };
          return {
            ...c,
            riwayatAktivitas: [newLog, ...(c.riwayatAktivitas || [])],
          };
        }
        return c;
      })
    );
    showToast(`Aktivitas "${actionName}" berhasil diverifikasi ke profil warga.`);
  };

  // Verify all members of a family by No KK
  const handleVerifyEntireFamily = (noKk: string) => {
    setCitizens((prev) =>
      prev.map((c) => {
        if (c.noKk === noKk) {
          const newLog = {
            id: `act-${Date.now()}-${c.id}`,
            tanggal: new Date().toLocaleString('id-ID'),
            aksi: 'Verifikasi Sekeluarga Sah (Dukcapil)',
            petugas: admin.nama,
            keterangan: 'Verifikasi kolektif basis Nomor Kartu Keluarga',
          };
          return {
            ...c,
            statusVerifikasi: 'terverifikasi' as VerificationStatus,
            terakhirDiverifikasi: new Date().toISOString().split('T')[0],
            petugasVerifikator: admin.nama,
            riwayatAktivitas: [newLog, ...(c.riwayatAktivitas || [])],
          };
        }
        return c;
      })
    );
    showToast(`Seluruh anggota keluarga pada No. KK ${noKk} berhasil diverifikasi sah.`);
  };

  // Import / Synchronize verified citizens from Dispendukcapil KK document
  const handleImportVerifiedCitizens = (newCitizens: Citizen[], noKk: string) => {
    setCitizens((prev) => {
      const incomingNiks = new Set(newCitizens.map((c) => c.nik));
      const retained = prev.filter((c) => !incomingNiks.has(c.nik));
      return [...newCitizens, ...retained];
    });
    showToast(
      `Berhasil! Seluruh data keluarga No. KK ${noKk} (${newCitizens.length} Jiwa) telah dimasukkan ke Database Warga SIAK.`
    );
  };

  // Clear all dummy citizens so database starts clean
  const handleClearAllCitizens = () => {
    setCitizens([]);
    localStorage.removeItem(STORAGE_KEY_CITIZENS);
    showToast('Database warga telah dikosongkan. Siap memindai berkas KK baru.');
  };

  // Reset to sample initial citizens
  const handleResetSampleCitizens = () => {
    setCitizens(INITIAL_CITIZENS);
    localStorage.setItem(STORAGE_KEY_CITIZENS, JSON.stringify(INITIAL_CITIZENS));
    showToast('Data warga standar dipulihkan.');
  };

  // 2FA Login success
  const handleSuccessLogin = (newLog: LoginAudit) => {
    setIsLoggedIn(true);
    setIsAuthModalOpen(false);
    setAuditLogs((prev) => [newLog, ...prev]);
    showToast('Otentikasi Dua Faktor (2FA) Berhasil. Sesi resmi dibuka.');
  };

  // Logout action
  const handleLogout = () => {
    setIsLoggedIn(false);
    setIsAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 bg-slate-900 text-white px-4 py-2.5 rounded-lg shadow-lg border border-slate-700 text-xs flex items-center gap-2 animate-bounce">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* TOP BAR CONTRACT: Exactly 3 zones separated by gap-8 */}
      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 no-print">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Brand title, one line */}
          <div className="flex items-center gap-3 whitespace-nowrap shrink-0">
            <div className="w-9 h-9 rounded-lg bg-slate-900 flex items-center justify-center text-white shadow-xs">
              <ShieldCheck className="w-5 h-5 text-sky-400" />
            </div>
            <div>
              <span className="text-base font-bold tracking-tight text-slate-900 block leading-tight">
                SIPENDUK ELEKTRONIK
              </span>
              <span className="text-[10px] text-slate-500 font-mono tracking-tight block">
                Disdukcapil RI · Gambir, Jakarta Pusat
              </span>
            </div>
          </div>

          {/* Zone 2: Navigation Links, 1-2 word labels, single-line */}
          <nav className="hidden lg:flex items-center gap-6 text-xs font-semibold text-slate-600 whitespace-nowrap">
            <button
              type="button"
              onClick={() => setActiveTab('dashboard')}
              className={`py-1 transition-colors hover:text-slate-900 ${
                activeTab === 'dashboard'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              Dashboard
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('citizens')}
              className={`py-1 transition-colors hover:text-slate-900 ${
                activeTab === 'citizens'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              Data Warga ({citizens.length})
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('register')}
              className={`py-1 transition-colors hover:text-slate-900 ${
                activeTab === 'register'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              Pendaftaran Baru
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('scanner')}
              className={`py-1 transition-colors hover:text-slate-900 ${
                activeTab === 'scanner'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              Pindai QR Real-Time
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('upload-kk')}
              className={`py-1 transition-colors hover:text-slate-900 flex items-center gap-1.5 ${
                activeTab === 'upload-kk'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              Unggah Berkas KK
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('map')}
              className={`py-1 transition-colors hover:text-slate-900 ${
                activeTab === 'map'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              Peta Sebaran
            </button>

            <button
              type="button"
              onClick={() => setActiveTab('security')}
              className={`py-1 transition-colors hover:text-slate-900 flex items-center gap-1.5 ${
                activeTab === 'security'
                  ? 'text-slate-900 border-b-2 border-slate-900 font-bold'
                  : ''
              }`}
            >
              <Lock className="w-3.5 h-3.5 text-slate-400" />
              Keamanan 2FA
            </button>
          </nav>

          {/* Zone 3: 1 Primary Action (Officer status & 2FA modal trigger) */}
          <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
            {isLoggedIn ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setActiveTab('security')}
                  className="flex items-center gap-2.5 text-left p-1.5 rounded-lg hover:bg-slate-100 transition-colors"
                  title="Lihat Pengaturan Keamanan 2FA"
                >
                  <img
                    src={admin.avatarUrl}
                    alt={admin.nama}
                    className="w-8 h-8 rounded-full object-cover border border-slate-200"
                  />
                  <div className="hidden sm:block">
                    <div className="text-xs font-semibold text-slate-900 leading-tight truncate max-w-[130px]">
                      {admin.nama.split(',')[0]}
                    </div>
                    <div className="text-[10px] text-emerald-700 font-medium flex items-center gap-1">
                      <ShieldCheck className="w-3 h-3 text-emerald-600" />
                      <span>2FA Aktif</span>
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={handleLogout}
                  className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors ml-1"
                  title="Kunci Sesi / Keluar"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAuthModalOpen(true)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
              >
                Masuk Otentikasi 2FA
              </button>
            )}

            {/* Mobile menu trigger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile dropdown nav */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('dashboard');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium ${
                activeTab === 'dashboard' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Dashboard
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('citizens');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium ${
                activeTab === 'citizens' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Data Warga ({citizens.length})
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('register');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium ${
                activeTab === 'register' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Pendaftaran Baru
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('scanner');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium ${
                activeTab === 'scanner' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Pindai QR Real-Time
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('upload-kk');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium flex items-center gap-2 ${
                activeTab === 'upload-kk' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              <FileCheck2 className="w-3.5 h-3.5 text-emerald-600" />
              Unggah Berkas KK (SIAK)
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('map');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium ${
                activeTab === 'map' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Peta Sebaran
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('security');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs rounded-md font-medium ${
                activeTab === 'security' ? 'bg-slate-100 text-slate-900 font-bold' : 'text-slate-600'
              }`}
            >
              Keamanan 2FA
            </button>
          </div>
        )}
      </header>

      {/* SUB-HEADER CONTEXTUAL BREADCRUMB STRIP */}
      <div className="bg-slate-100 border-b border-slate-200/80 px-4 sm:px-6 lg:px-8 py-2 text-[11px] text-slate-600 no-print">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span>Sistem Informasi Kependudukan</span>
            <span className="text-slate-400">/</span>
            <span>Provinsi DKI Jakarta</span>
            <span className="text-slate-400">/</span>
            <span className="font-semibold text-slate-800">
              {activeTab === 'dashboard' && 'Dasbor Statistik Demografi'}
              {activeTab === 'citizens' && 'Daftar & Validasi e-KTP'}
              {activeTab === 'register' && 'Formulir Warga Baru'}
              {activeTab === 'scanner' && 'Pemindai QR Lapangan Real-Time'}
              {activeTab === 'upload-kk' && 'Unggah Berkas KK (Integrasi Dispendukcapil SIAK)'}
              {activeTab === 'map' && 'Peta Geospasial Titik Domisili'}
              {activeTab === 'security' && 'Pusat Keamanan 2FA'}
            </span>
          </div>

          <div className="hidden sm:flex items-center gap-3 text-slate-500 font-mono tabular-nums">
            <span>Server: DUKCAPIL-NODE-01</span>
            <span className="text-slate-300">·</span>
            <span>TLS 1.3 2FA Enforced</span>
          </div>
        </div>
      </div>

      {/* MAIN VIEWPORT CONTENT */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            citizens={citizens}
            onNavigate={(tab) => setActiveTab(tab as any)}
            onOpenCardDetail={(citizen) => setSelectedCitizenForCard(citizen)}
            onOpenOfficialReport={() => setIsOfficialReportModalOpen(true)}
          />
        )}

        {activeTab === 'citizens' && (
          <CitizenListView
            citizens={citizens}
            onOpenCardDetail={(citizen) => setSelectedCitizenForCard(citizen)}
            onUpdateStatus={handleUpdateStatus}
            onOpenFamilyCard={(noKk) => setSelectedFamilyKk(noKk)}
            onOpenOfficialReport={() => setIsOfficialReportModalOpen(true)}
            onClearCitizens={handleClearAllCitizens}
            onResetCitizens={handleResetSampleCitizens}
          />
        )}

        {activeTab === 'register' && (
          <CitizenRegistrationForm
            onAddCitizen={handleAddCitizen}
            onCancel={() => setActiveTab('citizens')}
          />
        )}

        {activeTab === 'scanner' && (
          <QrScannerView
            citizens={citizens}
            onVerifyFieldPresence={handleVerifyFieldPresence}
            onOpenCardDetail={(citizen) => setSelectedCitizenForCard(citizen)}
            onOpenFamilyCard={(noKk) => setSelectedFamilyKk(noKk)}
            onVerifyEntireFamily={handleVerifyEntireFamily}
            onNavigateToKkUpload={() => setActiveTab('upload-kk')}
          />
        )}

        {activeTab === 'upload-kk' && (
          <KkUploadDispendukcapilView
            citizens={citizens}
            onImportVerifiedCitizens={handleImportVerifiedCitizens}
            onOpenCardDetail={(citizen) => setSelectedCitizenForCard(citizen)}
            onOpenFamilyCard={(noKk) => setSelectedFamilyKk(noKk)}
            onNavigateToCitizens={() => setActiveTab('citizens')}
          />
        )}

        {activeTab === 'map' && (
          <GeographicMapView
            citizens={citizens}
            onOpenCardDetail={(citizen) => setSelectedCitizenForCard(citizen)}
          />
        )}

        {activeTab === 'security' && (
          <AdminSecurityView
            admin={admin}
            auditLogs={auditLogs}
            onTriggerReAuth={() => setIsAuthModalOpen(true)}
            onLogout={handleLogout}
          />
        )}
      </main>

      {/* FOOTER */}
      <footer className="bg-white border-t border-slate-200 py-4 text-center text-xs text-slate-500 no-print">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div>
            © 2026 SIPENDUK ELEKTRONIK · Kementerian Dalam Negeri Republik Indonesia
          </div>
          <div className="text-[11px] text-slate-400">
            Terintegrasi Identitas Kependudukan Digital (IKD) & Autentikasi Dua Faktor
          </div>
        </div>
      </footer>

      {/* MODAL: e-KTP DIGITAL PREVIEW & PRINTABLE CARD */}
      {selectedCitizenForCard && (
        <EKtpCard
          citizen={selectedCitizenForCard}
          isModal={true}
          onClose={() => setSelectedCitizenForCard(null)}
        />
      )}

      {/* MODAL: KARTU KELUARGA (KK) RESMI */}
      {selectedFamilyKk && (
        <FamilyCardModal
          noKk={selectedFamilyKk}
          familyMembers={citizens.filter((c) => c.noKk === selectedFamilyKk)}
          isOpen={Boolean(selectedFamilyKk)}
          onClose={() => setSelectedFamilyKk(null)}
          onVerifyEntireFamily={handleVerifyEntireFamily}
          onSelectMember={(member) => {
            setSelectedCitizenForCard(member);
          }}
        />
      )}

      {/* MODAL: LAPORAN RESMI KECAMATAN PDF */}
      <OfficialKecamatanReportModal
        citizens={citizens}
        isOpen={isOfficialReportModalOpen}
        onClose={() => setIsOfficialReportModalOpen(false)}
      />

      {/* MODAL: TWO-FACTOR AUTHENTICATION LOGIN */}
      <Auth2FAModal
        admin={admin}
        auditLogs={auditLogs}
        isOpen={isAuthModalOpen}
        onSuccessLogin={handleSuccessLogin}
        onClose={() => setIsAuthModalOpen(false)}
      />
    </div>
  );
}
