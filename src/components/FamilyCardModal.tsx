import React, { useEffect, useState, useRef } from 'react';
import QRCode from 'qrcode';
import { Citizen, VerificationStatus } from '../types/citizen';
import { generateKkQrPayload } from '../utils/ektpValidation';
import {
  Users,
  Printer,
  Download,
  X,
  ShieldCheck,
  CheckCircle2,
  Clock,
  AlertTriangle,
  UserCheck,
} from 'lucide-react';

interface FamilyCardModalProps {
  noKk: string;
  familyMembers: Citizen[];
  isOpen: boolean;
  onClose: () => void;
  onVerifyEntireFamily?: (noKk: string) => void;
  onSelectMember?: (citizen: Citizen) => void;
}

export const FamilyCardModal: React.FC<FamilyCardModalProps> = ({
  noKk,
  familyMembers,
  isOpen,
  onClose,
  onVerifyEntireFamily,
  onSelectMember,
}) => {
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const printRef = useRef<HTMLDivElement>(null);

  // Find head of family or default to first member
  const headOfFamily =
    familyMembers.find((m) => m.hubunganKeluarga === 'Kepala Keluarga') ||
    familyMembers[0] ||
    null;

  const address = headOfFamily?.alamat || familyMembers[0]?.alamat;

  // Family verification status: terverifikasi if all are verified, else pending
  const allVerified =
    familyMembers.length > 0 &&
    familyMembers.every((m) => m.statusVerifikasi === 'terverifikasi');
  const hasRevisions = familyMembers.some((m) => m.statusVerifikasi === 'perlu_perbaikan');

  const familyStatus: VerificationStatus = allVerified
    ? 'terverifikasi'
    : hasRevisions
    ? 'perlu_perbaikan'
    : 'menunggu';

  useEffect(() => {
    if (!headOfFamily) return;

    const payload = generateKkQrPayload({
      noKk,
      namaKepalaKeluarga: headOfFamily.namaLengkap,
      jumlahAnggota: familyMembers.length,
      kelurahan: address?.kelurahan || 'Gambir',
    });

    QRCode.toDataURL(
      payload,
      {
        width: 250,
        margin: 1,
        color: { dark: '#0f172a', light: '#ffffff' },
      },
      (err, url) => {
        if (!err && url) {
          setQrDataUrl(url);
        }
      }
    );
  }, [noKk, headOfFamily, familyMembers.length, address]);

  if (!isOpen || !headOfFamily) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadQr = () => {
    if (!qrDataUrl) return;
    const link = document.createElement('a');
    link.download = `QR_Kartu_Keluarga_${noKk}_${headOfFamily.namaLengkap.replace(/\s+/g, '_')}.png`;
    link.href = qrDataUrl;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-xs overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-5xl w-full my-6 overflow-hidden flex flex-col">
        {/* Action Header (No-Print) */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between no-print border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/30 flex items-center justify-center text-sky-400">
              <Users className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-bold tracking-tight">
                Dokumen Kartu Keluarga (KK) Elektronik
              </h2>
              <p className="text-[11px] text-slate-400 font-mono">
                No. KK: {noKk} · Kepala Keluarga: {headOfFamily.namaLengkap}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onVerifyEntireFamily && !allVerified && (
              <button
                type="button"
                onClick={() => onVerifyEntireFamily(noKk)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-emerald-900 bg-emerald-300 hover:bg-emerald-200 rounded-lg transition-colors"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Verifikasi Sekeluarga
              </button>
            )}

            <button
              type="button"
              onClick={handleDownloadQr}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              Unduh QR KK
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white hover:bg-slate-100 rounded-lg transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              Cetak KK
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors ml-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Official Indonesian Kartu Keluarga View */}
        <div
          ref={printRef}
          className="p-6 sm:p-8 bg-white text-slate-900 space-y-6 overflow-x-auto text-[11px] leading-tight select-none"
        >
          {/* Official Document Header */}
          <div className="text-center space-y-1 pb-3 border-b-2 border-slate-900">
            {/* Garuda Pancasila representation */}
            <div className="flex justify-center mb-1">
              <div className="w-12 h-12 rounded-full border border-amber-600/40 bg-amber-50 flex items-center justify-center text-amber-700 font-bold shadow-xs">
                <span className="text-[10px] tracking-widest uppercase">GARUDA</span>
              </div>
            </div>

            <div className="text-lg sm:text-xl font-bold tracking-widest uppercase text-slate-950 font-serif">
              KARTU KELUARGA
            </div>
            <div className="text-sm sm:text-base font-bold font-mono tracking-wider text-slate-900 tabular-nums">
              No. {noKk}
            </div>
          </div>

          {/* Family Card Metadata Block */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1 text-slate-800 text-[11px]">
            <div className="space-y-1">
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Nama Kepala Keluarga</span>
                <span className="col-span-7 font-bold uppercase">: {headOfFamily.namaLengkap}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Alamat</span>
                <span className="col-span-7 uppercase">: {address?.jalan}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">RT / RW</span>
                <span className="col-span-7 font-mono tabular-nums">
                  : {address?.rt} / {address?.rw}
                </span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Desa / Kelurahan</span>
                <span className="col-span-7 uppercase">: {address?.kelurahan}</span>
              </div>
            </div>

            <div className="space-y-1">
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Kecamatan</span>
                <span className="col-span-7 uppercase">: {address?.kecamatan}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Kabupaten / Kota</span>
                <span className="col-span-7 uppercase">: {address?.kota}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Kode Pos</span>
                <span className="col-span-7 font-mono tabular-nums">: {address?.kodePos}</span>
              </div>
              <div className="grid grid-cols-12">
                <span className="col-span-5 font-semibold">Provinsi</span>
                <span className="col-span-7 uppercase">: {address?.provinsi}</span>
              </div>
            </div>
          </div>

          {/* Table 1: Anggota Keluarga Data Pokok */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              I. Data Anggota Keluarga (Identitas Dasar)
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-center">
                    <th className="p-1.5 border-r border-slate-300 w-8">No</th>
                    <th className="p-1.5 border-r border-slate-300 text-left">Nama Lengkap</th>
                    <th className="p-1.5 border-r border-slate-300">NIK (16 Digit)</th>
                    <th className="p-1.5 border-r border-slate-300">L/P</th>
                    <th className="p-1.5 border-r border-slate-300">Tempat Lahir</th>
                    <th className="p-1.5 border-r border-slate-300">Tanggal Lahir</th>
                    <th className="p-1.5 border-r border-slate-300">Agama</th>
                    <th className="p-1.5 border-r border-slate-300">Pekerjaan</th>
                    <th className="p-1.5">Gol. Darah</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {familyMembers.map((member, idx) => (
                    <tr
                      key={member.id}
                      onClick={() => onSelectMember && onSelectMember(member)}
                      className="hover:bg-sky-50/50 cursor-pointer transition-colors"
                      title="Klik untuk melihat e-KTP perorangan"
                    >
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-semibold text-slate-900">
                        {member.namaLengkap}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 font-mono text-center tabular-nums">
                        {member.nik}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-bold">
                        {member.jenisKelamin}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center">
                        {member.tempatLahir}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono tabular-nums">
                        {member.tanggalLahir}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center uppercase">
                        {member.agama}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center truncate max-w-[130px]">
                        {member.pekerjaan}
                      </td>
                      <td className="p-1.5 text-center font-mono">{member.golonganDarah}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Table 2: Status Hubungan & Administrasi */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-700">
              II. Status Hubungan Dalam Keluarga & Kewarganegaraan
            </div>
            <div className="overflow-x-auto border border-slate-300 rounded">
              <table className="w-full text-left text-[10px] border-collapse">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800 text-center">
                    <th className="p-1.5 border-r border-slate-300 w-8">No</th>
                    <th className="p-1.5 border-r border-slate-300">Status Perkawinan</th>
                    <th className="p-1.5 border-r border-slate-300">Hubungan Keluarga</th>
                    <th className="p-1.5 border-r border-slate-300">Kewarganegaraan</th>
                    <th className="p-1.5 border-r border-slate-300">No. Telepon / WA</th>
                    <th className="p-1.5">Status Verifikasi e-KTP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {familyMembers.map((member, idx) => (
                    <tr key={member.id} className="hover:bg-slate-50">
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono">
                        {idx + 1}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center uppercase">
                        {member.statusPerkawinan}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-semibold text-slate-900">
                        {member.hubunganKeluarga ||
                          (idx === 0 ? 'Kepala Keluarga' : idx === 1 ? 'Istri' : 'Anak')}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center uppercase font-mono">
                        {member.kewarganegaraan}
                      </td>
                      <td className="p-1.5 border-r border-slate-300 text-center font-mono tabular-nums">
                        {member.telepon}
                      </td>
                      <td className="p-1.5 text-center">
                        <span
                          className={`font-semibold px-2 py-0.5 rounded text-[10px] inline-flex items-center gap-1 ${
                            member.statusVerifikasi === 'terverifikasi'
                              ? 'text-emerald-800 bg-emerald-50'
                              : member.statusVerifikasi === 'menunggu'
                              ? 'text-amber-800 bg-amber-50'
                              : 'text-rose-800 bg-rose-50'
                          }`}
                        >
                          {member.statusVerifikasi === 'terverifikasi' && <CheckCircle2 className="w-3 h-3" />}
                          {member.statusVerifikasi === 'menunggu' && <Clock className="w-3 h-3" />}
                          {member.statusVerifikasi === 'perlu_perbaikan' && <AlertTriangle className="w-3 h-3" />}
                          {member.statusVerifikasi === 'terverifikasi'
                            ? 'Valid'
                            : member.statusVerifikasi === 'menunggu'
                            ? 'Menunggu'
                            : 'Revisi'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Official Signatures & Digital QR Seal Block */}
          <div className="pt-4 border-t border-slate-300 grid grid-cols-1 sm:grid-cols-3 gap-6 items-end text-center">
            {/* Left: Kepala Keluarga */}
            <div className="space-y-10">
              <div className="font-semibold text-slate-700">KEPALA KELUARGA</div>
              <div>
                <div className="font-bold underline text-slate-900 uppercase">
                  {headOfFamily.namaLengkap}
                </div>
                <div className="text-[10px] text-slate-500 font-mono">NIK: {headOfFamily.nik}</div>
              </div>
            </div>

            {/* Center: Electronic QR Seal BSrE Kemendagri */}
            <div className="flex flex-col items-center justify-center space-y-1.5">
              {qrDataUrl && (
                <div className="p-1.5 bg-white border border-slate-300 rounded shadow-xs">
                  <img src={qrDataUrl} alt="QR Kartu Keluarga" className="w-24 h-24" />
                </div>
              )}
              <div className="text-[9px] text-slate-500 font-mono">
                BSrE Ditjen Dukcapil Kemendagri RI
              </div>
              <div className="text-[8px] text-emerald-800 font-semibold">
                TERVERIFIKASI SECARA ELEKTRONIK
              </div>
            </div>

            {/* Right: Kepala Dinas / Petugas Kelurahan */}
            <div className="space-y-10">
              <div className="text-slate-700">
                <div className="font-semibold">
                  {address?.kota}, {headOfFamily.tanggalDaftar || '2026-01-10'}
                </div>
                <div className="text-[10px]">KEPALA DINAS KEPENDUDUKAN & PENCATATAN SIPIL</div>
              </div>

              <div>
                <div className="font-bold underline text-slate-900 uppercase">
                  Dra. Rahayu Kartika, M.Si
                </div>
                <div className="text-[10px] text-slate-500 font-mono">
                  NIP: 198403152008012004
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Footer Notes */}
        <div className="bg-slate-50 p-3 px-6 border-t border-slate-200 text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2 no-print">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>
              Status Kartu Keluarga: <strong>{familyMembers.length} Jiwa Terdaftar</strong>
            </span>
          </div>

          <div className="text-[11px] text-slate-400">
            Klik nama anggota keluarga pada tabel untuk melihat fisik e-KTP individual.
          </div>
        </div>
      </div>
    </div>
  );
};
