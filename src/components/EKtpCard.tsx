import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Citizen } from '../types/citizen';
import { Printer, QrCode, ShieldCheck, CheckCircle2, Clock, AlertTriangle, Download, X } from 'lucide-react';

interface EKtpCardProps {
  citizen: Citizen;
  onClose?: () => void;
  isModal?: boolean;
}

export const EKtpCard: React.FC<EKtpCardProps> = ({ citizen, onClose, isModal = false }) => {
  const [showQrBack, setShowQrBack] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // Determine official ID background color based on Indonesian rule:
  // Odd birth year = Red background, Even birth year = Blue background
  const birthYear = parseInt(citizen.tanggalLahir.split('-')[0], 10) || 1990;
  const isOddYear = birthYear % 2 !== 0;
  const photoBgClass = isOddYear ? 'bg-red-700' : 'bg-blue-700';

  useEffect(() => {
    QRCode.toDataURL(
      citizen.qrPayload,
      {
        width: 320,
        margin: 1,
        color: {
          dark: '#0f172a',
          light: '#ffffff',
        },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [citizen]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_Kependudukan_${citizen.nik}_${citizen.namaLengkap.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  const content = (
    <div className="flex flex-col items-center">
      {/* Top action toolbar */}
      <div className="w-full flex items-center justify-between pb-3 mb-3 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">
            Pratinjau e-KTP Digital Resmi
          </span>
          <span className="text-slate-300">·</span>
          <span className="text-xs text-slate-600 font-mono tabular-nums">{citizen.nik}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowQrBack(!showQrBack)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <QrCode className="w-3.5 h-3.5 text-slate-600" />
            {showQrBack ? 'Lihat Tampak Depan' : 'Lihat QR Verifikasi'}
          </button>

          <button
            type="button"
            onClick={handleDownloadQr}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-md hover:bg-slate-50 transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Unduh QR
          </button>

          <button
            type="button"
            onClick={handlePrint}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-slate-900 rounded-md hover:bg-slate-800 transition-colors"
          >
            <Printer className="w-3.5 h-3.5" />
            Cetak Kartu
          </button>

          {isModal && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors ml-1"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* The Printable e-KTP Physical Card Container */}
      <div
        ref={printRef}
        className="relative w-full max-w-[620px] aspect-[85.6/53.98] rounded-xl overflow-hidden shadow-md border border-sky-300 select-none text-slate-900"
        style={{
          backgroundImage: `url('/src/assets/images/ektp_hologram_texture_1792213981709.jpg')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        {/* Subtle cyan laminate tint */}
        <div className="absolute inset-0 bg-sky-100/50 mix-blend-multiply pointer-events-none" />

        {!showQrBack ? (
          /* FRONT SIDE */
          <div className="relative z-10 w-full h-full p-4 flex flex-col justify-between text-[11px] sm:text-[12px] leading-tight">
            {/* Header */}
            <div className="text-center font-bold tracking-wider leading-none">
              <div className="text-[12px] sm:text-[13px] uppercase text-slate-900">
                REPUBLIK INDONESIA
              </div>
              <div className="text-[10px] sm:text-[11px] uppercase text-slate-800 mt-0.5">
                PROVINSI {citizen.alamat.provinsi}
              </div>
              <div className="text-[10px] sm:text-[11px] uppercase text-slate-800">
                {citizen.alamat.kota}
              </div>
            </div>

            {/* NIK row */}
            <div className="mt-1 flex items-baseline gap-2">
              <span className="font-bold text-[13px] sm:text-[15px] tracking-wide text-slate-900">
                NIK
              </span>
              <span className="font-mono font-bold text-[14px] sm:text-[17px] tracking-wider text-slate-950 tabular-nums">
                : {citizen.nik}
              </span>
            </div>

            {/* Card Body Grid */}
            <div className="grid grid-cols-12 gap-2 flex-1 mt-1">
              {/* Fields column (Left 8 cols) */}
              <div className="col-span-8 flex flex-col justify-between text-[10px] sm:text-[11px] space-y-0.5 font-medium">
                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Nama</span>
                  <span className="col-span-8 font-semibold truncate">: {citizen.namaLengkap}</span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Tempat/Tgl Lahir</span>
                  <span className="col-span-8 truncate">
                    : {citizen.tempatLahir},{' '}
                    {new Date(citizen.tanggalLahir).toLocaleDateString('id-ID', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Jenis Kelamin</span>
                  <span className="col-span-5">
                    : {citizen.jenisKelamin === 'L' ? 'LAKI-LAKI' : 'PEREMPUAN'}
                  </span>
                  <span className="col-span-3 uppercase">Gol. Darah : {citizen.golonganDarah}</span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Alamat</span>
                  <span className="col-span-8 truncate">: {citizen.alamat.jalan}</span>
                </div>

                <div className="grid grid-cols-12 pl-4">
                  <span className="col-span-3 uppercase text-[9px] sm:text-[10px]">RT/RW</span>
                  <span className="col-span-9 font-mono tabular-nums">
                    : {citizen.alamat.rt}/{citizen.alamat.rw}
                  </span>
                </div>

                <div className="grid grid-cols-12 pl-4">
                  <span className="col-span-3 uppercase text-[9px] sm:text-[10px]">Kel/Desa</span>
                  <span className="col-span-9 truncate">: {citizen.alamat.kelurahan}</span>
                </div>

                <div className="grid grid-cols-12 pl-4">
                  <span className="col-span-3 uppercase text-[9px] sm:text-[10px]">Kecamatan</span>
                  <span className="col-span-9 truncate">: {citizen.alamat.kecamatan}</span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Agama</span>
                  <span className="col-span-8 uppercase">: {citizen.agama}</span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Status Perkawinan</span>
                  <span className="col-span-8 uppercase">: {citizen.statusPerkawinan}</span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Pekerjaan</span>
                  <span className="col-span-8 truncate uppercase">: {citizen.pekerjaan}</span>
                </div>

                <div className="grid grid-cols-12">
                  <span className="col-span-4 uppercase">Kewarganegaraan</span>
                  <span className="col-span-8 uppercase">: {citizen.kewarganegaraan}</span>
                </div>

                <div className="grid grid-cols-12 font-bold text-slate-900 pt-0.5">
                  <span className="col-span-4 uppercase">Berlaku Hingga</span>
                  <span className="col-span-8 uppercase">: SEUMUR HIDUP</span>
                </div>
              </div>

              {/* Photo & Signature Column (Right 4 cols) */}
              <div className="col-span-4 flex flex-col items-center justify-between text-center">
                {/* Contactless Chip Simulation */}
                <div className="w-8 h-6 rounded bg-gradient-to-tr from-amber-400 to-amber-200 border border-amber-500/70 shadow-xs flex items-center justify-center self-end mb-1">
                  <div className="w-5 h-3 border border-amber-600/40 rounded-xs flex items-center justify-center">
                    <div className="w-2 h-full border-r border-amber-600/40"></div>
                  </div>
                </div>

                {/* Passport/KTP Photo */}
                <div
                  className={`w-24 sm:w-28 aspect-[3/4] ${photoBgClass} rounded border border-slate-400 overflow-hidden shadow-inner flex items-center justify-center relative`}
                >
                  {/* Photo representation */}
                  <div className="w-full h-full flex flex-col items-center justify-end text-white/90">
                    <div className="w-14 h-14 rounded-full bg-slate-200/90 border border-white/50 mb-1 shadow-xs flex items-center justify-center text-slate-700 font-bold text-lg">
                      {citizen.namaLengkap.charAt(0)}
                    </div>
                    <div className="w-22 h-14 bg-slate-800 rounded-t-xl" />
                  </div>
                  {/* Watermark text */}
                  <span className="absolute bottom-1 right-1 text-[8px] text-white/70 font-mono tracking-tighter">
                    DUKCAPIL
                  </span>
                </div>

                {/* Issue city and signature */}
                <div className="w-full text-center mt-1 text-[8px] sm:text-[9px] text-slate-700">
                  <div>
                    {citizen.alamat.kota},{' '}
                    {citizen.terakhirDiverifikasi || citizen.tanggalDaftar}
                  </div>
                  <div className="font-serif italic font-semibold text-slate-800 tracking-wider text-[11px] mt-0.5 border-b border-slate-500/50 pb-0.5 inline-block px-2">
                    {citizen.namaLengkap.split(' ')[0]}
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* BACK SIDE WITH QR VERIFICATION CHIP */
          <div className="relative z-10 w-full h-full p-5 flex flex-col items-center justify-between text-center bg-white/90 backdrop-blur-xs">
            <div className="w-full flex items-center justify-between border-b border-slate-300 pb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-slate-800">
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                Sertifikat Identitas Kependudukan Elektronik
              </div>
              <span className="text-[10px] font-mono text-slate-500">ISO/IEC 18004</span>
            </div>

            <div className="flex items-center justify-center gap-6 my-auto">
              {qrDataUrl && (
                <div className="p-2 bg-white rounded-lg border border-slate-300 shadow-sm">
                  <img src={qrDataUrl} alt="QR Warga" className="w-32 h-32" />
                </div>
              )}

              <div className="text-left text-[11px] space-y-1 text-slate-700 max-w-[260px]">
                <div className="font-semibold text-slate-900 text-xs">
                  {citizen.namaLengkap}
                </div>
                <div className="font-mono text-[10px] text-slate-600">NIK: {citizen.nik}</div>
                <div className="text-[10px] text-slate-600">
                  Domisili: RT {citizen.alamat.rt} / RW {citizen.alamat.rw}, {citizen.alamat.kelurahan}
                </div>
                <div className="pt-2 flex items-center gap-1 text-[10px] font-medium text-emerald-800">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  Tanda Tangan Kriptografis Sah Dukcapil
                </div>
                <div className="text-[9px] text-slate-400">
                  Pindai menggunakan aplikasi petugas SIPENDUK untuk verifikasi real-time seketika.
                </div>
              </div>
            </div>

            <div className="w-full text-center text-[9px] text-slate-500 border-t border-slate-200 pt-1">
              Kementerian Dalam Negeri Republik Indonesia · Direktorat Jenderal Kependudukan dan Pencatatan Sipil
            </div>
          </div>
        )}
      </div>

      {/* Verification status badge below card */}
      <div className="mt-3 flex items-center gap-3 text-xs text-slate-600">
        <span className="font-medium text-slate-700">Status Verifikasi Sistem:</span>
        {citizen.statusVerifikasi === 'terverifikasi' && (
          <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
            <CheckCircle2 className="w-3.5 h-3.5" /> e-KTP Valid & Terverifikasi
          </span>
        )}
        {citizen.statusVerifikasi === 'menunggu' && (
          <span className="inline-flex items-center gap-1 font-semibold text-amber-700">
            <Clock className="w-3.5 h-3.5" /> Menunggu Validasi Petugas
          </span>
        )}
        {citizen.statusVerifikasi === 'perlu_perbaikan' && (
          <span className="inline-flex items-center gap-1 font-semibold text-rose-700">
            <AlertTriangle className="w-3.5 h-3.5" /> Perlu Perbaikan Dokumen
          </span>
        )}
        {citizen.catatanVerifikasi && (
          <>
            <span className="text-slate-300">·</span>
            <span className="text-slate-500 italic max-w-sm truncate">
              "{citizen.catatanVerifikasi}"
            </span>
          </>
        )}
      </div>
    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
        <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-xs">
      {content}
    </div>
  );
};
