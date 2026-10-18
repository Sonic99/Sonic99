import React, { useEffect, useRef, useState, useCallback, useMemo } from 'react';
import jsQR from 'jsqr';
import { Citizen } from '../types/citizen';
import {
  Camera,
  CameraOff,
  CheckCircle2,
  AlertCircle,
  ScanLine,
  Upload,
  UserCheck,
  MapPin,
  Calendar,
  CreditCard,
  RefreshCw,
  Eye,
  ShieldAlert,
  Users,
  FileSpreadsheet,
  Search,
} from 'lucide-react';

interface QrScannerViewProps {
  citizens: Citizen[];
  onVerifyFieldPresence: (citizenId: string, actionName: string) => void;
  onOpenCardDetail: (citizen: Citizen) => void;
  onOpenFamilyCard: (noKk: string) => void;
  onVerifyEntireFamily?: (noKk: string) => void;
  onNavigateToKkUpload?: () => void;
}

export const QrScannerView: React.FC<QrScannerViewProps> = ({
  citizens,
  onVerifyFieldPresence,
  onOpenCardDetail,
  onOpenFamilyCard,
  onVerifyEntireFamily,
  onNavigateToKkUpload,
}) => {
  // Scanner Target Mode: 'ektp' (Perorangan / NIK) or 'kk' (Kartu Keluarga / No KK)
  const [scanMode, setScanMode] = useState<'ektp' | 'kk'>('kk');

  const [isScanning, setIsScanning] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);

  // Scan results
  const [scanResultCitizen, setScanResultCitizen] = useState<Citizen | null>(null);
  const [scanResultFamilyNoKk, setScanResultFamilyNoKk] = useState<string | null>(null);

  // Manual / Barcode input search for No KK
  const [manualKkInput, setManualKkInput] = useState('');

  const [invalidPayload, setInvalidPayload] = useState<string | null>(null);
  const [verificationFeedback, setVerificationFeedback] = useState<string | null>(null);
  const [selectedDemoId, setSelectedDemoId] = useState<string>('');
  const [selectedDemoKk, setSelectedDemoKk] = useState<string>('');

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameId = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Group citizens into distinct Family Cards
  const familyCards = useMemo(() => {
    const map = new Map<string, Citizen[]>();
    citizens.forEach((c) => {
      const list = map.get(c.noKk) || [];
      list.push(c);
      map.set(c.noKk, list);
    });

    return Array.from(map.entries()).map(([noKk, members]) => {
      const head =
        members.find((m) => m.hubunganKeluarga === 'Kepala Keluarga') || members[0];
      return {
        noKk,
        namaKepalaKeluarga: head?.namaLengkap || 'Kepala Keluarga',
        alamat: head?.alamat,
        anggotaKeluarga: members,
        jumlahAnggota: members.length,
      };
    });
  }, [citizens]);

  const stopCamera = useCallback(() => {
    if (animationFrameId.current) {
      cancelAnimationFrame(animationFrameId.current);
      animationFrameId.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    setIsScanning(false);
  }, []);

  // Process decoded string from camera or file
  const handleProcessQrData = useCallback(
    (decodedText: string) => {
      try {
        let detectedNoKk = '';
        let detectedNik = '';

        if (decodedText.startsWith('{')) {
          const obj = JSON.parse(decodedText);
          if (obj.noKk) detectedNoKk = obj.noKk;
          if (obj.nik) detectedNik = obj.nik;
        } else {
          const trimmed = decodedText.trim();
          // Check if it matches No KK or NIK
          if (familyCards.some((f) => f.noKk === trimmed)) {
            detectedNoKk = trimmed;
          } else {
            detectedNik = trimmed;
          }
        }

        // If scanning KK or payload contains KK
        if (scanMode === 'kk' || detectedNoKk) {
          const targetKk =
            detectedNoKk ||
            (detectedNik ? citizens.find((c) => c.nik === detectedNik)?.noKk : null);

          if (targetKk) {
            const familyMatch = familyCards.find((f) => f.noKk === targetKk);
            if (familyMatch) {
              setScanResultFamilyNoKk(targetKk);
              setScanResultCitizen(null);
              setInvalidPayload(null);
              setVerificationFeedback(null);
              return;
            }
          }
        }

        // Fallback / standard e-KTP match
        const citizenMatch = citizens.find(
          (c) => c.nik === detectedNik || c.qrPayload === decodedText || c.nik === decodedText.trim()
        );

        if (citizenMatch) {
          if (scanMode === 'kk') {
            // In KK mode, if user scans citizen QR, resolve to family card!
            setScanResultFamilyNoKk(citizenMatch.noKk);
            setScanResultCitizen(null);
          } else {
            setScanResultCitizen(citizenMatch);
            setScanResultFamilyNoKk(null);
          }
          setInvalidPayload(null);
          setVerificationFeedback(null);
        } else {
          setScanResultCitizen(null);
          setScanResultFamilyNoKk(null);
          setInvalidPayload(
            `Data dengan kode "${decodedText.substring(0, 35)}..." tidak ditemukan dalam database SIPENDUK.`
          );
        }
      } catch {
        // Direct string fallback
        const clean = decodedText.trim();
        const familyMatch = familyCards.find((f) => f.noKk === clean);
        if (familyMatch) {
          setScanResultFamilyNoKk(clean);
          setScanResultCitizen(null);
          setInvalidPayload(null);
          return;
        }

        const citizenMatch = citizens.find((c) => c.nik === clean);
        if (citizenMatch) {
          if (scanMode === 'kk') {
            setScanResultFamilyNoKk(citizenMatch.noKk);
          } else {
            setScanResultCitizen(citizenMatch);
          }
          setInvalidPayload(null);
        } else {
          setScanResultCitizen(null);
          setScanResultFamilyNoKk(null);
          setInvalidPayload('Kode QR tidak dapat dibaca atau format tidak sesuai dokumen Dukcapil.');
        }
      }
    },
    [citizens, familyCards, scanMode]
  );

  const tick = useCallback(() => {
    if (videoRef.current && videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA) {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (ctx) {
          canvas.height = videoRef.current.videoHeight;
          canvas.width = videoRef.current.videoWidth;
          ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: 'dontInvert',
          });

          if (code && code.data) {
            handleProcessQrData(code.data);
            stopCamera();
            return;
          }
        }
      }
    }
    animationFrameId.current = requestAnimationFrame(tick);
  }, [handleProcessQrData, stopCamera]);

  const startCamera = async () => {
    setCameraError(null);
    setScanResultCitizen(null);
    setScanResultFamilyNoKk(null);
    setInvalidPayload(null);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.setAttribute('playsinline', 'true');
        await videoRef.current.play();
        setIsScanning(true);
        animationFrameId.current = requestAnimationFrame(tick);
      }
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : 'Kamera tidak dapat diakses';
      setCameraError(
        `Akses kamera tidak aktif (${errorMsg}). Anda dapat menggunakan fitur upload gambar QR atau input nomor KK di bawah.`
      );
      setIsScanning(false);
    }
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, [stopCamera]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0);
          const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
          const code = jsQR(imageData.data, imageData.width, imageData.height);
          if (code && code.data) {
            handleProcessQrData(code.data);
          } else {
            setScanResultCitizen(null);
            setScanResultFamilyNoKk(null);
            setInvalidPayload('Tidak mendeteksi kode QR pada gambar yang diunggah. Pastikan QR code terlihat jelas.');
          }
        }
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // Manual KK Search handler
  const handleManualKkSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanKk = manualKkInput.trim().replace(/\D/g, '');
    if (!cleanKk) return;

    const foundFamily = familyCards.find((f) => f.noKk === cleanKk);
    if (foundFamily) {
      setScanResultFamilyNoKk(cleanKk);
      setScanResultCitizen(null);
      setInvalidPayload(null);
      setVerificationFeedback(null);
    } else {
      setScanResultFamilyNoKk(null);
      setScanResultCitizen(null);
      setInvalidPayload(`Nomor Kartu Keluarga "${cleanKk}" tidak ditemukan dalam database kependudukan.`);
    }
  };

  // Action recorded on a single citizen
  const handleAction = (actionName: string) => {
    if (!scanResultCitizen) return;
    onVerifyFieldPresence(scanResultCitizen.id, actionName);
    setVerificationFeedback(`Aksi "${actionName}" untuk ${scanResultCitizen.namaLengkap} berhasil dicatat.`);
    setTimeout(() => setVerificationFeedback(null), 4000);
  };

  // Action recorded on entire family
  const handleFamilyAction = (actionName: string) => {
    if (!activeFamily) return;
    activeFamily.anggotaKeluarga.forEach((member) => {
      onVerifyFieldPresence(member.id, actionName);
    });
    setVerificationFeedback(
      `Aksi "${actionName}" berhasil dicatat untuk seluruh (${activeFamily.anggotaKeluarga.length}) anggota keluarga.`
    );
    setTimeout(() => setVerificationFeedback(null), 4000);
  };

  // Active family object if KK scanned
  const activeFamily = useMemo(() => {
    if (!scanResultFamilyNoKk) return null;
    return familyCards.find((f) => f.noKk === scanResultFamilyNoKk) || null;
  }, [familyCards, scanResultFamilyNoKk]);

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Pemindai Dokumen Kependudukan Real-Time
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Verifikasi keabsahan data seketika berdasarkan Nomor Kartu Keluarga (KK) atau e-KTP perorangan.
          </p>
        </div>

        {/* Scan Mode Switch & KK Upload shortcut */}
        <div className="flex flex-wrap items-center gap-2">
          {onNavigateToKkUpload && (
            <button
              type="button"
              onClick={onNavigateToKkUpload}
              className="px-3 py-1.5 text-xs font-bold text-emerald-900 bg-emerald-100 hover:bg-emerald-200 border border-emerald-300 rounded-lg transition-colors inline-flex items-center gap-1.5"
            >
              <Upload className="w-3.5 h-3.5 text-emerald-700" />
              Unggah Berkas KK (SIAK Dukcapil)
            </button>
          )}

          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-lg shrink-0">
            <button
              type="button"
              onClick={() => {
                setScanMode('kk');
                setScanResultCitizen(null);
                setScanResultFamilyNoKk(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 ${
                scanMode === 'kk'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-slate-700" />
              Mode Kartu Keluarga (KK)
            </button>

            <button
              type="button"
              onClick={() => {
                setScanMode('ektp');
                setScanResultCitizen(null);
                setScanResultFamilyNoKk(null);
              }}
              className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors inline-flex items-center gap-1.5 ${
                scanMode === 'ektp'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <CreditCard className="w-3.5 h-3.5 text-slate-700" />
              Mode e-KTP Individu
            </button>
          </div>
        </div>
      </div>

      {/* Manual Nomor Kartu Keluarga Search Input Strip */}
      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-xs">
        <form
          onSubmit={handleManualKkSearch}
          className="flex flex-col sm:flex-row items-center gap-3"
        >
          <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 whitespace-nowrap">
            <Users className="w-4 h-4 text-slate-500" />
            <span>Pindai / Input Nomor Kartu Keluarga:</span>
          </div>

          <div className="relative flex-1 w-full">
            <input
              type="text"
              value={manualKkInput}
              onChange={(e) => setManualKkInput(e.target.value.replace(/\D/g, '').slice(0, 16))}
              placeholder="Ketik atau tempel 16 digit No. KK (contoh: 3171010802090014)..."
              className="w-full text-xs font-mono px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:ring-1 focus:ring-slate-900"
              maxLength={16}
            />
          </div>

          <button
            type="submit"
            className="w-full sm:w-auto px-4 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors shrink-0 inline-flex items-center justify-center gap-1.5"
          >
            <Search className="w-3.5 h-3.5" />
            Cari Data KK
          </button>
        </form>
      </div>

      {/* Main scanner grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Scanner Viewport (Left 6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
                {scanMode === 'kk' ? 'Pemindai QR Kartu Keluarga' : 'Pemindai QR e-KTP'}
              </span>
              <span className="text-[11px] font-medium text-sky-800 bg-sky-50 px-2 py-0.5 rounded">
                {scanMode === 'kk' ? 'Target: No. KK' : 'Target: NIK'}
              </span>
            </div>
            <span className="text-xs text-slate-500">
              {isScanning ? 'Status: Memindai...' : 'Status: Siap'}
            </span>
          </div>

          {/* Viewport container */}
          <div className="relative aspect-video w-full bg-slate-900 rounded-lg overflow-hidden flex items-center justify-center border border-slate-800">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${isScanning ? 'block' : 'hidden'}`}
            />
            <canvas ref={canvasRef} className="hidden" />

            {/* Target reticle overlay when scanning */}
            {isScanning && (
              <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                <div className="w-56 h-56 border-2 border-emerald-400/80 rounded-lg relative">
                  <div className="absolute top-0 left-0 w-4 h-4 border-t-4 border-l-4 border-emerald-400"></div>
                  <div className="absolute top-0 right-0 w-4 h-4 border-t-4 border-r-4 border-emerald-400"></div>
                  <div className="absolute bottom-0 left-0 w-4 h-4 border-b-4 border-l-4 border-emerald-400"></div>
                  <div className="absolute bottom-0 right-0 w-4 h-4 border-b-4 border-r-4 border-emerald-400"></div>
                  <div className="w-full h-0.5 bg-emerald-400/80 absolute top-1/2 -translate-y-1/2 animate-pulse"></div>
                </div>
              </div>
            )}

            {!isScanning && (
              <div className="text-center p-6 text-slate-400 space-y-3">
                <ScanLine className="w-12 h-12 mx-auto text-slate-500 stroke-1" />
                <div>
                  <div className="text-sm font-medium text-slate-200">
                    Kamera Sedang Tidak Aktif
                  </div>
                  <div className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
                    Klik "Aktifkan Pemindai Kamera" atau gunakan opsi unggah berkas / simulator KK di bawah.
                  </div>
                </div>
                <button
                  type="button"
                  onClick={startCamera}
                  className="px-3.5 py-1.5 text-xs font-semibold text-slate-900 bg-white rounded-md hover:bg-slate-100 transition-colors inline-flex items-center gap-1.5"
                >
                  <Camera className="w-3.5 h-3.5" />
                  Mulai Kamera
                </button>
              </div>
            )}
          </div>

          {cameraError && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <span>{cameraError}</span>
            </div>
          )}

          {/* Alternate Upload & Fast Simulation strip */}
          <div className="pt-2 border-t border-slate-100 space-y-3">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <label className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-3.5 py-2 text-xs font-medium text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer">
                <Upload className="w-3.5 h-3.5 text-slate-600" />
                <span>Unggah Foto QR {scanMode === 'kk' ? 'Kartu Keluarga' : 'e-KTP'}</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              {isScanning && (
                <button
                  type="button"
                  onClick={stopCamera}
                  className="w-full sm:w-auto px-3.5 py-2 text-xs font-medium text-rose-700 bg-rose-50 border border-rose-200 rounded-lg hover:bg-rose-100 transition-colors inline-flex items-center justify-center gap-1.5"
                >
                  <CameraOff className="w-3.5 h-3.5" />
                  Matikan Kamera
                </button>
              )}
            </div>

            {/* Quick KK Simulator Picker */}
            <div className="p-3 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
              <span className="text-[11px] font-semibold text-slate-700 uppercase tracking-wider block">
                Uji Coba Cepat (Pilih dari Database):
              </span>

              {scanMode === 'kk' ? (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDemoKk}
                    onChange={(e) => {
                      const kk = e.target.value;
                      setSelectedDemoKk(kk);
                      if (kk) handleProcessQrData(kk);
                    }}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="">-- Pilih Kartu Keluarga Uji Coba --</option>
                    {familyCards.map((f) => (
                      <option key={f.noKk} value={f.noKk}>
                        KK No. {f.noKk} · {f.namaKepalaKeluarga} ({f.jumlahAnggota} Anggota)
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <select
                    value={selectedDemoId}
                    onChange={(e) => {
                      const id = e.target.value;
                      setSelectedDemoId(id);
                      const found = citizens.find((c) => c.id === id);
                      if (found) handleProcessQrData(found.qrPayload);
                    }}
                    className="w-full text-xs bg-white border border-slate-200 rounded-md px-2.5 py-1.5 text-slate-800 font-medium focus:ring-1 focus:ring-slate-800"
                  >
                    <option value="">-- Pilih Warga e-KTP Uji Coba --</option>
                    {citizens.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.namaLengkap} ({c.statusVerifikasi})
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Verification Result Card (Right 6 cols) */}
        <div className="lg:col-span-6 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Hasil Verifikasi Kependudukan
            </span>
            {(activeFamily || scanResultCitizen) && (
              <button
                type="button"
                onClick={() => {
                  setScanResultCitizen(null);
                  setScanResultFamilyNoKk(null);
                  setInvalidPayload(null);
                }}
                className="text-xs text-slate-500 hover:text-slate-800 inline-flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" /> Bersihkan
              </button>
            )}
          </div>

          {verificationFeedback && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{verificationFeedback}</span>
            </div>
          )}

          {/* CASE 1: KARTU KELUARGA (KK) SCANNED */}
          {activeFamily ? (
            <div className="space-y-4">
              {/* KK Verification Header */}
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-lg space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <div className="text-xs font-bold text-slate-900">
                        Kartu Keluarga Terverifikasi Sah
                      </div>
                      <div className="text-[11px] text-slate-500 font-mono">
                        No. KK: {activeFamily.noKk}
                      </div>
                    </div>
                  </div>

                  <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-100 text-emerald-800">
                    {activeFamily.jumlahAnggota} Jiwa Terdaftar
                  </span>
                </div>

                <div className="text-xs text-slate-700 pt-1 border-t border-slate-200 space-y-1">
                  <div>
                    Kepala Keluarga:{' '}
                    <strong className="text-slate-900">{activeFamily.namaKepalaKeluarga}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Domisili: {activeFamily.alamat?.jalan}, RT {activeFamily.alamat?.rt}/RW{' '}
                    {activeFamily.alamat?.rw}, {activeFamily.alamat?.kelurahan}
                  </div>
                </div>
              </div>

              {/* Family Members Breakdown Table */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs font-semibold text-slate-700">
                  <span>Daftar Anggota Keluarga Terkait:</span>
                  <span className="text-[11px] font-mono text-slate-500">
                    {activeFamily.jumlahAnggota} Orang
                  </span>
                </div>

                <div className="divide-y divide-slate-100 border border-slate-200 rounded-lg overflow-hidden max-h-56 overflow-y-auto">
                  {activeFamily.anggotaKeluarga.map((member, idx) => (
                    <div
                      key={member.id}
                      className="p-2.5 flex items-center justify-between hover:bg-slate-50 text-xs transition-colors"
                    >
                      <div>
                        <div className="font-semibold text-slate-900 flex items-center gap-1.5">
                          <span>{member.namaLengkap}</span>
                          <span className="text-[10px] font-normal text-slate-500 bg-slate-100 px-1.5 py-0.2 rounded">
                            {member.hubunganKeluarga || (idx === 0 ? 'Kepala Keluarga' : 'Anggota')}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          NIK: {member.nik} · {member.pekerjaan}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                            member.statusVerifikasi === 'terverifikasi'
                              ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                              : 'bg-amber-50 text-amber-700 border border-amber-200'
                          }`}
                        >
                          {member.statusVerifikasi === 'terverifikasi' ? 'e-KTP Valid' : 'Menunggu'}
                        </span>

                        <button
                          type="button"
                          onClick={() => onOpenCardDetail(member)}
                          className="p-1 text-slate-500 hover:text-slate-900 rounded hover:bg-slate-200"
                          title="Lihat e-KTP perorangan"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Family Level Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider block">
                  Aksi Sensus & Verifikasi Kartu Keluarga
                </span>

                <div className="grid grid-cols-1 gap-2">
                  <button
                    type="button"
                    onClick={() => onOpenFamilyCard(activeFamily.noKk)}
                    className="w-full px-3 py-2 text-xs font-semibold text-white bg-slate-900 rounded-lg hover:bg-slate-800 transition-colors text-left flex items-center justify-between"
                  >
                    <span>1. Buka Dokumen Resmi Kartu Keluarga (KK)</span>
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                  </button>

                  {onVerifyEntireFamily && (
                    <button
                      type="button"
                      onClick={() => {
                        onVerifyEntireFamily(activeFamily.noKk);
                        handleFamilyAction('Verifikasi Validasi Lengkap Sekeluarga');
                      }}
                      className="w-full px-3 py-2 text-xs font-semibold text-emerald-950 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors text-left flex items-center justify-between"
                    >
                      <span>2. Verifikasi & Sahkan Seluruh Anggota Keluarga Sekaligus</span>
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => handleFamilyAction('Penyaluran Bantuan Sosial Keluarga (Bansos PKH/BLT)')}
                    className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-slate-100 border border-slate-200 rounded-lg hover:bg-slate-200 transition-colors text-left flex items-center justify-between"
                  >
                    <span>3. Konfirmasi Bansos / Bantuan Rumah Tangga</span>
                    <Users className="w-3.5 h-3.5 text-slate-600" />
                  </button>
                </div>
              </div>
            </div>
          ) : scanResultCitizen ? (
            /* CASE 2: INDIVIDUAL e-KTP SCANNED */
            <div className="space-y-4">
              <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <div className="text-xs font-bold text-slate-900">
                      e-KTP Terverifikasi Valid
                    </div>
                    <div className="text-[11px] text-slate-500 font-mono">
                      Timestamp: {new Date().toLocaleTimeString('id-ID')} WIB
                    </div>
                  </div>
                </div>

                <span
                  className={`text-xs font-semibold px-2.5 py-1 rounded-md ${
                    scanResultCitizen.statusVerifikasi === 'terverifikasi'
                      ? 'bg-emerald-100 text-emerald-800'
                      : scanResultCitizen.statusVerifikasi === 'menunggu'
                      ? 'bg-amber-100 text-amber-800'
                      : 'bg-rose-100 text-rose-800'
                  }`}
                >
                  {scanResultCitizen.statusVerifikasi === 'terverifikasi'
                    ? 'e-KTP Sah'
                    : scanResultCitizen.statusVerifikasi === 'menunggu'
                    ? 'Menunggu'
                    : 'Revisi'}
                </span>
              </div>

              {/* Citizen Card Summary */}
              <div className="space-y-2 text-xs text-slate-700">
                <div className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24">NIK</span>
                  <span className="font-mono font-bold text-slate-900 tabular-nums">
                    {scanResultCitizen.nik}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24">No. KK</span>
                  <span className="font-mono font-medium text-slate-900 tabular-nums">
                    {scanResultCitizen.noKk}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24">Nama Lengkap</span>
                  <span className="font-semibold text-slate-900">
                    {scanResultCitizen.namaLengkap}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                  <span className="text-slate-500 w-24">Tgl Lahir / Usia</span>
                  <span>
                    {scanResultCitizen.tempatLahir}, {scanResultCitizen.tanggalLahir}
                  </span>
                </div>

                <div className="flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <span className="text-slate-500 w-24">Alamat</span>
                  <div className="flex-1">
                    <div>{scanResultCitizen.alamat.jalan}</div>
                    <div className="text-slate-500 font-mono tabular-nums text-[11px]">
                      RT {scanResultCitizen.alamat.rt} / RW {scanResultCitizen.alamat.rw},{' '}
                      {scanResultCitizen.alamat.kelurahan}
                    </div>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="pt-2 border-t border-slate-100 space-y-2">
                <button
                  type="button"
                  onClick={() => onOpenFamilyCard(scanResultCitizen.noKk)}
                  className="w-full px-3 py-2 text-xs font-semibold text-slate-800 bg-sky-50 border border-sky-200 rounded-lg hover:bg-sky-100 transition-colors text-left flex items-center justify-between"
                >
                  <span>Buka Seluruh Kartu Keluarga (No. {scanResultCitizen.noKk})</span>
                  <Users className="w-3.5 h-3.5 text-sky-700" />
                </button>

                <button
                  type="button"
                  onClick={() => onOpenCardDetail(scanResultCitizen)}
                  className="w-full px-3 py-2 text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors text-left flex items-center justify-between"
                >
                  <span>Lihat Fisik e-KTP Digital</span>
                  <Eye className="w-3.5 h-3.5 text-slate-500" />
                </button>
              </div>
            </div>
          ) : invalidPayload ? (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg text-rose-800 space-y-2">
              <div className="flex items-center gap-2 font-semibold text-xs">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0" />
                Data Tidak Cocok / Tidak Valid
              </div>
              <p className="text-xs leading-relaxed">{invalidPayload}</p>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <ScanLine className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <div className="text-xs font-medium text-slate-600">
                Belum Ada QR Dokumen Yang Dipindai
              </div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Pindai QR kode Kartu Keluarga (KK) atau masukkan 16 digit No. KK di atas untuk verifikasi anggota keluarga secara real-time.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
