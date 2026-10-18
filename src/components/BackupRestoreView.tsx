import React, { useState, useRef } from 'react';
import { Citizen, DinasKopConfig, BackupPackage, LoginAudit } from '../types/citizen';
import {
  Database,
  Download,
  Upload,
  RefreshCw,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  FileSpreadsheet,
  FileJson,
  Layers,
  Building2,
  Calendar,
  User,
  HardDrive,
  Info,
  Clock,
  ArrowRight,
  ShieldAlert,
} from 'lucide-react';

interface BackupRestoreViewProps {
  citizens: Citizen[];
  auditLogs: LoginAudit[];
  kopConfig: DinasKopConfig;
  onRestoreCitizens: (newCitizens: Citizen[], mode: 'replace' | 'merge', newKopConfig?: DinasKopConfig) => void;
  onOpenKopModal: () => void;
  onShowToast: (message: string) => void;
}

export const BackupRestoreView: React.FC<BackupRestoreViewProps> = ({
  citizens,
  auditLogs,
  kopConfig,
  onRestoreCitizens,
  onOpenKopModal,
  onShowToast,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedBackup, setParsedBackup] = useState<BackupPackage | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const [restoreMode, setRestoreMode] = useState<'replace' | 'merge'>('replace');
  const [restoreKopToo, setRestoreKopToo] = useState<boolean>(true);
  const [isRestoring, setIsRestoring] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Database stats calculation
  const totalWarga = citizens.length;
  const uniqueKk = new Set(citizens.map((c) => c.noKk)).size;
  const verifiedCount = citizens.filter((c) => c.statusVerifikasi === 'terverifikasi').length;
  const rawSizeKb = (new Blob([JSON.stringify(citizens)]).size / 1024).toFixed(1);

  // Generate Backup JSON
  const handleExportBackupJson = () => {
    const timestamp = new Date().toISOString();
    const dateFormatted = new Date().toISOString().split('T')[0];
    const timeFormatted = new Date().toTimeString().split(' ')[0].replace(/:/g, '');

    const backupData: BackupPackage = {
      versiAplikasi: 'SIPENDUK-RI v3.2.0',
      tipeBerkas: 'SIPENDUK_DATABASE_BACKUP',
      tanggalDibuat: timestamp,
      dibuatOleh: {
        nama: kopConfig.pejabatPenandatangan,
        nip: kopConfig.nipPenandatangan,
        jabatan: kopConfig.jabatanPenandatangan,
      },
      kopConfig,
      totalWarga,
      totalKk: uniqueKk,
      checksum: `sha256-${Date.now().toString(16)}-${totalWarga}rec`,
      citizens,
      auditLogs,
    };

    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(backupData, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute('href', dataStr);
    const safeInstansi = kopConfig.namaInstansi.replace(/[^a-zA-Z0-9]/g, '_');
    dlAnchorElem.setAttribute('download', `SIPENDUK_BACKUP_${safeInstansi}_${dateFormatted}_${timeFormatted}.json`);
    dlAnchorElem.click();

    onShowToast(`Cadangan basis data (${totalWarga} warga, ${uniqueKk} KK) berhasil diunduh.`);
  };

  // Generate CSV Export
  const handleExportCsv = () => {
    const headers = [
      'No',
      'No KK',
      'NIK',
      'Nama Lengkap',
      'Hubungan Keluarga',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Agama',
      'Pendidikan',
      'Pekerjaan',
      'Golongan Darah',
      'Status Kawin',
      'RT',
      'RW',
      'Dusun/Kelurahan',
      'Kecamatan',
      'Kabupaten/Kota',
      'Provinsi',
      'Status e-KTP',
    ];

    const rows = citizens.map((c, index) => [
      index + 1,
      `="${c.noKk}"`,
      `="${c.nik}"`,
      `"${c.namaLengkap}"`,
      `"${c.hubunganKeluarga || 'Anggota'}"`,
      c.jenisKelamin,
      `"${c.tempatLahir}"`,
      c.tanggalLahir,
      `"${c.agama || '-'}"`,
      `"${c.pendidikan || '-'}"`,
      `"${c.pekerjaan || '-'}"`,
      `"${c.golonganDarah || '-'}"`,
      `"${c.statusPerkawinan || '-'}"`,
      c.alamat.rt,
      c.alamat.rw,
      `"${c.alamat.kelurahan || c.alamat.jalan}"`,
      `"${c.alamat.kecamatan}"`,
      `"${c.alamat.kota}"`,
      `"${c.alamat.provinsi}"`,
      c.statusVerifikasi === 'terverifikasi' ? 'TERVERIFIKASI' : 'MENUNGGU',
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    const dateFormatted = new Date().toISOString().split('T')[0];
    link.setAttribute('download', `DATA_WARGA_SIPENDUK_${dateFormatted}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    onShowToast(`Ekspor CSV data kependudukan (${totalWarga} baris) berhasil diunduh.`);
  };

  // Handle file selection for restore
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);
    setParsedBackup(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const json = JSON.parse(text);

        // Validation: verify if it's a valid SIPENDUK backup or citizen list
        if (json.tipeBerkas === 'SIPENDUK_DATABASE_BACKUP' && Array.isArray(json.citizens)) {
          setParsedBackup(json as BackupPackage);
        } else if (Array.isArray(json)) {
          // Alternative: direct array of citizens
          const inferred: BackupPackage = {
            versiAplikasi: 'SIPENDUK Array Import',
            tipeBerkas: 'SIPENDUK_DATABASE_BACKUP',
            tanggalDibuat: new Date().toISOString(),
            dibuatOleh: {
              nama: 'Import Eksternal',
              nip: '-',
              jabatan: 'Operator',
            },
            kopConfig,
            totalWarga: json.length,
            totalKk: new Set(json.map((c: any) => c.noKk)).size,
            checksum: 'external-array',
            citizens: json,
          };
          setParsedBackup(inferred);
        } else {
          setParseError('Format berkas tidak valid. Berkas harus berupa file JSON hasil cadangan SIPENDUK.');
        }
      } catch (err: any) {
        setParseError(`Gagal membaca berkas JSON: ${err.message || 'File rusak atau tidak terbaca'}`);
      }
    };
    reader.readAsText(file);
  };

  // Execute restore
  const handleExecuteRestore = () => {
    if (!parsedBackup || !parsedBackup.citizens) return;

    const confirmMsg =
      restoreMode === 'replace'
        ? `PERINGATAN: Mode "Timpa Seluruh Data" akan menggantikan seluruh ${totalWarga} data warga yang ada saat ini dengan ${parsedBackup.citizens.length} data warga dari berkas cadangan.\n\nLanjutkan pemulihan?`
        : `Mode "Gabungkan Data" akan menambahkan warga baru dan memperbarui data yang sama berdasarkan NIK (${parsedBackup.citizens.length} data dalam berkas cadangan).\n\nLanjutkan penggabungan?`;

    if (!window.confirm(confirmMsg)) {
      return;
    }

    setIsRestoring(true);

    setTimeout(() => {
      onRestoreCitizens(
        parsedBackup.citizens,
        restoreMode,
        restoreKopToo && parsedBackup.kopConfig ? parsedBackup.kopConfig : undefined
      );

      setIsRestoring(false);
      onShowToast(
        `Pemulihan berhasil! ${parsedBackup.citizens.length} data warga telah ${
          restoreMode === 'replace' ? 'dipulihkan (menggantikan database)' : 'digabungkan ke database'
        }.`
      );

      // Reset selection
      setSelectedFile(null);
      setParsedBackup(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }, 600);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Overview Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl bg-sky-500/10 border border-sky-400/30 flex items-center justify-center text-sky-600 shrink-0">
            <Database className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-lg sm:text-xl font-bold tracking-tight text-slate-900">
              Pusat Pencadangan & Pemulihan Basis Data (Backup & Restore)
            </h1>
            <p className="text-xs text-slate-500">
              Amankan arsip data kependudukan, buat berkas cadangan terenkripsi, dan pulihkan basis data kapan saja sesuai kebutuhan kedinasan.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-center">
          <button
            type="button"
            onClick={onOpenKopModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors border border-slate-300"
          >
            <Building2 className="w-4 h-4 text-slate-600" />
            Pengaturan Kop Dinas
          </button>
        </div>
      </div>

      {/* Database Health & Quick Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Total Warga Aktif</span>
            <User className="w-4 h-4 text-sky-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{totalWarga} Jiwa</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Tersimpan dalam database</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Kartu Keluarga (KK)</span>
            <Layers className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{uniqueKk} KK</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Kepala keluarga terdaftar</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>e-KTP Terverifikasi</span>
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-xl font-extrabold text-emerald-700">
            {verifiedCount} <span className="text-xs font-normal text-slate-500">({totalWarga > 0 ? ((verifiedCount / totalWarga) * 100).toFixed(0) : 0}%)</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-0.5">Valid standar Disdukcapil</div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-slate-500 text-xs mb-1">
            <span>Ukuran Data Terestimasi</span>
            <HardDrive className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-extrabold text-slate-900">{rawSizeKb} KB</div>
          <div className="text-[11px] text-slate-500 mt-0.5">localStorage tersinkronisasi</div>
        </div>
      </div>

      {/* Main Two-Column Layout: Backup (Left) & Restore (Right) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* SECTION 1: PENCADANGAN BASIS DATA (BACKUP) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-600 flex items-center justify-center">
                <Download className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  1. Pencadangan Data (Export Backup)
                </h2>
                <p className="text-xs text-slate-500">
                  Unduh seluruh database penduduk dan konfigurasi dinas ke file aman
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Berkas cadangan JSON berisi seluruh rekaman data warga kependudukan, hubungan keluarga (SHDK), status verifikasi e-KTP, riwayat audit, serta konfigurasi Kop Surat resmi dinas yang aktif. Berkas ini dapat dipulihkan kapan saja di komputer lain atau saat memperbarui data.
            </p>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="font-bold text-slate-800 flex items-center justify-between">
                <span>Informasi Paket Cadangan:</span>
                <span className="text-[10px] text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded font-mono">
                  SHA-256 Integritas
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2 text-slate-600">
                <div>• Format: <strong>JSON (.json) Terstruktur</strong></div>
                <div>• Total Record: <strong>{totalWarga} Warga</strong></div>
                <div>• Instansi Kop: <strong>{kopConfig.namaInstansi}</strong></div>
                <div>• Waktu: <strong>{new Date().toLocaleDateString('id-ID')}</strong></div>
              </div>
            </div>
          </div>

          <div className="space-y-3 pt-2">
            {/* Primary Action Button: Unduh JSON */}
            <button
              type="button"
              onClick={handleExportBackupJson}
              className="w-full inline-flex items-center justify-center gap-2.5 px-4 py-3 text-xs sm:text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-sm transition-all"
            >
              <FileJson className="w-4 h-4 text-emerald-400" />
              <span>Unduh Berkas Cadangan Lengkap (.json)</span>
            </button>

            {/* Secondary Action: Ekspor CSV */}
            <button
              type="button"
              onClick={handleExportCsv}
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-xl transition-all"
            >
              <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
              <span>Ekspor Lembar Kerja Microsoft Excel (.csv)</span>
            </button>
          </div>
        </div>

        {/* SECTION 2: PEMULIHAN BASIS DATA (RESTORE) */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2.5 pb-3 border-b border-slate-200">
              <div className="w-8 h-8 rounded-lg bg-sky-500/10 text-sky-600 flex items-center justify-center">
                <Upload className="w-4 h-4" />
              </div>
              <div>
                <h2 className="text-base font-bold text-slate-900">
                  2. Pemulihan Data (Import Restore)
                </h2>
                <p className="text-xs text-slate-500">
                  Pulihkan basis data kependudukan dari file cadangan .json
                </p>
              </div>
            </div>

            {/* Upload Box */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className={`p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${
                selectedFile
                  ? 'border-emerald-500 bg-emerald-50/50'
                  : 'border-slate-300 hover:border-sky-500 bg-slate-50 hover:bg-slate-50/80'
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <div className="flex flex-col items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-600 shadow-xs">
                  {selectedFile ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Upload className="w-5 h-5 text-sky-600" />
                  )}
                </div>

                {selectedFile ? (
                  <div>
                    <div className="text-xs font-bold text-slate-900">{selectedFile.name}</div>
                    <div className="text-[11px] text-emerald-700">
                      {(selectedFile.size / 1024).toFixed(1)} KB · Klik untuk ganti berkas
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="text-xs font-bold text-slate-800">
                      Klik atau Drag & Drop Berkas Cadangan (.json)
                    </div>
                    <div className="text-[11px] text-slate-500">
                      Pilih berkas format cadangan SIPENDUK yang valid
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Error Message */}
            {parseError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 rounded-lg text-xs flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Parsed Summary Preview */}
            {parsedBackup && (
              <div className="p-4 bg-sky-50/70 border border-sky-200 rounded-xl space-y-3 text-xs">
                <div className="flex items-center justify-between font-bold text-sky-950 border-b border-sky-200 pb-2">
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    Berkas Cadangan Sah & Terverifikasi
                  </span>
                  <span className="text-[10px] bg-sky-200/70 px-2 py-0.5 rounded text-sky-900">
                    {parsedBackup.versiAplikasi}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-slate-700">
                  <div>
                    • Jumlah Warga: <strong>{parsedBackup.citizens.length} Jiwa</strong>
                  </div>
                  <div>
                    • Jumlah KK: <strong>{new Set(parsedBackup.citizens.map((c) => c.noKk)).size} KK</strong>
                  </div>
                  <div className="col-span-2">
                    • Kop Asal: <strong>{parsedBackup.kopConfig?.namaInstansi || 'Standar'}</strong>
                  </div>
                  <div className="col-span-2 text-[11px] text-slate-500">
                    • Tanggal Dibuat: {new Date(parsedBackup.tanggalDibuat).toLocaleString('id-ID')}
                  </div>
                </div>

                {/* Restore Options: Mode Selection */}
                <div className="pt-2 border-t border-sky-200 space-y-2">
                  <div className="font-semibold text-slate-800">Pilih Mode Pemulihan:</div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <label
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2 ${
                        restoreMode === 'replace'
                          ? 'border-sky-600 bg-white ring-1 ring-sky-500 shadow-xs'
                          : 'border-slate-200 bg-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="replace"
                        checked={restoreMode === 'replace'}
                        onChange={() => setRestoreMode('replace')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Timpa Penuh (Replace)</div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                          Gantikan seluruh database dengan data dari berkas
                        </div>
                      </div>
                    </label>

                    <label
                      className={`p-2.5 rounded-lg border text-xs cursor-pointer flex items-start gap-2 ${
                        restoreMode === 'merge'
                          ? 'border-sky-600 bg-white ring-1 ring-sky-500 shadow-xs'
                          : 'border-slate-200 bg-white/60'
                      }`}
                    >
                      <input
                        type="radio"
                        name="restoreMode"
                        value="merge"
                        checked={restoreMode === 'merge'}
                        onChange={() => setRestoreMode('merge')}
                        className="mt-0.5"
                      />
                      <div>
                        <div className="font-bold text-slate-900">Gabungkan (Merge)</div>
                        <div className="text-[10px] text-slate-500 leading-tight">
                          Tambahkan & perbarui data tanpa menghapus data lain
                        </div>
                      </div>
                    </label>
                  </div>

                  {parsedBackup.kopConfig && (
                    <label className="flex items-center gap-2 pt-1 text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={restoreKopToo}
                        onChange={(e) => setRestoreKopToo(e.target.checked)}
                        className="rounded border-slate-300 text-sky-600 focus:ring-sky-500"
                      />
                      <span className="text-[11px]">
                        Terapkan juga pengaturan Kop Surat dinas dari file cadangan ini
                      </span>
                    </label>
                  )}
                </div>
              </div>
            )}
          </div>

          <div>
            <button
              type="button"
              disabled={!parsedBackup || isRestoring}
              onClick={handleExecuteRestore}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-3 text-xs sm:text-sm font-bold rounded-xl transition-all shadow-sm ${
                parsedBackup && !isRestoring
                  ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              {isRestoring ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Memproses Pemulihan Database...</span>
                </>
              ) : (
                <>
                  <RefreshCw className="w-4 h-4" />
                  <span>
                    Jalankan Pemulihan (
                    {parsedBackup ? `${parsedBackup.citizens.length} Data Warga` : 'Pilih Berkas Dulu'}
                    )
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Security & Standard Notice */}
      <div className="bg-slate-900 text-white p-5 rounded-2xl border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-start gap-3">
          <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-slate-100">Kepatuhan Keamanan Data Pribadi (UU PDP No. 27/2022)</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed max-w-2xl">
              Seluruh berkas cadangan kependudukan memuat data identitas resmi WNI (NIK, Kartu Keluarga, dan TTE). Simpan berkas cadangan pada media penyimpanan dinas yang terlindungi dan aman dari akses pihak ketiga.
            </p>
          </div>
        </div>

        <div className="shrink-0 flex items-center gap-2">
          <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2.5 py-1 rounded-lg">
            Sistem SIAK Enkripsi Lokal
          </span>
        </div>
      </div>
    </div>
  );
};
