'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import ExcelJS from 'exceljs';
import {
  PDFDownloadLink,
  Document,
  Page,
  Text,
  View,
  StyleSheet,
  Font,
  Image as PDFImage,
} from '@react-pdf/renderer';

interface ReportItemSummary {
  name: string;
  unit: string;
  totalQuantity: number;
  totalCost: number;
  branch_name: string;
}

interface BranchSummary {
  branchName: string;
  totalOrders: number;
  totalBudget: number;
  itemDetails: ReportItemSummary[];
}

Font.register({ family: 'THSarabunNew', src: '/fonts/THSarabunNew.ttf' });

const styles = StyleSheet.create({
  page: { padding: 40, fontFamily: 'THSarabunNew' },
  logo: { width: 80, height: 80, alignSelf: 'center', marginBottom: 10 },
  companyName: { fontSize: 20, textAlign: 'center', marginBottom: 5, fontWeight: 'bold' },
  address: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  subHeader: { fontSize: 18, textAlign: 'center', marginBottom: 5, fontWeight: 'bold' },
  subHeader2: { fontSize: 14, textAlign: 'center', marginBottom: 20 },
  dateTextLeft: { fontSize: 16, textAlign: 'left', marginBottom: 15, paddingLeft: 5 },
  table: { display: 'flex', flexDirection: 'column', width: '100%', borderTop: '1px solid #000', borderLeft: '1px solid #000', marginBottom: 20 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#F8BBD0' },
  row: { flexDirection: 'row' },
  cell: { padding: 5, fontSize: 14, borderRight: '1px solid #000', borderBottom: '1px solid #000' },
  footerRow: { flexDirection: 'row', backgroundColor: '#F48FB1' },
  signatureContainer: { marginTop: 30 },
  sigRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 20 },
  sigBox: { width: '45%', textAlign: 'center', fontSize: 12 },
});

