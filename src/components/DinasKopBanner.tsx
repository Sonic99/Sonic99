import React from 'react';
import { DinasKopConfig } from '../types/citizen';
import {
  Building2,
  Edit3,
  Printer,
  Database,
  ShieldCheck,
  CheckCircle2,
} from 'lucide-react';

interface DinasKopBannerProps {
  kopConfig: DinasKopConfig;
  onOpenKopModal: () => void;
  onOpenReportModal: () => void;
  onNavigateToBackup: () => void;
}

export const DinasKopBanner: React.FC<DinasKopBannerProps> = ({
  kopConfig,
  onOpenKopModal,
  onOpenReportModal,
  onNavigateToBackup,
}) => {
  return (
    <div className="bg-slate-900 text-white border-b border-slate-800 no-print">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Official Emblem & Details */}
          <div className="flex items-start sm:items-center gap-3.5">
            {/* Emblem Badge */}
            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/10 border border-amber-400/30 flex items-center justify-center text-amber-300 font-bold text-xs tracking-wider shrink-0 shadow-xs">
              {kopConfig.logoDaerahType === 'dki' ? (
                'DKI'
              ) : kopConfig.logoDaerahType === 'garuda' ? (
                <ShieldCheck className="w-6 h-6 text-amber-400" />
              ) : (
                <Building2 className="w-6 h-6 text-amber-400" />
              )}
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-[10px] font-bold uppercase tracking-widest text-amber-400 font-mono">
                  {kopConfig.pemerintahTingkat1}
                </span>
                {kopConfig.pemerintahTingkat2 && (
                  <>
                    <span className="text-slate-600 text-[10px]">·</span>
                    <span className="text-[10px] font-semibold text-slate-300 tracking-wide">
                      {kopConfig.pemerintahTingkat2}
                    </span>
                  </>
                )}
                <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                  <CheckCircle2 className="w-2.5 h-2.5" />
                  SIAK Online Terhubung
                </span>
              </div>

              <h1 className="text-sm sm:text-base font-extrabold tracking-tight text-white leading-tight truncate">
                {kopConfig.namaInstansi}
                {kopConfig.subInstansi && (
                  <span className="text-xs font-medium text-slate-300 ml-2 hidden sm:inline">
                    ({kopConfig.subInstansi})
                  </span>
                )}
              </h1>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[11px] text-slate-400 mt-0.5">
                <span className="truncate max-w-md">{kopConfig.alamatKantor}</span>
                <span className="hidden md:inline text-slate-600">·</span>
                <span className="hidden md:inline font-mono">Telp: {kopConfig.telepon}</span>
                <span className="hidden md:inline text-slate-600">·</span>
                <span className="hidden lg:inline">Email: {kopConfig.email}</span>
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-center shrink-0">
            {/* Ubah Kop Aplikasi Button */}
            <button
              type="button"
              onClick={onOpenKopModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-200 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all shadow-xs"
              title="Sesuaikan Kop Surat & Identitas Dinas"
            >
              <Edit3 className="w-3.5 h-3.5 text-amber-400" />
              <span>Ubah Kop Aplikasi</span>
            </button>

            {/* Print Laporan Resmi Button */}
            <button
              type="button"
              onClick={onOpenReportModal}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-900 bg-emerald-400 hover:bg-emerald-300 transition-all shadow-xs"
              title="Buka Cetak Laporan Resmi Sesuai Permintaan Dinas"
            >
              <Printer className="w-3.5 h-3.5 text-slate-950" />
              <span>Print Laporan Dinas</span>
            </button>

            {/* Menu Backup & Restore */}
            <button
              type="button"
              onClick={onNavigateToBackup}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-300 bg-slate-800/60 hover:bg-slate-700 hover:text-white border border-slate-700 transition-all"
              title="Pencadangan & Pemulihan Basis Data Kependudukan"
            >
              <Database className="w-3.5 h-3.5 text-sky-400" />
              <span className="hidden sm:inline">Backup & Restore</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
