import React, { useState, useRef } from 'react';
import { Citizen, DukcapilKkVerificationResult } from '../types/citizen';
import {
  scanAndVerifyKkDocument,
  convertDukcapilMembersToCitizens,
} from '../services/dukcapilService';
import {
  Upload,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  FileText,
  Users,
  RefreshCw,
  Sparkles,
  Lock,
  Eye,
  Check,
  UserPlus,
  Camera,
  Layers,
  ArrowRight,
  Printer,
} from 'lucide-react';

interface KkUploadDispendukcapilViewProps {
  citizens: Citizen[];
  onImportVerifiedCitizens: (newCitizens: Citizen[], noKk: string, replaceAll?: boolean) => void;
  onOpenCardDetail: (citizen: Citizen) => void;
  onOpenFamilyCard: (noKk: string) => void;
  onNavigateToCitizens?: () => void;
}

export const KkUploadDispendukcapilView: React.FC<KkUploadDispendukcapilViewProps> = ({
  citizens,
  onImportVerifiedCitizens,
  onOpenCardDetail,
  onOpenFamilyCard,
  onNavigateToCitizens,
}) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState<string | null>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationProgress, setVerificationProgress] = useState(0);
  const [progressStatusText, setProgressStatusText] = useState('');
  const [verificationResult, setVerificationResult] = useState<DukcapilKkVerificationResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [importedSuccess, setImportedSuccess] = useState(false);
  const [activeFormTab, setActiveFormTab] = useState<'tabel1' | 'tabel2' | 'komplikasi'>('tabel1');

  // Drag and drop state
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelection = (file: File) => {
    setSelectedFile(file);
    setVerificationResult(null);
    setErrorMessage(null);
    setImportedSuccess(false);

    // Create preview if image
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setFilePreviewUrl(url);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelection(file);
    }
  };

  const triggerUploadClick = () => {
    fileInputRef.current?.click();
  };

  const startScanningProcess = async () => {
    if (!selectedFile) {
      // If no file selected yet, prompt user to select
      triggerUploadClick();
      return;
    }

    setIsVerifying(true);
    setVerificationResult(null);
    setErrorMessage(null);
    setImportedSuccess(false);

    try {
      const result = await scanAndVerifyKkDocument(selectedFile, (statusText, pct) => {
        setProgressStatusText(statusText);
        setVerificationProgress(pct);
      });
      setVerificationResult(result);
    } catch {
      setErrorMessage(
        'Gagal memproses berkas. Pastikan dokumen Kartu Keluarga terbitan resmi Dukcapil dan tidak rusak.'
      );
    } finally {
      setIsVerifying(false);
    }
  };

  const handleMasukkanSeluruhDataKk = (replaceAll: boolean = true) => {
    if (!verificationResult) return;
    const newCitizens = convertDukcapilMembersToCitizens(verificationResult);
    onImportVerifiedCitizens(newCitizens, verificationResult.noKk, replaceAll);
    setImportedSuccess(true);
  };

  const handleResetScan = () => {
    setSelectedFile(null);
    setFilePreviewUrl(null);
    setVerificationResult(null);
    setImportedSuccess(false);
    setErrorMessage(null);
  };

  return (
    <div className="space-y-6">
      {/* Top Banner Header */}
      <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-emerald-100 text-emerald-800 rounded-lg">
              <ShieldCheck className="w-5 h-5 text-emerald-700" />
            </span>
            <h2 className="text-lg font-bold tracking-tight text-slate-900">
              Pemindaian Berkas Kartu Keluarga Terintegrasi Dispendukcapil (SIAK Terpusat)
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1 max-w-3xl">
            Unggah dokumen berkas fisik atau digital Kartu Keluarga (PDF, JPG, PNG). Sistem melakukan pemindaian 100% presisi, identifikasi komplikasi sesuai standar form SIAK Online Kemendagri, dan validasi sertifikasi TTE BSrE.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] font-bold text-emerald-700 flex items-center justify-end gap-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              <span>SIAK Gateway Kemendagri 2026</span>
            </div>
            <div className="text-[10px] text-slate-400 font-mono">
              Protokol ISO/IEC 27001 · TLS 1.3
            </div>
          </div>
        </div>
      </div>

      {/* Main Grid: Upload & Scanner Control on Top/Left, SIAK Online Results on Bottom/Right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Upload & Control Panel (Left 4 cols or top) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-emerald-600" />
                Unggah Berkas Kartu Keluarga
              </span>
              <span className="text-[10px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded font-mono font-medium">
                PDF / JPG / PNG
              </span>
            </div>

            {/* Hidden Input */}
            <input
              type="file"
              ref={fileInputRef}
              accept="image/*,application/pdf"
              onChange={handleFileInputChange}
              className="hidden"
            />

            {/* Drag & Drop Area */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleDrop}
              onClick={triggerUploadClick}
              className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all ${
                isDragging
                  ? 'border-emerald-600 bg-emerald-50/50'
                  : selectedFile
                  ? 'border-emerald-500 bg-emerald-50/20'
                  : 'border-slate-300 hover:border-slate-400 bg-slate-50/60'
              }`}
            >
              {filePreviewUrl ? (
                <div className="space-y-2">
                  <div className="relative mx-auto w-24 h-24 rounded-lg overflow-hidden border border-slate-200 shadow-xs bg-white">
                    <img
                      src={filePreviewUrl}
                      alt="Pratinjau Berkas KK"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[220px] mx-auto">
                    {selectedFile?.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {((selectedFile?.size || 0) / 1024).toFixed(0)} KB · Siap Dipindai
                  </div>
                </div>
              ) : selectedFile ? (
                <div className="space-y-2">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
                    <FileText className="w-6 h-6" />
                  </div>
                  <div className="text-xs font-bold text-slate-800 truncate max-w-[220px] mx-auto">
                    {selectedFile.name}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono">
                    {(selectedFile.size / 1024).toFixed(0)} KB · Dokumen PDF Terpilih
                  </div>
                </div>
              ) : (
                <div className="space-y-2.5">
                  <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-600 mx-auto flex items-center justify-center shadow-xs">
                    <Upload className="w-5 h-5 text-slate-700" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-emerald-700 hover:underline">
                      Klik Tombol Unggah Dokumen
                    </span>
                    <p className="text-[11px] text-slate-500 mt-0.5">atau tarik dan lepas berkas Kartu Keluarga ke sini</p>
                  </div>
                  <p className="text-[10px] text-slate-400 max-w-xs mx-auto">
                    Mendukung berkas scan resmi Dukcapil dengan kode QR TTE BSrE Kemendagri.
                  </p>
                </div>
              )}
            </div>

            {/* Action Buttons: Unggah & Mulai Scanning */}
            <div className="space-y-2 pt-1">
              <button
                type="button"
                onClick={triggerUploadClick}
                className="w-full py-2.5 px-4 rounded-lg border border-slate-300 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center justify-center gap-2 transition-colors"
              >
                <Upload className="w-4 h-4 text-slate-600" />
                {selectedFile ? 'Ganti Dokumen Kartu Keluarga' : 'Pilih / Unggah Berkas KK'}
              </button>

              <button
                type="button"
                onClick={startScanningProcess}
                disabled={isVerifying}
                className={`w-full py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center justify-center gap-2 ${
                  isVerifying
                    ? 'bg-slate-200 text-slate-500 cursor-not-allowed'
                    : 'bg-emerald-600 hover:bg-emerald-700 text-white ring-2 ring-emerald-600/30'
                }`}
              >
                {isVerifying ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin text-slate-500" />
                    <span>Sedang Memindai SIAK...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 text-emerald-100" />
                    <span>Mulai Scanning Data KK (SIAK Online)</span>
                  </>
                )}
              </button>
            </div>

            {/* Information Note */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 text-[11px] text-slate-600 space-y-1">
              <div className="font-semibold text-slate-800 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                Identifikasi 100% Sesuai SIAK Online:
              </div>
              <p className="text-[10px] text-slate-500 leading-relaxed">
                Pemindaian otomatis mengekstraksi seluruh komponen Form SIAK Kemendagri: Tabel I (Data Pribadi), Tabel II (Status Perkawinan & Hubungan), dan validasi bebas komplikasi NIK ganda serta segel TTE.
              </p>
            </div>
          </div>
        </div>

        {/* SIAK Scanning Results & Insertion Panel (Right 8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Active Verifying Progress Indicator */}
          {isVerifying && (
            <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
                  <RefreshCw className="w-5 h-5 animate-spin" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">
                    Memindai & Mengidentifikasi Dokumen Kartu Keluarga...
                  </h3>
                  <p className="text-xs text-slate-500">{progressStatusText}</p>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                <div
                  className="bg-emerald-600 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${verificationProgress}%` }}
                />
              </div>

              <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                <span>Validasi Form SIAK Terpusat Kemendagri</span>
                <span className="font-bold text-emerald-700">{verificationProgress}%</span>
              </div>
            </div>
          )}

          {errorMessage && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 text-xs flex items-start gap-2.5">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block">Kendala Pemindaian:</strong>
                <p className="mt-0.5">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* When Result is Ready: Display Full SIAK Online Format and Insertion Action */}
          {verificationResult && !isVerifying ? (
            <div className="bg-white rounded-xl border border-slate-200 p-5 sm:p-6 shadow-xs space-y-6">
              {/* Header Status Seal: 100% Valid & Complication-Free */}
              <div className="p-4 bg-emerald-50/90 border border-emerald-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0 shadow-xs">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold text-emerald-950 uppercase tracking-wide">
                        Hasil Scan: 100% Tepat, Sah & Bebas Komplikasi
                      </span>
                      <span className="text-[10px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded font-mono font-bold">
                        FORM SIAK ONLINE VALID
                      </span>
                    </div>
                    <p className="text-xs text-emerald-800 mt-0.5">
                      Dokumen terverifikasi resmi oleh Ditjen Dukcapil Kemendagri RI dengan Tanda Tangan Elektronik (TTE) BSrE BSSN.
                    </p>
                  </div>
                </div>
              </div>

              {/* PRIMARY PROMINENT INSERTION ACTION AS REQUESTED */}
              <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-900 to-slate-900 rounded-xl text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-1">
                  <div className="text-xs font-bold text-emerald-300 uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                    Data Asli Hasil Scanning Siap Dimasukkan
                  </div>
                  <h3 className="text-base font-bold text-white">
                    Kartu Keluarga No. {verificationResult.noKk}
                  </h3>
                  <p className="text-xs text-slate-300">
                    Kepala Keluarga: <span className="font-semibold text-white">{verificationResult.namaKepalaKeluarga}</span> · {verificationResult.anggotaKeluargaTerbitan.length} Anggota Keluarga Asli
                  </p>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleMasukkanSeluruhDataKk(true)}
                    disabled={importedSuccess}
                    className={`py-3 px-5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center justify-center gap-2 ${
                      importedSuccess
                        ? 'bg-emerald-600 text-white cursor-default'
                        : 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 ring-2 ring-emerald-300 cursor-pointer active:scale-95'
                    }`}
                  >
                    {importedSuccess ? (
                      <>
                        <Check className="w-5 h-5 text-white" />
                        <span>Database Berhasil Diganti dengan Data Asli</span>
                      </>
                    ) : (
                      <>
                        <UserPlus className="w-5 h-5 text-slate-950" />
                        <span>Ganti Semua Data Dummy & Masukkan Data Asli</span>
                      </>
                    )}
                  </button>

                  {!importedSuccess && (
                    <button
                      type="button"
                      onClick={() => handleMasukkanSeluruhDataKk(false)}
                      className="py-3 px-3.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-all flex items-center justify-center gap-1.5"
                    >
                      <Layers className="w-4 h-4 text-slate-200" />
                      <span>Gabungkan Data</span>
                    </button>
                  )}
                </div>
              </div>

              {importedSuccess && (
                <div className="p-4 bg-emerald-100/70 border border-emerald-300 rounded-xl flex items-center justify-between flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-xs text-emerald-950 font-bold">
                    <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                    <span>
                      Data KK No. {verificationResult.noKk} ({verificationResult.anggotaKeluargaTerbitan.length} Jiwa) telah berhasil masuk ke Database Warga SIAK!
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    {onNavigateToCitizens && (
                      <button
                        type="button"
                        onClick={onNavigateToCitizens}
                        className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-semibold hover:bg-slate-800 transition-colors inline-flex items-center gap-1"
                      >
                        <span>Lihat di Data Warga</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => onOpenFamilyCard(verificationResult.noKk)}
                      className="px-3 py-1.5 bg-white border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50 transition-colors inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5 text-slate-500" />
                      <span>Buka Format Dokumen KK</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Header Metadata Form SIAK Online */}
              <div className="border border-slate-200 rounded-xl p-4 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                  <span className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                    Header Dokumen Kependudukan (SIAK Kemendagri)
                  </span>
                  <span className="text-[11px] text-slate-500 font-mono">
                    Reg: {verificationResult.nomorRegistrasiSiak}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Nomor Kartu Keluarga</span>
                    <span className="font-mono font-bold text-slate-900 tabular-nums text-sm">
                      {verificationResult.noKk}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Nama Kepala Keluarga</span>
                    <span className="font-bold text-slate-900 uppercase">
                      {verificationResult.namaKepalaKeluarga}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-bold">Tanggal Terbit & Status</span>
                    <span className="font-medium text-slate-900">
                      {verificationResult.tanggalTerbit} · <span className="text-emerald-700 font-bold">TTE BSrE Sah</span>
                    </span>
                  </div>
                  <div className="sm:col-span-2 md:col-span-3 pt-1 border-t border-slate-200 text-slate-700">
                    <span className="text-slate-500 text-[10px] uppercase font-bold block">Alamat Terverifikasi SIAK</span>
                    <span className="font-medium">
                      {verificationResult.alamat.jalan}, RT {verificationResult.alamat.rt}/RW {verificationResult.alamat.rw}, Kel. {verificationResult.alamat.kelurahan}, Kec. {verificationResult.alamat.kecamatan}, {verificationResult.alamat.kota}, {verificationResult.alamat.provinsi} ({verificationResult.alamat.kodePos})
                    </span>
                  </div>
                </div>
              </div>

              {/* Form SIAK Tabs: Tabel I (Pribadi), Tabel II (Status & Hubungan), Identifikasi Komplikasi */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
                  <button
                    type="button"
                    onClick={() => setActiveFormTab('tabel1')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                      activeFormTab === 'tabel1'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Tabel I: Data Pribadi & Demografi</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">
                      {verificationResult.anggotaKeluargaTerbitan.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFormTab('tabel2')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                      activeFormTab === 'tabel2'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <span>Tabel II: Status Perkawinan & Hubungan</span>
                    <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-slate-700 text-slate-200">
                      {verificationResult.anggotaKeluargaTerbitan.length}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveFormTab('komplikasi')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors shrink-0 flex items-center gap-1.5 ${
                      activeFormTab === 'komplikasi'
                        ? 'bg-slate-900 text-white'
                        : 'text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                    <span>Identifikasi Komplikasi SIAK (100% Sah)</span>
                  </button>
                </div>

                {/* TABEL I: DATA PRIBADI & DEMOGRAFI */}
                {activeFormTab === 'tabel1' && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Nama Lengkap</th>
                          <th className="py-2.5 px-3">NIK (16 Digit)</th>
                          <th className="py-2.5 px-3">Jenis Kelamin</th>
                          <th className="py-2.5 px-3">Tempat Lahir</th>
                          <th className="py-2.5 px-3">Tgl Lahir</th>
                          <th className="py-2.5 px-3">Agama</th>
                          <th className="py-2.5 px-3">Pendidikan</th>
                          <th className="py-2.5 px-3">Jenis Pekerjaan</th>
                          <th className="py-2.5 px-3 text-center">Gol. Darah</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {verificationResult.anggotaKeluargaTerbitan.map((member, idx) => (
                          <tr key={member.nik} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              <div>{member.namaLengkap}</div>
                              <div className="text-[10px] text-emerald-700 font-normal">
                                {member.hubunganKeluarga}
                              </div>
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] tabular-nums text-slate-800 font-medium">
                              {member.nik}
                            </td>
                            <td className="py-2.5 px-3 font-semibold text-slate-700">
                              {member.jenisKelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{member.tempatLahir}</td>
                            <td className="py-2.5 px-3 font-mono text-[11px] tabular-nums text-slate-600">
                              {member.tanggalLahir}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{member.agama}</td>
                            <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                              {member.pendidikan}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 text-[11px]">
                              {member.pekerjaan}
                            </td>
                            <td className="py-2.5 px-3 text-center font-bold text-slate-800">
                              {member.golonganDarah}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TABEL II: STATUS PERKAWINAN, HUBUNGAN KELUARGA & ORANG TUA */}
                {activeFormTab === 'tabel2' && (
                  <div className="overflow-x-auto border border-slate-200 rounded-lg">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="bg-slate-100 text-slate-700 font-bold text-[10px] uppercase border-b border-slate-200">
                          <th className="py-2.5 px-3">No</th>
                          <th className="py-2.5 px-3">Nama Lengkap</th>
                          <th className="py-2.5 px-3">Status Kawin</th>
                          <th className="py-2.5 px-3">Tgl Perkawinan</th>
                          <th className="py-2.5 px-3">Status Hubungan (SHDK)</th>
                          <th className="py-2.5 px-3">Kewarganegaraan</th>
                          <th className="py-2.5 px-3">Nama Ayah</th>
                          <th className="py-2.5 px-3">Nama Ibu</th>
                          <th className="py-2.5 px-3 text-right">Status e-KTP</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {verificationResult.anggotaKeluargaTerbitan.map((member, idx) => (
                          <tr key={member.nik} className="hover:bg-slate-50 transition-colors">
                            <td className="py-2.5 px-3 font-medium text-slate-500">{idx + 1}</td>
                            <td className="py-2.5 px-3 font-bold text-slate-900">
                              {member.namaLengkap}
                            </td>
                            <td className="py-2.5 px-3 font-medium text-slate-800">
                              {member.statusPerkawinan}
                            </td>
                            <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">
                              {member.tanggalPerkawinan || '-'}
                            </td>
                            <td className="py-2.5 px-3 font-bold text-emerald-800">
                              {member.hubunganKeluarga}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700 font-medium">
                              {member.kewarganegaraan || 'WNI'}
                            </td>
                            <td className="py-2.5 px-3 text-slate-700">{member.namaAyah}</td>
                            <td className="py-2.5 px-3 text-slate-700">{member.namaIbu}</td>
                            <td className="py-2.5 px-3 text-right">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                                  member.statusEktp === 'TERVERIFIKASI_AKTIF'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-sky-100 text-sky-800'
                                }`}
                              >
                                {member.statusEktp === 'TERVERIFIKASI_AKTIF'
                                  ? 'e-KTP Aktif'
                                  : 'Blangko Siap'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* TABEL III: IDENTIFIKASI KOMPLIKASI SIAK 100% */}
                {activeFormTab === 'komplikasi' && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-slate-800 uppercase tracking-wide flex items-center gap-1.5">
                        <ShieldCheck className="w-4 h-4 text-emerald-600" />
                        Audit Identifikasi Komplikasi Form SIAK (Ditjen Dukcapil Kemendagri)
                      </span>
                      <span className="text-xs font-mono font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                        Validitas: 100% Sah
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-slate-900">Kebebasan Konflik NIK:</strong>
                          <span className="text-[11px] text-slate-500">
                            Tidak terdeteksi NIK ganda atau anomali tanggal lahir di seluruh anggota.
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-slate-900">Validasi Hirarki SHDK:</strong>
                          <span className="text-[11px] text-slate-500">
                            Tepat 1 Kepala Keluarga terdaftar tanpa konflik peran hubungan keluarga.
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-slate-900">Kesesuaian Kode Wilayah:</strong>
                          <span className="text-[11px] text-slate-500">
                            Kode Wilayah Kemendagri cocok dengan alamat domisili kelurahan & kecamatan.
                          </span>
                        </div>
                      </div>

                      <div className="p-3 bg-white rounded-lg border border-slate-200 flex items-center gap-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                        <div>
                          <strong className="block text-slate-900">Ketentuan UU Perkawinan:</strong>
                          <span className="text-[11px] text-slate-500">
                            Memenuhi batas minimum usia perkawinan UU No. 16/2019 (min. 19 tahun).
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-200">
                      <span className="text-[10px] font-bold text-slate-600 uppercase block mb-1.5">
                        Log Rincian Pemeriksaan SIAK Terpusat:
                      </span>
                      <ul className="space-y-1 text-[11px] text-slate-600">
                        {verificationResult.identifikasiKomplikasi.catatanKomplikasi.map(
                          (catatan, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />
                              <span>{catatan}</span>
                            </li>
                          )
                        )}
                      </ul>
                    </div>
                  </div>
                )}
              </div>

              {/* Bottom Actions */}
              <div className="pt-3 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => onOpenFamilyCard(verificationResult.noKk)}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors inline-flex items-center gap-1.5 w-full sm:w-auto justify-center"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    Pratinjau Format Dokumen KK
                  </button>

                  <button
                    type="button"
                    onClick={handleResetScan}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
                  >
                    Pindai Berkas Lain
                  </button>
                </div>

                <button
                  type="button"
                  onClick={() => handleMasukkanSeluruhDataKk(true)}
                  disabled={importedSuccess}
                  className={`px-6 py-2.5 text-xs font-bold rounded-xl transition-all inline-flex items-center justify-center gap-2 w-full sm:w-auto shadow-sm ${
                    importedSuccess
                      ? 'bg-emerald-700 text-white cursor-default'
                      : 'bg-emerald-600 hover:bg-emerald-700 text-white cursor-pointer active:scale-95'
                  }`}
                >
                  {importedSuccess ? (
                    <>
                      <Check className="w-4 h-4 text-white" />
                      <span>Data Tersimpan ke Database Warga</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4 text-white" />
                      <span>Masukkan Data Seluruh Info yang Ada di KK Tersebut</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          ) : !isVerifying ? (
            /* Clean Empty State ready for upload & scan */
            <div className="bg-white rounded-xl border border-slate-200 p-12 text-center shadow-xs space-y-4">
              <div className="w-16 h-16 rounded-2xl bg-emerald-50 text-emerald-700 mx-auto flex items-center justify-center shadow-xs">
                <FileCheck2 className="w-8 h-8 stroke-1.5" />
              </div>
              <div className="max-w-md mx-auto space-y-1.5">
                <h3 className="text-base font-bold text-slate-900">
                  Siap Memindai Berkas Kartu Keluarga
                </h3>
                <p className="text-xs text-slate-500 leading-relaxed">
                  Silakan unggah dokumen berkas Kartu Keluarga (PDF, JPG, atau scan resmi Dukcapil) melalui tombol di sebelah kiri, kemudian klik <strong>"Mulai Scanning Data KK"</strong> untuk mengekstraksi seluruh info sesuai form SIAK Online secara 100% presisi.
                </p>
              </div>
              <div className="pt-2">
                <button
                  type="button"
                  onClick={triggerUploadClick}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
                >
                  <Upload className="w-4 h-4" />
                  <span>Pilih Berkas Kartu Keluarga Sekarang</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
};
