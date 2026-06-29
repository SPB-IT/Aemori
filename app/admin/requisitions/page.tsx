'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

interface Requisition {
  id: string;
  created_at: string;
  branch_name: string;
  requester_name: string;
  status: 'pending' | 'approved' | 'rejected';
}

interface RequisitionDetail {
  id: string;
  quantity: number;
  price_at_time: number;
  rejection_reason: string | null;
  items: {
    name: string;
    unit: string;
    image_url: string | null;
  } | null;
}

const PAGE_SIZE = 20;

export default function AdminRequisitionsPage() {
  const [requisitions, setRequisitions]     = useState<Requisition[]>([]);
  const [loading, setLoading]               = useState(true);
  const [selectedReq, setSelectedReq]       = useState<Requisition | null>(null);
  const [details, setDetails]               = useState<RequisitionDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalMode, setModalMode]           = useState<'review' | 'view'>('review');
  const [filterStatus, setFilterStatus]     = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm]         = useState('');

  // Pagination state
  const [currentPage, setCurrentPage]   = useState(1);
  const [totalCount, setTotalCount]     = useState(0);

  // Summary counts
  const [pendingCount, setPendingCount]   = useState(0);
  const [approvedCount, setApprovedCount] = useState(0);
  const [rejectedCount, setRejectedCount] = useState(0);

  // Item-level rejection modal
  const [rejectingDetail, setRejectingDetail] = useState<RequisitionDetail | null>(null);
  const [rejectReason, setRejectReason]       = useState('');
  const [savingReject, setSavingReject]       = useState(false);

  // Print
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = (req: Requisition, detailList: RequisitionDetail[]) => {
    const win = window.open('', '_blank', 'width=800,height=900');
    if (!win) return;
    const dateStr = new Date(req.created_at).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    const timeStr = new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' });
    const rows = detailList.map((d, i) => {
      const rejected = !!d.rejection_reason;
      return `
        <tr style="${rejected ? 'background:#fff5f5;color:#aaa;' : ''}">
          <td style="padding:8px 10px;border:1px solid #f9a8d4;text-align:center;">${i + 1}</td>
          <td style="padding:8px 10px;border:1px solid #f9a8d4;${rejected ? 'text-decoration:line-through;' : ''}">${d.items?.name ?? '-'}</td>
          <td style="padding:8px 10px;border:1px solid #f9a8d4;text-align:center;">${rejected ? '<span style="color:#e11d48;font-weight:bold;">ยกเลิก</span>' : d.quantity}</td>
          <td style="padding:8px 10px;border:1px solid #f9a8d4;text-align:center;">${d.items?.unit ?? '-'}</td>
          <td style="padding:8px 10px;border:1px solid #f9a8d4;text-align:right;">${rejected ? '—' : (d.price_at_time || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}</td>
          ${rejected ? `<td style="padding:8px 10px;border:1px solid #f9a8d4;color:#e11d48;font-size:12px;">⛔ ${d.rejection_reason}</td>` : '<td style="padding:8px 10px;border:1px solid #f9a8d4;"></td>'}
        </tr>`;
    }).join('');
    const total = detailList
      .filter(d => !d.rejection_reason)
      .reduce((s, d) => s + (d.price_at_time || 0) * (d.quantity || 0), 0)
      .toLocaleString('th-TH', { minimumFractionDigits: 2 });

    win.document.write(`<!DOCTYPE html><html><head>
      <meta charset="utf-8"/>
      <title>ใบเบิกสินค้า - ${req.branch_name}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Sarabun:wght@400;600;700&display=swap');
        * { font-family: 'Sarabun', sans-serif; box-sizing: border-box; }
        body { margin: 30px 40px; color: #1e293b; font-size: 14px; }
        h1 { font-size: 20px; font-weight: 700; text-align: center; margin: 0 0 4px; }
        .sub { text-align: center; color: #db2777; font-size: 13px; margin-bottom: 20px; }
        .meta { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; background: #fff0f6; border: 1px solid #fbcfe8; border-radius: 10px; padding: 14px 18px; margin-bottom: 20px; font-size: 13px; }
        .meta-label { color: #db2777; font-weight: 700; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; }
        .meta-value { font-weight: 600; margin-top: 2px; }
        table { width: 100%; border-collapse: collapse; font-size: 13px; }
        thead tr { background: #fce7f3; }
        thead th { padding: 9px 10px; border: 1px solid #f9a8d4; font-weight: 700; color: #be185d; }
        .total-row td { background: #db2777; color: white; font-weight: 700; padding: 9px 10px; border: 1px solid #be185d; }
        .sig { display: flex; justify-content: space-between; margin-top: 50px; }
        .sig-box { width: 42%; text-align: center; font-size: 13px; }
        .sig-line { border-top: 1px dashed #94a3b8; margin: 40px 10px 6px; }
        @media print { body { margin: 15px 20px; } }
      </style>
    </head><body>
      <h1>ใบเบิกสินค้า Aemori</h1>
      <p class="sub">Supply Requisition Form</p>
      <div class="meta">
        <div><div class="meta-label">สาขา</div><div class="meta-value">${req.branch_name}</div></div>
        <div><div class="meta-label">ผู้เบิก</div><div class="meta-value">${req.requester_name}</div></div>
        <div><div class="meta-label">วันที่</div><div class="meta-value">${dateStr}</div></div>
        <div><div class="meta-label">เวลา</div><div class="meta-value">${timeStr} น.</div></div>
      </div>
      <table>
        <thead><tr>
          <th style="width:5%;text-align:center;">ลำดับ</th>
          <th>รายการสินค้า</th>
          <th style="width:10%;text-align:center;">จำนวน</th>
          <th style="width:10%;text-align:center;">หน่วย</th>
          <th style="width:14%;text-align:right;">ราคา/หน่วย (฿)</th>
          <th style="width:20%;">หมายเหตุ</th>
        </tr></thead>
        <tbody>${rows}</tbody>
        <tfoot><tr class="total-row">
          <td colspan="4" style="text-align:right;">รวมทั้งสิ้น</td>
          <td style="text-align:right;">${total} ฿</td>
          <td></td>
        </tr></tfoot>
      </table>
      <div class="sig">
        <div class="sig-box"><div class="sig-line"></div>ผู้เบิก<br/>(${req.requester_name})</div>
        <div class="sig-box"><div class="sig-line"></div>ผู้จัดของ / ตรวจสอบ</div>
        <div class="sig-box"><div class="sig-line"></div>ผู้อนุมัติ</div>
      </div>
      <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`);
    win.document.close();
  };

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  async function fetchCounts() {
    const [p, a, r] = await Promise.all([
      supabase.from('requisitions').select('id', { count: 'exact', head: true }).eq('status', 'pending'),
      supabase.from('requisitions').select('id', { count: 'exact', head: true }).eq('status', 'approved'),
      supabase.from('requisitions').select('id', { count: 'exact', head: true }).eq('status', 'rejected'),
    ]);
    setPendingCount(p.count ?? 0);
    setApprovedCount(a.count ?? 0);
    setRejectedCount(r.count ?? 0);
  }

  const fetchRequisitions = useCallback(async (page = currentPage) => {
    setLoading(true);
    const from = (page - 1) * PAGE_SIZE;
    const to   = from + PAGE_SIZE - 1;

    let query = supabase
      .from('requisitions')
      .select('id, created_at, branch_name, requester_name, status', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(from, to);

    if (filterStatus !== 'all') query = query.eq('status', filterStatus);
    if (searchTerm.trim()) {
      query = query.or(
        `branch_name.ilike.%${searchTerm.trim()}%,requester_name.ilike.%${searchTerm.trim()}%`,
      );
    }

    const { data, count, error } = await query;
    if (error) console.error('Error fetching requisitions:', error);
    setRequisitions(data ?? []);
    setTotalCount(count ?? 0);
    setLoading(false);
  }, [currentPage, filterStatus, searchTerm]);

  useEffect(() => { fetchRequisitions(currentPage); }, [currentPage, filterStatus, searchTerm]);
  useEffect(() => { fetchCounts(); }, []);

  const handleFilterChange = (s: typeof filterStatus) => { setFilterStatus(s); setCurrentPage(1); };
  const handleSearchChange = (v: string) => { setSearchTerm(v); setCurrentPage(1); };

  const groupedRequisitions = requisitions.reduce((groups, req) => {
    const date = new Date(req.created_at).toLocaleDateString('th-TH', {
      day: 'numeric', month: 'long', year: 'numeric',
    });
    if (!groups[date]) groups[date] = [];
    groups[date].push(req);
    return groups;
  }, {} as Record<string, Requisition[]>);

  const handleViewDetails = async (req: Requisition, mode: 'review' | 'view') => {
    setSelectedReq(req);
    setModalMode(mode);
    setLoadingDetails(true);
    const { data, error } = await supabase
      .from('requisition_details')
      .select('id, quantity, price_at_time, rejection_reason, items (name, unit, image_url)')
      .eq('requisition_id', req.id);
    if (data) setDetails(data as unknown as RequisitionDetail[]);
    if (error) console.error(error);
    setLoadingDetails(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const label =
      newStatus === 'approved' ? 'อนุมัติ' :
      newStatus === 'rejected' ? 'ปฏิเสธ' : 'ยกเลิกการอนุมัติ';
    if (!window.confirm(`ยืนยันการ "${label}" ใบเบิกนี้?`)) return;
    const { error } = await supabase.from('requisitions').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      setSelectedReq(null);
      await Promise.all([fetchRequisitions(currentPage), fetchCounts()]);
    }
  };

  // ── Item-level reject ───────────────────────────────────────────────────
  const openRejectItemModal = (detail: RequisitionDetail) => {
    setRejectingDetail(detail);
    setRejectReason(detail.rejection_reason ?? '');
  };

  const handleSaveItemRejection = async () => {
    if (!rejectingDetail) return;
    if (!rejectReason.trim()) { alert('กรุณาระบุเหตุผล'); return; }
    setSavingReject(true);
    const { error } = await supabase
      .from('requisition_details')
      .update({ rejection_reason: rejectReason.trim() })
      .eq('id', rejectingDetail.id);
    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      // อัปเดต local state
      setDetails((prev) =>
        prev.map((d) =>
          d.id === rejectingDetail.id ? { ...d, rejection_reason: rejectReason.trim() } : d
        )
      );
      setRejectingDetail(null);
      setRejectReason('');
    }
    setSavingReject(false);
  };

  const handleClearItemRejection = async (detail: RequisitionDetail) => {
    if (!window.confirm('ยืนยันการยกเลิกการปฏิเสธรายการนี้?')) return;
    const { error } = await supabase
      .from('requisition_details')
      .update({ rejection_reason: null })
      .eq('id', detail.id);
    if (!error) {
      setDetails((prev) =>
        prev.map((d) => d.id === detail.id ? { ...d, rejection_reason: null } : d)
      );
    }
  };

  // ── Pagination ──────────────────────────────────────────────────────────
  const goToPage = (p: number) => {
    if (p < 1 || p > totalPages) return;
    setCurrentPage(p);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  function pageNumbers(): (number | '…')[] {
    if (totalPages <= 7) return Array.from({ length: totalPages }, (_, i) => i + 1);
    const pages: (number | '…')[] = [1];
    if (currentPage > 3) pages.push('…');
    for (let i = Math.max(2, currentPage - 1); i <= Math.min(totalPages - 1, currentPage + 1); i++) {
      pages.push(i);
    }
    if (currentPage < totalPages - 2) pages.push('…');
    pages.push(totalPages);
    return pages;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return (
          <span className="inline-flex items-center gap-1.5 bg-emerald-50 text-emerald-600 px-3 py-1 rounded-full text-xs font-bold border border-emerald-100">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />อนุมัติแล้ว
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1.5 bg-rose-50 text-rose-500 px-3 py-1 rounded-full text-xs font-bold border border-rose-100">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-400" />ปฏิเสธ
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 bg-amber-50 text-amber-500 px-3 py-1 rounded-full text-xs font-bold border border-amber-100">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />รออนุมัติ
          </span>
        );
    }
  };

  const rejectedCount_detail = details.filter((d) => !!d.rejection_reason).length;

  return (
    <div className="min-h-screen bg-linear-to-br from-pink-50 via-white to-rose-50/30 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* Navbar */}
        <nav className="bg-white border border-pink-100 rounded-2xl p-4 sm:p-5 shadow-sm shadow-pink-100/50 flex flex-col sm:flex-row items-center justify-between gap-4">
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
            <Link href="/admin/requisitions" className="bg-white text-pink-600 shadow-sm shadow-pink-100 px-4 py-2 rounded-lg transition-all">📝 ใบเบิก</Link>
            <Link href="/admin/reports" className="px-4 py-2 rounded-lg text-slate-500 hover:text-pink-500 hover:bg-white/70 transition-all">📈 รายงาน</Link>
            <Link href="/admin/inventory" className="px-4 py-2 rounded-lg text-slate-500 hover:text-pink-500 hover:bg-white/70 transition-all">📦 คลัง</Link>
          </div>
        </nav>

        {/* Page Header */}
        <div className="bg-white p-5 rounded-2xl shadow-sm shadow-pink-100/50 border border-pink-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">📝 จัดการใบเบิกสินค้า</h1>
              <p className="text-xs font-semibold text-pink-400 mt-1 uppercase tracking-widest">ตรวจสอบและอนุมัติ</p>
            </div>
            <button
              onClick={() => fetchRequisitions(currentPage)}
              className="inline-flex items-center gap-2 bg-pink-50 text-pink-500 hover:bg-pink-100 border border-pink-100 px-4 py-2.5 rounded-xl text-sm font-bold transition-all active:scale-95"
            >
              🔄 รีเฟรช
            </button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-amber-50 border border-amber-100 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
              <p className="text-xs font-bold text-amber-400 mt-0.5">รออนุมัติ</p>
            </div>
            <div className="bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-emerald-600">{approvedCount}</p>
              <p className="text-xs font-bold text-emerald-400 mt-0.5">อนุมัติแล้ว</p>
            </div>
            <div className="bg-rose-50 border border-rose-100 rounded-xl px-4 py-3 text-center">
              <p className="text-2xl font-black text-rose-500">{rejectedCount}</p>
              <p className="text-xs font-bold text-rose-300 mt-0.5">ปฏิเสธ</p>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <input
              type="text"
              placeholder="🔍 ค้นหาสาขาหรือชื่อผู้เบิก..."
              value={searchTerm}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="flex-1 h-10 px-4 border border-pink-100 rounded-xl bg-pink-50/50 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all placeholder:text-slate-400"
            />
            <div className="flex items-center gap-1 bg-pink-50 p-1 rounded-xl border border-pink-100 shrink-0">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => handleFilterChange(s)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                    filterStatus === s
                      ? 'bg-white text-pink-600 shadow-sm shadow-pink-100'
                      : 'text-slate-500 hover:text-pink-500'
                  }`}
                >
                  {s === 'all' ? 'ทั้งหมด' : s === 'pending' ? 'รออนุมัติ' : s === 'approved' ? 'อนุมัติแล้ว' : 'ปฏิเสธ'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Requisition Tables */}
        {loading ? (
          <div className="flex flex-col items-center gap-3 py-20 bg-white rounded-2xl border border-pink-100">
            <div className="w-10 h-10 rounded-full border-4 border-pink-200 border-t-pink-400 animate-spin" />
            <p className="text-pink-400 font-bold text-sm">กำลังโหลดข้อมูล...</p>
          </div>
        ) : Object.keys(groupedRequisitions).length === 0 ? (
          <div className="py-20 text-center bg-white rounded-2xl border border-pink-100">
            <p className="text-pink-300 font-bold text-base">ไม่พบใบเบิกในเงื่อนไขที่เลือก</p>
          </div>
        ) : (
          <>
            <div className="bg-white rounded-2xl shadow-sm shadow-pink-100/50 border border-pink-100 overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="bg-pink-50/80 border-b border-pink-100 text-xs font-black text-pink-400 uppercase tracking-wider">
                      <th className="px-4 py-3 w-20">เวลา</th>
                      <th className="px-4 py-3">สาขา</th>
                      <th className="px-4 py-3">ผู้เบิก</th>
                      <th className="px-4 py-3 w-36">สถานะ</th>
                      <th className="px-4 py-3 text-right w-56">จัดการ</th>
                    </tr>
                  </thead>
                  {Object.entries(groupedRequisitions).map(([date, reqs]) => (
                    <tbody key={date} className="divide-y divide-pink-50/80">
                      {/* Date separator row */}
                      <tr className="bg-linear-to-r from-pink-50 to-rose-50/50">
                        <td colSpan={5} className="px-5 py-2">
                          <div className="flex items-center gap-2">
                            <span className="text-pink-300 text-xs">🗓️</span>
                            <span className="text-pink-500 font-black text-xs uppercase tracking-wider">{date}</span>
                            <span className="ml-auto text-xs font-bold text-pink-300">{reqs.length} รายการ</span>
                          </div>
                        </td>
                      </tr>
                      {reqs.map((req) => (
                        <tr key={req.id} className="hover:bg-pink-50/40 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-slate-400 whitespace-nowrap">
                            {new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="px-4 py-3">
                            <span className="font-black text-slate-800">{req.branch_name}</span>
                          </td>
                          <td className="px-4 py-3">
                            <span className="text-sm font-semibold text-slate-500">{req.requester_name}</span>
                          </td>
                          <td className="px-4 py-3">{getStatusBadge(req.status)}</td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-2">
                              {req.status === 'approved' && (
                                <button
                                  onClick={async () => {
                                    const { data } = await supabase
                                      .from('requisition_details')
                                      .select('id, quantity, price_at_time, rejection_reason, items (name, unit, image_url)')
                                      .eq('requisition_id', req.id);
                                    if (data) handlePrint(req, data as unknown as RequisitionDetail[]);
                                  }}
                                  className="inline-flex items-center gap-1.5 bg-slate-50 text-slate-500 hover:bg-slate-100 border border-slate-200 px-3 py-2 rounded-xl text-xs font-bold transition-all active:scale-95"
                                >
                                  🖨️ พิมพ์
                                </button>
                              )}
                              {req.status === 'pending' ? (
                                <button
                                  onClick={() => handleViewDetails(req, 'review')}
                                  className="bg-linear-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-pink-300/30 active:scale-95"
                                >
                                  ตรวจสอบ →
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleViewDetails(req, 'view')}
                                  className="bg-pink-50 text-pink-400 hover:bg-pink-100 border border-pink-100 px-4 py-2 rounded-xl text-sm font-bold transition-all active:scale-95"
                                >
                                  {req.status === 'approved' ? '✅ รายละเอียด' : '❌ ดูข้อมูล'}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  ))}
                </table>
              </div>
            </div>

            {/* Pagination */}
            <div className="bg-white border border-pink-100 rounded-2xl px-5 py-4 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm shadow-pink-100/50">
              <p className="text-xs font-semibold text-slate-400 shrink-0">
                แสดง {((currentPage - 1) * PAGE_SIZE) + 1}–{Math.min(currentPage * PAGE_SIZE, totalCount)} จาก {totalCount.toLocaleString('th-TH')} รายการ
              </p>
              <div className="flex items-center gap-1.5 flex-wrap justify-center">
                <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-pink-100 bg-pink-50 text-pink-400 hover:bg-pink-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95">
                  ← ก่อนหน้า
                </button>
                {pageNumbers().map((p, idx) =>
                  p === '…' ? (
                    <span key={`ellipsis-${idx}`} className="px-2 text-slate-300 text-sm select-none">…</span>
                  ) : (
                    <button key={p} onClick={() => goToPage(p as number)}
                      className={`w-9 h-9 rounded-xl text-xs font-bold transition-all active:scale-95 ${
                        currentPage === p
                          ? 'bg-linear-to-r from-pink-500 to-rose-400 text-white shadow-sm shadow-pink-300/30'
                          : 'border border-pink-100 bg-pink-50 text-pink-400 hover:bg-pink-100'
                      }`}>{p}</button>
                  )
                )}
                <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
                  className="px-3 py-2 rounded-xl text-xs font-bold border border-pink-100 bg-pink-50 text-pink-400 hover:bg-pink-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all active:scale-95">
                  ถัดไป →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedReq && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl shadow-pink-200/50 overflow-hidden border border-pink-100">
            <div className="bg-linear-to-r from-pink-600 to-rose-500 text-white p-5 flex items-start justify-between">
              <div>
                <h3 className="font-black text-base tracking-tight">
                  {modalMode === 'review' ? '📋 ตรวจสอบใบเบิก' : '📄 รายละเอียดใบเบิก'}
                </h3>
                <p className="text-sm text-pink-200 mt-1 font-semibold">
                  {selectedReq.branch_name} · {selectedReq.requester_name}
                </p>
              </div>
              <button
                onClick={() => setSelectedReq(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white font-bold text-lg transition-all"
              >
                ×
              </button>
            </div>

            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {loadingDetails ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 bg-pink-50 p-4 rounded-xl border border-pink-100 text-sm">
                    <div>
                      <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">ผู้เบิก</p>
                      <p className="font-bold text-slate-700 mt-1">{selectedReq.requester_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">สาขา</p>
                      <p className="font-bold text-slate-700 mt-1">{selectedReq.branch_name}</p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">วันที่</p>
                      <p className="font-bold text-slate-700 mt-1">
                        {new Date(selectedReq.created_at).toLocaleDateString('th-TH', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-pink-400 uppercase tracking-wider">สถานะ</p>
                      <div className="mt-1">{getStatusBadge(selectedReq.status)}</div>
                    </div>
                  </div>

                  {/* Item-level rejection notice */}
                  {rejectedCount_detail > 0 && (
                    <div className="flex items-center gap-2 bg-rose-50 border border-rose-100 rounded-xl px-4 py-2.5">
                      <span className="text-rose-400 text-sm">⚠️</span>
                      <p className="text-xs font-bold text-rose-500">
                        มี {rejectedCount_detail} รายการที่ถูกปฏิเสธในใบเบิกนี้
                      </p>
                    </div>
                  )}

                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-pink-100 text-pink-400">
                        <th className="py-2.5 px-2 font-black">รายการ</th>
                        <th className="py-2.5 px-2 text-center font-black w-16">จำนวน</th>
                        <th className="py-2.5 px-2 text-center font-black w-16">หน่วย</th>
                        <th className="py-2.5 px-2 text-right font-black w-24">ราคา/หน่วย</th>
                        {modalMode === 'review' && (
                          <th className="py-2.5 px-2 text-center font-black w-16">จัดการ</th>
                        )}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50">
                      {details.map((d) => {
                        const isRejected = !!d.rejection_reason;
                        return (
                          <tr key={d.id} className={`transition-colors ${isRejected ? 'bg-rose-50/60' : 'hover:bg-pink-50/50'}`}>
                            <td className="py-3 px-2">
                              <p className={`font-semibold ${isRejected ? 'line-through text-slate-400' : 'text-slate-700'}`}>
                                {d.items?.name}
                              </p>
                              {isRejected && (
                                <div className="flex items-start gap-1 mt-1">
                                  <span className="text-rose-400 text-xs mt-px">⛔</span>
                                  <p className="text-xs text-rose-500 font-semibold leading-tight">
                                    {d.rejection_reason}
                                  </p>
                                </div>
                              )}
                            </td>
                            <td className={`py-3 px-2 text-center font-black ${isRejected ? 'text-slate-300 line-through' : 'text-pink-600'}`}>
                              {d.quantity}
                            </td>
                            <td className={`py-3 px-2 text-center ${isRejected ? 'text-slate-300' : 'text-slate-500'}`}>
                              {d.items?.unit}
                            </td>
                            <td className={`py-3 px-2 text-right font-bold ${isRejected ? 'text-slate-300' : 'text-slate-700'}`}>
                              {isRejected ? '—' : (d.price_at_time || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                            </td>
                            {modalMode === 'review' && (
                              <td className="py-3 px-2 text-center">
                                {isRejected ? (
                                  <button
                                    onClick={() => handleClearItemRejection(d)}
                                    title="ยกเลิกการปฏิเสธรายการนี้"
                                    className="text-xs text-slate-400 hover:text-emerald-500 font-bold transition-colors px-1.5 py-1 rounded-lg hover:bg-emerald-50"
                                  >
                                    ↩️
                                  </button>
                                ) : (
                                  <button
                                    onClick={() => openRejectItemModal(d)}
                                    title="ปฏิเสธรายการนี้"
                                    className="text-xs text-rose-400 hover:text-rose-600 font-bold transition-colors px-1.5 py-1 rounded-lg hover:bg-rose-50"
                                  >
                                    ⛔
                                  </button>
                                )}
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-pink-200 font-black text-slate-800">
                        <td colSpan={modalMode === 'review' ? 3 : 3} className="py-3 px-2 text-right text-sm">รวมเป็นเงินทั้งสิ้น</td>
                        <td className="py-3 px-2 text-right text-pink-600 text-base">
                          {details
                            .filter((d) => !d.rejection_reason)
                            .reduce((sum, d) => sum + (d.price_at_time || 0) * (d.quantity || 0), 0)
                            .toLocaleString('th-TH', { minimumFractionDigits: 2 })}{' '}
                          ฿
                        </td>
                        {modalMode === 'review' && <td />}
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            <div className="p-4 bg-pink-50/40 border-t border-pink-100 flex gap-2">
              {modalMode === 'review' ? (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'rejected')}
                    className="flex-1 border border-pink-200 text-pink-500 py-3 rounded-xl text-sm font-bold hover:bg-pink-50 transition-all active:scale-95"
                  >
                    ❌ ปฏิเสธทั้งใบ
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'approved')}
                    className="flex-1 bg-linear-to-r from-pink-500 to-rose-400 text-white py-3 rounded-xl text-sm font-bold hover:from-pink-600 hover:to-rose-500 transition-all shadow-md shadow-pink-200 active:scale-95"
                  >
                    ✅ อนุมัติ
                  </button>
                </>
              ) : selectedReq.status === 'approved' ? (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'pending')}
                    className="flex-1 bg-amber-400 text-white py-3 rounded-xl text-sm font-bold hover:bg-amber-500 transition-all active:scale-95"
                  >
                    ↩️ ยกเลิกการอนุมัติ
                  </button>
                  <button
                    onClick={() => handlePrint(selectedReq, details)}
                    className="flex-1 bg-slate-700 text-white py-3 rounded-xl text-sm font-bold hover:bg-slate-800 transition-all active:scale-95"
                  >
                    🖨️ พิมพ์ใบเบิก
                  </button>
                </>
              ) : (
                <button
                  onClick={() => setSelectedReq(null)}
                  className="w-full bg-pink-50 text-pink-400 border border-pink-100 py-3 rounded-xl text-sm font-bold hover:bg-pink-100 transition-all"
                >
                  ปิดหน้าต่าง
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Item Rejection Modal ── */}
      {rejectingDetail && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[60] flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl border border-rose-100 overflow-hidden">
            <div className="bg-linear-to-r from-rose-500 to-pink-500 text-white p-5">
              <h3 className="font-black text-base">⛔ ปฏิเสธรายการสินค้า</h3>
              <p className="text-sm text-rose-100 mt-1 font-semibold">{rejectingDetail.items?.name}</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-black text-rose-400 uppercase tracking-widest mb-2">
                  เหตุผลที่ปฏิเสธ <span className="text-rose-500">*</span>
                </label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="เช่น สินค้าหมด / ไม่มีในสต็อก / รอสั่งเพิ่ม..."
                  rows={3}
                  className="w-full px-4 py-3 border border-rose-200 rounded-xl text-sm font-medium text-slate-700 placeholder:text-slate-300 outline-none focus:ring-2 focus:ring-rose-300 focus:border-rose-400 transition-all resize-none"
                  autoFocus
                />
              </div>
              {/* Quick reason chips */}
              <div className="flex flex-wrap gap-2">
                {['สินค้าหมด', 'ไม่มีในสต็อก', 'รอสั่งเพิ่ม', 'สินค้าเลิกผลิต'].map((r) => (
                  <button
                    key={r}
                    onClick={() => setRejectReason(r)}
                    className="px-3 py-1.5 rounded-full text-xs font-bold border border-rose-100 bg-rose-50 text-rose-400 hover:bg-rose-100 transition-all"
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>
            <div className="p-4 bg-rose-50/40 border-t border-rose-100 flex gap-2">
              <button
                onClick={() => { setRejectingDetail(null); setRejectReason(''); }}
                className="flex-1 border border-rose-100 text-slate-400 py-3 rounded-xl text-sm font-bold hover:bg-slate-50 transition-all"
              >
                ยกเลิก
              </button>
              <button
                onClick={handleSaveItemRejection}
                disabled={savingReject || !rejectReason.trim()}
                className="flex-1 bg-linear-to-r from-rose-500 to-pink-500 text-white py-3 rounded-xl text-sm font-bold hover:from-rose-600 hover:to-pink-600 transition-all shadow-md shadow-rose-200 disabled:opacity-50 active:scale-95"
              >
                {savingReject ? 'กำลังบันทึก...' : '⛔ ยืนยันปฏิเสธ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}