const ReportPDF = ({
  data,
  title,
  type,
  dateFrom,
  dateTo,
}: {
  data: any;
  title: string;
  type: string;
  dateFrom: string;
  dateTo: string;
}) => {
  const formatDateTH = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' });
  };
  const dateLabel =
    dateFrom && dateTo
      ? `ช่วงวันที่: ${formatDateTH(dateFrom)} ถึง ${formatDateTH(dateTo)}`
      : dateFrom
      ? `ตั้งแต่วันที่: ${formatDateTH(dateFrom)}`
      : dateTo
      ? `ถึงวันที่: ${formatDateTH(dateTo)}`
      : `วันที่รายงาน: ${new Date().toLocaleDateString('th-TH', { year: 'numeric', month: 'long', day: 'numeric' })} (ข้อมูลสะสมทั้งหมด)`;

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        <PDFImage style={styles.logo} src="/logo.png" />
        <Text style={styles.companyName}>บริษัท แอมโมริ เทรดดิ้งกรุ๊ป จำกัด</Text>
        <Text style={styles.address}>499/95 หมู่ที่ 2 ตำบลชุมเห็ด อำเภอเมืองบุรีรัมย์ จ.บุรีรัมย์ 31000</Text>
        <Text style={styles.subHeader}>ใบเบิกวัสดุอุปกรณ์และสินค้า (Supply Use) ประจำวัน</Text>
        <Text style={styles.subHeader2}>สรุปรายละเอียดการใช้วัสดุสิ้นเปลืองและการเบิกจ่ายสินค้า (Aemori) รวมทั้งหมด</Text>
        <Text style={styles.dateTextLeft}>{dateLabel}</Text>

        <View style={styles.table}>
          <View style={styles.tableHeader}>
            {type === 'items' ? (
              <>
                <Text style={[styles.cell, { width: '10%' }]}>ลำดับ</Text>
                <Text style={[styles.cell, { width: '20%' }]}>ชื่อสาขา</Text>
                <Text style={[styles.cell, { width: '30%' }]}>รายการ</Text>
                <Text style={[styles.cell, { width: '20%' }]}>จำนวนที่ได้รับ</Text>
                <Text style={[styles.cell, { width: '20%' }]}>ราคารวม (บาท)</Text>
              </>
            ) : (
              <>
                <Text style={[styles.cell, { width: '40%' }]}>ชื่อสาขา</Text>
                <Text style={[styles.cell, { width: '30%' }]}>จำนวนใบเบิก</Text>
                <Text style={[styles.cell, { width: '30%' }]}>งบประมาณรวม (บาท)</Text>
              </>
            )}
          </View>

          {type === 'items'
            ? data.itemsList.map((item: any, index: number) => (
                <View key={index} style={styles.row}>
                  <Text style={[styles.cell, { width: '10%', textAlign: 'center' }]}>{index + 1}</Text>
                  <Text style={[styles.cell, { width: '20%' }]}>{item.branch_name}</Text>
                  <Text style={[styles.cell, { width: '30%' }]}>{item.name}</Text>
                  <Text style={[styles.cell, { width: '20%', textAlign: 'center' }]}>
                    {item.totalQuantity} {item.unit}
                  </Text>
                  <Text style={[styles.cell, { width: '20%', textAlign: 'right' }]}>
                    {item.totalCost.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))
            : data.branchSummaries.map((b: any, index: number) => (
                <View key={index} style={styles.row}>
                  <Text style={[styles.cell, { width: '40%' }]}>{b.branchName}</Text>
                  <Text style={[styles.cell, { width: '30%', textAlign: 'center' }]}>{b.totalOrders}</Text>
                  <Text style={[styles.cell, { width: '30%', textAlign: 'right' }]}>
                    {b.totalBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                  </Text>
                </View>
              ))}

          <View style={styles.footerRow}>
            <Text style={[styles.cell, { width: type === 'items' ? '80%' : '70%', textAlign: 'right', paddingRight: 10, fontWeight: 'bold' }]}>
              รวมยอดสุทธิทั้งสิ้น
            </Text>
            <Text style={[styles.cell, { width: type === 'items' ? '20%' : '30%', fontWeight: 'bold', textAlign: 'right' }]}>
              {data.totalBudget.toLocaleString('th-TH', { minimumFractionDigits: 2 })} บาท
            </Text>
          </View>
        </View>

        <View style={styles.signatureContainer}>
          <View style={styles.sigRow}>
            <View style={styles.sigBox}>
              <Text>ผู้ขอเบิก...................................</Text>
              <Text style={{ marginTop: 5 }}>(...........................................)</Text>
              <Text style={{ marginTop: 5 }}>วันที่........./........./..........</Text>
            </View>
            <View style={styles.sigBox}>
              <Text>ผู้จัดทำ....................................</Text>
              <Text style={{ marginTop: 5 }}>(...........................................)</Text>
              <Text style={{ marginTop: 5 }}>วันที่........./........./..........</Text>
            </View>
          </View>
          <View style={styles.sigRow}>
            <View style={styles.sigBox}>
              <Text>ผู้ตรวจสอบ................................</Text>
              <Text style={{ marginTop: 5 }}>(...........................................)</Text>
              <Text style={{ marginTop: 5 }}>วันที่........./........./..........</Text>
            </View>
            <View style={styles.sigBox}>
              <Text>ผู้อนุมัติ....................................</Text>
              <Text style={{ marginTop: 5 }}>(...........................................)</Text>
              <Text style={{ marginTop: 5 }}>วันที่........./........./..........</Text>
            </View>
          </View>
        </View>
      </Page>
    </Document>
  );
};

