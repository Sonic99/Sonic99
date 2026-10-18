import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Citizen, DinasKopConfig } from '../types/citizen';

export interface ReportOptions {
  nomorSurat: string;
  tanggalSurat: string;
  tujuanLaporan: string;
  perihal?: string;
  filterRw?: string;
  kopConfig: DinasKopConfig;
}

export function exportCitizensToKecamatanPdf(
  citizens: Citizen[],
  options: ReportOptions
) {
  const { kopConfig } = options;

  // Landscape A4 for wide demographic tables
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  const pageWidth = doc.internal.pageSize.getWidth();

  // 1. KOP SURAT RESMI SESUAI PERMINTAAN DINAS
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text(kopConfig.pemerintahTingkat1.toUpperCase(), pageWidth / 2, 13, { align: 'center' });

  if (kopConfig.pemerintahTingkat2) {
    doc.setFontSize(11);
    doc.text(kopConfig.pemerintahTingkat2.toUpperCase(), pageWidth / 2, 18, { align: 'center' });
  }

  doc.setFontSize(13);
  doc.text(kopConfig.namaInstansi.toUpperCase(), pageWidth / 2, 24, { align: 'center' });

  if (kopConfig.subInstansi) {
    doc.setFontSize(9.5);
    doc.text(kopConfig.subInstansi.toUpperCase(), pageWidth / 2, 29, { align: 'center' });
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const kontakStr = `Alamat: ${kopConfig.alamatKantor} | Telp: ${kopConfig.telepon} | Email: ${kopConfig.email} | Kode Pos: ${kopConfig.kodePos}`;
  doc.text(kontakStr, pageWidth / 2, 34, { align: 'center' });

  // Double horizontal separator line (Garis Ganda Kop Surat Dinas)
  doc.setLineWidth(0.8);
  doc.line(14, 37, pageWidth - 14, 37);
  doc.setLineWidth(0.2);
  doc.line(14, 38, pageWidth - 14, 38);

  // 2. DOCUMENT TITLE & NUMBER
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('LAPORAN RESMI REKAPITULASI DATA KEPENDUDUKAN & REGISTRASI WARGA', pageWidth / 2, 45, { align: 'center' });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.text(`Nomor Registrasi Dinas: ${options.nomorSurat}`, pageWidth / 2, 50, { align: 'center' });

  // 3. LETTER METADATA / TUJUAN
  doc.setFontSize(8.5);
  doc.text(`Kepada Yth. : ${options.tujuanLaporan}`, 14, 56);
  doc.text(`Perihal        : ${options.perihal || 'Laporan Data Penduduk & Perekaman KTP Elektronik'}`, 14, 61);
  doc.text(`Tanggal Cetak: ${options.tanggalSurat}`, pageWidth - 70, 56);
  doc.text(`Cakupan Wilayah: ${options.filterRw && options.filterRw !== 'all' ? `Rukun Warga (RW) ${options.filterRw}` : 'Seluruh Wilayah Instansi'}`, pageWidth - 70, 61);

  // 4. STATISTICAL SUMMARY HIGHLIGHTS
  const totalWarga = citizens.length;
  const totalPria = citizens.filter((c) => c.jenisKelamin === 'L').length;
  const totalWanita = citizens.filter((c) => c.jenisKelamin === 'P').length;
  const uniqueKk = new Set(citizens.map((c) => c.noKk)).size;
  const totalValid = citizens.filter((c) => c.statusVerifikasi === 'terverifikasi').length;

  // Wajib KTP (usia >= 17)
  const currentYear = new Date().getFullYear();
  const wajibKtp = citizens.filter((c) => {
    const birthYear = parseInt(c.tanggalLahir.split('-')[0], 10);
    const umur = isNaN(birthYear) ? 20 : currentYear - birthYear;
    return umur >= 17 || c.statusPerkawinan === 'Kawin';
  }).length;

  doc.setFillColor(248, 250, 252);
  doc.setDrawColor(203, 213, 225);
  doc.roundedRect(14, 65, pageWidth - 28, 10, 1.5, 1.5, 'FD');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.text(
    `REKAPITULASI DINAS: Total Penduduk: ${totalWarga} Jiwa  |  Kepala Keluarga: ${uniqueKk} KK  |  Laki-laki: ${totalPria}  |  Perempuan: ${totalWanita}  |  Wajib KTP: ${wajibKtp} Jiwa  |  e-KTP Terverifikasi: ${totalValid} (${((totalValid / (totalWarga || 1)) * 100).toFixed(1)}%)`,
    18,
    71.5
  );

  // 5. DATA TABLE RESMI SESUAI STANDAR DISDUKCAPIL
  const tableRows = citizens.map((c, index) => [
    String(index + 1),
    c.noKk || '-',
    c.nik,
    c.namaLengkap,
    c.hubunganKeluarga || (c.nik === c.noKk ? 'Kepala Keluarga' : 'Anggota'),
    c.jenisKelamin,
    `${c.tempatLahir}, ${c.tanggalLahir}`,
    c.agama || 'Islam',
    c.pendidikan || 'SMA/Sederajat',
    c.pekerjaan || 'Karyawan Swasta',
    c.statusPerkawinan ? c.statusPerkawinan.toUpperCase() : 'BELUM KAWIN',
    `RT ${c.alamat.rt}/RW ${c.alamat.rw}, ${c.alamat.kelurahan || c.alamat.jalan}`,
    c.statusVerifikasi === 'terverifikasi'
      ? 'AKTIF TERVERIFIKASI'
      : c.statusVerifikasi === 'menunggu'
      ? 'MENUNGGU VERIFIKASI'
      : 'PERLU REVISI',
  ]);

  autoTable(doc, {
    startY: 78,
    head: [
      [
        'No',
        'No. Kartu Keluarga',
        'NIK',
        'Nama Lengkap Warga',
        'SHDK',
        'JK',
        'Tempat, Tgl Lahir',
        'Agama',
        'Pendidikan',
        'Pekerjaan',
        'Status Kawin',
        'Alamat Domisili',
        'Status e-KTP',
      ],
    ],
    body: tableRows,
    theme: 'grid',
    styles: {
      fontSize: 7,
      cellPadding: 1.2,
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
      0: { halign: 'center', cellWidth: 7 },
      1: { font: 'courier', cellWidth: 24 },
      2: { font: 'courier', fontStyle: 'bold', cellWidth: 24 },
      3: { fontStyle: 'bold', cellWidth: 32 },
      4: { cellWidth: 18 },
      5: { halign: 'center', cellWidth: 8 },
      6: { cellWidth: 26 },
      7: { cellWidth: 14 },
      8: { cellWidth: 20 },
      9: { cellWidth: 22 },
      10: { cellWidth: 18 },
      11: { cellWidth: 34 },
      12: { halign: 'center', cellWidth: 22 },
    },
    didDrawPage: (data) => {
      // Footer page numbering
      const str = `Halaman ${data.pageNumber} dari ${doc.getNumberOfPages()}  ·  ${kopConfig.namaInstansi}  ·  SIPENDUK-RI Terverifikasi`;
      doc.setFontSize(7.5);
      doc.setFont('helvetica', 'normal');
      doc.text(str, pageWidth / 2, doc.internal.pageSize.getHeight() - 6, { align: 'center' });
    },
  });

  // 6. OFFICIAL SIGNATURES BLOCK (PENGESAHAN RESMI DINAS)
  let finalY = (doc as any).lastAutoTable.finalY + 8;
  if (finalY > doc.internal.pageSize.getHeight() - 44) {
    doc.addPage();
    finalY = 20;
  }

  const signWidth = 85;
  const leftX = 20;
  const rightX = pageWidth - signWidth - 20;

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);

  // Left Signature: Petugas Pelapor / Operator SIAK
  doc.text('Petugas Pelapor / Verifikator Data:', leftX, finalY);
  doc.text(`${kopConfig.jabatanPenandatangan},`, leftX, finalY + 4);

  // Box TTE stamp indication
  doc.setDrawColor(203, 213, 225);
  doc.rect(leftX, finalY + 7, 36, 14);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('TTE Tervalidasi', leftX + 4, finalY + 12);
  doc.text('BSrE Kemendagri RI', leftX + 4, finalY + 16);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.text(kopConfig.pejabatPenandatangan, leftX, finalY + 26);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${kopConfig.nipPenandatangan}`, leftX, finalY + 30);

  // Right Signature: Pejabat Pengesah (Kepala Dinas / Camat / Lurah)
  doc.text(`${kopConfig.kotaSurat}, ${options.tanggalSurat}`, rightX, finalY);
  doc.text('Mengetahui dan Mengesahkan,', rightX, finalY + 4);
  doc.text(`${kopConfig.jabatanPengesah},`, rightX, finalY + 8);

  // Box Cap Dinas / TTE
  doc.setDrawColor(203, 213, 225);
  doc.rect(rightX, finalY + 11, 40, 14);
  doc.setFontSize(6.5);
  doc.setTextColor(100, 116, 139);
  doc.text('Tanda Tangan Elektronik (TTE)', rightX + 3, finalY + 15);
  doc.text('Tersertifikasi Disdukcapil RI', rightX + 3, finalY + 19);
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(8);

  doc.setFont('helvetica', 'bold');
  doc.text(kopConfig.pejabatPengesah, rightX, finalY + 30);
  doc.setFont('helvetica', 'normal');
  doc.text(`NIP. ${kopConfig.nipPengesah}`, rightX, finalY + 34);

  // Save the document
  const safeDate = options.tanggalSurat.replace(/\s+/g, '_');
  const safeInstansi = kopConfig.namaInstansi.replace(/[^a-zA-Z0-9]/g, '_');
  const fileName = `Laporan_Resmi_${safeInstansi}_${safeDate}.pdf`;
  doc.save(fileName);
}
