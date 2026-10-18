import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Citizen } from '../types/citizen';

export interface ReportOptions {
  nomorSurat: string;
  tanggalSurat: string;
  tujuanLaporan: string;
  filterRw?: string;
  pejabatKelurahan: string;
  nipPejabat: string;
  lurahNama: string;
  nipLurah: string;
}

export function exportCitizensToKecamatanPdf(
  citizens: Citizen[],
  options: ReportOptions
) {
  // Landscape A4 for wide demographic tables
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. KOP SURAT RESMI PEMDA DKI JAKARTA - KELURAHAN GAMBIR
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('PEMERINTAH PROVINSI DAERAH KHUSUS IBUKOTA JAKARTA', pageWidth / 2, 14, { align: 'center' });

  doc.setFontSize(13);
  doc.text('KOTA ADMINISTRASI JAKARTA PUSAT', pageWidth / 2, 20, { align: 'center' });

  doc.setFontSize(15);
  doc.text('KECAMATAN GAMBIR - KELURAHAN GAMBIR', pageWidth / 2, 27, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(
    'Alamat: Jl. Medan Merdeka Timur No. 12, Gambir, Jakarta Pusat 10110 | Telp: (021) 3840921 | Email: kelurahan.gambir@jakarta.go.id',
    pageWidth / 2,
    32,
    { align: 'center' }
  );

  // Double horizontal separator line
  doc.setLineWidth(0.8);
  doc.line(14, 35, pageWidth - 14, 35);
  doc.setLineWidth(0.2);
  doc.line(14, 36, pageWidth - 14, 36);

  // 2. DOCUMENT TITLE & NUMBER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN REKAPITULASI DATA KEPENDUDUKAN & PENDAFTARAN WARGA', pageWidth / 2, 43, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.text(`Nomor Dokumen: ${options.nomorSurat}`, pageWidth / 2, 48, { align: 'center' });

  // 3. LETTER METADATA / TUJUAN
  doc.setFontSize(9);
  doc.text(`Kepada Yth. : ${options.tujuanLaporan}`, 14, 55);
  doc.text(`Perihal        : Laporan Mutasi & Registrasi Penduduk Semester I Tahun 2026`, 14, 60);
  doc.text(`Tanggal       : ${options.tanggalSurat}`, pageWidth - 70, 55);
  doc.text(`Wilayah       : ${options.filterRw && options.filterRw !== 'all' ? `Rukun Warga (RW) ${options.filterRw}` : 'Seluruh Wilayah Kelurahan Gambir'}`, pageWidth - 70, 60);

  // 4. STATISTICAL SUMMARY HIGHLIGHTS
  const totalWarga = citizens.length;
  const totalPria = citizens.filter((c) => c.jenisKelamin === 'L').length;
  const totalWanita = citizens.filter((c) => c.jenisKelamin === 'P').length;
  const uniqueKk = new Set(citizens.map((c) => c.noKk)).size;
  const totalValid = citizens.filter((c) => c.statusVerifikasi === 'terverifikasi').length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 64, pageWidth - 28, 11, 2, 2, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text(
    `RINGKASAN SENSUS KECAMATAN:  Total Penduduk: ${totalWarga} Jiwa  |  Kepala Keluarga: ${uniqueKk} KK  |  Pria: ${totalPria}  |  Wanita: ${totalWanita}  |  e-KTP Terverifikasi: ${totalValid} (${((totalValid / (totalWarga || 1)) * 100).toFixed(1)}%)`,
    18,
    71
  );

  // 5. DATA TABLE
  const tableRows = citizens.map((c, index) => [
    String(index + 1),
    c.nik,
    c.noKk,
    c.namaLengkap,
    c.jenisKelamin,
    `${c.tempatLahir}, ${c.tanggalLahir}`,
    c.agama,
    c.pekerjaan,
    `RT ${c.alamat.rt}/RW ${c.alamat.rw}, ${c.alamat.jalan}`,
    c.statusVerifikasi === 'terverifikasi'
      ? 'Terverifikasi'
      : c.statusVerifikasi === 'menunggu'
      ? 'Menunggu'
      : 'Perlu Revisi',
  ]);

  autoTable(doc, {
    startY: 78,
    head: [
      [
        'No',
        'NIK',
        'No. KK',
        'Nama Lengkap Warga',
        'L/P',
        'Tempat, Tgl Lahir',
        'Agama',
        'Pekerjaan',
        'Alamat Domisili',
        'Status e-KTP',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7.5,
      cellPadding: 1.5,
      textColor: [15, 23, 42],
      lineColor: [203, 213, 225],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [15, 23, 42],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      halign: 'center',
    },
    columnStyles: {
      0: { halign: 'center', cellWidth: 8 },
      1: { font: 'courier', fontStyle: 'bold', cellWidth: 26 },
      2: { font: 'courier', cellWidth: 26 },
      3: { fontStyle: 'bold', cellWidth: 40 },
      4: { halign: 'center', cellWidth: 10 },
      5: { cellWidth: 32 },
      6: { cellWidth: 16 },
      7: { cellWidth: 32 },
      8: { cellWidth: 50 },
      9: { halign: 'center', cellWidth: 22 },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}  ·  Sistem Informasi Pendataan Warga (SIPENDUK-RI) Kelurahan Gambir`;
      doc.setFontSize(8);
      doc.setFont('helvetica', 'normal');
      doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 8, { align: 'center' });
    },
  });

  // 6. OFFICIAL SIGNATURES BLOCK (On the last page or dynamic position)
  // Ensure enough room or add new page
  let finalY = (doc as any).lastAutoTable.finalY + 10;
  if (finalY > doc.internal.pageSize.getHeight() - 40) {
    doc.addPage();
    finalY = 20;
  }

  const signWidth = 80;
  const leftX = 25;
  const rightX = pageWidth - signWidth - 25;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);

  // Left Signature: Kepala Seksi Pelayanan Kependudukan
  doc.text('Petugas Pelapor / Verifikator:', leftX, finalY);
  doc.text('Kepala Seksi Pelayanan Kependudukan,', leftX, finalY + 4);

  doc.setFont('helvetica', 'bold');
  doc.text(options.pejabatKelurahan, leftX, finalY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${options.nipPejabat}`, leftX, finalY + 28);

  // Right Signature: Mengetahui Lurah Kelurahan Gambir
  doc.text(`Jakarta Pusat, ${options.tanggalSurat}`, rightX, finalY);
  doc.text('Mengetahui / Mengesahkan,', rightX, finalY + 4);
  doc.text('Lurah Kelurahan Gambir,', rightX, finalY + 8);

  doc.setFont('helvetica', 'bold');
  doc.text(options.lurahNama, rightX, finalY + 24);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${options.nipLurah}`, rightX, finalY + 28);

  // Save the document
  const safeDate = options.tanggalSurat.replace(/\s+/g, '_');
  const fileName = `Laporan_Kependudukan_Kecamatan_Gambir_${safeDate}.pdf`;
  doc.save(fileName);
}
