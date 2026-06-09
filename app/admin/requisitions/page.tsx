'use client';

import { useEffect, useState } from 'react';
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
  items: {
    name: string;
    unit: string;
    image_url: string | null;
  } | null;
}

export default function AdminRequisitionsPage() {
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedReq, setSelectedReq] = useState<Requisition | null>(null);
  const [details, setDetails] = useState<RequisitionDetail[]>([]);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [modalMode, setModalMode] = useState<'review' | 'view'>('review');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  async function fetchRequisitions() {
    setLoading(true);
    const { data, error } = await supabase
      .from('requisitions')
      .select('id, created_at, branch_name, requester_name, status')
      .order('created_at', { ascending: false });
    if (data) setRequisitions(data);
    if (error) console.error('Error fetching requisitions:', error);
    setLoading(false);
  }

  useEffect(() => {
    fetchRequisitions();
  }, []);

  const filteredRequisitions = requisitions.filter((req) => {
    const matchesStatus = filterStatus === 'all' || req.status === filterStatus;
    const matchesSearch =
      !searchTerm ||
      req.branch_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      req.requester_name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const groupedRequisitions = filteredRequisitions.reduce((groups, req) => {
    const date = new Date(req.created_at).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
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
      .select('id, quantity, price_at_time, items (name, unit, image_url)')
      .eq('requisition_id', req.id);
    if (data) setDetails(data as unknown as RequisitionDetail[]);
    if (error) console.error(error);
    setLoadingDetails(false);
  };

  const handleUpdateStatus = async (id: string, newStatus: 'pending' | 'approved' | 'rejected') => {
    const label = newStatus === 'approved' ? 'อนุมัติ' : newStatus === 'rejected' ? 'ปฏิเสธ' : 'ยกเลิกการอนุมัติ';
    if (!window.confirm(`ยืนยันการ "${label}" ใบเบิกนี้?`)) return;
    const { error } = await supabase.from('requisitions').update({ status: newStatus }).eq('id', id);
    if (error) {
      alert(`เกิดข้อผิดพลาด: ${error.message}`);
    } else {
      setSelectedReq(null);
      fetchRequisitions();
    }
  };

  const pendingCount  = requisitions.filter((r) => r.status === 'pending').length;
  const approvedCount = requisitions.filter((r) => r.status === 'approved').length;
  const rejectedCount = requisitions.filter((r) => r.status === 'rejected').length;

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

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-white to-rose-50/30 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 text-slate-800">
      <div className="max-w-6xl mx-auto space-y-5">

        {/* ── Navbar ── */}
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

        {/* ── Page Header ── */}
        <div className="bg-white p-5 rounded-2xl shadow-sm shadow-pink-100/50 border border-pink-100 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">📝 จัดการใบเบิกสินค้า</h1>
              <p className="text-xs font-semibold text-pink-400 mt-1 uppercase tracking-widest">ตรวจสอบและอนุมัติ</p>
            </div>
            <button
              onClick={fetchRequisitions}
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
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1 h-10 px-4 border border-pink-100 rounded-xl bg-pink-50/50 text-sm font-medium text-slate-700 outline-none focus:ring-2 focus:ring-pink-200 focus:border-pink-300 transition-all placeholder:text-slate-400"
            />
            <div className="flex items-center gap-1 bg-pink-50 p-1 rounded-xl border border-pink-100 flex-shrink-0">
              {(['all', 'pending', 'approved', 'rejected'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
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

        {/* ── Requisition Tables ── */}
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
          Object.entries(groupedRequisitions).map(([date, reqs]) => (
            <div key={date} className="bg-white rounded-2xl shadow-sm shadow-pink-100/50 border border-pink-100 overflow-hidden">
              <div className="px-5 py-3 bg-gradient-to-r from-pink-50 to-rose-50/50 border-b border-pink-100 flex items-center gap-2">
                <span className="text-pink-300">🗓️</span>
                <span className="text-pink-500 font-black text-sm uppercase tracking-wider">{date}</span>
                <span className="ml-auto text-xs font-bold text-pink-300">{reqs.length} รายการ</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <tbody className="divide-y divide-pink-50/80">
                    {reqs.map((req) => (
                      <tr key={req.id} className="hover:bg-pink-50/40 transition-colors group">
                        <td className="p-4 text-sm font-semibold text-slate-400 w-24">
                          {new Date(req.created_at).toLocaleTimeString('th-TH', { hour: '2-digit', minute: '2-digit' })}
                        </td>
                        <td className="p-4">
                          <span className="font-black text-slate-800">{req.branch_name}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-semibold text-slate-500">{req.requester_name}</span>
                        </td>
                        <td className="p-4">{getStatusBadge(req.status)}</td>
                        <td className="p-4 text-right">
                          {req.status === 'pending' ? (
                            <button
                              onClick={() => handleViewDetails(req, 'review')}
                              className="bg-gradient-to-r from-pink-500 to-rose-400 text-white hover:from-pink-600 hover:to-rose-500 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-sm shadow-pink-300/30 active:scale-95"
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
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))
        )}
      </div>

      {/* ── Detail Modal ── */}
      {selectedReq && (
        <div className="fixed inset-0 bg-pink-900/20 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl shadow-pink-200/50 overflow-hidden border border-pink-100">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-pink-600 to-rose-500 text-white p-5 flex items-start justify-between">
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

            {/* Modal Body */}
            <div className="p-5 max-h-[60vh] overflow-y-auto">
              {loadingDetails ? (
                <div className="flex justify-center py-10">
                  <div className="w-8 h-8 rounded-full border-4 border-pink-200 border-t-pink-400 animate-spin" />
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Info grid */}
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

                  {/* Items table */}
                  <table className="w-full text-left text-sm border-collapse">
                    <thead>
                      <tr className="border-b-2 border-pink-100 text-pink-400">
                        <th className="py-2.5 px-2 font-black">รายการ</th>
                        <th className="py-2.5 px-2 text-center font-black w-20">จำนวน</th>
                        <th className="py-2.5 px-2 text-center font-black w-20">หน่วย</th>
                        <th className="py-2.5 px-2 text-right font-black w-28">ราคา/หน่วย</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pink-50">
                      {details.map((d) => (
                        <tr key={d.id} className="text-slate-700 hover:bg-pink-50/50">
                          <td className="py-3 px-2 font-semibold">{d.items?.name}</td>
                          <td className="py-3 px-2 text-center font-black text-pink-600">{d.quantity}</td>
                          <td className="py-3 px-2 text-center text-slate-500">{d.items?.unit}</td>
                          <td className="py-3 px-2 text-right font-bold text-slate-700">
                            {(d.price_at_time || 0).toLocaleString('th-TH', { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="border-t-2 border-pink-200 font-black text-slate-800">
                        <td colSpan={3} className="py-3 px-2 text-right text-sm">รวมเป็นเงินทั้งสิ้น</td>
                        <td className="py-3 px-2 text-right text-pink-600 text-base">
                          {details
                            .reduce((sum, d) => sum + (d.price_at_time || 0) * (d.quantity || 0), 0)
                            .toLocaleString('th-TH', { minimumFractionDigits: 2 })}{' '}
                          ฿
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-pink-50/40 border-t border-pink-100 flex gap-2">
              {modalMode === 'review' ? (
                <>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'rejected')}
                    className="flex-1 border border-pink-200 text-pink-500 py-3 rounded-xl text-sm font-bold hover:bg-pink-50 transition-all active:scale-95"
                  >
                    ❌ ปฏิเสธ
                  </button>
                  <button
                    onClick={() => handleUpdateStatus(selectedReq.id, 'approved')}
                    className="flex-1 bg-gradient-to-r from-pink-500 to-rose-400 text-white py-3 rounded-xl text-sm font-bold hover:from-pink-600 hover:to-rose-500 transition-all shadow-md shadow-pink-200 active:scale-95"
                  >
                    ✅ อนุมัติ
                  </button>
                </>
              ) : selectedReq.status === 'approved' ? (
                <button
                  onClick={() => handleUpdateStatus(selectedReq.id, 'pending')}
                  className="w-full bg-amber-400 text-white py-3 rounded-xl text-sm font-bold hover:bg-amber-500 transition-all active:scale-95"
                >
                  ↩️ ยกเลิกการอนุมัติ
                </button>
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
    </div>
  );
}