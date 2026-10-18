import { AdminUser, Citizen, LoginAudit } from '../types/citizen';

export const INITIAL_ADMIN: AdminUser = {
  id: 'adm-001',
  nama: 'Dra. Rahayu Kartika, M.Si',
  nip: '198403152008012004',
  email: 'admin@sipenduk.go.id',
  jabatan: 'Kepala Seksi Pelayanan Kependudukan',
  unitKerja: 'Kelurahan Gambir, Jakarta Pusat',
  avatarUrl: '/src/assets/images/admin_avatar_officer_1792213982531.jpg',
  is2FAEnabled: true,
  totpSecret: 'JBSWY3DPEHPK3PXP', // Base32 test secret standard
  recoveryCodes: [
    'A8X9-4K21',
    '7P2M-991Q',
    '3F5L-008B',
    '6T1C-884Y',
    '9W2Z-117R',
    '4D3E-552K',
    '2J8N-339M',
    '5V7A-660X',
  ],
  lastLogin: '2026-10-18 08:32 WIB',
};

export const INITIAL_AUDIT_LOGS: LoginAudit[] = [
  {
    id: 'aud-101',
    waktu: '2026-10-18 08:32:14 WIB',
    ip: '180.252.164.21',
    perangkat: 'Chrome on macOS (Workstation Kantor Kelurahan)',
    status: 'BERHASIL',
    metode2FA: 'TOTP Authenticator',
  },
  {
    id: 'aud-102',
    waktu: '2026-10-17 14:10:05 WIB',
    ip: '180.252.164.21',
    perangkat: 'Chrome on macOS (Workstation Kantor Kelurahan)',
    status: 'BERHASIL',
    metode2FA: 'TOTP Authenticator',
  },
  {
    id: 'aud-103',
    waktu: '2026-10-16 09:15:30 WIB',
    ip: '114.122.208.92',
    perangkat: 'Firefox on Windows (Laptop Dinas Petugas)',
    status: 'BERHASIL',
    metode2FA: 'Recovery Code',
  },
  {
    id: 'aud-104',
    waktu: '2026-10-15 19:40:11 WIB',
    ip: '36.85.12.105',
    perangkat: 'Safari on iPhone (Mobile Web)',
    status: 'GAGAL',
    metode2FA: 'TOTP Mismatch',
  },
];

// Seluruh data dummy dihapus. Database dimulai bersih dan diisi murni dari hasil scanning asli dokumen Kartu Keluarga.
export const INITIAL_CITIZENS: Citizen[] = [];
