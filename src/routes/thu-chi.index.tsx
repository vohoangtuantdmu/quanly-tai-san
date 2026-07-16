import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatVND, formatDate, monthKey } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import type { CashflowCategory, CashflowDirection } from "@/lib/types";

export const Route = createFileRoute("/thu-chi/")({
  head: () => ({ meta: [{ title: "Sổ thu chi & Báo cáo — Quản Lý Tài Sản" }] }),
  component: Cashflow,
});

const INCOME_CATS: CashflowCategory[] = ["Tiền thuê thu vào", "Tiền cọc nhận", "Tiền bán"];
const EXPENSE_CATS: CashflowCategory[] = ["Tiền thuê trả chủ nhà", "Tiền cọc trả", "Chi phí sửa chữa", "Hoá đơn điện", "Hoá đơn nước", "Hoá đơn internet", "Phí quản lý", "Thuế trước bạ", "Thuế phi nông nghiệp", "Thuế môn bài", "Thuế TNCN", "Thuế GTGT", "Thuế khác"];
const TAX_CATS: CashflowCategory[] = ["Thuế trước bạ", "Thuế phi nông nghiệp", "Thuế môn bài", "Thuế TNCN", "Thuế GTGT", "Thuế khác"];

const PIE_COLORS = ["var(--color-chart-1)", "var(--color-chart-2)", "var(--color-chart-3)", "var(--color-chart-4)", "var(--color-chart-5)"];

function Cashflow() {
  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Sổ thu chi & Báo cáo</h1>
        <p className="text-sm text-muted-foreground mt-1">Ghi chép giao dịch và xem báo cáo tài chính theo tài sản, thời gian.</p>
      </div>
      <Tabs defaultValue="ledger">
        <TabsList>
          <TabsTrigger value="ledger">Sổ giao dịch</TabsTrigger>
          <TabsTrigger value="income">Thu nhập theo thời gian</TabsTrigger>
          <TabsTrigger value="profit">Lợi nhuận theo tài sản</TabsTrigger>
          <TabsTrigger value="tax">Tổng thuế theo năm</TabsTrigger>
        </TabsList>
        <TabsContent value="ledger" className="mt-4"><LedgerTab /></TabsContent>
        <TabsContent value="income" className="mt-4"><IncomeTab /></TabsContent>
        <TabsContent value="profit" className="mt-4"><ProfitTab /></TabsContent>
        <TabsContent value="tax" className="mt-4"><TaxTab /></TabsContent>
      </Tabs>
    </div>
  );
}

