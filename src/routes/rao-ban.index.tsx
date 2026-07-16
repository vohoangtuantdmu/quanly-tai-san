import { createFileRoute, Link } from "@tanstack/react-router";
import { useStore } from "@/lib/store";
import { formatDate, formatVND } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tag, Send, CheckCheck, Users } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/rao-ban/")({
  head: () => ({ meta: [{ title: "Rao bán — Quản Lý Tài Sản" }] }),
  component: SalePage,
});

function SalePage() {
  const store = useStore();
  const listings = store.saleListings;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Tài sản đang rao bán</h1>
        <p className="text-sm text-muted-foreground mt-1">Theo dõi tin đăng và gửi cho các môi giới trong sổ đối tác.</p>
      </div>

      {listings.length === 0 && <Card><CardContent className="p-10 text-center text-muted-foreground">Chưa có tài sản nào đang rao bán.</CardContent></Card>}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {listings.map((l) => {
          const asset = store.assets.find((a) => a.id === l.assetId);
          if (!asset) return null;
          return (
            <Card key={l.id} className="overflow-hidden py-0 gap-0">
              <div className="h-40 relative">
                <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
                <Badge className="absolute top-2 left-2">{l.status}</Badge>
              </div>
              <CardContent className="p-4 space-y-3">
                <div>
                  <Link to="/tai-san/$id" params={{ id: asset.id }} className="font-semibold hover:underline">{asset.name}</Link>
                  <div className="text-xs text-muted-foreground mt-0.5">{asset.district}, {asset.city}</div>
                </div>
                <div className="flex items-end justify-between">
                  <div>
                    <div className="text-xs text-muted-foreground">Giá rao</div>
                    <div className="text-lg font-semibold text-primary">{formatVND(l.price)}</div>
                  </div>
                  <div className="text-xs text-muted-foreground text-right">
                    Đăng {formatDate(l.listedDate)}
                  </div>
                </div>
                <div className="pt-3 border-t">
                  <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1"><Users className="h-3 w-3" />Đã gửi cho {l.sentToBrokers.length} môi giới</div>
                  <div className="space-y-1">
                    {l.sentToBrokers.map((b) => {
                      const broker = store.contacts.find((c) => c.id === b.brokerId);
                      return (
                        <div key={b.brokerId} className="text-xs flex justify-between">
                          <span>{broker?.name}</span>
                          <span className="text-muted-foreground">{formatDate(b.sentAt)}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
                <div className="flex gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1" onClick={() => toast.info("Chọn môi giới trong prototype tiếp theo")}>
                    <Send className="h-4 w-4 mr-1.5" />Gửi môi giới
                  </Button>
                  <Button size="sm" variant="default" className="flex-1" onClick={() => { store.updateAsset(asset.id, { status: "Đã bán" }); toast.success("Đã đánh dấu đã bán"); }}>
                    <CheckCheck className="h-4 w-4 mr-1.5" />Đã bán
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-4 flex items-start gap-3">
          <Tag className="h-5 w-5 text-primary shrink-0 mt-0.5" />
          <div className="text-sm text-muted-foreground">
            Để đăng thêm tài sản, mở chi tiết tài sản và bấm <span className="text-foreground font-medium">"Đăng rao bán"</span>. Prototype hiện hiển thị dữ liệu mẫu.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
