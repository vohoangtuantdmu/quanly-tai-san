import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { assetsApi, type AssetListFilters } from "@/lib/api/assets";
import {
  ASSET_TYPE,
  OWNERSHIP_TYPE,
  ASSET_STATUS,
  enumOptions,
  type AssetStatusCode,
  type AssetTypeCode,
  type OwnershipTypeCode,
} from "@/constants/enums";
import { AssetStatusBadgeCode } from "@/components/EnumBadge";
import { formatVND } from "@/lib/format";
import { getErrorMessage } from "@/lib/api/errors";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Search, MapPin, ImageIcon, Home, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/tai-san/")({
  head: () => ({ meta: [{ title: "Danh sách tài sản — Quản Lý Tài Sản" }] }),
  component: AssetList,
});

function AssetList() {
  const navigate = useNavigate();

  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [type, setType] = useState<AssetTypeCode | "">("");
  const [status, setStatus] = useState<AssetStatusCode | "">("");
  const [ownershipType, setOwnershipType] = useState<OwnershipTypeCode | "">("");
  const [page, setPage] = useState(1);

  // Debounce keyword 400ms
  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const filters: AssetListFilters = { keyword, type, status, ownershipType, page, pageSize: 12 };

  const query = useQuery({
    queryKey: ["assets", filters],
    queryFn: () => assetsApi.list(filters),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const data = query.data;

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Danh sách tài sản</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.totalCount} tài sản` : "Đang tải..."}
          </p>
        </div>
        <Button onClick={() => navigate({ to: "/tai-san/moi" })}>
          <Plus className="h-4 w-4 mr-1.5" />Thêm tài sản
        </Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="relative md:col-span-2">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm theo tên, địa chỉ..."
              className="pl-9"
              value={keywordInput}
              onChange={(e) => setKeywordInput(e.target.value)}
            />
          </div>
          <Select value={type === "" ? "all" : String(type)} onValueChange={(v) => { setType(v === "all" ? "" : Number(v) as AssetTypeCode); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Loại tài sản" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả loại</SelectItem>
              {enumOptions(ASSET_TYPE).map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={status === "" ? "all" : String(status)} onValueChange={(v) => { setStatus(v === "all" ? "" : Number(v) as AssetStatusCode); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Trạng thái" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              {enumOptions(ASSET_STATUS).map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={ownershipType === "" ? "all" : String(ownershipType)} onValueChange={(v) => { setOwnershipType(v === "all" ? "" : Number(v) as OwnershipTypeCode); setPage(1); }}>
            <SelectTrigger><SelectValue placeholder="Hình thức sở hữu" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả hình thức</SelectItem>
              {enumOptions(OWNERSHIP_TYPE).map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {query.isLoading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}><CardContent className="p-0">
              <Skeleton className="h-40 w-full rounded-t-lg" />
              <div className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-4 w-2/3" />
              </div>
            </CardContent></Card>
          ))}
        </div>
      )}

      {query.isError && (
        <Card><CardContent className="p-10 text-center space-y-3">
          <p className="text-destructive text-sm">{getErrorMessage(query.error, "Không tải được danh sách")}</p>
          <Button variant="outline" size="sm" onClick={() => query.refetch()}>
            <RefreshCw className="h-4 w-4 mr-1.5" />Thử lại
          </Button>
        </CardContent></Card>
      )}

      {data && data.items.length === 0 && (
        <Card><CardContent className="p-16 text-center">
          <Home className="h-12 w-12 mx-auto text-muted-foreground/60" />
          <h3 className="mt-4 font-semibold">Bạn chưa có tài sản nào</h3>
          <p className="text-sm text-muted-foreground mt-1">Thêm tài sản đầu tiên để bắt đầu.</p>
          <Button className="mt-5" onClick={() => navigate({ to: "/tai-san/moi" })}>
            <Plus className="h-4 w-4 mr-1.5" />Thêm tài sản
          </Button>
        </CardContent></Card>
      )}

      {data && data.items.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {data.items.map((a) => (
            <Link key={a.id} to="/tai-san/$id" params={{ id: a.id }} className="group">
              <Card className="overflow-hidden transition hover:shadow-md hover:border-primary/40">
                <div className="relative h-40 bg-muted flex items-center justify-center">
                  {a.thumbnailUrl ? (
                    <img src={a.thumbnailUrl} alt={a.name} className="h-full w-full object-cover" loading="lazy" />
                  ) : (
                    <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                  )}
                  <div className="absolute top-2 left-2 flex gap-1.5">
                    <AssetStatusBadgeCode code={a.status} />
                  </div>
                  <div className="absolute top-2 right-2">
                    <Badge variant="secondary" className="text-xs">{OWNERSHIP_TYPE[a.ownershipType]}</Badge>
                  </div>
                </div>
                <CardContent className="p-4 space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold group-hover:text-primary line-clamp-1">{a.name}</h3>
                    <Badge variant="outline" className="text-xs shrink-0">{ASSET_TYPE[a.type]}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground flex items-center gap-1.5 line-clamp-1">
                    <MapPin className="h-3.5 w-3.5 shrink-0" />{a.district}, {a.city}
                  </p>
                  <p className="text-sm font-medium text-primary">
                    {a.currentValue ? formatVND(a.currentValue) : "—"}
                  </p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {data && data.totalPages > 1 && (
        <div className="flex items-center justify-center gap-1 pt-2">
          <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Trước</Button>
          {Array.from({ length: data.totalPages }).map((_, i) => {
            const p = i + 1;
            return (
              <Button key={p} size="sm" variant={p === page ? "default" : "outline"} onClick={() => setPage(p)}>
                {p}
              </Button>
            );
          })}
          <Button variant="outline" size="sm" disabled={page >= data.totalPages} onClick={() => setPage((p) => p + 1)}>Sau</Button>
        </div>
      )}
    </div>
  );
}
