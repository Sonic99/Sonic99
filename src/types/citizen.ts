export type Gender = 'L' | 'P';

export type VerificationStatus = 'terverifikasi' | 'menunggu' | 'perlu_perbaikan';

export type MaritalStatus = 'Belum Kawin' | 'Kawin' | 'Cerai Hidup' | 'Cerai Mati';

export type Religion = 'Islam' | 'Kristen' | 'Katolik' | 'Hindu' | 'Buddha' | 'Konghucu';

export interface CitizenAddress {
  provinsi: string;
  kota: string;
  kecamatan: string;
  kelurahan: string;
  rt: string;
  rw: string;
  jalan: string;
  kodePos: string;
  latitude: number;
  longitude: number;
}

export interface ActivityLog {
  id: string;
  tanggal: string;
  aksi: string;
  petugas: string;
  keterangan?: string;
}

export interface Citizen {
  id: string;
  nik: string;
  noKk: string;
  namaLengkap: string;
  tempatLahir: string;
  tanggalLahir: string; // YYYY-MM-DD
  jenisKelamin: Gender;
  golonganDarah: 'A' | 'B' | 'AB' | 'O' | '-';
  agama: Religion;
  statusPerkawinan: MaritalStatus;
  pekerjaan: string;
  kewarganegaraan: 'WNI' | 'WNA';
  hubunganKeluarga?: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
  pendidikan?: string;
  namaAyah?: string;
  namaIbu?: string;
  tanggalPerkawinan?: string;
  noPaspor?: string;
  noKitasKitap?: string;
  alamat: CitizenAddress;
  telepon: string;
  email?: string;
  statusVerifikasi: VerificationStatus;
  catatanVerifikasi?: string;
  tanggalDaftar: string;
  terakhirDiverifikasi?: string;
  petugasVerifikator?: string;
  fotoUrl?: string;
  qrPayload: string;
  riwayatAktivitas: ActivityLog[];
}

export interface FamilyCard {
  noKk: string;
  namaKepalaKeluarga: string;
  alamat: CitizenAddress;
  anggotaKeluarga: Citizen[];
  tanggalTerbit: string;
  qrPayloadKk: string;
  statusVerifikasiKeluarga: VerificationStatus;
}

export interface DukcapilMemberData {
  nik: string;
  namaLengkap: string;
  jenisKelamin: Gender;
  tempatLahir: string;
  tanggalLahir: string;
  agama: Religion;
  pendidikan: string;
  pekerjaan: string;
  statusPerkawinan: MaritalStatus;
  tanggalPerkawinan?: string;
  hubunganKeluarga: 'Kepala Keluarga' | 'Istri' | 'Anak' | 'Orang Tua' | 'Famili Lain';
  golonganDarah: 'A' | 'B' | 'AB' | 'O' | '-';
  kewarganegaraan?: 'WNI' | 'WNA';
  noPaspor?: string;
  noKitasKitap?: string;
  namaAyah: string;
  namaIbu: string;
  telepon?: string;
  statusEktp: 'TERVERIFIKASI_AKTIF' | 'BELUM_REKAM' | 'BLANGKO_SIAP';
}

export interface SiakComplicationAnalysis {
  bebasKonflikNik: boolean;
  validasiShdk: boolean;
  validasiKodeWilayah: boolean;
  validasiUsiaKawin: boolean;
  validasiTteBsre: boolean;
  catatanKomplikasi: string[];
  persentaseValiditas: number;
}

export interface DukcapilKkVerificationResult {
  noKk: string;
  namaKepalaKeluarga: string;
  alamat: CitizenAddress;
  tanggalTerbit: string;
  pejabatPenerbit: string;
  nomorRegistrasiSiak: string;
  statusKeabsahan: 'VALID_100_PERSEN' | 'MENUNGGU' | 'TIDAK_VALID';
  sertifikatDigital: {
    penerbit: string;
    statusTte: 'SAH_DAN_TERVERIFIKASI' | 'KADALUARSA' | 'TIDAK_VALID';
    hashSha256: string;
    waktuValidasi: string;
  };
  statusSinkronisasiSiak: 'TERKINI_100_PERSEN';
  identifikasiKomplikasi: SiakComplicationAnalysis;
  anggotaKeluargaTerbitan: DukcapilMemberData[];
}

export interface NikAnalysis {
  isValid: boolean;
  errors: string[];
  provinsiKode?: string;
  provinsiNama?: string;
  kabupatenKotaKode?: string;
  kecamatanKode?: string;
  tanggalLahir?: string;
  jenisKelamin?: Gender;
  nomorUrut?: string;
  umur?: number;
}

export interface AdminUser {
  id: string;
  nama: string;
  nip: string;
  email: string;
  jabatan: string;
  unitKerja: string;
  avatarUrl: string;
  is2FAEnabled: boolean;
  totpSecret: string;
  recoveryCodes: string[];
  lastLogin: string;
}

export interface LoginAudit {
  id: string;
  waktu: string;
  ip: string;
  perangkat: string;
  status: 'BERHASIL' | 'GAGAL';
  metode2FA: string;
}
