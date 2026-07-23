import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetsApi } from "@/lib/api/assets";
import { getErrorMessage } from "@/lib/api/errors";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Link2, Link2Off, ExternalLink } from "lucide-react";

/**
 * Card liên kết tài sản với tin đăng (Property).
 * TODO: thay ô nhập Property ID bằng dropdown chọn từ GET /api/properties khi API sẵn sàng.
 */
export function LinkPropertyCard({ assetId, linkedPropertyId }: { assetId: string; linkedPropertyId: string | null }) {
  const qc = useQueryClient();
  const [openLink, setOpenLink] = useState(false);
  const [openUnlink, setOpenUnlink] = useState(false);
  const [propertyId, setPropertyId] = useState("");

  const linkMut = useMutation({
    mutationFn: (pid: string) => assetsApi.linkProperty(assetId, pid),
    onSuccess: () => {
      toast.success("Đã liên kết với tin đăng");
      qc.invalidateQueries({ queryKey: ["asset", assetId] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      setOpenLink(false);
      setPropertyId("");
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không liên kết được")),
  });

  const unlinkMut = useMutation({
    mutationFn: () => assetsApi.unlinkProperty(assetId),
    onSuccess: () => {
      toast.success("Đã gỡ liên kết");
      qc.invalidateQueries({ queryKey: ["asset", assetId] });
      qc.invalidateQueries({ queryKey: ["assets"] });
      setOpenUnlink(false);
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không gỡ được liên kết")),
  });

  return (
    <Card>
      <CardHeader><CardTitle className="text-base flex items-center gap-2"><Link2 className="h-4 w-4" />Liên kết tin đăng</CardTitle></CardHeader>
      <CardContent className="space-y-3 text-sm">
        {linkedPropertyId ? (
          <>
            <div className="flex items-center justify-between gap-2 rounded-md border bg-muted/40 p-3">
              <div className="min-w-0">
                <div className="text-xs text-muted-foreground">Đang liên kết với tin đăng</div>
                <div className="font-medium truncate flex items-center gap-1.5">
                  <ExternalLink className="h-3.5 w-3.5" />#{linkedPropertyId}
                </div>
              </div>
              <Button variant="outline" size="sm" className="text-destructive" onClick={() => setOpenUnlink(true)}>
                <Link2Off className="h-4 w-4 mr-1.5" />Gỡ liên kết
              </Button>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-between gap-2">
            <p className="text-muted-foreground">Tài sản này chưa liên kết với tin đăng nào.</p>
            <Button size="sm" onClick={() => setOpenLink(true)}><Link2 className="h-4 w-4 mr-1.5" />Liên kết</Button>
          </div>
        )}
      </CardContent>

      <Dialog open={openLink} onOpenChange={(v) => { if (!linkMut.isPending) setOpenLink(v); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Liên kết với tin đăng</DialogTitle>
            <DialogDescription>Nhập mã tin đăng (Property ID) để liên kết. Sẽ thay bằng danh sách chọn khi API sẵn sàng.</DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="pid">Property ID *</Label>
            <Input id="pid" inputMode="numeric" value={propertyId} onChange={(e) => setPropertyId(e.target.value.replace(/\D/g, ""))} placeholder="VD: 12345" />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpenLink(false)} disabled={linkMut.isPending}>Huỷ</Button>
            <Button onClick={() => propertyId && linkMut.mutate(propertyId)} disabled={!propertyId || linkMut.isPending}>
              {linkMut.isPending ? "Đang liên kết..." : "Liên kết"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={openUnlink} onOpenChange={(v) => { if (!unlinkMut.isPending) setOpenUnlink(v); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Gỡ liên kết tin đăng?</AlertDialogTitle>
            <AlertDialogDescription>Tài sản sẽ không còn liên kết với tin đăng #{linkedPropertyId}.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={unlinkMut.isPending}>Huỷ</AlertDialogCancel>
            <AlertDialogAction onClick={(e) => { e.preventDefault(); unlinkMut.mutate(); }} disabled={unlinkMut.isPending} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {unlinkMut.isPending ? "Đang gỡ..." : "Gỡ liên kết"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}