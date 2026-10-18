import React, { useState, useMemo } from 'react';
import { Citizen, VerificationStatus } from '../types/citizen';
import {
  Search,
  CheckCircle2,
  Clock,
  AlertTriangle,
  Eye,
  CreditCard,
  Download,
  Filter,
  Check,
  X,
  History,
  FileText,
  Printer,
} from 'lucide-react';

interface CitizenListViewProps {
  citizens: Citizen[];
  onOpenCardDetail: (citizen: Citizen) => void;
  onUpdateStatus: (citizenId: string, newStatus: VerificationStatus, note?: string) => void;
  onOpenFamilyCard?: (noKk: string) => void;
  onOpenOfficialReport?: () => void;
  onClearCitizens?: () => void;
  onResetCitizens?: () => void;
}

export const CitizenListView: React.FC<CitizenListViewProps> = ({
  citizens,
  onOpenCardDetail,
  onUpdateStatus,
  onOpenFamilyCard,
  onOpenOfficialReport,
  onClearCitizens,
  onResetCitizens,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [rwFilter, setRwFilter] = useState<string>('all');
  const [genderFilter, setGenderFilter] = useState<string>('all');
  const [selectedCitizenForHistory, setSelectedCitizenForHistory] = useState<Citizen | null>(null);

  // Status prompt modal for quick status update
  const [editingCitizen, setEditingCitizen] = useState<Citizen | null>(null);
  const [statusNote, setStatusNote] = useState('');
  const [newStatusChoice, setNewStatusChoice] = useState<VerificationStatus>('terverifikasi');

  // Filtered dataset
  const filteredCitizens = useMemo(() => {
    return citizens.filter((c) => {
      // Search text
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        c.nik.toLowerCase().includes(q) ||
        c.namaLengkap.toLowerCase().includes(q) ||
        c.noKk.toLowerCase().includes(q) ||
        c.pekerjaan.toLowerCase().includes(q);

      // Status
      const matchStatus = statusFilter === 'all' || c.statusVerifikasi === statusFilter;

      // RW
      const matchRw = rwFilter === 'all' || c.alamat.rw === rwFilter;

      // Gender
      const matchGender = genderFilter === 'all' || c.jenisKelamin === genderFilter;

      return matchSearch && matchStatus && matchRw && matchGender;
    });
  }, [citizens, searchQuery, statusFilter, rwFilter, genderFilter]);

  // Extract distinct RWs
  const availableRws = useMemo(() => {
    const set = new Set(citizens.map((c) => c.alamat.rw));
    return Array.from(set).sort();
  }, [citizens]);

  const handleOpenStatusEdit = (citizen: Citizen) => {
    setEditingCitizen(citizen);
    setNewStatusChoice(citizen.statusVerifikasi);
    setStatusNote(citizen.catatanVerifikasi || '');
  };

  const handleSaveStatus = () => {
    if (!editingCitizen) return;
    onUpdateStatus(editingCitizen.id, newStatusChoice, statusNote);
    setEditingCitizen(null);
  };

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

    const rows = filteredCitizens.map((c) => [
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
    link.setAttribute('download', `Daftar_Warga_Sipenduk_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Daftar & Verifikasi Berkas Kependudukan
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Kelola data identitas warga, tinjau hasil verifikasi biometrik e-KTP, dan terbitkan QR code resmi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {onClearCitizens && citizens.length > 0 && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Kosongkan database warga untuk mulai memindai berkas KK baru?')) {
                  onClearCitizens();
                }
              }}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors shadow-xs"
              title="Kosongkan seluruh data warga"
            >
              <X className="w-3.5 h-3.5 text-rose-600" />
              Kosongkan Data ({citizens.length})
            </button>
          )}

          {onResetCitizens && citizens.length === 0 && (
            <button
              type="button"
              onClick={onResetCitizens}
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs"
            >
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              Pulihkan Data Sampel
            </button>
          )}

          {onOpenOfficialReport && (
            <button
              type="button"
              onClick={onOpenOfficialReport}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-300 rounded-lg hover:bg-emerald-100 transition-colors shadow-xs"
              title="Cetak Laporan Resmi Sesuai Permintaan Dinas"
            >
              <Printer className="w-3.5 h-3.5 text-emerald-700" />
              Print Laporan Dinas (.pdf)
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors shadow-xs"
          >
            <Download className="w-3.5 h-3.5 text-slate-600" />
            Unduh CSV ({filteredCitizens.length})
          </button>
        </div>
      </div>

      {/* Filter toolbar */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-center gap-3">
          {/* Search box */}
          <div className="relative flex-1 w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari NIK 16 digit, Nama Lengkap, No KK, atau Profesi..."
              className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900 focus:border-slate-900 transition-colors"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 text-xs"
              >
                ✕
              </button>
            )}
          </div>

          {/* Filter Dropdowns */}
          <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-1 md:pb-0">
            {/* Status Filter */}
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-slate-900 shrink-0"
            >
              <option value="all">Semua Status e-KTP</option>
              <option value="terverifikasi">Terverifikasi Sah</option>
              <option value="menunggu">Menunggu Validasi</option>
              <option value="perlu_perbaikan">Perlu Perbaikan</option>
            </select>

            {/* RW Filter */}
            <select
              value={rwFilter}
              onChange={(e) => setRwFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-slate-900 shrink-0"
            >
              <option value="all">Semua RW</option>
              {availableRws.map((rw) => (
                <option key={rw} value={rw}>
                  RW {rw}
                </option>
              ))}
            </select>

            {/* Gender Filter */}
            <select
              value={genderFilter}
              onChange={(e) => setGenderFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-slate-900 shrink-0"
            >
              <option value="all">Semua Gender</option>
              <option value="L">Laki-laki (L)</option>
              <option value="P">Perempuan (P)</option>
            </select>
          </div>
        </div>

        {/* Filter result count */}
        <div className="flex items-center justify-between text-xs text-slate-500 pt-1 border-t border-slate-100">
          <div className="flex items-center gap-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>
              Menampilkan{' '}
              <strong className="text-slate-800 font-mono tabular-nums">
                {filteredCitizens.length}
              </strong>{' '}
              dari{' '}
              <strong className="text-slate-800 font-mono tabular-nums">
                {citizens.length}
              </strong>{' '}
              warga terdaftar
            </span>
          </div>

          {(statusFilter !== 'all' || rwFilter !== 'all' || genderFilter !== 'all' || searchQuery) && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
                setRwFilter('all');
                setGenderFilter('all');
              }}
              className="text-slate-600 hover:text-slate-900 underline text-[11px]"
            >
              Reset Filter
            </button>
          )}
        </div>
      </div>

      {/* Citizens Table */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/70 text-slate-500 font-semibold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-4">NIK & Nama Lengkap</th>
                <th className="py-3 px-4">Tempat & Tgl Lahir</th>
                <th className="py-3 px-4">Jenis Kelamin</th>
                <th className="py-3 px-4">Alamat Domisili</th>
                <th className="py-3 px-4">Pekerjaan</th>
                <th className="py-3 px-4">Status Verifikasi</th>
                <th className="py-3 px-4 text-right">Tindakan Petugas</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCitizens.length > 0 ? (
                filteredCitizens.map((citizen) => (
                  <tr key={citizen.id} className="hover:bg-slate-50/80 transition-colors">
                    {/* NIK & Name */}
                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-900 text-xs">
                        {citizen.namaLengkap}
                      </div>
                      <div className="text-slate-500 font-mono tabular-nums text-[11px] flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <CreditCard className="w-3 h-3 text-slate-400" />
                          <span>{citizen.nik}</span>
                        </span>
                        {onOpenFamilyCard && (
                          <button
                            type="button"
                            onClick={() => onOpenFamilyCard(citizen.noKk)}
                            className="text-[10px] text-sky-700 hover:text-sky-900 underline font-mono tabular-nums"
                            title="Buka Kartu Keluarga"
                          >
                            KK: {citizen.noKk}
                          </button>
                        )}
                      </div>
                    </td>

                    {/* Birth info */}
                    <td className="py-3 px-4 text-slate-700">
                      <div>{citizen.tempatLahir}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        {citizen.tanggalLahir}
                      </div>
                    </td>

                    {/* Gender */}
                    <td className="py-3 px-4 text-slate-700 font-medium">
                      {citizen.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}
                    </td>

                    {/* Address */}
                    <td className="py-3 px-4 text-slate-700 max-w-[200px]">
                      <div className="truncate">{citizen.alamat.jalan}</div>
                      <div className="text-[11px] text-slate-500 font-mono tabular-nums">
                        RT {citizen.alamat.rt} / RW {citizen.alamat.rw}, {citizen.alamat.kelurahan}
                      </div>
                    </td>

                    {/* Occupation */}
                    <td className="py-3 px-4 text-slate-700">
                      <div>{citizen.pekerjaan}</div>
                      <div className="text-[11px] text-slate-500">{citizen.statusPerkawinan}</div>
                    </td>

                    {/* Verification Status */}
                    <td className="py-3 px-4">
                      <div>
                        {citizen.statusVerifikasi === 'terverifikasi' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded text-[11px]">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" /> Terverifikasi
                          </span>
                        )}
                        {citizen.statusVerifikasi === 'menunggu' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded text-[11px]">
                            <Clock className="w-3 h-3 text-amber-600" /> Menunggu Validasi
                          </span>
                        )}
                        {citizen.statusVerifikasi === 'perlu_perbaikan' && (
                          <span className="inline-flex items-center gap-1 font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded text-[11px]">
                            <AlertTriangle className="w-3 h-3 text-rose-600" /> Perlu Perbaikan
                          </span>
                        )}
                      </div>
                      {citizen.catatanVerifikasi && (
                        <div className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-[150px]">
                          {citizen.catatanVerifikasi}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onOpenCardDetail(citizen)}
                          title="Lihat e-KTP & QR"
                          className="p-1.5 text-slate-600 hover:text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {onOpenFamilyCard && (
                          <button
                            type="button"
                            onClick={() => onOpenFamilyCard(citizen.noKk)}
                            title="Buka Kartu Keluarga (KK)"
                            className="px-2 py-1 text-[11px] font-semibold text-sky-800 bg-sky-50 hover:bg-sky-100 border border-sky-200 rounded-md transition-colors"
                          >
                            KK
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleOpenStatusEdit(citizen)}
                          title="Ubah Status Verifikasi"
                          className="px-2 py-1 text-[11px] font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
                        >
                          Verifikasi
                        </button>

                        <button
                          type="button"
                          onClick={() => setSelectedCitizenForHistory(citizen)}
                          title="Riwayat Aktivitas"
                          className="p-1.5 text-slate-400 hover:text-slate-700 rounded-md hover:bg-slate-100 transition-colors"
                        >
                          <History className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <div className="max-w-sm mx-auto space-y-2">
                      <p className="text-xs font-semibold text-slate-800">
                        {citizens.length === 0
                          ? 'Database Warga Bersih (Seluruh Data Dummy Telah Dihapus)'
                          : 'Tidak ditemukan data warga yang sesuai filter.'}
                      </p>
                      <p className="text-[11px] text-slate-500">
                        {citizens.length === 0
                          ? 'Silakan masuk ke menu Unggah Berkas KK untuk memindai dokumen Kartu Keluarga dengan AI dan mengganti database dengan data asli.'
                          : 'Coba gunakan kata kunci lain atau bersihkan filter pencarian.'}
                      </p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Status Edit Modal */}
      {editingCitizen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-md w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900">
                Pembaruan Status e-KTP Warga
              </h3>
              <button
                type="button"
                onClick={() => setEditingCitizen(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs space-y-1">
              <div>
                Warga:{' '}
                <strong className="text-slate-900">{editingCitizen.namaLengkap}</strong>
              </div>
              <div className="font-mono text-slate-600">NIK: {editingCitizen.nik}</div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pilih Status Validasi:
                </label>
                <select
                  value={newStatusChoice}
                  onChange={(e) => setNewStatusChoice(e.target.value as VerificationStatus)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="terverifikasi">Terverifikasi Sah (e-KTP Valid & Aktif)</option>
                  <option value="menunggu">Menunggu Validasi Dokumen Lanjutan</option>
                  <option value="perlu_perbaikan">Perlu Perbaikan / Revisi Berkas</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan Petugas Verifikator:
                </label>
                <textarea
                  value={statusNote}
                  onChange={(e) => setStatusNote(e.target.value)}
                  placeholder="Misal: Biometrik dan NIK telah sinkron dengan server Kemendagri..."
                  rows={3}
                  className="w-full text-xs p-2.5 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingCitizen(null)}
                className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveStatus}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors inline-flex items-center gap-1.5"
              >
                <Check className="w-3.5 h-3.5" />
                Simpan Perubahan
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity History Modal */}
      {selectedCitizenForHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-xl shadow-xl border border-slate-200 p-6 max-w-lg w-full space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <History className="w-4 h-4 text-slate-600" />
                <h3 className="text-sm font-bold text-slate-900">
                  Log Riwayat Administrasi Warga
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedCitizenForHistory(null)}
                className="text-slate-400 hover:text-slate-700"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs">
              <div className="font-semibold text-slate-900">
                {selectedCitizenForHistory.namaLengkap}
              </div>
              <div className="font-mono text-slate-500 tabular-nums">
                NIK: {selectedCitizenForHistory.nik}
              </div>
            </div>

            <div className="space-y-3 max-h-60 overflow-y-auto divide-y divide-slate-100">
              {selectedCitizenForHistory.riwayatAktivitas?.map((act) => (
                <div key={act.id} className="pt-2 text-xs space-y-0.5">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-slate-800">{act.aksi}</span>
                    <span className="font-mono text-[10px] text-slate-400 tabular-nums">
                      {act.tanggal}
                    </span>
                  </div>
                  <div className="text-slate-500 text-[11px]">Petugas: {act.petugas}</div>
                  {act.keterangan && (
                    <div className="text-slate-600 bg-slate-50 p-1.5 rounded text-[11px] mt-1">
                      {act.keterangan}
                    </div>
                  )}
                </div>
              ))}
            </div>

            <div className="flex justify-end pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setSelectedCitizenForHistory(null)}
                className="px-4 py-1.5 text-xs font-semibold text-slate-800 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
