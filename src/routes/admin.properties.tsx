import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { api } from "@/lib/auth/api";
import { ApiError } from "@/lib/auth/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/admin/properties")({
  head: () => ({ meta: [{ title: "Duyệt tin đăng — Quản trị" }] }),
  component: AdminPropertiesPage,
});

interface PendingProperty {
  id: string;
  title?: string;
  ownerName?: string;
  createdAt?: string;
  [k: string]: unknown;
}

interface Stats {
  [k: string]: number;
}

function AdminPropertiesPage() {
  const [items, setItems] = useState<PendingProperty[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [rejectItem, setRejectItem] = useState<PendingProperty | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    try {
      const [list, s] = await Promise.all([
        api<PendingProperty[]>("/admin/properties/pending"),
        api<Stats>("/admin/properties/stats"),
      ]);
      setItems(list || []);
      setStats(s || null);
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Không tải được dữ liệu.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, []);

  const approve = async (id: string) => {
    setBusy(id);
    try {
      await api(`/admin/properties/${id}/approve`, { method: "POST", body: { note: null } });
      toast.success("Đã duyệt tin");
      setItems((xs) => xs.filter((x) => x.id !== id));
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Duyệt thất bại.");
    } finally {
      setBusy(null);
    }
  };

  const submitReject = async () => {
    if (!rejectItem) return;
    if (!rejectReason.trim()) return toast.error("Vui lòng nhập lý do từ chối.");
    setBusy(rejectItem.id);
    try {
      await api(`/admin/properties/${rejectItem.id}/reject`, {
        method: "POST",
        body: { reason: rejectReason.trim() },
      });
      toast.success("Đã từ chối tin");
      setItems((xs) => xs.filter((x) => x.id !== rejectItem.id));
      setRejectItem(null);
      setRejectReason("");
    } catch (err) {
      toast.error(err instanceof ApiError ? err.detail : "Từ chối thất bại.");
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 lg:p-6">
      <div>
        <h1 className="text-2xl font-semibold">Duyệt tin đăng</h1>
        <p className="text-sm text-muted-foreground">
          Quản trị viên xem xét và duyệt các tin đăng đang chờ.
        </p>
      </div>

      {stats && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          {Object.entries(stats).map(([k, v]) => (
            <Card key={k}>
              <CardContent className="p-4">
                <div className="text-xs uppercase text-muted-foreground">{k}</div>
                <div className="mt-1 text-2xl font-semibold">{v}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Đang chờ duyệt ({items.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" />
              Đang tải...
            </div>
          ) : items.length === 0 ? (
            <div className="py-10 text-center text-sm text-muted-foreground">
              Không có tin đăng nào đang chờ duyệt.
            </div>
          ) : (
            <div className="space-y-3">
              {items.map((p) => (
                <div
                  key={p.id}
                  className="flex items-start justify-between gap-3 rounded-md border p-3"
                >
                  <div className="min-w-0">
                    <div className="font-medium truncate">{p.title || `Tin đăng ${p.id}`}</div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {p.ownerName && <span>{p.ownerName} · </span>}
                      <span>ID: {p.id}</span>
                    </div>
                  </div>
                  <div className="flex shrink-0 gap-2">
                    <Button size="sm" onClick={() => approve(p.id)} disabled={busy === p.id}>
                      <CheckCircle2 className="mr-1 h-4 w-4" />
                      Duyệt
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        setRejectItem(p);
                        setRejectReason("");
                      }}
                      disabled={busy === p.id}
                    >
                      <XCircle className="mr-1 h-4 w-4" />
                      Từ chối
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={!!rejectItem} onOpenChange={(o) => !o && setRejectItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Từ chối tin đăng</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="reason">Lý do (bắt buộc)</Label>
            <Textarea
              id="reason"
              rows={4}
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setRejectItem(null)}>
              Huỷ
            </Button>
            <Button variant="destructive" onClick={submitReject} disabled={busy === rejectItem?.id}>
              {busy === rejectItem?.id && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Xác nhận
              từ chối
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
