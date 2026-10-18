import { DinasKopConfig } from '../types/citizen';

export const DINAS_KOP_PRESETS: { id: string; label: string; deskripsi: string; config: DinasKopConfig }[] = [
  {
    id: 'disdukcapil',
    label: 'Dinas Kependudukan dan Catatan Sipil (Disdukcapil)',
    deskripsi: 'Standar instansi Dinas Dukcapil Kabupaten/Kota untuk koordinasi lintas kecamatan',
    config: {
      pemerintahTingkat1: 'PEMERINTAH KABUPATEN / KOTA ADMINISTRASI',
      pemerintahTingkat2: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL',
      namaInstansi: 'DINAS KEPENDUDUKAN DAN PENCATATAN SIPIL',
      subInstansi: 'BIDANG PELAYANAN PENDAFTARAN PENDUDUK & PENGELOLAAN SIAK',
      alamatKantor: 'Jl. Letjen S. Parman No. 45, Kompleks Perkantoran Pemda',
      telepon: '(021) 5678910',
      email: 'disdukcapil@pemda.go.id',
      website: 'dukcapil.kemendagri.go.id',
      kodePos: '10110',
      nomorSuratDefault: '470/DISDUKCAPIL-REG/X/2026',
      pejabatPenandatangan: 'Dra. Hj. Siti Nurjanah, M.AP',
      nipPenandatangan: '198204122005012003',
      jabatanPenandatangan: 'Kepala Bidang Pelayanan Pendaftaran Penduduk',
      pejabatPengesah: 'Ir. H. Rachmat Hidayat, M.Si',
      nipPengesah: '197509181999031004',
      jabatanPengesah: 'Kepala Dinas Kependudukan dan Pencatatan Sipil',
      kotaSurat: 'Jakarta Pusat',
      logoDaerahType: 'garuda',
    },
  },
  {
    id: 'kecamatan',
    label: 'Kantor Kecamatan (Seksi Kependudukan)',
    deskripsi: 'Standar pelaporan wilayah Kecamatan ke Disdukcapil atau Bupati/Walikota',
    config: {
      pemerintahTingkat1: 'PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA',
      pemerintahTingkat2: 'KOTA ADMINISTRASI JAKARTA PUSAT',
      namaInstansi: 'KANTOR KECAMATAN GAMBIR',
      subInstansi: 'SEKSI PEMERINTAHAN & PELAYANAN KEPENDUDUKAN',
      alamatKantor: 'Jl. Medan Merdeka Timur No. 12, Gambir, Jakarta Pusat 10110',
      telepon: '(021) 3840921',
      email: 'kecamatan.gambir@jakarta.go.id',
      website: 'gambir.jakarta.go.id',
      kodePos: '10110',
      nomorSuratDefault: '470/REG-WARGA/KEC-GMB/X/2026',
      pejabatPenandatangan: 'Dra. Rahayu Kartika, M.Si',
      nipPenandatangan: '198403152008012004',
      jabatanPenandatangan: 'Kepala Seksi Pemerintahan & Kependudukan',
      pejabatPengesah: 'Drs. H. Bambang Irawan, M.Si',
      nipPengesah: '197805122003121002',
      jabatanPengesah: 'Camat Gambir, Jakarta Pusat',
      kotaSurat: 'Jakarta Pusat',
      logoDaerahType: 'dki',
    },
  },
  {
    id: 'kelurahan-desa',
    label: 'Pemerintah Kelurahan / Balai Desa',
    deskripsi: 'Standar registrasi tingkat dasar Kelurahan / Kantor Balai Desa untuk pelaporan ke Camat',
    config: {
      pemerintahTingkat1: 'PEMERINTAH KABUPATEN BOGOR',
      pemerintahTingkat2: 'KECAMATAN CIBINONG',
      namaInstansi: 'KANTOR KELURAHAN CIRIMEKAR',
      subInstansi: 'BAGIAN PELAYANAN ADMINISTRASI KEPENDUDUKAN & RT/RW',
      alamatKantor: 'Jl. Mayor Oking Jaya Atmaja No. 28, Cibinong, Bogor',
      telepon: '(0251) 8754123',
      email: 'kelurahan.cirimekar@bogorkab.go.id',
      website: 'cirimekar.desa.id',
      kodePos: '16911',
      nomorSuratDefault: '470/KEL-CRM/PELAPORAN/X/2026',
      pejabatPenandatangan: 'Achmad Fauzi, S.Sos',
      nipPenandatangan: '198807192010011006',
      jabatanPenandatangan: 'Sekretaris Kelurahan Cirimekar',
      pejabatPengesah: 'H. Sudrajat Effendi, S.IP',
      nipPengesah: '197906232002121003',
      jabatanPengesah: 'Lurah Cirimekar, Cibinong',
      kotaSurat: 'Bogor',
      logoDaerahType: 'daerah',
    },
  },
];

export const DEFAULT_DINAS_KOP_CONFIG: DinasKopConfig = DINAS_KOP_PRESETS[0].config;

export const STORAGE_KEY_KOP_CONFIG = 'sipenduk_dinas_kop_config_v1';

export function loadStoredKopConfig(): DinasKopConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_KOP_CONFIG);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && parsed.namaInstansi) {
        return parsed;
      }
    }
  } catch {
    // fallback
  }
  return DEFAULT_DINAS_KOP_CONFIG;
}

export function saveStoredKopConfig(config: DinasKopConfig) {
  try {
    localStorage.setItem(STORAGE_KEY_KOP_CONFIG, JSON.stringify(config));
  } catch (e) {
    console.warn('Gagal menyimpan kop config', e);
  }
}
