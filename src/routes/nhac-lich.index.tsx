import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatDate, daysUntil } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Trash2, Bell, Calendar as CalIcon } from "lucide-react";
import { toast } from "sonner";
import type { ReminderType, ReminderCycle } from "@/lib/types";

export const Route = createFileRoute("/nhac-lich/")({
  head: () => ({ meta: [{ title: "Nhắc lịch — Quản Lý Tài Sản" }] }),
  component: Reminders,
});

const typeIcon: Record<ReminderType, string> = {
  "Thu tiền thuê": "bg-success/15 text-success border-success/30",
  "Đóng tiền thuê": "bg-destructive/15 text-destructive border-destructive/30",
  "Bảo dưỡng": "bg-info/15 text-info border-info/30",
  "Hết hạn hợp đồng": "bg-warning/20 text-warning-foreground border-warning/40",
  "Đóng thuế": "bg-primary/10 text-primary border-primary/30",
  "Thanh toán hoá đơn": "bg-secondary text-secondary-foreground border-border",
};

function Reminders() {
  const store = useStore();
  const [fType, setFType] = useState<ReminderType | "all">("all");
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() =>
    store.reminders.filter((r) => fType === "all" || r.type === fType)
      .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime()),
    [store.reminders, fType]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Nhắc lịch</h1>
          <p className="text-sm text-muted-foreground mt-1">Danh sách nhắc nhở cho thu chi, bảo dưỡng, thuế, hợp đồng.</p>
        </div>
        <Button onClick={() => setOpen(true)}><Plus className="h-4 w-4 mr-1.5" />Tạo nhắc lịch</Button>
      </div>

      <Card>
        <CardContent className="p-4 max-w-md">
          <Label className="text-xs">Lọc theo loại</Label>
          <Select value={fType} onValueChange={(v) => setFType(v as ReminderType | "all")}>
            <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả</SelectItem>
              {Object.keys(typeIcon).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow><TableHead>Tiêu đề</TableHead><TableHead>Loại</TableHead><TableHead>Tài sản</TableHead><TableHead>Đến hạn</TableHead><TableHead>Lặp lại</TableHead><TableHead>Bật</TableHead><TableHead></TableHead></TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((r) => {
                const asset = r.assetId ? store.assets.find((a) => a.id === r.assetId) : null;
                const days = daysUntil(r.dueDate);
                return (
                  <TableRow key={r.id} className={!r.enabled ? "opacity-60" : ""}>
                    <TableCell>
                      <div className="font-medium flex items-center gap-2"><Bell className="h-3.5 w-3.5 text-primary" />{r.title}</div>
                      <div className="text-xs text-muted-foreground mt-0.5">Báo trước {r.daysBefore} ngày</div>
                    </TableCell>
                    <TableCell><Badge variant="outline" className={typeIcon[r.type]}>{r.type}</Badge></TableCell>
                    <TableCell className="text-sm">{asset?.name ?? <span className="text-muted-foreground">—</span>}</TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1.5 text-sm"><CalIcon className="h-3.5 w-3.5 text-muted-foreground" />{formatDate(r.dueDate)}</div>
                      <div className={`text-xs mt-0.5 ${days < 0 ? "text-destructive" : days <= 7 ? "text-warning-foreground" : "text-muted-foreground"}`}>
                        {days < 0 ? `Đã quá ${Math.abs(days)} ngày` : days === 0 ? "Hôm nay" : `Còn ${days} ngày`}
                      </div>
                    </TableCell>
                    <TableCell><Badge variant="outline">{r.cycle}</Badge></TableCell>
                    <TableCell><Switch checked={r.enabled} onCheckedChange={(v) => store.updateReminder(r.id, { enabled: v })} /></TableCell>
                    <TableCell><Button size="icon" variant="ghost" onClick={() => { store.deleteReminder(r.id); toast.success("Đã xoá"); }}><Trash2 className="h-4 w-4" /></Button></TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <AddReminderDialog open={open} onOpenChange={setOpen} />
    </div>
  );
}

function AddReminderDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const store = useStore();
  const [title, setTitle] = useState("");
  const [type, setType] = useState<ReminderType>("Bảo dưỡng");
  const [assetId, setAssetId] = useState<string>("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));
  const [cycle, setCycle] = useState<ReminderCycle>("Không lặp");
  const [daysBefore, setDaysBefore] = useState(3);

  const handleSave = () => {
    if (!title.trim()) { toast.error("Vui lòng nhập tiêu đề"); return; }
    store.addReminder({
      id: `r-${Date.now()}`, title, type,
      assetId: assetId || undefined,
      dueDate: new Date(dueDate).toISOString(),
      cycle, daysBefore, enabled: true,
    });
    toast.success("Đã tạo nhắc lịch");
    setTitle("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>Tạo nhắc lịch mới</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Tiêu đề *</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="VD: Bảo dưỡng máy lạnh 6 tháng" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Loại</Label>
              <Select value={type} onValueChange={(v) => setType(v as ReminderType)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{Object.keys(typeIcon).map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Chu kỳ lặp</Label>
              <Select value={cycle} onValueChange={(v) => setCycle(v as ReminderCycle)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{["Không lặp", "Tháng", "Quý", "Nửa năm", "Năm"].map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label>Tài sản (tuỳ chọn)</Label>
            <Select value={assetId} onValueChange={setAssetId}>
              <SelectTrigger><SelectValue placeholder="Không gắn tài sản" /></SelectTrigger>
              <SelectContent>{store.assets.map((a) => <SelectItem key={a.id} value={a.id}>{a.name}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>Đến hạn</Label><Input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} /></div>
            <div className="space-y-2"><Label>Báo trước (ngày)</Label><Input type="number" value={daysBefore} onChange={(e) => setDaysBefore(Number(e.target.value))} /></div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleSave}>Tạo</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
