'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

interface Item {
  id: string;
  name: string;
  unit: string;
  image_url: string | null;
}

interface CartItem extends Item {
  quantity: number;
}

interface CartFormContentProps {
  branchName: string;
  setBranchName: (val: string) => void;
  branches: { name: string }[];
  requesterName: string;
  setRequesterName: (val: string) => void;
  handlePreSubmitCheck: (e: React.FormEvent) => void;
  totalCartItems: number;
  cart: CartItem[];
  updateQuantity: (id: string, amount: number) => void;
  removeFromCart: (id: string) => void;
  loading: boolean;
  cartBounce: boolean;
}

const CartFormContent = ({
  branchName,
  setBranchName,
  branches,
  requesterName,
  setRequesterName,
  handlePreSubmitCheck,
  totalCartItems,
  cart,
  updateQuantity,
  removeFromCart,
  loading,
  cartBounce,
}: CartFormContentProps) => (
  <form onSubmit={handlePreSubmitCheck} className="h-full flex flex-col gap-5">
    <div className="space-y-4 overflow-y-auto flex-1 pr-1">
      {/* สาขา */}
      <div>
        <label className="block text-xs font-black text-pink-500 uppercase tracking-widest mb-1.5">สาขาที่ขอเบิก</label>
        <div className="relative">
          <select
            value={branchName}
            onChange={(e) => setBranchName(e.target.value)}
            className="block w-full p-3 pl-4 pr-10 bg-pink-50/30 border border-pink-100 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-400/10 rounded-xl text-sm font-semibold text-slate-700 outline-none transition-all appearance-none cursor-pointer"
          >
            <option value="">— เลือกสาขาต้นทาง —</option>
            {branches.map((b) => (
              <option key={b.name} value={b.name}>{b.name}</option>
            ))}
          </select>
          <span className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-pink-400 text-xs">▼</span>
        </div>
      </div>

      {/* ชื่อผู้เบิก */}
      <div>
        <label className="block text-xs font-black text-pink-500 uppercase tracking-widest mb-1.5">ชื่อผู้เบิกสินค้า</label>
        <input
          type="text"
          value={requesterName}
          onChange={(e) => setRequesterName(e.target.value)}
          placeholder="ชื่อ - นามสกุล ผู้เบิก"
          className="block w-full p-3 px-4 bg-pink-50/30 border border-pink-100 focus:border-pink-400 focus:bg-white focus:ring-4 focus:ring-pink-400/10 rounded-xl text-sm font-semibold text-slate-700 placeholder:text-slate-400 outline-none transition-all"
        />
      </div>

      <div className="border-t border-dashed border-pink-100" />

      {/* หัวรายการ */}
      <div className="flex items-center justify-between">
        <h4 className="font-black text-xs uppercase tracking-widest text-slate-400">รายการที่เลือกเบิก</h4>
        <span className={`px-3 py-1 rounded-full text-xs font-black border transition-all duration-300 ${
          cartBounce ? 'scale-110 bg-rose-500 border-rose-500 text-white' : 'bg-pink-50 border-pink-100 text-pink-600'
        }`}>
          {totalCartItems} ชิ้น
        </span>
      </div>

      {/* รายการ */}
      <div className="space-y-2.5 max-h-72 overflow-y-auto pr-1">
        {cart.length === 0 ? (
          <div className="text-center py-10 bg-pink-50/20 rounded-xl border border-dashed border-pink-200/50 flex flex-col items-center justify-center gap-2">
            <span className="text-2xl opacity-30">🛒</span>
            <p className="text-slate-400 text-sm font-semibold">ยังไม่มีสินค้าในตะกร้า</p>
          </div>
        ) : (
          cart.map((item) => (
            <div key={item.id} className="flex items-center justify-between bg-white p-2.5 border border-slate-100 rounded-xl shadow-sm hover:border-pink-100 transition-all">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-10 bg-pink-50/40 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden border border-pink-50">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-base">📦</span>
                  )}
                </div>
                <div className="truncate pr-2">
                  <p className="font-bold text-slate-800 truncate text-sm">{item.name}</p>
                  <p className="text-xs text-pink-400 font-bold mt-0.5">{item.unit}</p>
                </div>
              </div>

              {/* ±quantity */}
              <div className="flex items-center bg-slate-50 border border-slate-200/60 rounded-lg p-0.5 mr-2 flex-shrink-0">
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, -1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-pink-600 hover:bg-white rounded-md text-sm font-black active:scale-90 transition-all"
                >
                  −
                </button>
                <span className="w-9 text-center font-black text-sm text-slate-700">{item.quantity}</span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.id, 1)}
                  className="w-7 h-7 flex items-center justify-center text-slate-500 hover:text-pink-600 hover:bg-white rounded-md text-sm font-black active:scale-90 transition-all"
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={() => removeFromCart(item.id)}
                className="text-slate-400 hover:text-rose-500 px-2 py-1.5 text-xs font-bold hover:bg-rose-50 rounded-lg transition-colors flex-shrink-0"
              >
                ลบ
              </button>
            </div>
          ))
        )}
      </div>
    </div>

    {/* Submit */}
    <div className="pt-2">
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-gradient-to-r from-pink-500 to-rose-500 text-white py-4 rounded-xl font-bold hover:from-pink-600 hover:to-rose-600 disabled:from-slate-300 disabled:to-slate-400 shadow-md shadow-pink-500/20 active:scale-[0.99] transition-all text-sm tracking-wide flex items-center justify-center gap-2"
      >
        {loading ? (
          <><div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" /><span>กำลังประมวลผล...</span></>
        ) : (
          <><span>📝</span><span>ตรวจสอบและส่งใบเบิก ({cart.length} รายการ)</span></>
        )}
      </button>
    </div>
  </form>
);

