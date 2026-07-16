import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Phone, Mail, Pencil, Trash2 } from "lucide-react";
import type { ContactParty, ContactType } from "@/lib/types";
import { toast } from "sonner";

export const Route = createFileRoute("/doi-tac/")({
  head: () => ({ meta: [{ title: "Sổ đối tác — Quản Lý Tài Sản" }] }),
  component: Contacts,
});

const typeTone: Record<ContactType, string> = {
  "Người thuê": "bg-info/15 text-info border-info/30",
  "Chủ nhà": "bg-success/15 text-success border-success/30",
  "Môi giới": "bg-warning/20 text-warning-foreground border-warning/40",
  "Nhà thầu": "bg-secondary text-secondary-foreground border-border",
};

function Contacts() {
  const store = useStore();
  const [q, setQ] = useState("");
  const [fType, setFType] = useState<ContactType | "all">("all");
  const [editing, setEditing] = useState<ContactParty | null>(null);
  const [open, setOpen] = useState(false);

  const filtered = useMemo(() => store.contacts.filter((c) => {
    if (fType !== "all" && c.type !== fType) return false;
    if (q && !`${c.name} ${c.phone} ${c.email ?? ""}`.toLowerCase().includes(q.toLowerCase())) return false;
    return true;
  }), [store.contacts, q, fType]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Sổ đối tác</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} liên hệ · Người thuê, chủ nhà, môi giới, nhà thầu.</p>
        </div>
        <Button onClick={() => { setEditing(null); setOpen(true); }}><Plus className="h-4 w-4 mr-1.5" />Thêm liên hệ</Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo tên, SĐT, email..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={fType} onValueChange={(v) => setFType(v as ContactType | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {["Người thuê", "Chủ nhà", "Môi giới", "Nhà thầu"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Họ tên</TableHead><TableHead>Loại</TableHead>
                <TableHead>SĐT</TableHead><TableHead>Email</TableHead><TableHead>Ghi chú</TableHead><TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((c) => (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell><Badge variant="outline" className={typeTone[c.type]}>{c.type}</Badge></TableCell>
                  <TableCell><a href={`tel:${c.phone}`} className="text-sm flex items-center gap-1.5 hover:text-primary"><Phone className="h-3 w-3" />{c.phone}</a></TableCell>
                  <TableCell className="text-sm">{c.email ? <a href={`mailto:${c.email}`} className="flex items-center gap-1.5 hover:text-primary"><Mail className="h-3 w-3" />{c.email}</a> : "—"}</TableCell>
                  <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">{c.notes}</TableCell>
                  <TableCell className="text-right">
                    <Button size="icon" variant="ghost" onClick={() => { setEditing(c); setOpen(true); }}><Pencil className="h-4 w-4" /></Button>
                    <Button size="icon" variant="ghost" onClick={() => { store.deleteContact(c.id); toast.success("Đã xoá"); }}><Trash2 className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <ContactDialog open={open} onOpenChange={setOpen} editing={editing} />
    </div>
  );
}

function ContactDialog({ open, onOpenChange, editing }: { open: boolean; onOpenChange: (v: boolean) => void; editing: ContactParty | null }) {
  const store = useStore();
  const [name, setName] = useState(editing?.name ?? "");
  const [type, setType] = useState<ContactType>(editing?.type ?? "Người thuê");
  const [phone, setPhone] = useState(editing?.phone ?? "");
  const [email, setEmail] = useState(editing?.email ?? "");
  const [notes, setNotes] = useState(editing?.notes ?? "");

  // Reset when editing changes
  useMemo(() => {
    setName(editing?.name ?? ""); setType(editing?.type ?? "Người thuê");
    setPhone(editing?.phone ?? ""); setEmail(editing?.email ?? ""); setNotes(editing?.notes ?? "");
  }, [editing]);

  const handleSave = () => {
    if (!name.trim() || !phone.trim()) { toast.error("Vui lòng nhập tên và SĐT"); return; }
    if (editing) {
      store.updateContact(editing.id, { name, type, phone, email, notes });
      toast.success("Đã cập nhật");
    } else {
      store.addContact({ id: `c-${Date.now()}`, name, type, phone, email, notes });
      toast.success("Đã thêm liên hệ");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader><DialogTitle>{editing ? "Sửa liên hệ" : "Thêm liên hệ"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="space-y-2"><Label>Họ tên *</Label><Input value={name} onChange={(e) => setName(e.target.value)} /></div>
          <div className="space-y-2">
            <Label>Loại</Label>
            <Select value={type} onValueChange={(v) => setType(v as ContactType)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{["Người thuê", "Chủ nhà", "Môi giới", "Nhà thầu"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2"><Label>SĐT *</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} /></div>
            <div className="space-y-2"><Label>Email</Label><Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          </div>
          <div className="space-y-2"><Label>Ghi chú</Label><Textarea rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Huỷ</Button>
          <Button onClick={handleSave}>Lưu</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

void DialogTrigger;
