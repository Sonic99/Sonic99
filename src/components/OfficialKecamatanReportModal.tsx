import React, { useState, useMemo, useRef } from 'react';
import { Citizen } from '../types/citizen';
import { exportCitizensToKecamatanPdf, ReportOptions } from '../utils/kecamatanPdfExport';
import {
  FileText,
  Download,
  Printer,
  X,
  Filter,
  ShieldCheck,
  CheckCircle2,
  Building2,
  UserCheck,
} from 'lucide-react';

interface OfficialKecamatanReportModalProps {
  citizens: Citizen[];
  isOpen: boolean;
  onClose: () => void;
}

export const OfficialKecamatanReportModal: React.FC<OfficialKecamatanReportModalProps> = ({
  citizens,
  isOpen,
  onClose,
}) => {
  const [filterRw, setFilterRw] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [nomorSurat, setNomorSurat] = useState('470/REG-WARGA/X/2026');
  const [tanggalSurat, setTanggalSurat] = useState('18 Oktober 2026');
  const [tujuanLaporan, setTujuanLaporan] = useState('Bapak Camat Gambir, Up. Kepala Seksi Pemerintahan & Kependudukan');

  const printRef = useRef<HTMLDivElement>(null);

  // Available RWs
  const availableRws = useMemo(() => {
    const set = new Set(citizens.map((c) => c.alamat.rw));
    return Array.from(set).sort();
  }, [citizens]);

  // Filtered dataset for the report
  const reportCitizens = useMemo(() => {
    return citizens.filter((c) => {
      const matchRw = filterRw === 'all' || c.alamat.rw === filterRw;
      const matchStatus = filterStatus === 'all' || c.statusVerifikasi === filterStatus;
      return matchRw && matchStatus;
    });
  }, [citizens, filterRw, filterStatus]);

  // Report statistics
  const stats = useMemo(() => {
    const total = reportCitizens.length;
    const pria = reportCitizens.filter((c) => c.jenisKelamin === 'L').length;
    const wanita = reportCitizens.filter((c) => c.jenisKelamin === 'P').length;
    const kkSet = new Set(reportCitizens.map((c) => c.noKk));
    const verified = reportCitizens.filter((c) => c.statusVerifikasi === 'terverifikasi').length;

    return {
      total,
      pria,
      wanita,
      totalKk: kkSet.size,
      verified,
      verifiedPct: total > 0 ? ((verified / total) * 100).toFixed(1) : '0',
    };
  }, [reportCitizens]);

  const handleDownloadPdf = () => {
    const options: ReportOptions = {
      nomorSurat,
      tanggalSurat,
      tujuanLaporan,
      filterRw,
      pejabatKelurahan: 'Dra. Rahayu Kartika, M.Si',
      nipPejabat: '198403152008012004',
      lurahNama: 'Drs. H. Bambang Irawan, M.Si',
      nipLurah: '197805122003121002',
    };
    exportCitizensToKecamatanPdf(reportCitizens, options);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-6xl w-full my-4 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Top Control Bar (No-Print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-col sm:flex-row sm:items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400">
              <Building2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                Laporan Kependudukan Resmi ke Kantor Kecamatan
              </h2>
              <p className="text-[11px] text-slate-400">
                Format standar pelaporan administrasi kependudukan Kemendagri RI (Kelurahan ke Kecamatan)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5 text-slate-900" />
              Unduh Berkas PDF (.pdf)
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Print PDF
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-1"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Customization Toolbar (No-Print) */}
        <div className="bg-slate-50 p-3 px-6 border-b border-slate-200 no-print flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Filter Wilayah RW:</span>
              <select
                value={filterRw}
                onChange={(e) => setFilterRw(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium"
              >
                <option value="all">Seluruh Wilayah Kelurahan</option>
                {availableRws.map((rw) => (
                  <option key={rw} value={rw}>
                    RW {rw}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">Status e-KTP:</span>
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium"
              >
                <option value="all">Semua Status</option>
                <option value="terverifikasi">Hanya Terverifikasi Valid</option>
                <option value="menunggu">Hanya Menunggu</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Data Terpilih: <strong>{reportCitizens.length}</strong> Warga ({stats.totalKk} KK)
            </span>
          </div>
        </div>

        {/* Official Printable Document Container */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-8 bg-slate-100">
          <div
            ref={printRef}
            className="max-w-5xl mx-auto bg-white p-8 sm:p-10 shadow-lg border border-slate-300 rounded-xl space-y-6 text-slate-900 text-xs select-none"
          >
            {/* KOP SURAT RESMI PEMERINTAH DAERAH */}
            <div className="text-center relative pb-3 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-4 mb-1">
                {/* Official seal badge */}
                <div className="w-12 h-12 rounded-full border border-amber-600/40 bg-amber-50 flex items-center justify-center text-amber-800 font-bold text-[9px] shadow-xs">
                  DKI
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase font-serif text-slate-900">
                    PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA
                  </h3>
                  <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-900">
                    KOTA ADMINISTRASI JAKARTA PUSAT
                  </h4>
                  <h2 className="text-sm sm:text-base font-bold tracking-wide uppercase text-slate-950 font-serif">
                    KECAMATAN GAMBIR - KELURAHAN GAMBIR
                  </h2>
                </div>
              </div>

              <div className="text-[10px] text-slate-600 mt-1">
                Jl. Medan Merdeka Timur No. 12, Gambir, Jakarta Pusat 10110 | Telp: (021) 3840921 | Email: kelurahan.gambir@jakarta.go.id
              </div>

              {/* Double Line */}
              <div className="w-full h-0.5 bg-slate-900 mt-2"></div>
              <div className="w-full h-px bg-slate-900 mt-0.5"></div>
            </div>

            {/* DOCUMENT TITLE & LETTER NUMBER */}
            <div className="text-center space-y-1">
              <h3 className="text-sm font-bold tracking-wider uppercase text-slate-950 underline">
                LAPORAN REKAPITULASI DATA KEPENDUDUKAN & PENDAFTARAN WARGA
              </h3>
              <div className="text-xs font-mono text-slate-700">
                Nomor: {nomorSurat}
              </div>
            </div>

            {/* REPORT RECIPIENT & CONTEXT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 pt-2 border-t border-slate-200">
              <div className="space-y-1">
                <div>
                  <span className="font-semibold">Kepada Yth:</span>
                  <div className="pl-4 font-bold text-slate-900">{tujuanLaporan}</div>
                </div>
                <div className="text-[11px] text-slate-600 pl-4">
                  Di Kantor Kecamatan Gambir, Jakarta Pusat
                </div>
              </div>

              <div className="sm:text-right space-y-1">
                <div>
                  <span className="text-slate-500">Tanggal Pelaporan: </span>
                  <span className="font-semibold text-slate-900">{tanggalSurat}</span>
                </div>
                <div>
                  <span className="text-slate-500">Cakupan Wilayah: </span>
                  <span className="font-semibold text-slate-900">
                    {filterRw === 'all' ? 'Seluruh RW (Kelurahan Gambir)' : `Rukun Warga (RW) ${filterRw}`}
                  </span>
                </div>
              </div>
            </div>

            {/* STATISTICAL SUMMARY HIGHLIGHT STRIP */}
            <div className="p-3 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-1">
              <div className="font-bold text-slate-900 flex items-center justify-between">
                <span className="uppercase text-[11px] tracking-wider text-slate-700">
                  Ringkasan Statistik Demografi Pelaporan:
                </span>
                <span className="font-mono text-slate-600 text-[11px]">
                  Basis e-KTP Dukcapil Terverifikasi
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 font-mono text-slate-800 text-[11px] tabular-nums">
                <div>
                  Total Penduduk: <strong>{stats.total} Jiwa</strong>
                </div>
                <div>
                  Kepala Keluarga: <strong>{stats.totalKk} KK</strong>
                </div>
                <div>
                  Rasio: <strong>{stats.pria} Pria / {stats.wanita} Wanita</strong>
                </div>
                <div>
                  Validitas e-KTP: <strong className="text-emerald-800">{stats.verified} ({stats.verifiedPct}%)</strong>
                </div>
              </div>
            </div>

            {/* TABLE OF RESIDENTS */}
            <div className="space-y-1.5">
              <div className="text-[11px] font-bold uppercase tracking-wider text-slate-700">
                I. Daftar Buku Induk Penduduk Terdaftar
              </div>
              <div className="overflow-x-auto border border-slate-300 rounded">
                <table className="w-full text-left text-[10px] border-collapse">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-center">
                      <th className="p-1.5 border-r border-slate-300 w-8">No</th>
                      <th className="p-1.5 border-r border-slate-300">NIK (16 Digit)</th>
                      <th className="p-1.5 border-r border-slate-300">No. Kartu Keluarga</th>
                      <th className="p-1.5 border-r border-slate-300 text-left">Nama Lengkap</th>
                      <th className="p-1.5 border-r border-slate-300">L/P</th>
                      <th className="p-1.5 border-r border-slate-300">Tempat, Tgl Lahir</th>
                      <th className="p-1.5 border-r border-slate-300">Pekerjaan</th>
                      <th className="p-1.5 border-r border-slate-300">Alamat (RT/RW)</th>
                      <th className="p-1.5">Status e-KTP</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {reportCitizens.map((c, idx) => (
                      <tr key={c.id} className="hover:bg-slate-50">
                        <td className="p-1.5 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                        <td className="p-1.5 border-r border-slate-300 font-mono font-medium text-slate-950 tabular-nums">
                          {c.nik}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-mono text-slate-600 tabular-nums">
                          {c.noKk}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 font-bold text-slate-900">
                          {c.namaLengkap}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 text-center font-bold">{c.jenisKelamin}</td>
                        <td className="p-1.5 border-r border-slate-300">
                          {c.tempatLahir}, {c.tanggalLahir}
                        </td>
                        <td className="p-1.5 border-r border-slate-300 truncate max-w-[110px]">{c.pekerjaan}</td>
                        <td className="p-1.5 border-r border-slate-300">
                          RT {c.alamat.rt}/RW {c.alamat.rw}, {c.alamat.jalan}
                        </td>
                        <td className="p-1.5 text-center">
                          <span
                            className={`font-semibold px-1.5 py-0.5 rounded text-[9px] ${
                              c.statusVerifikasi === 'terverifikasi'
                                ? 'text-emerald-800 bg-emerald-50'
                                : 'text-amber-800 bg-amber-50'
                            }`}
                          >
                            {c.statusVerifikasi === 'terverifikasi' ? 'Terverifikasi' : 'Menunggu'}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* OFFICIAL DUAL SIGNATURE BLOCK */}
            <div className="pt-6 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-center text-xs">
              {/* Petugas Pelapor / Verifikator */}
              <div className="space-y-12">
                <div>
                  <div className="text-slate-600">Petugas Pelapor / Verifikator:</div>
                  <div className="font-semibold text-slate-800">
                    Kepala Seksi Pelayanan Kependudukan
                  </div>
                </div>

                <div>
                  <div className="font-bold underline text-slate-900 uppercase">
                    Dra. Rahayu Kartika, M.Si
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    NIP. 198403152008012004
                  </div>
                </div>
              </div>

              {/* Mengetahui / Mengesahkan: Lurah */}
              <div className="space-y-12">
                <div>
                  <div className="text-slate-600">Jakarta Pusat, {tanggalSurat}</div>
                  <div className="font-semibold text-slate-800">
                    Mengetahui / Mengesahkan:
                  </div>
                  <div className="text-slate-700 font-medium">Lurah Kelurahan Gambir</div>
                </div>

                <div>
                  <div className="font-bold underline text-slate-900 uppercase">
                    Drs. H. Bambang Irawan, M.Si
                  </div>
                  <div className="text-[11px] text-slate-600 font-mono">
                    NIP. 197805122003121002
                  </div>
                </div>
              </div>
            </div>

            {/* Document Security Seal */}
            <div className="pt-3 border-t border-slate-200 text-center text-[10px] text-slate-500 font-mono">
              Dokumen ini dicetak secara sah melalui Sistem Informasi Pendataan Warga (SIPENDUK-RI) Kelurahan Gambir · Disdukcapil RI
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
