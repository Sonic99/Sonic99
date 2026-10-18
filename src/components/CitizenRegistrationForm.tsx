import React, { useState } from 'react';
import { Citizen, Gender, MaritalStatus, Religion, VerificationStatus } from '../types/citizen';
import { analyzeNik, generateQrPayload } from '../utils/ektpValidation';
import {
  UserPlus,
  MapPin,
  FileCheck2,
  AlertCircle,
  CheckCircle2,
  Compass,
  Sparkles,
  Info,
} from 'lucide-react';

interface CitizenRegistrationFormProps {
  onAddCitizen: (newCitizen: Citizen) => void;
  onCancel: () => void;
}

export const CitizenRegistrationForm: React.FC<CitizenRegistrationFormProps> = ({
  onAddCitizen,
  onCancel,
}) => {
  // Form step: 1: Identitas, 2: Lokasi, 3: Verifikasi e-KTP
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);

  // Identity fields
  const [nik, setNik] = useState('');
  const [noKk, setNoKk] = useState('');
  const [namaLengkap, setNamaLengkap] = useState('');
  const [tempatLahir, setTempatLahir] = useState('Jakarta');
  const [tanggalLahir, setTanggalLahir] = useState('1995-06-15');
  const [jenisKelamin, setJenisKelamin] = useState<Gender>('L');
  const [golonganDarah, setGolonganDarah] = useState<'A' | 'B' | 'AB' | 'O' | '-'>('O');
  const [agama, setAgama] = useState<Religion>('Islam');
  const [statusPerkawinan, setStatusPerkawinan] = useState<MaritalStatus>('Belum Kawin');
  const [pekerjaan, setPekerjaan] = useState('Karyawan Swasta');
  const [kewarganegaraan, setKewarganegaraan] = useState<'WNI' | 'WNA'>('WNI');
  const [telepon, setTelepon] = useState('0812');
  const [email, setEmail] = useState('');

  // Location fields
  const [provinsi, setProvinsi] = useState('DKI Jakarta');
  const [kota, setKota] = useState('Jakarta Pusat');
  const [kecamatan, setKecamatan] = useState('Gambir');
  const [kelurahan, setKelurahan] = useState('Gambir');
  const [rt, setRt] = useState('001');
  const [rw, setRw] = useState('001');
  const [jalan, setJalan] = useState('Jl. Merdeka Barat No. ');
  const [kodePos, setKodePos] = useState('10110');
  const [latitude, setLatitude] = useState(-6.1754);
  const [longitude, setLongitude] = useState(106.8272);
  const [locationStatus, setLocationStatus] = useState<string | null>(null);

  // Verification fields
  const [statusVerifikasi, setStatusVerifikasi] = useState<VerificationStatus>('terverifikasi');
  const [catatanVerifikasi, setCatatanVerifikasi] = useState('Dokumen e-KTP telah diverifikasi petugas.');

  // NIK analysis state
  const nikAnalysis = analyzeNik(nik);

  // Auto populate date of birth and gender when valid 16-digit NIK is entered
  const handleNikChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.replace(/\D/g, '').slice(0, 16);
    setNik(val);
    if (val.length === 16) {
      const result = analyzeNik(val);
      if (result.isValid) {
        if (result.tanggalLahir) setTanggalLahir(result.tanggalLahir);
        if (result.jenisKelamin) setJenisKelamin(result.jenisKelamin);
      }
    }
  };

  // GPS auto-detect
  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      setLocationStatus('Geolokasi tidak didukung oleh browser Anda.');
      return;
    }
    setLocationStatus('Mendeteksi sinyal GPS koordinat presisi...');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(parseFloat(pos.coords.latitude.toFixed(6)));
        setLongitude(parseFloat(pos.coords.longitude.toFixed(6)));
        setLocationStatus(`Koordinat akurat berhasil diperoleh (Akurasi: ±${Math.round(pos.coords.accuracy)}m)`);
      },
      (err) => {
        setLocationStatus(`Gagal membaca GPS: ${err.message}. Menggunakan koordinat area default Gambir.`);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // OCR Demo autofill simulator
  const handleAutoFillOcrDemo = () => {
    setNik('3171011807920002');
    setNoKk('3171011005080031');
    setNamaLengkap('Danang Tri Wicaksono');
    setTempatLahir('Semarang');
    setTanggalLahir('1992-07-18');
    setJenisKelamin('L');
    setGolonganDarah('B');
    setAgama('Islam');
    setStatusPerkawinan('Kawin');
    setPekerjaan('Analis Sistem Informasi');
    setTelepon('081389002133');
    setEmail('danang.wicaksono@email.com');
    setJalan('Jl. Medan Merdeka Barat No. 8');
    setRt('002');
    setRw('001');
    setLatitude(-6.1748);
    setLongitude(106.8225);
    setStatusVerifikasi('terverifikasi');
    setCatatanVerifikasi('Ekstraksi e-KTP dan data biometrik tervalidasi.');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (nik.length !== 16) {
      alert('NIK harus terdiri dari tepat 16 digit angka.');
      return;
    }

    if (!namaLengkap.trim()) {
      alert('Nama lengkap warga wajib diisi.');
      return;
    }

    const citizenPayload = {
      nik,
      namaLengkap,
      alamat: { rt, rw, kelurahan },
      statusVerifikasi,
    };

    const newCitizen: Citizen = {
      id: `warga-${Date.now()}`,
      nik,
      noKk: noKk || '3171010000000000',
      namaLengkap,
      tempatLahir,
      tanggalLahir,
      jenisKelamin,
      golonganDarah,
      agama,
      statusPerkawinan,
      pekerjaan,
      kewarganegaraan,
      alamat: {
        provinsi,
        kota,
        kecamatan,
        kelurahan,
        rt,
        rw,
        jalan,
        kodePos,
        latitude,
        longitude,
      },
      telepon,
      email,
      statusVerifikasi,
      catatanVerifikasi,
      tanggalDaftar: new Date().toISOString().split('T')[0],
      terakhirDiverifikasi: statusVerifikasi === 'terverifikasi' ? new Date().toISOString().split('T')[0] : undefined,
      petugasVerifikator: 'Dra. Rahayu Kartika, M.Si',
      qrPayload: generateQrPayload(citizenPayload),
      riwayatAktivitas: [
        {
          id: `act-${Date.now()}`,
          tanggal: new Date().toLocaleString('id-ID'),
          aksi: 'Registrasi Warga Baru & Verifikasi e-KTP',
          petugas: 'Dra. Rahayu Kartika, M.Si',
          keterangan: catatanVerifikasi,
        },
      ],
    };

    onAddCitizen(newCitizen);
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
      {/* Top Banner & Quick OCR Simulator */}
      <div className="p-6 border-b border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight">
            Formulir Pendataan & Verifikasi Warga Baru
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Pastikan seluruh elemen data terverifikasi sesuai fisik e-KTP dan Kartu Keluarga resmi.
          </p>
        </div>

        <button
          type="button"
          onClick={handleAutoFillOcrDemo}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-sky-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors shrink-0"
        >
          <Sparkles className="w-3.5 h-3.5 text-sky-600" />
          Simulasi Ekstraksi OCR e-KTP Cepat
        </button>
      </div>

      {/* Stepper Tabs */}
      <div className="flex border-b border-slate-200 bg-white">
        <button
          type="button"
          onClick={() => setCurrentStep(1)}
          className={`flex-1 py-3 px-4 text-xs font-semibold text-center border-b-2 transition-colors inline-flex items-center justify-center gap-2 ${
            currentStep === 1
              ? 'border-slate-900 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserPlus className="w-4 h-4" />
          1. Data Identitas Warga
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(2)}
          className={`flex-1 py-3 px-4 text-xs font-semibold text-center border-b-2 transition-colors inline-flex items-center justify-center gap-2 ${
            currentStep === 2
              ? 'border-slate-900 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <MapPin className="w-4 h-4" />
          2. Lokasi & Titik Koordinat
        </button>

        <button
          type="button"
          onClick={() => setCurrentStep(3)}
          className={`flex-1 py-3 px-4 text-xs font-semibold text-center border-b-2 transition-colors inline-flex items-center justify-center gap-2 ${
            currentStep === 3
              ? 'border-slate-900 text-slate-900 bg-slate-50/50'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <FileCheck2 className="w-4 h-4" />
          3. Verifikasi e-KTP & QR
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {/* STEP 1: IDENTITAS */}
        {currentStep === 1 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Induk Kependudukan (NIK) *
                </label>
                <input
                  type="text"
                  value={nik}
                  onChange={handleNikChange}
                  placeholder="Contoh: 3171011405900001 (16 Digit)"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  maxLength={16}
                  required
                />

                {/* Live NIK breakdown helper */}
                {nik.length > 0 && (
                  <div className="mt-1.5 p-2 rounded-md bg-slate-50 border border-slate-200 text-[11px] space-y-0.5">
                    {nikAnalysis.isValid ? (
                      <div className="text-emerald-700 flex items-center gap-1 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <span>
                          Valid: {nikAnalysis.provinsiNama} ·{' '}
                          {nikAnalysis.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'} · Tgl Lahir:{' '}
                          {nikAnalysis.tanggalLahir} ({nikAnalysis.umur} thn)
                        </span>
                      </div>
                    ) : (
                      <div className="text-amber-700 flex items-center gap-1">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <span>{nikAnalysis.errors.join(' ')}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nomor Kartu Keluarga (No KK) *
                </label>
                <input
                  type="text"
                  value={noKk}
                  onChange={(e) => setNoKk(e.target.value.replace(/\D/g, '').slice(0, 16))}
                  placeholder="Contoh: 3171010802090014 (16 Digit)"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  maxLength={16}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Lengkap (Sesuai e-KTP) *
                </label>
                <input
                  type="text"
                  value={namaLengkap}
                  onChange={(e) => setNamaLengkap(e.target.value)}
                  placeholder="Nama lengkap tanpa singkatan"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tempat Lahir *
                </label>
                <input
                  type="text"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  placeholder="Kota/Kabupaten kelahiran"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Tanggal Lahir *
                </label>
                <input
                  type="date"
                  value={tanggalLahir}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Jenis Kelamin *
                </label>
                <select
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as Gender)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Golongan Darah
                </label>
                <select
                  value={golonganDarah}
                  onChange={(e) => setGolonganDarah(e.target.value as any)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                  <option value="-">- (Tidak Tahu)</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Agama *
                </label>
                <select
                  value={agama}
                  onChange={(e) => setAgama(e.target.value as Religion)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="Islam">Islam</option>
                  <option value="Kristen">Kristen</option>
                  <option value="Katolik">Katolik</option>
                  <option value="Hindu">Hindu</option>
                  <option value="Buddha">Buddha</option>
                  <option value="Konghucu">Konghucu</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Perkawinan *
                </label>
                <select
                  value={statusPerkawinan}
                  onChange={(e) => setStatusPerkawinan(e.target.value as MaritalStatus)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                >
                  <option value="Belum Kawin">Belum Kawin</option>
                  <option value="Kawin">Kawin</option>
                  <option value="Cerai Hidup">Cerai Hidup</option>
                  <option value="Cerai Mati">Cerai Mati</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pekerjaan *
                </label>
                <input
                  type="text"
                  value={pekerjaan}
                  onChange={(e) => setPekerjaan(e.target.value)}
                  placeholder="Misal: Pegawai Swasta, ASN, Wiraswasta"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  No. Telepon / WhatsApp
                </label>
                <input
                  type="text"
                  value={telepon}
                  onChange={(e) => setTelepon(e.target.value)}
                  placeholder="Contoh: 08123456789"
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Lanjut ke Data Lokasi →
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: LOKASI & GEOLOKASI */}
        {currentStep === 2 && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Provinsi
                </label>
                <input
                  type="text"
                  value={provinsi}
                  onChange={(e) => setProvinsi(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kota / Kabupaten
                </label>
                <input
                  type="text"
                  value={kota}
                  onChange={(e) => setKota(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kecamatan
                </label>
                <input
                  type="text"
                  value={kecamatan}
                  onChange={(e) => setKecamatan(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kelurahan / Desa
                </label>
                <input
                  type="text"
                  value={kelurahan}
                  onChange={(e) => setKelurahan(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RT (Rukun Tetangga) *
                </label>
                <input
                  type="text"
                  value={rt}
                  onChange={(e) => setRt(e.target.value.padStart(3, '0'))}
                  placeholder="001"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  maxLength={3}
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  RW (Rukun Warga) *
                </label>
                <input
                  type="text"
                  value={rw}
                  onChange={(e) => setRw(e.target.value.padStart(3, '0'))}
                  placeholder="001"
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  maxLength={3}
                  required
                />
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Alamat Jalan & Nomor Rumah *
                </label>
                <input
                  type="text"
                  value={jalan}
                  onChange={(e) => setJalan(e.target.value)}
                  placeholder="Jl. Medan Merdeka Barat No. ..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Kode Pos
                </label>
                <input
                  type="text"
                  value={kodePos}
                  onChange={(e) => setKodePos(e.target.value)}
                  className="w-full text-xs font-mono px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* GPS Geolocation section */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                <div>
                  <span className="text-xs font-bold text-slate-900 block">
                    Penetapan Titik Koordinat Geospasial (GIS)
                  </span>
                  <span className="text-[11px] text-slate-500">
                    Memetakan lokasi tempat tinggal warga secara presisi untuk pemetaan kependudukan.
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleDetectGps}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
                >
                  <Compass className="w-3.5 h-3.5 text-slate-700" />
                  Deteksi Lokasi GPS Saya
                </button>
              </div>

              {locationStatus && (
                <div className="text-[11px] text-slate-600 bg-white p-2 rounded border border-slate-200">
                  {locationStatus}
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Latitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={latitude}
                    onChange={(e) => setLatitude(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-md tabular-nums"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-slate-600 mb-0.5">
                    Longitude
                  </label>
                  <input
                    type="number"
                    step="0.000001"
                    value={longitude}
                    onChange={(e) => setLongitude(parseFloat(e.target.value))}
                    className="w-full text-xs font-mono px-3 py-1.5 bg-white border border-slate-200 rounded-md tabular-nums"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-3">
              <button
                type="button"
                onClick={() => setCurrentStep(1)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ← Kembali ke Identitas
              </button>

              <button
                type="button"
                onClick={() => setCurrentStep(3)}
                className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors"
              >
                Lanjut ke Verifikasi e-KTP →
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: VERIFIKASI e-KTP & QR */}
        {currentStep === 3 && (
          <div className="space-y-4">
            <div className="p-4 bg-sky-50/60 border border-sky-200 rounded-xl space-y-3">
              <div className="flex items-center gap-2 text-sky-900 font-semibold text-xs">
                <Info className="w-4 h-4 text-sky-700 shrink-0" />
                Ketentuan Verifikasi Kependudukan Elektronik
              </div>
              <p className="text-xs text-sky-800 leading-relaxed">
                Sistem akan membuat kode QR resmi secara otomatis yang ditandatangani secara kriptografis.
                Warga akan memperoleh e-KTP digital yang dapat dipindai langsung oleh petugas lapangan.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Status Verifikasi Awal
                </label>
                <select
                  value={statusVerifikasi}
                  onChange={(e) => setStatusVerifikasi(e.target.value as VerificationStatus)}
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg font-medium"
                >
                  <option value="terverifikasi">Terverifikasi e-KTP (Valid Langsung)</option>
                  <option value="menunggu">Menunggu Verifikasi Berkas Fisik</option>
                  <option value="perlu_perbaikan">Perlu Perbaikan Dokumen</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Catatan / Keterangan Petugas
                </label>
                <input
                  type="text"
                  value={catatanVerifikasi}
                  onChange={(e) => setCatatanVerifikasi(e.target.value)}
                  placeholder="Catatan keabsahan data..."
                  className="w-full text-xs px-3 py-2 bg-white border border-slate-200 rounded-lg"
                />
              </div>
            </div>

            {/* Preview Summary */}
            <div className="p-4 bg-slate-50 border border-slate-200 rounded-lg space-y-2 text-xs">
              <div className="font-semibold text-slate-800">Ringkasan Pendaftaran:</div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-slate-600">
                <div>
                  Nama:{' '}
                  <span className="font-medium text-slate-900">{namaLengkap || '-'}</span>
                </div>
                <div>
                  NIK: <span className="font-mono font-medium text-slate-900">{nik || '-'}</span>
                </div>
                <div>
                  Domisili:{' '}
                  <span className="font-medium text-slate-900">
                    RT {rt}/RW {rw}, {kelurahan}
                  </span>
                </div>
                <div>
                  Pekerjaan: <span className="font-medium text-slate-900">{pekerjaan}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setCurrentStep(2)}
                className="px-4 py-2 text-xs font-medium text-slate-700 bg-slate-100 rounded-lg hover:bg-slate-200 transition-colors"
              >
                ← Kembali ke Lokasi
              </button>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 transition-colors"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shadow-xs"
                >
                  Simpan & Terbitkan e-KTP Digital
                </button>
              </div>
            </div>
          </div>
        )}
      </form>
    </div>
  );
};