function LedgerTab() {
  const store = useStore();
  const [fAsset, setFAsset] = useState<string>("all");
  const [fDir, setFDir] = useState<CashflowDirection | "all">("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => {
    return store.cashflow
      .filter((e) => fAsset === "all" || e.assetId === fAsset)
      .filter((e) => fDir === "all" || e.direction === fDir)
      .sort((a, b) => new Date(b.occurredAt).getTime() - new Date(a.occurredAt).getTime());
  }, [store.cashflow, fAsset, fDir]);

  const totalIn = filtered.filter((e) => e.direction === "Thu").reduce((s, e) => s + e.amount, 0);
  const totalOut = filtered.filter((e) => e.direction === "Chi").reduce((s, e) => s + e.amount, 0);

  return (
    <>
      <div className="grid grid-cols-3 gap-4 mb-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tổng thu (lọc)</div><div className="text-xl font-semibold text-success mt-1">{formatVND(totalIn)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tổng chi (lọc)</div><div className="text-xl font-semibold text-destructive mt-1">{formatVND(totalOut)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Chênh lệch</div><div className={`text-xl font-semibold mt-1 ${totalIn - totalOut >= 0 ? "text-success" : "text-destructive"}`}>{formatVND(totalIn - totalOut)}</div></CardContent></Card>
      </div>

      <Card>
        <CardContent className="p-4 flex flex-wrap gap-3 items-end justify-between">
          <div className="flex gap-3 flex-wrap">
            <div className="w-52">
              <Label className="text-xs">Tài sản</Label>
              <Select value={fAsset} onValueChange={setFAsset}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Tất cả</SelectItem>
                  {store.assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="w-40">
              <Label className="text-xs">Chiều</Label>
              <Select value={fDir} onValueChange={(v) => setFDir(v as CashflowDirection | "all")}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Cả hai</SelectItem>
                  <SelectItem value="Thu">Thu</SelectItem>
                  <SelectItem value="Chi">Chi</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Ghi thu/chi mới</Button>
        </CardContent>
      </Card>

      <Card className="mt-4">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Ngày</TableHead><TableHead>Tài sản</TableHead><TableHead>Loại</TableHead><TableHead>Mô tả</TableHead><TableHead className="text-right">Số tiền</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.slice(0, 50).map((e) => {
                const asset = store.assets.find((a) => a.id === e.assetId);
                return (
                  <TableRow key={e.id}>
                    <TableCell>{formatDate(e.occurredAt)}</TableCell>
                    <TableCell className="text-sm">{asset?.name}</TableCell>
                    <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                    <TableCell className="text-sm text-muted-foreground max-w-[280px] truncate">{e.description}</TableCell>
                    <TableCell className={`text-right font-medium ${e.direction === "Thu" ? "text-success" : "text-destructive"}`}>
                      {e.direction === "Thu" ? "+" : "−"} {formatVND(e.amount)}
                    </TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => { store.deleteCashflow(e.id); toast.success("Đã xoá"); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddCashflowDialog open={open} onOpenChange={setOpen} />
    </>
  );
}

function AddCashflowDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useStore();
  const [direction, setDirection] = useState<CashflowDirection>("Thu");
  const [assetId, setAssetId] = useState("");
  const [category, setCategory] = useState<CashflowCategory>("Tiền thuê thu vào");
  const [amount, setAmount] = useState(0);
  const [occurredAt, setOccurredAt] = useState(new Date().toISOString().slice(0, 10));
  const [description, setDescription] = useState("");

  const cats = direction === "Thu" ? INCOME_CATS : EXPENSE_CATS;

  const handleSave = () => {
    if (!assetId || !amount) { toast.error("Vui lòng chọn tài sản và nhập số tiền"); return; }
    store.addCashflow({
      id: `cf-${Date.now()}`, assetId, direction, category, amount,
      occurredAt: new Date(occurredAt).toISOString(), description,
    });
    toast.success("Đã ghi giao dịch");
    setAmount(0); setDescription("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Ghi thu/chi mới</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Chiều</Label>
              <Select value={direction} onValueChange={(v) => { setDirection(v as CashflowDirection); setCategory(v === "Thu" ? INCOME_CATS[0] : EXPENSE_CATS[0]); }}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="Thu">Thu</SelectItem><SelectItem value="Chi">Chi</SelectItem></SelectContent>
              </Select>
            </div>
            <div className="space-y-2"><Label>Ngày</Label><Input type="date" value={occurredAt} onChange={(e) => setOccurredAt(e.target.value)} /></div>
          </div>
          <div className="space-y-2">
            <Label>Tài sản</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue placeholder="Chọn tài sản" /></SelectTrigger>
              <SelectContent>{store.assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Loại</Label>
            <Select value={category} onValueChange={(v) => setCategory(v as CashflowCategory)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{cats.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="space-y-2"><Label>Số tiền (VNĐ)</Label><Input type="number" value={amount || ""} onChange={(e) => setAmount(Number(e.target.value))} /></div>
          <div className="space-y-2"><Label>Mô tả</Label><Textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)} /></div>
          <div className="text-xs text-muted-foreground">Có thể đính kèm biên lai (prototype: bỏ qua bước upload).</div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleSave}>Ghi nhận</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function IncomeTab() {
  const store = useStore();
  const now = new Date();
  const [from, setFrom] = useState(new Date(now.getFullYear(), now.getMonth() - 5, 1).toISOString().slice(0, 10));
  const [to, setTo] = useState(new Date().toISOString().slice(0, 10));

  const data = useMemo(() => {
    const start = new Date(from), end = new Date(to);
    const map: Record<string, { month: string; thu: number; chi: number }> = {};
    const cursor = new Date(start.getFullYear(), start.getMonth(), 1);
    while (cursor <= end) {
      const k = monthKey(cursor);
      map[k] = { month: `${String(cursor.getMonth() + 1).padStart(2, "0")}/${cursor.getFullYear()}`, thu: 0, chi: 0 };
      cursor.setMonth(cursor.getMonth() + 1);
    }
    store.cashflow.forEach((e) => {
      const d = new Date(e.occurredAt);
      if (d >= start && d <= end) {
        const k = monthKey(d);
        if (map[k]) {
          if (e.direction === "Thu") map[k].thu += e.amount;
          else map[k].chi += e.amount;
        }
      }
    });
    return Object.values(map);
  }, [store.cashflow, from, to]);

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4 flex gap-3 flex-wrap">
          <div><Label className="text-xs">Từ ngày</Label><Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="mt-1 w-44" /></div>
          <div><Label className="text-xs">Đến ngày</Label><Input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="mt-1 w-44" /></div>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Thu / Chi theo tháng</CardTitle></CardHeader>
        <CardContent>
          <div className="h-80">
            <ResponsiveContainer>
              <BarChart data={data}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" fontSize={12} stroke="var(--color-muted-foreground)" />
                <YAxis fontSize={12} stroke="var(--color-muted-foreground)" tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                <Tooltip formatter={(v: number) => formatVND(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="thu" name="Thu" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chi" name="Chi" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </>
  );
}

function ProfitTab() {
  const store = useStore();
  const [assetId, setAssetId] = useState(store.assets[0]?.id ?? "");

  const entries = store.cashflow.filter((e) => e.assetId === assetId);
  const totalIn = entries.filter((e) => e.direction === "Thu").reduce((s, e) => s + e.amount, 0);
  const totalOut = entries.filter((e) => e.direction === "Chi").reduce((s, e) => s + e.amount, 0);

  const breakdown = useMemo(() => {
    const map: Record<string, number> = {};
    entries.filter((e) => e.direction === "Chi").forEach((e) => {
      map[e.category] = (map[e.category] ?? 0) + e.amount;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [entries]);

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <Label className="text-xs">Chọn tài sản</Label>
          <Select value={assetId} onValueChange={setAssetId}>
            <SelectTrigger className="mt-1 max-w-md"><SelectValue /></SelectTrigger>
            <SelectContent>{store.assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tổng thu</div><div className="text-2xl font-semibold text-success mt-1">{formatVND(totalIn)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tổng chi</div><div className="text-2xl font-semibold text-destructive mt-1">{formatVND(totalOut)}</div></CardContent></Card>
        <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Lợi nhuận</div><div className={`text-2xl font-semibold mt-1 ${totalIn - totalOut >= 0 ? "text-success" : "text-destructive"}`}>{formatVND(totalIn - totalOut)}</div></CardContent></Card>
      </div>
      <Card className="mt-4">
        <CardHeader><CardTitle className="text-base">Cơ cấu chi phí</CardTitle></CardHeader>
        <CardContent>
          {breakdown.length === 0 ? <div className="text-center py-8 text-muted-foreground text-sm">Chưa có chi phí nào.</div> : (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={breakdown} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={100} label={(entry) => `${(entry as { name?: string }).name}`}>
                    {breakdown.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => formatVND(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}

function TaxTab() {
  const store = useStore();
  const [year, setYear] = useState(new Date().getFullYear());
  const yearEntries = store.cashflow.filter((e) => new Date(e.occurredAt).getFullYear() === year && TAX_CATS.includes(e.category));

  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};
    yearEntries.forEach((e) => { map[e.category] = (map[e.category] ?? 0) + e.amount; });
    return TAX_CATS.map((c) => ({ category: c, amount: map[c] ?? 0 })).filter((r) => r.amount > 0);
  }, [yearEntries]);

  const total = byCategory.reduce((s, r) => s + r.amount, 0);
  const years = Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i);

  return (
    <>
      <Card className="mb-4">
        <CardContent className="p-4">
          <Label className="text-xs">Năm</Label>
          <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
            <SelectTrigger className="mt-1 w-32"><SelectValue /></SelectTrigger>
            <SelectContent>{years.map((y) => <SelectItem key={y} value={String(y)}>{y}</SelectItem>)}</SelectContent>
          </Select>
        </CardContent>
      </Card>
      <Card>
        <CardHeader><CardTitle className="text-base">Chi tiết thuế năm {year}</CardTitle></CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader><TableRow><TableHead>Loại thuế</TableHead><TableHead className="text-right">Số tiền</TableHead></TableRow></TableHeader>
            <TableBody>
              {byCategory.length === 0 && <TableRow><TableCell colSpan={2} className="text-center py-8 text-muted-foreground text-sm">Không có khoản thuế nào trong năm {year}.</TableCell></TableRow>}
              {byCategory.map((r) => (
                <TableRow key={r.category}><TableCell>{r.category}</TableCell><TableCell className="text-right font-medium">{formatVND(r.amount)}</TableCell></TableRow>
              ))}
              {byCategory.length > 0 && (
                <TableRow className="bg-muted/40 font-semibold"><TableCell>Tổng cộng</TableCell><TableCell className="text-right">{formatVND(total)}</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  );
}
