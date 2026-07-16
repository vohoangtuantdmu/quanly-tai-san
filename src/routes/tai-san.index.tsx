import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatVND } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AssetStatusBadge } from "@/components/StatusBadge";
import { Plus, Search, MapPin, Home, Building, TreePine, Store, LayoutGrid, Map as MapIcon, Ruler } from "lucide-react";
import type { AssetType, AssetStatus, OwnershipType } from "@/lib/types";
import { Badge } from "@/components/ui/badge";

export const Route = createFileRoute("/tai-san/")({
  head: () => ({ meta: [{ title: "Danh sách tài sản — Quản Lý Tài Sản" }] }),
  component: AssetList,
});

const typeIcon: Record<AssetType, React.ElementType> = {
  "Nhà riêng": Home, "Căn hộ": Building, "Đất": TreePine, "Biệt thự": Home,
  "Nhà mặt phố": Store, "Văn phòng": Building, "Khác": Home,
};

function AssetList() {
  const navigate = useNavigate();
  const { assets, contracts, units } = useStore();
  const [q, setQ] = useState("");
  const [fType, setFType] = useState<AssetType | "all">("all");
  const [fStatus, setFStatus] = useState<AssetStatus | "all">("all");
  const [fOwn, setFOwn] = useState<OwnershipType | "all">("all");
  const [view, setView] = useState<"grid" | "map">("grid");

  const filtered = useMemo(() => {
    return assets.filter((a) => {
      if (q && !a.name.toLowerCase().includes(q.toLowerCase())) return false;
      if (fType !== "all" && a.type !== fType) return false;
      if (fStatus !== "all" && a.status !== fStatus) return false;
      if (fOwn !== "all" && a.ownershipType !== fOwn) return false;
      return true;
    });
  }, [assets, q, fType, fStatus, fOwn]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Danh sách tài sản</h1>
          <p className="text-sm text-muted-foreground mt-1">{filtered.length} tài sản trên tổng số {assets.length}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center rounded-md border p-0.5 bg-muted/40">
            <Button variant={view === "grid" ? "default" : "ghost"} size="sm" onClick={() => setView("grid")} className="h-8">
              <LayoutGrid className="h-4 w-4 mr-1.5" /> Danh sách
            </Button>
            <Button variant={view === "map" ? "default" : "ghost"} size="sm" onClick={() => setView("map")} className="h-8">
              <MapIcon className="h-4 w-4 mr-1.5" /> Bản đồ
            </Button>
          </div>
          <Button onClick={() => navigate({ to: "/tai-san/moi" })}>
            <Plus className="h-4 w-4 mr-1.5" /> Tạo tài sản mới
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm theo tên tài sản..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={fType} onValueChange={(v) => setFType(v as AssetType | "all")}>
            <SelectTrigger><SelectValue placeholder="Loại tài sản" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {["Nhà riêng", "Căn hộ", "Đất", "Biệt thự", "Nhà mặt phố", "Văn phòng", "Khác"].map((t) => (
                <SelectItem key={t} value={t}>{t}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={(v) => setFStatus(v as AssetStatus | "all")}>
            <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {["Đang sử dụng", "Đang cho thuê", "Đang rao bán", "Trống", "Đã bán", "Hết hợp đồng thuê"].map((s) => (
                <SelectItem key={s} value={s}>{s}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={fOwn} onValueChange={(v) => setFOwn(v as OwnershipType | "all")}>
            <SelectTrigger><SelectValue placeholder="Hình thức sở hữu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Cả sở hữu và đi thuê</SelectItem>
              <SelectItem value="Sở hữu">Sở hữu</SelectItem>
              <SelectItem value="Đi thuê">Đi thuê</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {view === "grid" ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {filtered.map((a) => {
            const Icon = typeIcon[a.type] ?? Home;
            const activeContracts = contracts.filter((c) => c.assetId === a.id && c.status === "Đang hiệu lực").length;
            const unitCount = units.filter((u) => u.assetId === a.id).length;
            return (
              <Link key={a.id} to="/tai-san/$id" params={{ id: a.id }} className="group">
                <Card className="overflow-hidden hover:shadow-md hover:border-primary/50 transition-all py-0 gap-0">
                  <div className="relative h-40 bg-muted overflow-hidden">
                    <img src={a.thumbnail} alt={a.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" loading="lazy" />
                    <div className="absolute top-2 left-2 flex gap-1.5">
                      <AssetStatusBadge status={a.status} />
                    </div>
                    <Badge variant="secondary" className="absolute top-2 right-2 bg-background/90 backdrop-blur">
                      {a.ownershipType}
                    </Badge>
                  </div>
                  <CardContent className="p-4 space-y-2.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Icon className="h-3.5 w-3.5" />
                          <span>{a.type}</span>
                        </div>
                        <div className="font-semibold mt-1 truncate">{a.name}</div>
                      </div>
                    </div>
                    <div className="flex items-start gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{a.addressDetail}, {a.ward}, {a.district}, {a.city}</span>
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t">
                      <div className="text-xs text-muted-foreground flex items-center gap-1"><Ruler className="h-3.5 w-3.5" />{a.area} m²</div>
                      <div className="text-sm font-semibold">{a.ownershipType === "Sở hữu" ? formatVND(a.currentValue) : "Đi thuê"}</div>
                    </div>
                    <div className="flex items-center gap-2 text-xs">
                      {activeContracts > 0 && (
                        <Badge variant="outline" className="border-success/30 text-success">
                          {activeContracts} HĐ hiệu lực
                        </Badge>
                      )}
                      {unitCount > 0 && (
                        <Badge variant="outline">{unitCount} phòng</Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0 overflow-hidden">
            <div className="relative h-[600px] bg-muted">
              <img
                src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=1600"
                alt="Bản đồ tài sản"
                className="absolute inset-0 w-full h-full object-cover opacity-40"
              />
              <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/30" />
              {filtered.map((a, i) => {
                const left = 10 + ((i * 137) % 80);
                const top = 15 + ((i * 89) % 65);
                return (
                  <Link key={a.id} to="/tai-san/$id" params={{ id: a.id }}
                    style={{ left: `${left}%`, top: `${top}%` }}
                    className="absolute -translate-x-1/2 -translate-y-full group"
                  >
                    <div className="flex flex-col items-center">
                      <div className="bg-card border shadow-lg rounded-md p-2 min-w-[180px] group-hover:border-primary transition-colors">
                        <div className="text-xs font-medium truncate">{a.name}</div>
                        <div className="text-[10px] text-muted-foreground truncate">{a.district}, {a.city}</div>
                      </div>
                      <MapPin className="h-6 w-6 text-primary fill-primary/30" />
                    </div>
                  </Link>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
