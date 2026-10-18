import React, { useState } from 'react';
import { AdminUser, LoginAudit } from '../types/citizen';
import {
  ShieldCheck,
  Key,
  Lock,
  Smartphone,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  AlertCircle,
  FileText,
  UserCheck,
} from 'lucide-react';

interface AdminSecurityViewProps {
  admin: AdminUser;
  auditLogs: LoginAudit[];
  onTriggerReAuth: () => void;
  onLogout: () => void;
}

export const AdminSecurityView: React.FC<AdminSecurityViewProps> = ({
  admin,
  auditLogs,
  onTriggerReAuth,
  onLogout,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedCode(text);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pusat Keamanan & Autentikasi Dua Faktor (2FA)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi perlindungan akses administratif portal kependudukan dan pemantauan riwayat sesi masuk.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onTriggerReAuth}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <RefreshCw className="w-3.5 h-3.5 text-slate-600" />
            Uji Coba Alur Login 2FA
          </button>

          <button
            type="button"
            onClick={onLogout}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors"
          >
            <LogOut className="w-3.5 h-3.5" />
            Keluar Sesi
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Officer Profile & 2FA Status (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Officer Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-3">
              <img
                src={admin.avatarUrl}
                alt={admin.nama}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200 shadow-xs"
              />
              <div>
                <h3 className="font-bold text-sm text-slate-900">{admin.nama}</h3>
                <div className="text-xs text-slate-600">{admin.jabatan}</div>
                <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                  NIP: {admin.nip}
                </div>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-lg space-y-1.5 text-xs text-slate-700 border border-slate-100">
              <div className="flex justify-between">
                <span className="text-slate-500">Unit Kerja:</span>
                <span className="font-medium">{admin.unitKerja}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Email Akun Dinas:</span>
                <span className="font-mono text-[11px]">{admin.email}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Sesi Terakhir:</span>
                <span className="font-mono text-[11px] text-emerald-700 font-medium">
                  {admin.lastLogin}
                </span>
              </div>
            </div>
          </div>

          {/* 2FA Status Banner */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-600" />
                <span className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Status 2FA: Aktif & Terlindungi
                </span>
              </div>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded">
                ENFORCED
              </span>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Setiap kali masuk ke sistem pendataan warga, administrator wajib memasukkan kode TOTP 6-digit dari aplikasi authenticator ponsel untuk mencegah kebocoran data kependudukan.
            </p>

            <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="text-slate-700 font-medium flex items-center justify-between">
                <span>Kunci Rahasia Base32 (TOTP):</span>
                <button
                  type="button"
                  onClick={() => handleCopy(admin.totpSecret)}
                  className="text-[11px] text-slate-600 hover:text-slate-900 inline-flex items-center gap-1 font-normal"
                >
                  {copiedCode === admin.totpSecret ? (
                    <Check className="w-3 h-3 text-emerald-600" />
                  ) : (
                    <Copy className="w-3 h-3" />
                  )}
                  {copiedCode === admin.totpSecret ? 'Tersalin' : 'Salin'}
                </button>
              </div>
              <div className="font-mono text-slate-900 font-bold tracking-widest bg-white p-2 rounded border border-slate-200 text-center">
                {admin.totpSecret}
              </div>
            </div>
          </div>

          {/* Backup Emergency Codes */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Kode Cadangan Darurat (Backup Codes)
              </h3>
              <Key className="w-4 h-4 text-slate-400" />
            </div>

            <p className="text-[11px] text-slate-500">
              Dapat digunakan untuk masuk apabila perangkat ponsel hilang atau tidak dapat menerima kode TOTP.
            </p>

            <div className="grid grid-cols-2 gap-2 pt-1 font-mono text-xs tabular-nums">
              {admin.recoveryCodes.map((code) => (
                <div
                  key={code}
                  className="p-1.5 bg-slate-50 border border-slate-200 rounded text-center text-slate-800 flex items-center justify-between px-2 text-[11px]"
                >
                  <span>{code}</span>
                  <button
                    type="button"
                    onClick={() => handleCopy(code)}
                    className="text-slate-400 hover:text-slate-700 ml-1"
                    title="Salin kode"
                  >
                    {copiedCode === code ? (
                      <Check className="w-3 h-3 text-emerald-600" />
                    ) : (
                      <Copy className="w-3 h-3" />
                    )}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Audit Logs Table (7 cols) */}
        <div className="lg:col-span-7 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                Log Audit & Jejak Aktivitas Autentikasi
              </h3>
              <p className="text-[11px] text-slate-500">
                Perekaman otomatis setiap upaya masuk ke portal SIPENDUK.
              </p>
            </div>
            <span className="text-xs font-mono text-slate-500 tabular-nums">
              {auditLogs.length} Entri Tercatat
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                  <th className="py-2.5 px-3">Waktu & Tanggal</th>
                  <th className="py-2.5 px-3">Alamat IP & Perangkat</th>
                  <th className="py-2.5 px-3">Metode 2FA</th>
                  <th className="py-2.5 px-3 text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {auditLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-2.5 px-3 font-mono text-[11px] text-slate-800 whitespace-nowrap">
                      {log.waktu}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="font-mono text-[11px]">{log.ip}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[200px]">
                        {log.perangkat}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                      {log.metode2FA}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <span
                        className={`inline-block font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
                          log.status === 'BERHASIL'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {log.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};
