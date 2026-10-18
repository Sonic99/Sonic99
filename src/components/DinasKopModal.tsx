import React, { useState } from 'react';
import { DinasKopConfig } from '../types/citizen';
import { DINAS_KOP_PRESETS } from '../data/dinasKopPresets';
import {
  Building2,
  X,
  Check,
  RotateCcw,
  ShieldCheck,
  FileText,
  MapPin,
  Phone,
  Mail,
  UserCheck,
} from 'lucide-react';

interface DinasKopModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: DinasKopConfig;
  onSave: (newConfig: DinasKopConfig) => void;
}

export const DinasKopModal: React.FC<DinasKopModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onSave,
}) => {
  const [formData, setFormData] = useState<DinasKopConfig>({ ...currentConfig });
  const [activePresetId, setActivePresetId] = useState<string>('');

  if (!isOpen) return null;

  const handleSelectPreset = (presetId: string) => {
    const preset = DINAS_KOP_PRESETS.find((p) => p.id === presetId);
    if (preset) {
      setFormData({ ...preset.config });
      setActivePresetId(presetId);
    }
  };

  const handleChange = (field: keyof DinasKopConfig, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    setActivePresetId('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleReset = () => {
    handleSelectPreset('disdukcapil');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-xs overflow-y-auto no-print">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 max-w-4xl w-full my-6 overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in duration-200">
        {/* Header */}
        <div className="bg-slate-900 text-white p-4 px-6 flex items-center justify-between border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500/20 border border-amber-400/30 flex items-center justify-center text-amber-400">
              <Building2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight">
                Pengaturan Kop Surat & Identitas Dinas Resmi
              </h2>
              <p className="text-xs text-slate-400">
                Sesuaikan Kop Surat aplikasi & format cetak laporan resmi sesuai permintaan instansi pemohon
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Quick Preset Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider block">
              Pilih Template Standar Dinas (Cepat):
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {DINAS_KOP_PRESETS.map((preset) => {
                const isSelected = activePresetId === preset.id || formData.namaInstansi === preset.config.namaInstansi;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => handleSelectPreset(preset.id)}
                    className={`p-3 text-left rounded-xl border transition-all flex flex-col justify-between ${
                      isSelected
                        ? 'border-sky-600 bg-sky-50/70 text-sky-950 shadow-xs ring-2 ring-sky-500/20'
                        : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-800'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold flex items-center justify-between mb-1">
                        <span>{preset.label}</span>
                        {isSelected && <Check className="w-3.5 h-3.5 text-sky-600" />}
                      </div>
                      <p className="text-[11px] text-slate-500 leading-snug">{preset.deskripsi}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Live Preview Box */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                Pratinjau Kop Surat Resmi (Sesuai Cetakan Dinas):
              </span>
              <span className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Format Standar Kemendagri
              </span>
            </div>

            <div className="p-4 sm:p-5 bg-white border-2 border-slate-300 rounded-xl shadow-xs text-center space-y-1 relative">
              <div className="flex items-center justify-center gap-3">
                <div className="w-10 h-10 rounded-full border border-amber-600/30 bg-amber-50 flex items-center justify-center text-amber-800 font-bold text-[9px] shadow-xs shrink-0">
                  {formData.logoDaerahType === 'dki' ? 'DKI' : formData.logoDaerahType === 'garuda' ? 'RI' : 'PEMDA'}
                </div>
                <div>
                  <h4 className="text-[11px] sm:text-xs font-bold tracking-widest uppercase text-slate-900 font-serif">
                    {formData.pemerintahTingkat1}
                  </h4>
                  {formData.pemerintahTingkat2 && (
                    <h5 className="text-[11px] sm:text-xs font-bold tracking-wider uppercase text-slate-800">
                      {formData.pemerintahTingkat2}
                    </h5>
                  )}
                  <h3 className="text-xs sm:text-sm font-black tracking-wide uppercase text-slate-950 font-serif">
                    {formData.namaInstansi}
                  </h3>
                  {formData.subInstansi && (
                    <p className="text-[10px] sm:text-[11px] font-semibold text-slate-700 uppercase">
                      {formData.subInstansi}
                    </p>
                  )}
                </div>
              </div>

              <p className="text-[10px] text-slate-600 pt-1">
                Alamat: {formData.alamatKantor} | Telp: {formData.telepon} | Email: {formData.email} | Kode Pos: {formData.kodePos}
              </p>

              {/* Garis Ganda Kop Surat Resmi */}
              <div className="w-full h-0.5 bg-slate-950 mt-2"></div>
              <div className="w-full h-px bg-slate-950 mt-0.5"></div>
            </div>
          </div>

          {/* Form Fields: Grid 2 Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Field: Pemerintah Tingkat 1 */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pemerintah Tingkat 1 (Provinsi / Kabupaten):
              </label>
              <input
                type="text"
                value={formData.pemerintahTingkat1}
                onChange={(e) => handleChange('pemerintahTingkat1', e.target.value)}
                required
                placeholder="Contoh: PEMERINTAH PROVINSI JAWA BARAT"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Field: Pemerintah Tingkat 2 */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Pemerintah Tingkat 2 (Kota / Kabupaten / Satker):
              </label>
              <input
                type="text"
                value={formData.pemerintahTingkat2}
                onChange={(e) => handleChange('pemerintahTingkat2', e.target.value)}
                placeholder="Contoh: KOTA ADMINISTRASI JAKARTA PUSAT"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Field: Nama Instansi */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nama Instansi Utama (Kop Baris 3 - Huruf Tebal):
              </label>
              <input
                type="text"
                value={formData.namaInstansi}
                onChange={(e) => handleChange('namaInstansi', e.target.value)}
                required
                placeholder="Contoh: DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 font-bold"
              />
            </div>

            {/* Field: Sub Instansi */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Sub Instansi / Bagian / Seksi (Kop Baris 4):
              </label>
              <input
                type="text"
                value={formData.subInstansi || ''}
                onChange={(e) => handleChange('subInstansi', e.target.value)}
                placeholder="Contoh: BIDANG PENDAFTARAN PENDUDUK ATAU SEKSI PEMERINTAHAN"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Field: Alamat Kantor */}
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Alamat Kantor Lengkap:
              </label>
              <input
                type="text"
                value={formData.alamatKantor}
                onChange={(e) => handleChange('alamatKantor', e.target.value)}
                required
                placeholder="Contoh: Jl. Letjen S. Parman No. 45, Gambir, Jakarta Pusat"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 font-medium"
              />
            </div>

            {/* Field: Kontak (Telepon, Email, Web, Kode Pos) */}
            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Nomor Telepon Dinas:
              </label>
              <input
                type="text"
                value={formData.telepon}
                onChange={(e) => handleChange('telepon', e.target.value)}
                placeholder="Contoh: (021) 3840921"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Alamat Email Resmi:
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => handleChange('email', e.target.value)}
                placeholder="Contoh: disdukcapil@pemda.go.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Website / Portal Resmi:
              </label>
              <input
                type="text"
                value={formData.website}
                onChange={(e) => handleChange('website', e.target.value)}
                placeholder="Contoh: dukcapil.kemendagri.go.id"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
              />
            </div>

            <div>
              <label className="font-semibold text-slate-700 block mb-1">
                Kode Pos & Kota:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <input
                  type="text"
                  value={formData.kodePos}
                  onChange={(e) => handleChange('kodePos', e.target.value)}
                  placeholder="10110"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
                <input
                  type="text"
                  value={formData.kotaSurat}
                  onChange={(e) => handleChange('kotaSurat', e.target.value)}
                  placeholder="Jakarta Pusat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>

            {/* Field: Format Nomor Surat */}
            <div className="md:col-span-2">
              <label className="font-semibold text-slate-700 block mb-1">
                Format Default Nomor Surat Laporan Dinas:
              </label>
              <input
                type="text"
                value={formData.nomorSuratDefault}
                onChange={(e) => handleChange('nomorSuratDefault', e.target.value)}
                placeholder="Contoh: 470/REG-WARGA/DISDUKCAPIL/X/2026"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-300 rounded-lg text-slate-900 focus:bg-white focus:ring-2 focus:ring-sky-500 font-mono"
              />
            </div>
          </div>

          {/* Section: Pejabat Penandatangan Laporan */}
          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-sky-600" />
              Pejabat Penandatangan & Pengesah Dokumen Laporan
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              {/* Petugas Pelapor / Verifikator */}
              <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block border-b pb-1">
                  1. Petugas Pelapor / Verifikator (Kiri):
                </span>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Nama Lengkap & Gelar:</label>
                  <input
                    type="text"
                    value={formData.pejabatPenandatangan}
                    onChange={(e) => handleChange('pejabatPenandatangan', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">NIP Petugas:</label>
                  <input
                    type="text"
                    value={formData.nipPenandatangan}
                    onChange={(e) => handleChange('nipPenandatangan', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Jabatan:</label>
                  <input
                    type="text"
                    value={formData.jabatanPenandatangan}
                    onChange={(e) => handleChange('jabatanPenandatangan', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>

              {/* Pejabat Pengesah */}
              <div className="space-y-2 p-3 bg-white rounded-lg border border-slate-200">
                <span className="font-bold text-slate-900 block border-b pb-1">
                  2. Pejabat Mengetahui / Pengesah (Kanan):
                </span>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Nama Kepala Dinas / Camat / Lurah:</label>
                  <input
                    type="text"
                    value={formData.pejabatPengesah}
                    onChange={(e) => handleChange('pejabatPengesah', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-semibold"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">NIP Pejabat Pengesah:</label>
                  <input
                    type="text"
                    value={formData.nipPengesah}
                    onChange={(e) => handleChange('nipPengesah', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900 font-mono"
                  />
                </div>
                <div>
                  <label className="text-[11px] text-slate-600 block mb-0.5">Jabatan Pengesah:</label>
                  <input
                    type="text"
                    value={formData.jabatanPengesah}
                    onChange={(e) => handleChange('jabatanPengesah', e.target.value)}
                    required
                    className="w-full px-2.5 py-1.5 border border-slate-300 rounded text-slate-900"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-200">
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset ke Standar Disdukcapil
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors"
              >
                Batal
              </button>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2 text-xs font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-lg shadow-sm transition-colors"
              >
                <Check className="w-4 h-4 text-emerald-400" />
                Simpan & Terapkan Kop Dinas
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