export default function RequisitionPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [branches, setBranches] = useState<{ name: string }[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [requesterName, setRequesterName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [cartBounce, setCartBounce] = useState(false);
  const [clickedItemId, setClickedItemId] = useState<string | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: itemsData }, { data: branchesData }] = await Promise.all([
        supabase.from('items').select('id, name, unit, image_url').eq('is_active', true).order('name'),
        supabase.from('branches').select('name').order('name'),
      ]);
      if (itemsData) setItems(itemsData);
      if (branchesData) setBranches(branchesData);
    }
    fetchData();
  }, []);

  const filteredItems = items.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addToCart = (item: Item) => {
    setClickedItemId(item.id);
    setCartBounce(true);
    setTimeout(() => setClickedItemId(null), 800);
    setTimeout(() => setCartBounce(false), 300);

    setCart((prev) => {
      const idx = prev.findIndex((c) => c.id === item.id);
      if (idx > -1) {
        const next = [...prev];
        next[idx] = { ...next[idx], quantity: next[idx].quantity + 1 };
        return next;
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, amount: number) => {
    setCart((prev) =>
      prev.map((item) =>
        item.id === id ? { ...item, quantity: Math.max(1, item.quantity + amount) } : item
      )
    );
  };

  const removeFromCart = (id: string) => setCart((prev) => prev.filter((item) => item.id !== id));

  const totalCartItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  const handlePreSubmitCheck = (e: React.FormEvent) => {
    e.preventDefault();
    if (!branchName.trim()) { alert('กรุณาเลือกสาขา'); return; }
    if (!requesterName.trim()) { alert('กรุณากรอกชื่อผู้เบิก'); return; }
    if (cart.length === 0) { alert('กรุณาเลือกสินค้าอย่างน้อย 1 รายการ'); return; }
    setIsCartOpen(false);
    setShowConfirmModal(true);
  };

  const handleConfirmSubmit = async () => {
    setShowConfirmModal(false);
    setLoading(true);

    const { data: reqData, error: reqError } = await supabase
      .from('requisitions')
      .insert([{ branch_name: branchName.trim(), requester_name: requesterName.trim(), status: 'pending', total_price: 0 }])
      .select('id')
      .single();

    if (reqError || !reqData) {
      alert(`เกิดข้อผิดพลาด: ${reqError?.message || 'ไม่สามารถสร้างใบเบิกได้'}`);
      setLoading(false);
      return;
    }

    const { data: dbItems } = await supabase.from('items').select('id, price');
    const detailRows = cart.map((item) => ({
      requisition_id: reqData.id,
      item_id: item.id,
      quantity: item.quantity,
      price_at_time: dbItems?.find((d) => d.id === item.id)?.price || 0,
    }));

    const { error: detailError } = await supabase.from('requisition_details').insert(detailRows);
    setLoading(false);

    if (detailError) {
      alert('เกิดข้อผิดพลาดในการบันทึกรายการ: ' + detailError.message);
    } else {
      alert('ส่งคำขอเบิกสินค้าเรียบร้อยแล้ว!');
      setCart([]);
      setSearchTerm('');
      setRequesterName('');
      setBranchName('');
    }
  };

  return (
    <div className="min-h-screen bg-pink-50/20 py-6 sm:py-8 px-3 sm:px-6 lg:px-8 text-slate-800 relative pb-24 lg:pb-10">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Header ── */}
        <div className="bg-white border border-pink-100 rounded-2xl p-5 sm:p-6 shadow-sm flex flex-col sm:flex-row items-center justify-between gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-pink-100/30 rounded-full blur-2xl pointer-events-none" />
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-pink-100 flex items-center justify-center shadow-md shadow-pink-500/10 overflow-hidden border border-pink-200">
              <img src="/logo.png" alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-800">ใบเบิกของ Aemori</h1>
              <p className="text-xs font-bold text-pink-400 mt-0.5 uppercase tracking-wider">ระบบจัดการคำขอเบิกวัสดุอุปกรณ์</p>
            </div>
          </div>
          <div className="bg-pink-50/50 border border-pink-100/60 rounded-xl px-4 py-2.5 text-center flex-shrink-0">
            <span className="block text-xs font-black text-pink-400 uppercase tracking-widest">Document Type</span>
            <span className="text-sm font-black text-slate-700">ฟอร์มดิจิทัล (Requisition)</span>
          </div>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">

          {/* ── Left: items ── */}
          <div className="flex-1 w-full min-w-0">
            {/* Search */}
            <div className="relative mb-5 group">
              <span className="absolute inset-y-0 left-0 flex items-center pl-4 pointer-events-none text-slate-400 group-focus-within:text-pink-500 transition-colors">🔍</span>
              <input
                type="text"
                placeholder="ค้นหาสินค้า เช่น กระดาษ A4, ปากกา..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-11 pr-4 py-3.5 bg-white border border-slate-200 focus:border-pink-400 rounded-2xl outline-none focus:ring-4 focus:ring-pink-400/10 transition-all text-sm font-semibold text-slate-700 placeholder:text-slate-400 shadow-sm"
              />
            </div>

            {/* Items grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredItems.length === 0 ? (
                <div className="col-span-full text-center py-16 bg-white rounded-2xl border border-slate-100 shadow-sm">
                  <span className="text-4xl block mb-2 opacity-50">📂</span>
                  <p className="text-slate-400 text-sm font-bold">
                    {searchTerm ? `ไม่พบสินค้า "${searchTerm}"` : 'ยังไม่มีสินค้าในระบบ'}
                  </p>
                </div>
              ) : (
                filteredItems.map((item) => {
                  const isClicked = clickedItemId === item.id;
                  const inCart = cart.find((c) => c.id === item.id);
                  return (
                    <div
                      key={item.id}
                      className={`p-4 border rounded-2xl flex items-center justify-between gap-4 bg-white hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group ${
                        isClicked ? 'border-rose-400 ring-4 ring-rose-400/5 bg-rose-50/10' : 'border-slate-100 hover:border-pink-100'
                      }`}
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-xl flex-shrink-0 flex items-center justify-center overflow-hidden shadow-inner relative">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                          ) : (
                            <span className="text-2xl opacity-50">📦</span>
                          )}
                          {inCart && (
                            <div className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-pink-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-white shadow">
                              {inCart.quantity}
                            </div>
                          )}
                        </div>
                        <div className="min-w-0">
                          <h4 className="font-bold text-slate-800 group-hover:text-pink-500 transition-colors truncate text-sm leading-tight">{item.name}</h4>
                          <span className="inline-block text-xs font-bold text-pink-400 mt-1 bg-pink-50/60 px-2 py-0.5 rounded-lg">
                            หน่วย: {item.unit || 'ชิ้น'}
                          </span>
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => addToCart(item)}
                        className={`px-4 py-2.5 rounded-xl font-bold text-sm active:scale-95 transition-all flex-shrink-0 shadow-sm border ${
                          isClicked
                            ? 'bg-rose-500 border-rose-500 text-white'
                            : 'bg-pink-50 border-pink-100/40 text-pink-600 hover:bg-pink-500 hover:text-white hover:border-pink-500'
                        }`}
                      >
                        {isClicked ? '✓' : '+ เพิ่ม'}
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ── Right: Desktop cart ── */}
          <div className="hidden lg:block lg:w-96 flex-shrink-0">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-100 lg:sticky lg:top-6">
              <h3 className="font-black text-base text-slate-800 border-b border-slate-100 pb-4 flex items-center gap-2 mb-5">
                <span className="text-pink-500 text-lg">📋</span> สรุปใบเบิกสินค้า
              </h3>
              <CartFormContent
                branchName={branchName} setBranchName={setBranchName}
                branches={branches}
                requesterName={requesterName} setRequesterName={setRequesterName}
                handlePreSubmitCheck={handlePreSubmitCheck}
                totalCartItems={totalCartItems}
                cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart}
                loading={loading} cartBounce={cartBounce}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ── Mobile floating bar ── */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white border-t border-pink-100 px-4 py-3 z-40 flex items-center justify-between shadow-[0_-6px_20px_rgba(244,63,94,0.06)]">
        <div className="flex items-center gap-3">
          <span className={`text-2xl relative transition-transform duration-300 ${cartBounce ? 'scale-125' : 'scale-100'}`}>
            🛒
            {totalCartItems > 0 && (
              <span className={`absolute -top-1.5 -right-2 text-white w-5 h-5 rounded-full text-[10px] font-black flex items-center justify-center border-2 border-white shadow-sm transition-all ${cartBounce ? 'bg-rose-500 scale-110' : 'bg-pink-500'}`}>
                {totalCartItems}
              </span>
            )}
          </span>
          <span className="text-sm font-bold text-slate-700">
            {totalCartItems > 0 ? `${totalCartItems} รายการ` : 'ยังไม่มีสินค้า'}
          </span>
        </div>
        <button
          type="button"
          onClick={() => setIsCartOpen(true)}
          className="bg-gradient-to-r from-pink-500 to-rose-500 text-white px-5 py-3 rounded-xl text-sm font-bold shadow-md shadow-pink-500/20 active:scale-95 transition-all"
        >
          ดูใบเบิก
        </button>
      </div>

      {/* ── Mobile drawer backdrop ── */}
      <div
        className={`lg:hidden fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity duration-300 ${isCartOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        onClick={() => setIsCartOpen(false)}
      />

      {/* ── Mobile drawer ── */}
      <div className={`lg:hidden fixed inset-y-0 right-0 w-full sm:w-[420px] bg-white z-50 shadow-2xl flex flex-col transition-transform duration-300 ease-out ${isCartOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b border-pink-50 flex items-center justify-between bg-pink-50/20">
          <h3 className="font-bold text-base text-slate-800 flex items-center gap-2">
            <span className="text-pink-500">📋</span> สรุปใบเบิกสินค้า
          </h3>
          <button
            type="button"
            onClick={() => setIsCartOpen(false)}
            className="text-slate-400 hover:text-slate-700 text-2xl font-light w-9 h-9 flex items-center justify-center rounded-xl hover:bg-slate-100 transition-colors"
          >
            ×
          </button>
        </div>
        <div className="flex-1 overflow-hidden p-4">
          <CartFormContent
            branchName={branchName} setBranchName={setBranchName}
            branches={branches}
            requesterName={requesterName} setRequesterName={setRequesterName}
            handlePreSubmitCheck={handlePreSubmitCheck}
            totalCartItems={totalCartItems}
            cart={cart} updateQuantity={updateQuantity} removeFromCart={removeFromCart}
            loading={loading} cartBounce={cartBounce}
          />
        </div>
      </div>

      {/* ── Confirm Modal ── */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-slate-100 overflow-hidden">
            <div className="bg-gradient-to-r from-pink-600 to-rose-600 text-white p-5 flex items-center gap-3">
              <span className="text-xl">📋</span>
              <div>
                <h3 className="font-black text-base">ตรวจสอบรายละเอียดใบเบิก</h3>
                <p className="text-xs text-pink-100 mt-0.5 font-medium">กรุณาตรวจสอบความถูกต้องก่อนส่ง</p>
              </div>
            </div>

            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4 bg-pink-50/40 p-4 rounded-xl border border-pink-50">
                <div>
                  <span className="block text-xs font-black text-pink-400 uppercase tracking-wider">สาขา</span>
                  <span className="font-black text-slate-800 text-base mt-1 block">{branchName}</span>
                </div>
                <div>
                  <span className="block text-xs font-black text-pink-400 uppercase tracking-wider">ผู้เบิก</span>
                  <span className="font-black text-slate-800 text-base mt-1 block">{requesterName}</span>
                </div>
              </div>

              <div>
                <span className="block text-xs font-black text-slate-400 uppercase tracking-wider mb-2">
                  รายการสินค้า ({totalCartItems} ชิ้น)
                </span>
                <div className="border border-slate-100 rounded-xl overflow-hidden divide-y divide-slate-100 max-h-60 overflow-y-auto shadow-sm">
                  {cart.map((item) => (
                    <div key={item.id} className="p-3 flex items-center justify-between bg-white hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="w-9 h-9 bg-slate-50 rounded-lg overflow-hidden border border-slate-200/60 flex-shrink-0 flex items-center justify-center">
                          {item.image_url ? (
                            <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-xs">📦</span>
                          )}
                        </div>
                        <span className="font-bold text-slate-700 truncate text-sm">{item.name}</span>
                      </div>
                      <span className="font-black text-pink-600 bg-pink-50 border border-pink-100/50 px-3 py-1 rounded-lg text-sm ml-3 flex-shrink-0">
                        {item.quantity} {item.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setShowConfirmModal(false); setIsCartOpen(true); }}
                className="w-full bg-white text-slate-600 border border-slate-200 py-3 rounded-xl font-bold hover:bg-slate-100 active:scale-[0.98] transition-all text-sm"
              >
                ← แก้ไข
              </button>
              <button
                type="button"
                onClick={handleConfirmSubmit}
                className="w-full bg-pink-600 text-white py-3 rounded-xl font-bold hover:bg-pink-700 shadow-md active:scale-[0.98] transition-all text-sm"
              >
                ยืนยันส่งใบเบิก ✓
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}