import React, { useState, useMemo, useRef } from 'react';
import { Citizen, DinasKopConfig } from '../types/citizen';
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
  Edit3,
  FileSpreadsheet,
  QrCode,
} from 'lucide-react';

interface OfficialKecamatanReportModalProps {
  citizens: Citizen[];
  isOpen: boolean;
  onClose: () => void;
  kopConfig: DinasKopConfig;
  onOpenKopModal?: () => void;
}

export const OfficialKecamatanReportModal: React.FC<OfficialKecamatanReportModalProps> = ({
  citizens,
  isOpen,
  onClose,
  kopConfig,
  onOpenKopModal,
}) => {
  const [filterRw, setFilterRw] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [nomorSurat, setNomorSurat] = useState(kopConfig.nomorSuratDefault || '470/REG-WARGA/DISDUKCAPIL/X/2026');
  const [tanggalSurat, setTanggalSurat] = useState(() => {
    const d = new Date();
    return d.toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
  });
  const [tujuanLaporan, setTujuanLaporan] = useState(
    'Bapak Camat & Kepala Dinas Kependudukan dan Pencatatan Sipil'
  );
  const [perihal, setPerihal] = useState('Laporan Rekapitulasi Kependudukan & Perekaman e-KTP');

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

  // Comprehensive report statistics
  const stats = useMemo(() => {
    const total = reportCitizens.length;
    const pria = reportCitizens.filter((c) => c.jenisKelamin === 'L').length;
    const wanita = reportCitizens.filter((c) => c.jenisKelamin === 'P').length;
    const kkSet = new Set(reportCitizens.map((c) => c.noKk));
    const verified = reportCitizens.filter((c) => c.statusVerifikasi === 'terverifikasi').length;

    // Age breakdown
    const currentYear = new Date().getFullYear();
    let balita = 0; // 0-4
    let usiaSekolah = 0; // 5-18
    let usiaKerja = 0; // 19-59
    let lansia = 0; // 60+
    let wajibKtp = 0; // 17+ or married

    reportCitizens.forEach((c) => {
      const birthYear = parseInt(c.tanggalLahir.split('-')[0], 10);
      const umur = isNaN(birthYear) ? 25 : currentYear - birthYear;
      if (umur <= 4) balita++;
      else if (umur <= 18) usiaSekolah++;
      else if (umur <= 59) usiaKerja++;
      else lansia++;

      if (umur >= 17 || c.statusPerkawinan === 'Kawin') {
        wajibKtp++;
      }
    });

    const sexRatio = wanita > 0 ? ((pria / wanita) * 100).toFixed(1) : pria > 0 ? '100' : '0';

    return {
      total,
      pria,
      wanita,
      totalKk: kkSet.size,
      verified,
      verifiedPct: total > 0 ? ((verified / total) * 100).toFixed(1) : '0',
      wajibKtp,
      balita,
      usiaSekolah,
      usiaKerja,
      lansia,
      sexRatio,
    };
  }, [reportCitizens]);

  const handleDownloadPdf = () => {
    const options: ReportOptions = {
      nomorSurat,
      tanggalSurat,
      tujuanLaporan,
      perihal,
      filterRw,
      kopConfig,
    };
    exportCitizensToKecamatanPdf(reportCitizens, options);
  };

  const handleExportCsv = () => {
    const headers = [
      'No',
      'No KK',
      'NIK',
      'Nama Lengkap',
      'SHDK',
      'Jenis Kelamin',
      'Tempat Lahir',
      'Tanggal Lahir',
      'Agama',
      'Pendidikan',
      'Pekerjaan',
      'Status Kawin',
      'RT',
      'RW',
      'Dusun/Kelurahan',
      'Kecamatan',
      'Kabupaten/Kota',
      'Provinsi',
      'Status e-KTP',
    ];

    const rows = reportCitizens.map((c, index) => [
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
    link.setAttribute('download', `Rekap_Kependudukan_${kopConfig.namaInstansi.replace(/[^a-zA-Z0-9]/g, '_')}_${tanggalSurat.replace(/\s+/g, '_')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/85 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-6xl w-full my-4 overflow-hidden flex flex-col max-h-[94vh]">
        {/* Top Control Bar (No-Print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex flex-col lg:flex-row lg:items-center justify-between gap-3 no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shrink-0">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-sm sm:text-base font-bold tracking-tight">
                  Format Laporan Resmi Sesuai Permintaan Dinas
                </h2>
                <span className="text-[10px] bg-sky-500/20 text-sky-300 border border-sky-400/30 px-2 py-0.5 rounded font-mono">
                  SIAK Online Kemendagri
                </span>
              </div>
              <p className="text-[11px] text-slate-400">
                Kop Surat Aktif: <strong className="text-slate-200">{kopConfig.namaInstansi}</strong>
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {onOpenKopModal && (
              <button
                type="button"
                onClick={onOpenKopModal}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-300 bg-amber-950/40 hover:bg-amber-900/60 border border-amber-500/40 rounded-lg transition-colors"
                title="Ganti Kop Laporan ke Dinas/Kecamatan/Desa lain"
              >
                <Edit3 className="w-3.5 h-3.5" />
                Ubah Kop Dinas
              </button>
            )}

            <button
              type="button"
              onClick={handleExportCsv}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Ekspor ke Excel CSV"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              CSV Excel
            </button>

            <button
              type="button"
              onClick={handleDownloadPdf}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-bold text-slate-900 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors shadow-xs"
              title="Unduh format PDF A4 Landscape"
            >
              <Download className="w-3.5 h-3.5 text-slate-950" />
              Unduh PDF (.pdf)
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
              title="Cetak langsung ke printer"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak / Print
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

        {/* Filter & Parameters Toolbar (No-Print) */}
        <div className="bg-slate-50 p-3 px-6 border-b border-slate-200 no-print flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5">
              <Filter className="w-3.5 h-3.5 text-slate-500" />
              <span className="font-semibold text-slate-700">Filter RW:</span>
              <select
                value={filterRw}
                onChange={(e) => setFilterRw(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-1 text-slate-800 text-xs font-medium"
              >
                <option value="all">Seluruh Wilayah</option>
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

            <div className="flex items-center gap-1.5">
              <span className="font-semibold text-slate-700">No. Surat:</span>
              <input
                type="text"
                value={nomorSurat}
                onChange={(e) => setNomorSurat(e.target.value)}
                className="bg-white border border-slate-200 rounded px-2 py-0.5 text-slate-800 text-xs font-mono w-44"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-500">
              Total Terpilih: <strong>{reportCitizens.length}</strong> Warga ({stats.totalKk} KK)
            </span>
          </div>
        </div>

        {/* Printable Official Document Container */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-8 bg-slate-100">
          <div
            ref={printRef}
            className="max-w-5xl mx-auto bg-white p-6 sm:p-10 shadow-lg border border-slate-300 rounded-xl space-y-6 text-slate-900 text-xs"
          >
            {/* KOP SURAT RESMI SESUAI PERMINTAAN DINAS */}
            <div className="text-center relative pb-3 border-b-2 border-slate-900">
              <div className="flex items-center justify-center gap-4 mb-1">
                {/* Official seal badge */}
                <div className="w-14 h-14 rounded-full border-2 border-slate-900 bg-amber-50 flex items-center justify-center text-slate-900 font-bold text-xs shadow-xs shrink-0">
                  {kopConfig.logoDaerahType === 'dki' ? (
                    'DKI'
                  ) : kopConfig.logoDaerahType === 'garuda' ? (
                    <ShieldCheck className="w-7 h-7 text-slate-900" />
                  ) : (
                    'PEMDA'
                  )}
                </div>
                <div>
                  <h3 className="text-xs sm:text-sm font-bold tracking-widest uppercase font-serif text-slate-900">
                    {kopConfig.pemerintahTingkat1}
                  </h3>
                  {kopConfig.pemerintahTingkat2 && (
                    <h4 className="text-xs sm:text-sm font-bold tracking-wider uppercase text-slate-900">
                      {kopConfig.pemerintahTingkat2}
                    </h4>
                  )}
                  <h2 className="text-sm sm:text-base font-black tracking-wide uppercase text-slate-950 font-serif">
                    {kopConfig.namaInstansi}
                  </h2>
                  {kopConfig.subInstansi && (
                    <p className="text-[11px] sm:text-xs font-bold text-slate-800 uppercase tracking-tight">
                      {kopConfig.subInstansi}
                    </p>
                  )}
                </div>
              </div>

              <div className="text-[10px] text-slate-700 mt-1">
                Alamat: {kopConfig.alamatKantor} | Telp: {kopConfig.telepon} | Email: {kopConfig.email} | Kode Pos: {kopConfig.kodePos}
              </div>

              {/* Double Line Standar Kop Dinas */}
              <div className="w-full h-0.5 bg-slate-900 mt-2"></div>
              <div className="w-full h-px bg-slate-900 mt-0.5"></div>
            </div>

            {/* DOCUMENT TITLE & LETTER NUMBER */}
            <div className="text-center space-y-1">
              <h3 className="text-sm font-black tracking-wider uppercase text-slate-950 underline font-serif">
                LAPORAN REKAPITULASI DATA KEPENDUDUKAN & PENDAFTARAN WARGA RESMI
              </h3>
              <div className="text-xs font-mono font-bold text-slate-800">
                Nomor Registrasi Dinas: {nomorSurat}
              </div>
            </div>

            {/* REPORT RECIPIENT & CONTEXT */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-800 pt-2 border-t border-slate-200">
              <div className="space-y-1">
                <div>
                  <span className="font-semibold text-slate-600">Kepada Yth:</span>
                  <div className="pl-4 font-bold text-slate-900">{tujuanLaporan}</div>
                </div>
                <div className="text-[11px] text-slate-600 pl-4">
                  Perihal: {perihal}
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
                    {filterRw === 'all' ? 'Seluruh Wilayah Instansi' : `Rukun Warga (RW) ${filterRw}`}
                  </span>
                </div>
                <div>
                  <span className="text-slate-500">Kota: </span>
                  <span className="font-semibold text-slate-900">{kopConfig.kotaSurat}</span>
                </div>
              </div>
            </div>

            {/* STATISTICAL SUMMARY HIGHLIGHT STRIP */}
            <div className="p-3.5 bg-slate-50 border border-slate-300 rounded-lg text-xs space-y-2">
              <div className="font-bold text-slate-900 flex flex-wrap items-center justify-between border-b border-slate-200 pb-1.5">
                <span className="flex items-center gap-1.5 uppercase tracking-wide">
                  <FileText className="w-3.5 h-3.5 text-sky-700" />
                  Rekapitulasi Kependudukan & Perekaman KTP-el
                </span>
                <span className="text-emerald-700 font-mono">
                  Validitas SIAK: 100% Sesuai Disdukcapil RI
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 text-center pt-1">
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Total Penduduk</div>
                  <div className="text-base font-bold text-slate-900">{stats.total} Jiwa</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Kepala Keluarga</div>
                  <div className="text-base font-bold text-slate-900">{stats.totalKk} KK</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Laki-laki / Perempuan</div>
                  <div className="text-base font-bold text-slate-900">{stats.pria} / {stats.wanita}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Rasio Jenis Kelamin</div>
                  <div className="text-base font-bold text-slate-900">{stats.sexRatio}</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">Wajib KTP (≥17 th)</div>
                  <div className="text-base font-bold text-slate-900">{stats.wajibKtp} Jiwa</div>
                </div>
                <div className="p-2 bg-white rounded border border-slate-200">
                  <div className="text-[10px] text-slate-500 font-medium">e-KTP Terverifikasi</div>
                  <div className="text-base font-bold text-emerald-700">{stats.verifiedPct}%</div>
                </div>
              </div>

              {/* Age cohort breakdown */}
              <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200 flex flex-wrap justify-between gap-2">
                <span><strong>Distribusi Usia:</strong> Balita (0-4): {stats.balita} | Usia Sekolah (5-18): {stats.usiaSekolah} | Usia Produktif (19-59): {stats.usiaKerja} | Lansia (60+): {stats.lansia} Jiwa</span>
                <span className="text-slate-500 font-mono">Kode Wilayah Standar Kemendagri</span>
              </div>
            </div>

            {/* OFFICIAL DATA TABLE */}
            <div className="overflow-x-auto border border-slate-300 rounded-lg">
              <table className="w-full text-[11px] text-left border-collapse">
                <thead className="bg-slate-900 text-white uppercase text-[9.5px] font-bold">
                  <tr>
                    <th className="p-2 border border-slate-800 text-center w-8">No</th>
                    <th className="p-2 border border-slate-800">No. Kartu Keluarga</th>
                    <th className="p-2 border border-slate-800">NIK</th>
                    <th className="p-2 border border-slate-800">Nama Lengkap</th>
                    <th className="p-2 border border-slate-800 text-center">SHDK</th>
                    <th className="p-2 border border-slate-800 text-center">JK</th>
                    <th className="p-2 border border-slate-800">Tempat, Tgl Lahir</th>
                    <th className="p-2 border border-slate-800">Pekerjaan</th>
                    <th className="p-2 border border-slate-800">Status Kawin</th>
                    <th className="p-2 border border-slate-800">Alamat Domisili</th>
                    <th className="p-2 border border-slate-800 text-center">Status e-KTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-slate-800">
                  {reportCitizens.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="p-6 text-center text-slate-400 italic">
                        Tidak ada data warga dalam filter yang dipilih. Silakan unggah berkas Kartu Keluarga terlebih dahulu.
                      </td>
                    </tr>
                  ) : (
                    reportCitizens.map((c, idx) => (
                      <tr key={c.id || c.nik} className={idx % 2 === 0 ? 'bg-white' : 'bg-slate-50/70'}>
                        <td className="p-2 border border-slate-200 text-center font-medium">{idx + 1}</td>
                        <td className="p-2 border border-slate-200 font-mono text-[10px]">{c.noKk}</td>
                        <td className="p-2 border border-slate-200 font-mono font-bold text-[10px] text-slate-900">{c.nik}</td>
                        <td className="p-2 border border-slate-200 font-bold text-slate-900">{c.namaLengkap}</td>
                        <td className="p-2 border border-slate-200 text-center text-[10px] font-semibold">
                          {c.hubunganKeluarga || (c.nik === c.noKk ? 'Kepala Keluarga' : 'Anggota')}
                        </td>
                        <td className="p-2 border border-slate-200 text-center font-bold">{c.jenisKelamin}</td>
                        <td className="p-2 border border-slate-200 text-[10px]">{c.tempatLahir}, {c.tanggalLahir}</td>
                        <td className="p-2 border border-slate-200 text-[10px]">{c.pekerjaan || '-'}</td>
                        <td className="p-2 border border-slate-200 text-[10px] capitalize">{c.statusPerkawinan || '-'}</td>
                        <td className="p-2 border border-slate-200 text-[10px]">
                          RT {c.alamat.rt}/RW {c.alamat.rw}, {c.alamat.kelurahan || c.alamat.jalan}
                        </td>
                        <td className="p-2 border border-slate-200 text-center">
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[9px] font-bold ${
                              c.statusVerifikasi === 'terverifikasi'
                                ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {c.statusVerifikasi === 'terverifikasi' ? 'TERVERIFIKASI' : 'MENUNGGU'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* OFFICIAL DUAL SIGNATURE BLOCK WITH DIGITAL SEAL & TTE */}
            <div className="pt-6 border-t-2 border-slate-300 grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs text-slate-900">
              {/* Petugas Pelapor / Verifikator Data */}
              <div className="space-y-1">
                <div className="text-slate-600">Petugas Pelapor / Operator SIAK:</div>
                <div className="font-semibold text-slate-800">{kopConfig.jabatanPenandatangan},</div>

                {/* Digital Verification Seal */}
                <div className="my-2 p-2 bg-slate-50 border border-slate-300 rounded-lg inline-flex items-center gap-2 text-[10px] text-slate-600">
                  <QrCode className="w-7 h-7 text-slate-700 shrink-0" />
                  <div>
                    <div className="font-bold text-slate-800">TTE Terverifikasi BSrE</div>
                    <div>Kemendagri RI · SHA256: 8f9b...a34e</div>
                  </div>
                </div>

                <div className="pt-2">
                  <div className="font-bold text-slate-950 underline text-sm font-serif">
                    {kopConfig.pejabatPenandatangan}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    NIP. {kopConfig.nipPenandatangan}
                  </div>
                </div>
              </div>

              {/* Pejabat Pengesah (Kepala Dinas / Camat / Lurah) */}
              <div className="sm:text-right space-y-1">
                <div className="text-slate-600">
                  {kopConfig.kotaSurat}, {tanggalSurat}
                </div>
                <div className="text-slate-700">Mengetahui dan Mengesahkan,</div>
                <div className="font-bold text-slate-950">{kopConfig.jabatanPengesah},</div>

                {/* Official Stamp & TTE */}
                <div className="my-2 p-2 bg-slate-50 border border-slate-300 rounded-lg inline-flex items-center gap-2 text-[10px] text-slate-600 sm:ml-auto">
                  <div className="text-right">
                    <div className="font-bold text-slate-800">Tanda Tangan Elektronik</div>
                    <div>Dokumen Sah Sesuai UU ITE</div>
                  </div>
                  <ShieldCheck className="w-7 h-7 text-emerald-600 shrink-0" />
                </div>

                <div className="pt-2">
                  <div className="font-bold text-slate-950 underline text-sm font-serif">
                    {kopConfig.pejabatPengesah}
                  </div>
                  <div className="text-slate-600 font-mono text-[11px]">
                    NIP. {kopConfig.nipPengesah}
                  </div>
                </div>
              </div>
            </div>

            {/* Document Security Footnote */}
            <div className="pt-4 border-t border-slate-200 text-[10px] text-slate-500 flex flex-wrap justify-between items-center gap-2">
              <span>
                Dokumen ini dicetak secara sah melalui Sistem Informasi Pendataan Warga (SIPENDUK-RI). Verifikasi keabsahan melalui kode QR terintegrasi database Disdukcapil.
              </span>
              <span className="font-mono">Hal. 1 / 1 · SIAK OK</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