const getTodayStr = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function AdminReportsPage() {
  const [loading, setLoading] = useState(true);
  const [selectedReportType, setSelectedReportType] = useState('compare');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [allBranches, setAllBranches] = useState<string[]>([]);
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [rawRequisitions, setRawRequisitions] = useState<any[]>([]);
  const [rawDetails, setRawDetails] = useState<any[]>([]);

  const applyPreset = (preset: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'all') => {
    const today = getTodayStr();
    const shift = (days: number) => {
      const d = new Date();
      d.setDate(d.getDate() + days);
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    };
    const firstOfMonth = () => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;
    };
    switch (preset) {
      case 'today':     setDateFrom(today);          setDateTo(today);     break;
      case 'yesterday': setDateFrom(shift(-1));       setDateTo(shift(-1)); break;
      case '7days':     setDateFrom(shift(-6));       setDateTo(today);     break;
      case '30days':    setDateFrom(shift(-29));      setDateTo(today);     break;
      case 'thisMonth': setDateFrom(firstOfMonth());  setDateTo(today);     break;
      case 'all':       setDateFrom('');              setDateTo('');        break;
    }
  };

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const { data: reqs } = await supabase
        .from('requisitions')
        .select('id, branch_name, status, created_at')
        .eq('status', 'approved');

      if (!reqs) { setLoading(false); return; }
      setRawRequisitions(reqs);
      setAllBranches(Array.from(new Set(reqs.map((r) => r.branch_name))).sort());

      const reqIds = reqs.map((r) => r.id);
      if (reqIds.length === 0) { setLoading(false); return; }

      const { data: details } = await supabase
        .from('requisition_details')
        .select('requisition_id, quantity, price_at_time, items (name, unit)')
        .in('requisition_id', reqIds);

      if (details) setRawDetails(details);
      setLoading(false);
    }
    loadData();
  }, []);

  const getFilteredData = () => {
    const filteredReqs = rawRequisitions.filter((r) => {
      if (!r.created_at) return false;
      const rDate = new Date(r.created_at).toISOString().split('T')[0];
      if (dateFrom && rDate < dateFrom) return false;
      if (dateTo && rDate > dateTo) return false;
      return true;
    });

    const filteredReqIds = new Set(filteredReqs.map((r) => r.id));
    let totalBudgetCounter = 0;
    const globalItemsMap: Record<string, ReportItemSummary> = {};
    const branchMap: Record<string, { totalOrders: number; totalBudget: number; items: Record<string, ReportItemSummary> }> = {};

    allBranches.forEach((b) => { branchMap[b] = { totalOrders: 0, totalBudget: 0, items: {} }; });
    filteredReqs.forEach((r) => { if (branchMap[r.branch_name]) branchMap[r.branch_name].totalOrders++; });

    rawDetails.forEach((det: any) => {
      if (!filteredReqIds.has(det.requisition_id)) return;
      const parentReq = filteredReqs.find((r) => r.id === det.requisition_id);
      if (!parentReq) return;

      const branchName = parentReq.branch_name || 'ไม่ระบุสาขา';
      const itemName   = det.items?.name || 'ไม่ทราบชื่อสินค้า';
      const itemUnit   = det.items?.unit || 'ชิ้น';
      const qty        = det.quantity || 0;
      const cost       = qty * (det.price_at_time || 0);

      totalBudgetCounter += cost;

      const matchesBranch = selectedReportType !== 'items' || selectedBranch === 'all' || branchName === selectedBranch;
      if (matchesBranch) {
        const key = `${branchName}_${itemName}`;
        if (!globalItemsMap[key]) {
          globalItemsMap[key] = { name: itemName, unit: itemUnit, totalQuantity: 0, totalCost: 0, branch_name: branchName };
        }
        globalItemsMap[key].totalQuantity += qty;
        globalItemsMap[key].totalCost += cost;
      }

      if (branchMap[branchName]) {
        branchMap[branchName].totalBudget += cost;
        if (!branchMap[branchName].items[itemName]) {
          branchMap[branchName].items[itemName] = { name: itemName, unit: itemUnit, totalQuantity: 0, totalCost: 0, branch_name: branchName };
        }
        branchMap[branchName].items[itemName].totalQuantity += qty;
        branchMap[branchName].items[itemName].totalCost += cost;
      }
    });

    return {
      totalOrders: filteredReqs.length,
      totalBudget: totalBudgetCounter,
      itemsList: Object.values(globalItemsMap),
      branchSummaries: Object.keys(branchMap).map((b) => ({
        branchName:  b,
        totalOrders: branchMap[b].totalOrders,
        totalBudget: branchMap[b].totalBudget,
        itemDetails: Object.values(branchMap[b].items),
      })),
    };
  };

  const currentData    = getFilteredData();
  const itemsTotalQty  = currentData.itemsList.reduce((s, i) => s + i.totalQuantity, 0);
  const itemsTotalCost = currentData.itemsList.reduce((s, i) => s + i.totalCost, 0);

  const formatDateTH = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString('th-TH', { year: 'numeric', month: 'short', day: 'numeric' });

  const dateRangeLabel =
    dateFrom || dateTo
      ? `${dateFrom ? formatDateTH(dateFrom) : 'ตั้งต้น'} — ${dateTo ? formatDateTH(dateTo) : 'ปัจจุบัน'}`
      : 'ข้อมูลสะสมทั้งหมด';

  const getReportHeaderTitle = () => {
    if (selectedReportType === 'compare') return 'สรุปรายงานเปรียบเทียบงบประมาณรายสาขา';
    return selectedBranch === 'all'
      ? 'สรุปรายละเอียดของในการเบิกสะสมรวมทั้งหมด'
      : `สรุปรายละเอียดการเบิก: ${selectedBranch}`;
  };

  const handleExportToExcel = async () => {
    const workbook  = new ExcelJS.Workbook();
    const sheetName = (selectedBranch === 'all' ? 'Report' : selectedBranch).substring(0, 31);
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.mergeCells('A1:E1');
    const titleCell       = worksheet.getCell('A1');
    titleCell.value       = getReportHeaderTitle();
    titleCell.font        = { bold: true, size: 16 };
    titleCell.alignment   = { horizontal: 'center' };

    worksheet.mergeCells('A2:E2');
    const dateCell        = worksheet.getCell('A2');
    dateCell.value        = `ช่วงข้อมูล: ${dateRangeLabel}`;
    dateCell.font         = { italic: true, size: 11, color: { argb: 'FF888888' } };
    dateCell.alignment    = { horizontal: 'center' };

    worksheet.addRow([]);

    if (selectedReportType === 'items') {
      const headerRow = worksheet.addRow(['ลำดับ', 'สาขา', 'รายการสิ่งของ', 'จำนวน', 'หน่วย', 'งบประมาณ (บาท)']);
      styleHeader(headerRow);
      currentData.itemsList.forEach((item, idx) => {
        const row = worksheet.addRow([idx + 1, item.branch_name, item.name, item.totalQuantity, item.unit, item.totalCost]);
        styleDataRow(row, [6]);
      });
      worksheet.columns = [{ width: 8 }, { width: 25 }, { width: 35 }, { width: 12 }, { width: 12 }, { width: 20 }];
    } else {
      const headerRow = worksheet.addRow(['ชื่อสาขา', 'จำนวนใบเบิก', 'งบประมาณรวม (บาท)']);
      styleHeader(headerRow);
      currentData.branchSummaries.forEach((b) => {
        const row = worksheet.addRow([b.branchName, b.totalOrders, b.totalBudget]);
        styleDataRow(row, [3]);
      });
      worksheet.columns = [{ width: 40 }, { width: 20 }, { width: 25 }];
    }

    worksheet.addRow([]);
    const summaryRow = worksheet.addRow(['', '', 'รวมสุทธิ', '', '', currentData.totalBudget]);
    summaryRow.font = { bold: true, size: 12 };

    const rangeSuffix = dateFrom || dateTo ? `_${dateFrom || 'start'}_to_${dateTo || 'now'}` : '_all';
    const fileName    = `Report_${selectedReportType}_${selectedBranch}${rangeSuffix}.xlsx`;
    const buffer      = await workbook.xlsx.writeBuffer();
    const blob        = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const a           = document.createElement('a');
    a.href            = URL.createObjectURL(blob);
    a.download        = fileName;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const styleHeader = (row: ExcelJS.Row) => {
    row.eachCell((cell) => {
      cell.fill      = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE4EC' } };
      cell.font      = { bold: true, size: 12 };
      cell.border    = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });
  };

  const styleDataRow = (row: ExcelJS.Row, rightAlignCols: number[] = []) => {
    row.eachCell((cell) => {
      cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
    });
    rightAlignCols.forEach((col) => {
      row.getCell(col).alignment = { horizontal: 'right' };
    });
  };

  const PRESETS: { label: string; key: 'today' | 'yesterday' | '7days' | '30days' | 'thisMonth' | 'all' }[] = [
    { label: 'วันนี้',        key: 'today'     },
    { label: 'เมื่อวาน',     key: 'yesterday' },
    { label: '7 วันล่าสุด',  key: '7days'     },
    { label: '30 วันล่าสุด', key: '30days'    },
    { label: 'เดือนนี้',     key: 'thisMonth' },
    { label: 'ทั้งหมด',      key: 'all'       },
  ];

  const isActivePreset = (key: typeof PRESETS[number]['key']) => {
    const today = getTodayStr();
    const shift = (n: number) => {
      const d = new Date(); d.setDate(d.getDate() + n);
      return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    };
    const fom = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-01`; };
    switch (key) {
      case 'today':     return dateFrom === today      && dateTo === today;
      case 'yesterday': return dateFrom === shift(-1)  && dateTo === shift(-1);
      case '7days':     return dateFrom === shift(-6)  && dateTo === today;
      case '30days':    return dateFrom === shift(-29) && dateTo === today;
      case 'thisMonth': return dateFrom === fom()      && dateTo === today;
      case 'all':       return !dateFrom && !dateTo;
    }
  };

  if (loading)
    return (
      <div className="min-h-screen flex items-center justify-center bg-pink-50/40">
        <div className="flex flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-full border-4 border-pink-200 border-t-pink-400 animate-spin" />
          <p className="text-pink-400 font-bold text-base">กำลังคำนวณข้อมูลสรุปยอด...</p>
        </div>
      </div>
    );

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50/30 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 text-slate-800 print:bg-white print:py-0 print:px-0">
      <style jsx global>{`
        @media print {
          @page { size: A4 portrait; margin: 20mm; }
          body  { margin: 0 !important; padding: 0 !important; background-color: #fff !important; }
        }
      `}</style>

      <div className="max-w-4xl mx-auto space-y-5 print:max-w-full">

        {/* ── Navbar ── */}
        <nav className="bg-white border border-pink-100 rounded-2xl p-4 sm:p-5 shadow-sm shadow-pink-100/50 flex flex-col sm:flex-row items-center justify-between gap-4 print:hidden">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center shadow-md shadow-pink-500/10 overflow-hidden border border-pink-200">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <p className="text-xl font-black tracking-tight text-slate-800 leading-tight">Aemori</p>
              <p className="text-xs font-bold text-pink-400 mt-0.5 uppercase tracking-widest">ระบบจัดการเบิกของ Aemori</p>
            </div>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold bg-pink-50 p-1 rounded-xl border border-pink-100/80">
            <Link href="/admin/dashboard" className="px-4 py-2 rounded-lg text-slate-500 hover:text-pink-500 hover:bg-white/70 transition-all">📊 แดชบอร์ด</Link>
            <Link href="/admin/requisitions" className="px-4 py-2 rounded-lg text-slate-500 hover:text-pink-500 hover:bg-white/70 transition-all">📝 ใบเบิก</Link>
            <Link href="/admin/reports" className="bg-white text-pink-600 shadow-sm shadow-pink-100 px-4 py-2 rounded-lg transition-all">📈 รายงาน</Link>
            <Link href="/admin/inventory" className="px-4 py-2 rounded-lg text-slate-500 hover:text-pink-500 hover:bg-white/70 transition-all">📦 คลัง</Link>
          </div>
        </nav>

        {/* ── Filter Panel ── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm shadow-pink-100/50 border border-pink-100 space-y-5 print:hidden">
          {/* Header row */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-pink-50 pb-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">📈 สรุปยอดรายงาน</h1>
              <p className="text-xs font-semibold text-slate-400 mt-1">เลือกประเภทรายงาน ช่วงวันที่ และสาขา</p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              {/* PDF */}
              <PDFDownloadLink
                document={<ReportPDF data={currentData} title={getReportHeaderTitle()} type={selectedReportType} dateFrom={dateFrom} dateTo={dateTo} />}
                fileName={`Report_${selectedReportType}_${selectedBranch}${dateFrom ? `_${dateFrom}` : ''}_to_${dateTo || 'now'}.pdf`}
              >
                {({ loading: pdfLoading }) => (
                  <div className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all cursor-pointer border ${
                    pdfLoading
                      ? 'bg-pink-50 text-pink-400 border-pink-100'
                      : 'bg-white text-slate-700 border-pink-100 hover:border-pink-300 hover:bg-pink-50/50 shadow-sm active:scale-95'
                  }`}>
                    {pdfLoading ? (
                      <><div className="w-4 h-4 border-2 border-pink-300 border-t-transparent rounded-full animate-spin" /><span>กำลังเตรียม...</span></>
                    ) : (
                      <><span>📄</span><span>PDF</span></>
                    )}
                  </div>
                )}
              </PDFDownloadLink>

              {/* Excel */}
              <button
                type="button"
                onClick={handleExportToExcel}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-emerald-600 border border-emerald-100 hover:border-emerald-300 hover:bg-emerald-50/50 shadow-sm active:scale-95 transition-all"
              >
                <span>📗</span><span>Excel</span>
              </button>

              {/* Print */}
              <button
                type="button"
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:bg-slate-50 shadow-sm active:scale-95 transition-all"
              >
                <span>🖨️</span><span>พิมพ์</span>
              </button>
            </div>
          </div>

          {/* Row 1: type + branch */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-xs font-black text-pink-400 uppercase tracking-widest">📋 รูปแบบรายงาน</label>
              <select
                value={selectedReportType}
                onChange={(e) => { setSelectedReportType(e.target.value); if (e.target.value !== 'items') setSelectedBranch('all'); }}
                className="w-full h-11 px-4 bg-pink-50/50 border border-pink-100 rounded-xl font-semibold text-sm text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
              >
                <option value="compare">💵 สรุปยอดเงินรายสาขา</option>
                <option value="items">📦 รายการของที่เบิก</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-xs font-black text-pink-400 uppercase tracking-widest">🏬 สาขา</label>
              <select
                value={selectedBranch}
                onChange={(e) => setSelectedBranch(e.target.value)}
                className="w-full h-11 px-4 bg-pink-50/50 border border-pink-100 rounded-xl font-semibold text-sm text-slate-700 outline-none cursor-pointer focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
              >
                <option value="all">ทุกสาขา</option>
                {allBranches.map((b) => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
          </div>

          {/* Date Range */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-pink-400 uppercase tracking-widest">📅 ช่วงวันที่</label>
              {(dateFrom || dateTo) && (
                <button onClick={() => applyPreset('all')} className="text-xs text-rose-400 font-bold hover:underline">✕ ล้างช่วงวันที่</button>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.key}
                  onClick={() => applyPreset(p.key)}
                  className={`px-3.5 py-2 rounded-xl text-sm font-bold border transition-all ${
                    isActivePreset(p.key)
                      ? 'bg-pink-500 text-white border-pink-500 shadow-sm'
                      : 'bg-pink-50/60 text-slate-600 border-pink-100 hover:border-pink-300 hover:text-pink-600'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">ตั้งแต่วันที่</label>
                <input
                  type="date"
                  value={dateFrom}
                  max={dateTo || undefined}
                  onChange={(e) => setDateFrom(e.target.value)}
                  className="w-full h-11 px-4 bg-pink-50/50 border border-pink-100 rounded-xl font-semibold text-slate-700 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-slate-400">ถึงวันที่</label>
                <input
                  type="date"
                  value={dateTo}
                  min={dateFrom || undefined}
                  onChange={(e) => setDateTo(e.target.value)}
                  className="w-full h-11 px-4 bg-pink-50/50 border border-pink-100 rounded-xl font-semibold text-slate-700 text-sm outline-none cursor-pointer focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all"
                />
              </div>
            </div>
            {(dateFrom || dateTo) && (
              <div className="flex items-center gap-2 px-4 py-3 bg-pink-50 rounded-xl border border-pink-100">
                <span>📌</span>
                <span className="text-sm font-bold text-pink-600">
                  กำลังดูข้อมูล: <span className="text-slate-700">{dateRangeLabel}</span>
                </span>
              </div>
            )}
          </div>
        </div>

        {/* ── Report Document ── */}
        <div className="bg-white p-6 sm:p-10 rounded-2xl shadow-sm shadow-pink-100/50 border border-pink-100 print:shadow-none print:border-none print:p-0">

          {/* Report Header */}
          <div className="text-center border-b-2 border-pink-200 pb-5 space-y-1 print:border-slate-900">
            <p className="inline-flex items-center gap-2 text-xs font-black text-pink-400 uppercase tracking-widest mb-2 print:hidden">
              <span className="w-8 h-px bg-pink-200" />Aemori Report<span className="w-8 h-px bg-pink-200" />
            </p>
            <h2 className="text-xl font-black text-slate-800">{getReportHeaderTitle()}</h2>
            <p className="text-sm font-semibold text-slate-400">{dateRangeLabel}</p>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-2 gap-4 my-6">
            <div className="bg-pink-50/60 p-5 rounded-xl border border-pink-100 text-center">
              <span className="block text-xs font-black text-pink-400 uppercase tracking-widest">ใบเบิกที่อนุมัติ</span>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-black text-slate-800">{currentData.totalOrders}</span>
                <span className="text-sm font-bold text-slate-400">ฉบับ</span>
              </div>
            </div>
            <div className="bg-gradient-to-br from-pink-50 to-rose-50/60 p-5 rounded-xl border border-pink-100 text-center">
              <span className="block text-xs font-black text-pink-400 uppercase tracking-widest">รวมงบที่ใช้เบิก</span>
              <div className="mt-2 flex items-baseline justify-center gap-1">
                <span className="text-3xl font-black text-pink-600">{currentData.totalBudget.toLocaleString('th-TH')}</span>
                <span className="text-sm font-bold text-slate-400">บาท</span>
              </div>
            </div>
          </div>

          {/* Branch Table */}
          {(selectedReportType === 'all' || selectedReportType === 'compare') && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                ตารางสรุปงบประมาณรายสาขา
              </h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-pink-50 text-pink-500 font-black uppercase tracking-wide">
                    <th className="p-3 border border-pink-100">ชื่อสาขา</th>
                    <th className="p-3 border border-pink-100 text-center w-36">จำนวนใบเบิก</th>
                    <th className="p-3 border border-pink-100 text-right w-52">งบประมาณที่ใช้ไป</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-slate-700">
                  {currentData.branchSummaries.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-pink-300 font-bold">ไม่มีข้อมูลในช่วงเวลาที่เลือก</td>
                    </tr>
                  ) : (
                    <>
                      {currentData.branchSummaries.map((b, idx) => (
                        <tr key={b.branchName} className={`hover:bg-pink-50/40 transition-colors ${idx % 2 === 1 ? 'bg-pink-50/20' : ''}`}>
                          <td className="p-3 border border-pink-100/60 font-bold">
                            <div className="flex items-center gap-2"><span className="w-1.5 h-1.5 rounded-full bg-pink-300" />{b.branchName}</div>
                          </td>
                          <td className="p-3 border border-pink-100/60 text-center">{b.totalOrders}</td>
                          <td className="p-3 border border-pink-100/60 text-right font-bold">{b.totalBudget.toLocaleString('th-TH')} ฿</td>
                        </tr>
                      ))}
                      <tr className="bg-pink-600 text-white font-black">
                        <td className="p-3 border border-pink-500">รวมงบสุทธิ (Grand Total)</td>
                        <td className="p-3 border border-pink-500 text-center">{currentData.totalOrders}</td>
                        <td className="p-3 border border-pink-500 text-right">{currentData.totalBudget.toLocaleString('th-TH')} ฿</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Items Table */}
          {selectedReportType === 'items' && (
            <div className="space-y-3">
              <h3 className="text-sm font-black text-slate-700 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                รายการสิ่งของวัสดุในการเบิกสะสมรวม
              </h3>
              <table className="w-full text-left border-collapse text-sm">
                <thead>
                  <tr className="bg-pink-50 text-pink-500 font-black uppercase tracking-wide">
                    <th className="p-3 border border-pink-100 w-12 text-center">ลำดับ</th>
                    <th className="p-3 border border-pink-100">รายการสิ่งของ</th>
                    <th className="p-3 border border-pink-100 text-center w-40">จำนวนรวม</th>
                    <th className="p-3 border border-pink-100 text-right w-48">งบประมาณรวม</th>
                  </tr>
                </thead>
                <tbody className="font-medium text-slate-700">
                  {currentData.itemsList.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-10 text-center text-pink-300 font-bold">ไม่มีรายการที่อนุมัติในเงื่อนไขนี้</td>
                    </tr>
                  ) : (
                    <>
                      {currentData.itemsList.map((item, idx) => (
                        <tr key={`${item.branch_name}-${item.name}`} className={`hover:bg-pink-50/40 transition-colors ${idx % 2 === 1 ? 'bg-pink-50/20' : ''}`}>
                          <td className="p-3 border border-pink-100/60 text-center text-pink-300 font-bold">{idx + 1}</td>
                          <td className="p-3 border border-pink-100/60 font-bold">
                            <div>{item.name}</div>
                            <div className="text-xs text-pink-400 font-semibold mt-0.5">{item.branch_name}</div>
                          </td>
                          <td className="p-3 border border-pink-100/60 text-center font-bold">
                            <span className="bg-pink-50 text-pink-600 px-2.5 py-1 rounded-lg border border-pink-100">
                              {item.totalQuantity} {item.unit}
                            </span>
                          </td>
                          <td className="p-3 border border-pink-100/60 text-right">{item.totalCost.toLocaleString('th-TH')} ฿</td>
                        </tr>
                      ))}
                      <tr className="bg-pink-600 text-white font-black">
                        <td colSpan={2} className="p-3 border border-pink-500">รวมยอดสุทธิ (Total)</td>
                        <td className="p-3 border border-pink-500 text-center">{itemsTotalQty.toLocaleString('th-TH')} รายการ</td>
                        <td className="p-3 border border-pink-500 text-right">{itemsTotalCost.toLocaleString('th-TH')} ฿</td>
                      </tr>
                    </>
                  )}
                </tbody>
              </table>
            </div>
          )}

          {/* Signature Zone */}
          <div className="mt-14 grid grid-cols-2 gap-8 text-center text-xs font-bold text-slate-400 print:mt-12">
            <div className="space-y-8">
              <p>ผู้จัดทำรายงาน: ............................................................</p>
              <p>( ______________________________________ )</p>
            </div>
            <div className="space-y-8">
              <p>ผู้อนุมัติรายงาน: ............................................................</p>
              <p>( ______________________________________ )</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}