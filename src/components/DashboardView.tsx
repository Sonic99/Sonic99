import React, { useMemo } from 'react';
import { Citizen } from '../types/citizen';
import { calculateAge } from '../utils/ektpValidation';
import {
  Users,
  Home,
  ShieldCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Download,
  QrCode,
  UserPlus,
  Activity,
  FileCheck2,
  FileText,
} from 'lucide-react';

interface DashboardViewProps {
  citizens: Citizen[];
  onNavigate: (tab: string) => void;
  onOpenCardDetail: (citizen: Citizen) => void;
  onOpenOfficialReport?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  citizens,
  onNavigate,
  onOpenCardDetail,
  onOpenOfficialReport,
}) => {
  // Accurate calculations
  const stats = useMemo(() => {
    const totalWarga = citizens.length;

    // Unique KK count
    const uniqueKkSet = new Set(citizens.map((c) => c.noKk));
    const totalKk = uniqueKkSet.size;

    // Gender breakdown
    const maleCount = citizens.filter((c) => c.jenisKelamin === 'L').length;
    const femaleCount = citizens.filter((c) => c.jenisKelamin === 'P').length;

    // Verification breakdown
    const verifiedCount = citizens.filter((c) => c.statusVerifikasi === 'terverifikasi').length;
    const pendingCount = citizens.filter((c) => c.statusVerifikasi === 'menunggu').length;
    const revisionCount = citizens.filter((c) => c.statusVerifikasi === 'perlu_perbaikan').length;
    const verificationRate = totalWarga > 0 ? ((verifiedCount / totalWarga) * 100).toFixed(1) : '0';

    // Age groups
    let balita = 0; // 0-4
    let anakRemaja = 0; // 5-17
    let produktif = 0; // 18-59
    let lansia = 0; // 60+

    citizens.forEach((c) => {
      const age = calculateAge(c.tanggalLahir);
      if (age <= 4) balita++;
      else if (age <= 17) anakRemaja++;
      else if (age <= 59) produktif++;
      else lansia++;
    });

    // RW breakdown
    const rwMap: Record<string, number> = {};
    citizens.forEach((c) => {
      const rwKey = `RW ${c.alamat.rw}`;
      rwMap[rwKey] = (rwMap[rwKey] || 0) + 1;
    });

    // Job breakdown
    const jobMap: Record<string, number> = {};
    citizens.forEach((c) => {
      jobMap[c.pekerjaan] = (jobMap[c.pekerjaan] || 0) + 1;
    });
    const sortedJobs = Object.entries(jobMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    return {
      totalWarga,
      totalKk,
      maleCount,
      femaleCount,
      verifiedCount,
      pendingCount,
      revisionCount,
      verificationRate,
      ageDistribution: {
        balita,
        anakRemaja,
        produktif,
        lansia,
      },
      rwDistribution: Object.entries(rwMap).sort((a, b) => a[0].localeCompare(b[0])),
      topJobs: sortedJobs,
    };
  }, [citizens]);

  // CSV Export handler
  const handleExportCsv = () => {
    const headers = [
      'NIK',
      'No KK',
      'Nama Lengkap',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Jenis Kelamin',
      'Agama',
      'Pekerjaan',
      'Alamat',
      'RT',
      'RW',
      'Kelurahan',
      'Status Verifikasi',
    ];

    const rows = citizens.map((c) => [
      `"${c.nik}"`,
      `"${c.noKk}"`,
      `"${c.namaLengkap}"`,
      `"${c.tempatLahir}"`,
      `"${c.tanggalLahir}"`,
      `"${c.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}"`,
      `"${c.agama}"`,
      `"${c.pekerjaan}"`,
      `"${c.alamat.jalan}"`,
      `"${c.alamat.rt}"`,
      `"${c.alamat.rw}"`,
      `"${c.alamat.kelurahan}"`,
      `"${c.statusVerifikasi}"`,
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap_Kependudukan_SIPENDUK_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Export Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Dasbor Statistik Kependudukan Terintegrasi
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelurahan Gambir, Jakarta Pusat · Data kependudukan tersinkronisasi secara real-time dengan basis e-KTP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Ekspor Rekap CSV
          </button>

          {onOpenOfficialReport && (
            <button
              type="button"
              onClick={onOpenOfficialReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-rose-950 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-xs"
            >
              <FileText className="w-3.5 h-3.5 text-rose-700" />
              Laporan PDF Kecamatan
            </button>
          )}

          <button
            type="button"
            onClick={() => onNavigate('scanner')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <QrCode className="w-3.5 h-3.5" />
            Pindai QR Warga
          </button>

          <button
            type="button"
            onClick={() => onNavigate('upload-kk')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors shadow-xs"
          >
            <FileCheck2 className="w-3.5 h-3.5 text-emerald-700" />
            Unggah Berkas KK (SIAK)
          </button>

          <button
            type="button"
            onClick={() => onNavigate('register')}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-lg transition-colors shadow-xs"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Tambah Warga
          </button>
        </div>
      </div>

      {/* KPI 4-Card Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Warga */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Total Penduduk</span>
            <Users className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalWarga}
            </div>
            <div className="text-[11px] text-slate-500 mt-1 flex items-center gap-2">
              <span>{stats.maleCount} Pria</span>
              <span className="text-slate-300">·</span>
              <span>{stats.femaleCount} Wanita</span>
            </div>
          </div>
        </div>

        {/* Total Kartu Keluarga */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Kepala Keluarga (KK)</span>
            <Home className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.totalKk}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              Rata-rata {(stats.totalWarga / (stats.totalKk || 1)).toFixed(1)} jiwa per KK
            </div>
          </div>
        </div>

        {/* Tingkat Verifikasi e-KTP */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Validitas e-KTP</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.verificationRate}%
            </div>
            <div className="text-[11px] text-emerald-700 font-medium mt-1 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{stats.verifiedCount} Warga Terverifikasi Sah</span>
            </div>
          </div>
        </div>

        {/* Usia Produktif */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-medium uppercase tracking-wider">Usia Produktif</span>
            <Briefcase className="w-4 h-4 text-slate-400" />
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold font-mono text-slate-900 tabular-nums">
              {stats.ageDistribution.produktif}
            </div>
            <div className="text-[11px] text-slate-500 mt-1">
              {((stats.ageDistribution.produktif / (stats.totalWarga || 1)) * 100).toFixed(0)}% dari total warga (18-59 thn)
            </div>
          </div>
        </div>
      </div>

      {/* Analytics Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column: Demographics & Age Groups (7 cols) */}
        <div className="lg:col-span-7 space-y-6">
          {/* Age Distribution Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                  Distribusi Kelompok Usia Kependudukan
                </h3>
                <p className="text-[11px] text-slate-500">
                  Klasifikasi demografis berdasarkan tanggal lahir resmi e-KTP.
                </p>
              </div>
              <span className="text-xs font-mono text-slate-500 tabular-nums">
                n = {stats.totalWarga} Jiwa
              </span>
            </div>

            <div className="space-y-3 pt-2">
              {/* Balita */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">Balita (0 - 4 tahun)</span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {stats.ageDistribution.balita} jiwa (
                    {((stats.ageDistribution.balita / (stats.totalWarga || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-sky-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.ageDistribution.balita / (stats.totalWarga || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Usia Sekolah / Remaja */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">
                    Anak & Remaja (5 - 17 tahun)
                  </span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {stats.ageDistribution.anakRemaja} jiwa (
                    {((stats.ageDistribution.anakRemaja / (stats.totalWarga || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.ageDistribution.anakRemaja / (stats.totalWarga || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Usia Produktif */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">
                    Usia Produktif (18 - 59 tahun)
                  </span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {stats.ageDistribution.produktif} jiwa (
                    {((stats.ageDistribution.produktif / (stats.totalWarga || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-emerald-600 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.ageDistribution.produktif / (stats.totalWarga || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>

              {/* Lansia */}
              <div>
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-slate-700 font-medium">Lansia (60+ tahun)</span>
                  <span className="font-mono text-slate-900 tabular-nums">
                    {stats.ageDistribution.lansia} jiwa (
                    {((stats.ageDistribution.lansia / (stats.totalWarga || 1)) * 100).toFixed(1)}%)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2 overflow-hidden">
                  <div
                    className="bg-amber-500 h-2 rounded-full transition-all duration-300"
                    style={{
                      width: `${(stats.ageDistribution.lansia / (stats.totalWarga || 1)) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Regional RW Distribution */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Sebaran Warga per Rukun Warga (RW)
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {stats.rwDistribution.map(([rwName, count]) => {
                const pct = ((count / (stats.totalWarga || 1)) * 100).toFixed(0);
                return (
                  <div
                    key={rwName}
                    className="p-3 rounded-lg border border-slate-200 bg-slate-50/70 space-y-1"
                  >
                    <div className="text-xs font-semibold text-slate-700">{rwName}</div>
                    <div className="text-xl font-bold font-mono text-slate-900 tabular-nums">
                      {count} <span className="text-[11px] font-normal text-slate-500">jiwa</span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2">
                      <div
                        className="bg-slate-800 h-1.5 rounded-full"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Status Verifikasi & Top Occupations (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          {/* Status Verifikasi e-KTP Card */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              Status Verifikasi e-KTP Digital
            </h3>

            <div className="space-y-2.5">
              <div className="flex items-center justify-between p-2.5 bg-emerald-50/70 border border-emerald-200/80 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span className="font-semibold text-emerald-950">Terverifikasi Sah</span>
                </div>
                <span className="font-mono font-bold text-emerald-900 tabular-nums">
                  {stats.verifiedCount} Warga
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-600 shrink-0" />
                  <span className="font-semibold text-amber-950">Menunggu Validasi</span>
                </div>
                <span className="font-mono font-bold text-amber-900 tabular-nums">
                  {stats.pendingCount} Warga
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 bg-rose-50/70 border border-rose-200/80 rounded-lg text-xs">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                  <span className="font-semibold text-rose-950">Perlu Perbaikan Dokumen</span>
                </div>
                <span className="font-mono font-bold text-rose-900 tabular-nums">
                  {stats.revisionCount} Warga
                </span>
              </div>
            </div>
          </div>

          {/* Top Occupations */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
              5 Profesi & Lapangan Pekerjaan Utama
            </h3>

            <div className="divide-y divide-slate-100 text-xs">
              {stats.topJobs.map(([jobName, count]) => (
                <div key={jobName} className="py-2 flex items-center justify-between">
                  <span className="text-slate-700 truncate pr-2">{jobName}</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums shrink-0">
                    {count} orang
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification Shortcut banner */}
          <div className="p-4 bg-slate-900 text-white rounded-xl shadow-xs space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider">
              <Activity className="w-4 h-4 text-emerald-400" />
              Siap Pindai di Lapangan
            </div>
            <p className="text-xs text-slate-300 leading-relaxed">
              Petugas sensus dan kelurahan dapat memindai kartu e-KTP warga secara instan untuk verifikasi langsung tanpa kertas.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('scanner')}
              className="mt-2 w-full py-2 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
            >
              Buka Pemindai QR Sekarang
            </button>
          </div>
        </div>
      </div>

      {/* Quick Resident Preview Table */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
            Data Warga Terkini
          </h3>
          <button
            type="button"
            onClick={() => onNavigate('citizens')}
            className="text-xs font-semibold text-slate-700 hover:text-slate-950 transition-colors"
          >
            Lihat Semua ({citizens.length}) →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-2.5 px-3">NIK</th>
                <th className="py-2.5 px-3">Nama Lengkap</th>
                <th className="py-2.5 px-3">L/P</th>
                <th className="py-2.5 px-3">RT / RW</th>
                <th className="py-2.5 px-3">Status e-KTP</th>
                <th className="py-2.5 px-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {citizens.slice(0, 5).map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-800 font-medium">
                    {c.nik}
                  </td>
                  <td className="py-2.5 px-3 font-medium text-slate-900">{c.namaLengkap}</td>
                  <td className="py-2.5 px-3 text-slate-600">{c.jenisKelamin}</td>
                  <td className="py-2.5 px-3 font-mono tabular-nums text-slate-600">
                    RT {c.alamat.rt} / RW {c.alamat.rw}
                  </td>
                  <td className="py-2.5 px-3">
                    <span
                      className={`inline-flex items-center gap-1 font-medium ${
                        c.statusVerifikasi === 'terverifikasi'
                          ? 'text-emerald-700'
                          : c.statusVerifikasi === 'menunggu'
                          ? 'text-amber-700'
                          : 'text-rose-700'
                      }`}
                    >
                      {c.statusVerifikasi === 'terverifikasi' && <CheckCircle2 className="w-3 h-3" />}
                      {c.statusVerifikasi === 'menunggu' && <Clock className="w-3 h-3" />}
                      {c.statusVerifikasi === 'perlu_perbaikan' && <AlertTriangle className="w-3 h-3" />}
                      {c.statusVerifikasi === 'terverifikasi'
                        ? 'Sah'
                        : c.statusVerifikasi === 'menunggu'
                        ? 'Menunggu'
                        : 'Perlu Revisi'}
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-right">
                    <button
                      type="button"
                      onClick={() => onOpenCardDetail(c)}
                      className="px-2.5 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded transition-colors"
                    >
                      Lihat e-KTP
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
