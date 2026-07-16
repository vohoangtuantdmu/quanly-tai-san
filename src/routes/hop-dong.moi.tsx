import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { ArrowLeft, Check, Sparkles } from "lucide-react";
import type { ContractDirection, PaymentCycle, TaxResponsibility, LeaseContract } from "@/lib/types";

const searchSchema = z.object({ assetId: z.string().optional() });

export const Route = createFileRoute("/hop-dong/moi")({
  head: () => ({ meta: [{ title: "Tạo hợp đồng mới — Quản Lý Tài Sản" }] }),
  validateSearch: searchSchema,
  component: NewContract,
});

function NewContract() {
  const search = Route.useSearch();
  const navigate = useNavigate();
  const store = useStore();

  const [assetId, setAssetId] = useState(search.assetId ?? "");
  const [unitId, setUnitId] = useState<string>("");
  const [direction, setDirection] = useState<ContractDirection>("Cho thuê");
  const [counterpartyId, setCounterpartyId] = useState("");
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10));
  const [months, setMonths] = useState(12);
  const [rentAmount, setRentAmount] = useState(0);
  const [paymentCycle, setPaymentCycle] = useState<PaymentCycle>("Hàng tháng");
  const [paymentDueDay, setPaymentDueDay] = useState(5);
  const [depositAmount, setDepositAmount] = useState(0);
  const [taxResponsibility, setTaxResponsibility] = useState<TaxResponsibility>("Chủ nhà");
  const [notes, setNotes] = useState("");

  const asset = store.assets.find((a) => a.id === assetId);
  const units = store.units.filter((u) => u.assetId === assetId);

  const counterpartyType = direction === "Cho thuê" ? "Người thuê" : "Chủ nhà";
  const availableContacts = store.contacts.filter((c) => c.type === counterpartyType);

  const handleSubmit = () => {
    if (!assetId || !counterpartyId || !rentAmount) {
      toast.error("Vui lòng điền đủ thông tin: tài sản, đối tác, giá thuê.");
      return;
    }
    const end = new Date(startDate);
    end.setMonth(end.getMonth() + months);
    const contract: LeaseContract = {
      id: `k-${Date.now()}`,
      code: `HD-${new Date().getFullYear()}-${String(store.contracts.length + 1).padStart(3, "0")}`,
      assetId, unitId: unitId || undefined, direction, counterpartyId,
      startDate: new Date(startDate).toISOString(), endDate: end.toISOString(),
      rentAmount, paymentCycle, paymentDueDay, depositAmount,
      taxResponsibility, status: "Đang hiệu lực", notes,
    };
    store.addContract(contract);
    toast.success("Đã tạo hợp đồng " + contract.code, {
      description: "Đã tự động tạo 2 nhắc lịch: thu/đóng tiền định kỳ và nhắc hết hạn hợp đồng.",
      icon: <Sparkles className="h-4 w-4" />,
    });
    navigate({ to: "/hop-dong" });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/hop-dong"><ArrowLeft className="h-4 w-4 mr-1.5" />Quay lại</Link></Button>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo hợp đồng mới</h1>
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">1. Chọn tài sản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Tài sản *</Label>
            <Select value={assetId} onValueChange={(v) => { setAssetId(v); setUnitId(""); }}>
              <SelectTrigger><SelectValue placeholder="Chọn tài sản" /></SelectTrigger>
              <SelectContent>
                {store.assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          {units.length > 0 && (
            <div className="space-y-2">
              <Label>Áp dụng cho</Label>
              <RadioGroup value={unitId || "whole"} onValueChange={(v) => setUnitId(v === "whole" ? "" : v)}>
                <div className="flex items-center gap-2"><RadioGroupItem value="whole" id="whole" /><Label htmlFor="whole" className="font-normal">Toàn bộ tài sản</Label></div>
                {units.map((u) => (
                  <div key={u.id} className="flex items-center gap-2">
                    <RadioGroupItem value={u.id} id={u.id} />
                    <Label htmlFor={u.id} className="font-normal">{u.name} (tầng {u.floor}, {u.area}m² — {u.status})</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">2. Chiều hợp đồng và đối tác</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Chiều</Label>
            <RadioGroup value={direction} onValueChange={(v) => { setDirection(v as ContractDirection); setCounterpartyId(""); }} className="flex gap-4">
              <div className="flex items-center gap-2"><RadioGroupItem value="Cho thuê" id="out" /><Label htmlFor="out" className="font-normal">Cho thuê (bạn cho người khác thuê)</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="Đi thuê" id="in" /><Label htmlFor="in" className="font-normal">Đi thuê (thuê từ chủ nhà)</Label></div>
            </RadioGroup>
            {asset?.ownershipType === "Sở hữu" && direction === "Đi thuê" && (
              <p className="text-xs text-warning-foreground">⚠ Tài sản này thuộc sở hữu — thường chỉ có chiều "Cho thuê".</p>
            )}
          </div>
          <div className="space-y-2">
            <Label>{counterpartyType} *</Label>
            <Select value={counterpartyId} onValueChange={setCounterpartyId}>
              <SelectTrigger><SelectValue placeholder={`Chọn ${counterpartyType.toLowerCase()}`} /></SelectTrigger>
              <SelectContent>
                {availableContacts.map((c) => <SelectItem key={c.id} value={c.id}>{c.name} — {c.phone}</SelectItem>)}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">Không thấy? Thêm mới trong Sổ đối tác.</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="text-base">3. Điều khoản</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2"><Label>Ngày bắt đầu</Label><Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Thời hạn (tháng)</Label><Input type="number" value={months} onChange={(e) => setMonths(Number(e.target.value))} min={1} /></div>
            <div className="space-y-2"><Label>Giá thuê (VNĐ) *</Label><Input type="number" value={rentAmount || ""} onChange={(e) => setRentAmount(Number(e.target.value))} /></div>
            <div className="space-y-2">
              <Label>Chu kỳ thanh toán</Label>
              <Select value={paymentCycle} onValueChange={(v) => setPaymentCycle(v as PaymentCycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {["Hàng tháng", "Quý", "Nửa năm", "Năm"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Ngày thanh toán (trong kỳ)</Label><Input type="number" min={1} max={31} value={paymentDueDay} onChange={(e) => setPaymentDueDay(Number(e.target.value))} /></div>
            <div className="space-y-2"><Label>Tiền cọc (VNĐ)</Label><Input type="number" value={depositAmount || ""} onChange={(e) => setDepositAmount(Number(e.target.value))} /></div>
          </div>
          <div className="space-y-2">
            <Label>Bên chịu thuế</Label>
            <Select value={taxResponsibility} onValueChange={(v) => setTaxResponsibility(v as TaxResponsibility)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="Chủ nhà">Chủ nhà</SelectItem>
                <SelectItem value="Người thuê">Người thuê</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Ghi chú</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </CardContent>
      </Card>

      <div className="rounded-md border border-info/30 bg-info/5 p-4 flex gap-3">
        <Sparkles className="h-5 w-5 text-info shrink-0 mt-0.5" />
        <div className="text-sm">
          <div className="font-medium">Sau khi tạo, hệ thống sẽ tự động:</div>
          <ul className="mt-1 text-muted-foreground list-disc list-inside space-y-0.5">
            <li>Tạo nhắc lịch {direction === "Cho thuê" ? "thu tiền thuê" : "đóng tiền thuê"} theo chu kỳ đã chọn</li>
            <li>Tạo nhắc lịch báo trước 30 ngày khi hợp đồng sắp hết hạn</li>
            <li>Chuyển trạng thái {unitId ? "phòng đã chọn" : "tài sản"} sang "Đang cho thuê"</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end gap-2">
        <Button variant="outline" onClick={() => navigate({ to: "/hop-dong" })}>Huỷ</Button>
        <Button onClick={handleSubmit}><Check className="h-4 w-4 mr-1.5" />Tạo hợp đồng</Button>
      </div>
    </div>
  );
}
