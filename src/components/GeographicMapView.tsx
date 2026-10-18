import React, { useState, useMemo } from 'react';
import { Citizen } from '../types/citizen';
import { MapPin, Navigation, CheckCircle2, Clock, AlertTriangle, Eye, Layers } from 'lucide-react';

interface GeographicMapViewProps {
  citizens: Citizen[];
  onOpenCardDetail: (citizen: Citizen) => void;
}

export const GeographicMapView: React.FC<GeographicMapViewProps> = ({
  citizens,
  onOpenCardDetail,
}) => {
  const [selectedRw, setSelectedRw] = useState<string>('all');
  const [selectedCitizen, setSelectedCitizen] = useState<Citizen | null>(null);

  // Bounds for Kelurahan Gambir
  // Approx center: -6.175, 106.825
  const mapCenter = { lat: -6.175, lng: 106.825 };
  const latSpan = 0.024;
  const lngSpan = 0.026;

  const filteredCitizens = useMemo(() => {
    return citizens.filter((c) => selectedRw === 'all' || c.alamat.rw === selectedRw);
  }, [citizens, selectedRw]);

  // Convert lat/lng to percentage coordinates on the canvas
  const getCanvasCoords = (lat: number, lng: number) => {
    const x = ((lng - (mapCenter.lng - lngSpan / 2)) / lngSpan) * 100;
    const y = (((mapCenter.lat + latSpan / 2) - lat) / latSpan) * 100;
    return {
      x: Math.max(8, Math.min(92, x)),
      y: Math.max(8, Math.min(92, y)),
    };
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-slate-900">
            Peta Geospasial Kependudukan & Titik Domisili
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sebaran spasial tempat tinggal warga Kelurahan Gambir berdasarkan koordinat GPS presisi e-KTP.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedRw}
            onChange={(e) => setSelectedRw(e.target.value)}
            className="text-xs bg-white border border-slate-200 rounded-lg px-3 py-2 text-slate-700 font-medium focus:ring-1 focus:ring-slate-900"
          >
            <option value="all">Tampilkan Semua RW ({citizens.length} Titik)</option>
            <option value="001">Hanya RW 001</option>
            <option value="002">Hanya RW 002</option>
            <option value="003">Hanya RW 003</option>
          </select>
        </div>
      </div>

      {/* Map Container */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Interactive Map Surface (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-500">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-slate-400" />
              <span className="font-semibold text-slate-700">Wilayah Administratif Gambir</span>
              <span>· Titik Koordinat Aktif: {filteredCitizens.length}</span>
            </div>
            <span className="font-mono tabular-nums text-[11px]">
              Pusat: -6.175000°, 106.825000°
            </span>
          </div>

          {/* Interactive Geographic Canvas */}
          <div className="relative w-full aspect-[16/10] bg-slate-900 rounded-xl overflow-hidden border border-slate-800 shadow-inner">
            {/* Vector stylized street grid backdrop */}
            <svg
              className="absolute inset-0 w-full h-full opacity-25"
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#94a3b8" strokeWidth="0.75" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              {/* Landmark roads */}
              <line x1="10%" y1="50%" x2="90%" y2="50%" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="50%" y1="10%" x2="50%" y2="90%" stroke="#cbd5e1" strokeWidth="3" />
              <line x1="25%" y1="20%" x2="75%" y2="80%" stroke="#64748b" strokeWidth="1.5" />
              {/* Monas zone center indicator */}
              <circle cx="50%" cy="50%" r="35" fill="#1e293b" stroke="#38bdf8" strokeWidth="1" strokeDasharray="3 3" />
            </svg>

            {/* Landmark Label */}
            <div className="absolute top-4 left-4 bg-slate-800/80 backdrop-blur-xs text-[11px] text-slate-300 px-2.5 py-1 rounded border border-slate-700 font-mono">
              Kawasan Gambir / Monas - Jakarta Pusat
            </div>

            {/* Resident Pins */}
            {filteredCitizens.map((citizen) => {
              const coords = getCanvasCoords(citizen.alamat.latitude, citizen.alamat.longitude);
              const isSelected = selectedCitizen?.id === citizen.id;

              return (
                <button
                  key={citizen.id}
                  type="button"
                  onClick={() => setSelectedCitizen(citizen)}
                  style={{
                    left: `${coords.x}%`,
                    top: `${coords.y}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 group transition-transform ${
                    isSelected ? 'scale-125 z-20' : 'hover:scale-115 z-10'
                  }`}
                  title={`${citizen.namaLengkap} - RT ${citizen.alamat.rt}/RW ${citizen.alamat.rw}`}
                >
                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center shadow-md border ${
                      citizen.statusVerifikasi === 'terverifikasi'
                        ? 'bg-emerald-500 border-white text-white'
                        : citizen.statusVerifikasi === 'menunggu'
                        ? 'bg-amber-500 border-white text-white'
                        : 'bg-rose-500 border-white text-white'
                    }`}
                  >
                    <MapPin className="w-3.5 h-3.5" />
                  </div>

                  {/* Pin label toolip */}
                  <div className="hidden group-hover:block absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 whitespace-nowrap bg-slate-900 text-white text-[10px] font-medium px-2 py-1 rounded shadow-lg pointer-events-none z-30">
                    {citizen.namaLengkap} (RT {citizen.alamat.rt})
                  </div>
                </button>
              );
            })}
          </div>

          {/* Map Legend */}
          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 border-t border-slate-100">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                <span>e-KTP Terverifikasi</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                <span>Menunggu Validasi</span>
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                <span>Perlu Perbaikan</span>
              </span>
            </div>

            <span className="text-[11px] text-slate-400">
              Klik salah satu titik pin untuk melihat kartu profil warga.
            </span>
          </div>
        </div>

        {/* Selected Citizen Details (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-semibold text-slate-700 uppercase tracking-wider">
              Detail Titik Warga Terpilih
            </span>
            {selectedCitizen && (
              <button
                type="button"
                onClick={() => setSelectedCitizen(null)}
                className="text-xs text-slate-500 hover:text-slate-800"
              >
                Tutup
              </button>
            )}
          </div>

          {selectedCitizen ? (
            <div className="space-y-4">
              <div>
                <h3 className="font-bold text-sm text-slate-900">
                  {selectedCitizen.namaLengkap}
                </h3>
                <div className="font-mono text-xs text-slate-500 tabular-nums">
                  NIK: {selectedCitizen.nik}
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-lg space-y-2 text-xs text-slate-700 border border-slate-200">
                <div className="flex items-start gap-2">
                  <Navigation className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                  <div>
                    <div className="font-medium text-slate-900">
                      {selectedCitizen.alamat.jalan}
                    </div>
                    <div className="text-slate-500 font-mono text-[11px]">
                      RT {selectedCitizen.alamat.rt} / RW {selectedCitizen.alamat.rw},{' '}
                      {selectedCitizen.alamat.kelurahan}
                    </div>
                  </div>
                </div>

                <div className="text-[11px] font-mono text-slate-500 pt-1 border-t border-slate-200">
                  Lat: {selectedCitizen.alamat.latitude.toFixed(6)} | Lng:{' '}
                  {selectedCitizen.alamat.longitude.toFixed(6)}
                </div>
              </div>

              <div className="space-y-1.5 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Pekerjaan:</span>
                  <span className="font-medium text-slate-800">{selectedCitizen.pekerjaan}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Status e-KTP:</span>
                  <span className="font-semibold text-slate-800">
                    {selectedCitizen.statusVerifikasi === 'terverifikasi' && (
                      <span className="text-emerald-700 inline-flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sah Terverifikasi
                      </span>
                    )}
                    {selectedCitizen.statusVerifikasi === 'menunggu' && (
                      <span className="text-amber-700 inline-flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" /> Menunggu Validasi
                      </span>
                    )}
                    {selectedCitizen.statusVerifikasi === 'perlu_perbaikan' && (
                      <span className="text-rose-700 inline-flex items-center gap-1">
                        <AlertTriangle className="w-3.5 h-3.5" /> Perlu Perbaikan
                      </span>
                    )}
                  </span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => onOpenCardDetail(selectedCitizen)}
                className="w-full py-2 px-3 text-xs font-semibold text-slate-900 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                <Eye className="w-3.5 h-3.5" />
                Lihat Fisik e-KTP & QR
              </button>
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 space-y-2">
              <MapPin className="w-10 h-10 mx-auto text-slate-300 stroke-1" />
              <div className="text-xs font-medium text-slate-600">Pilih Salah Satu Titik Pin</div>
              <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
                Klik ikon lokasi pada peta di sebelah kiri untuk melihat informasi domisili warga.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
