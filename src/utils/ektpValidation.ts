import { Gender, NikAnalysis } from '../types/citizen';

export const PROVINCE_MAP: Record<string, string> = {
  '11': 'Aceh',
  '12': 'Sumatera Utara',
  '13': 'Sumatera Barat',
  '14': 'Riau',
  '15': 'Jambi',
  '16': 'Sumatera Selatan',
  '17': 'Bengkulu',
  '18': 'Lampung',
  '19': 'Kepulauan Bangka Belitung',
  '21': 'Kepulauan Riau',
  '31': 'DKI Jakarta',
  '32': 'Jawa Barat',
  '33': 'Jawa Tengah',
  '34': 'DI Yogyakarta',
  '35': 'Jawa Timur',
  '36': 'Banten',
  '51': 'Bali',
  '52': 'Nusa Tenggara Barat',
  '53': 'Nusa Tenggara Timur',
  '61': 'Kalimantan Barat',
  '62': 'Kalimantan Tengah',
  '63': 'Kalimantan Selatan',
  '64': 'Kalimantan Timur',
  '65': 'Kalimantan Utara',
  '71': 'Sulawesi Utara',
  '72': 'Sulawesi Tengah',
  '73': 'Sulawesi Selatan',
  '74': 'Sulawesi Tenggara',
  '75': 'Gorontalo',
  '76': 'Sulawesi Barat',
  '81': 'Maluku',
  '82': 'Maluku Utara',
  '91': 'Papua Barat',
  '92': 'Papua Barat Daya',
  '94': 'Papua Tengah',
  '95': 'Papua Pegunungan',
  '96': 'Papua Selatan',
};

export function analyzeNik(nik: string): NikAnalysis {
  const cleanNik = nik.trim().replace(/\D/g, '');
  const errors: string[] = [];

  if (cleanNik.length !== 16) {
    errors.push('NIK harus terdiri dari tepat 16 digit angka.');
    return { isValid: false, errors };
  }

  const provKode = cleanNik.substring(0, 2);
  const kabKotaKode = cleanNik.substring(2, 4);
  const kecKode = cleanNik.substring(4, 6);
  const tglStr = cleanNik.substring(6, 12); // DDMMYY
  const noUrut = cleanNik.substring(12, 16);

  const provNama = PROVINCE_MAP[provKode] || `Provinsi Kode ${provKode}`;

  // Parse birth date
  let day = parseInt(tglStr.substring(0, 2), 10);
  const month = parseInt(tglStr.substring(2, 4), 10);
  let rawYear = parseInt(tglStr.substring(4, 6), 10);

  let gender: Gender = 'L';
  if (day > 40) {
    gender = 'P';
    day = day - 40;
  }

  // Validate day and month
  if (month < 1 || month > 12) {
    errors.push(`Bulan lahir pada NIK (${month}) tidak valid.`);
  }
  if (day < 1 || day > 31) {
    errors.push(`Tanggal lahir pada NIK (${day}) tidak valid.`);
  }

  // Indonesian NIK year approximation: if rawYear <= 26 assume 2000s, else 1900s
  const currentYear = new Date().getFullYear();
  const century = rawYear <= (currentYear % 100) ? 2000 : 1900;
  const fullYear = century + rawYear;

  const birthDateObj = new Date(fullYear, month - 1, day);
  const formattedDate = `${fullYear}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;

  // Calculate age
  const today = new Date();
  let age = today.getFullYear() - birthDateObj.getFullYear();
  const m = today.getMonth() - birthDateObj.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDateObj.getDate())) {
    age--;
  }

  return {
    isValid: errors.length === 0,
    errors,
    provinsiKode: provKode,
    provinsiNama: provNama,
    kabupatenKotaKode: kabKotaKode,
    kecamatanKode: kecKode,
    tanggalLahir: formattedDate,
    jenisKelamin: gender,
    nomorUrut: noUrut,
    umur: Math.max(0, age),
  };
}

export function generateQrPayload(citizen: {
  nik: string;
  namaLengkap: string;
  alamat: { rt: string; rw: string; kelurahan: string };
  statusVerifikasi: string;
}): string {
  // Simple deterministic checksum for verification integrity
  const rawString = `${citizen.nik}|${citizen.namaLengkap}|${citizen.statusVerifikasi}|${citizen.alamat.kelurahan}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash << 5) - hash + rawString.charCodeAt(i);
    hash |= 0;
  }

  const payloadObj = {
    sys: 'SIPENDUK-RI',
    ver: '2.0',
    nik: citizen.nik,
    nama: citizen.namaLengkap,
    wilayah: `RT ${citizen.alamat.rt}/RW ${citizen.alamat.rw}, ${citizen.alamat.kelurahan}`,
    stat: citizen.statusVerifikasi,
    sig: Math.abs(hash).toString(16).toUpperCase(),
    ts: Date.now(),
  };

  return JSON.stringify(payloadObj);
}

export function calculateAge(birthDateStr: string): number {
  if (!birthDateStr) return 0;
  const birthDate = new Date(birthDateStr);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return Math.max(0, age);
}

export function generateKkQrPayload(family: {
  noKk: string;
  namaKepalaKeluarga: string;
  jumlahAnggota: number;
  kelurahan: string;
}): string {
  const rawString = `KK|${family.noKk}|${family.namaKepalaKeluarga}|${family.jumlahAnggota}|${family.kelurahan}`;
  let hash = 0;
  for (let i = 0; i < rawString.length; i++) {
    hash = (hash << 5) - hash + rawString.charCodeAt(i);
    hash |= 0;
  }

  const payloadObj = {
    sys: 'SIPENDUK-KK',
    ver: '2.0',
    noKk: family.noKk,
    kepala: family.namaKepalaKeluarga,
    anggota: family.jumlahAnggota,
    wilayah: family.kelurahan,
    sig: Math.abs(hash).toString(16).toUpperCase(),
    ts: Date.now(),
  };

  return JSON.stringify(payloadObj);
}
