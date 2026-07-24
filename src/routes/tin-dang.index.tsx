import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { propertiesApi, formatListingPrice, type PublicListingFilters } from "@/lib/api/properties";
import { getErrorMessage } from "@/lib/api/errors";
import { type ListingTypeCode } from "@/constants/enums";
import { PublicHeader } from "@/components/public/PublicHeader";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, MapPin, BedDouble, Bath, Ruler, ImageIcon, Home } from "lucide-react";

export const Route = createFileRoute("/tin-dang/")({
  head: () => ({ meta: [{ title: "Tin đăng bất động sản — Marketplace" }] }),
  component: PublicListingsPage,
});

function PublicListingsPage() {
  const [type, setType] = useState<ListingTypeCode | "">("");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [bedroomsMin, setBedroomsMin] = useState("");
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => {
    const t = setTimeout(() => {
      setKeyword(keywordInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [keywordInput]);

  const filters: PublicListingFilters = {
    type,
    city: city.trim(),
    district: district.trim(),
    priceMin: priceMin ?? "",
    priceMax: priceMax ?? "",
    bedroomsMin: bedroomsMin === "" ? "" : Number(bedroomsMin),
    keyword,
    page,
    pageSize: 12,
  };

  const query = useQuery({
    queryKey: ["public-listings", filters],
    queryFn: () => propertiesApi.search(filters),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const data = query.data;

  return (
    <div className="min-h-screen bg-muted/20">
      <PublicHeader />
      <div className="mx-auto max-w-[1200px] p-4 lg:p-6 space-y-5">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tin đăng bất động sản</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {data ? `${data.totalCount} tin đang hiển thị` : "Đang tải..."}
          </p>
        </div>

        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex flex-wrap items-end gap-3">
              <Tabs
                value={type === "" ? "all" : String(type)}
                onValueChange={(v) => {
                  setType(v === "all" ? "" : (Number(v) as ListingTypeCode));
                  setPage(1);
                }}
              >
                <TabsList>
                  <TabsTrigger value="all">Tất cả</TabsTrigger>
                  <TabsTrigger value="1">Bán</TabsTrigger>
                  <TabsTrigger value="2">Cho thuê</TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="relative flex-1 min-w-[220px]">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Tìm theo tiêu đề, mô tả..."
                  className="pl-9"
                  value={keywordInput}
                  onChange={(e) => setKeywordInput(e.target.value)}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              <div>
                <Label className="text-xs">Thành phố</Label>
                <Input
                  className="mt-1"
                  value={city}
                  onChange={(e) => {
                    setCity(e.target.value);
                    setPage(1);
                  }}
                  placeholder="VD: TP. Hồ Chí Minh"
                />
              </div>
              <div>
                <Label className="text-xs">Quận/Huyện</Label>
                <Input
                  className="mt-1"
                  value={district}
                  onChange={(e) => {
                    setDistrict(e.target.value);
                    setPage(1);
                  }}
                  placeholder="VD: Quận 7"
                />
              </div>
              <div>
                <Label className="text-xs">Giá từ (VNĐ)</Label>
                <CurrencyInput
                  value={priceMin}
                  onChange={(v) => {
                    setPriceMin(v);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Giá đến (VNĐ)</Label>
                <CurrencyInput
                  value={priceMax}
                  onChange={(v) => {
                    setPriceMax(v);
                    setPage(1);
                  }}
                />
              </div>
              <div>
                <Label className="text-xs">Phòng ngủ tối thiểu</Label>
                <Input
                  className="mt-1"
                  type="number"
                  min={0}
                  value={bedroomsMin}
                  onChange={(e) => {
                    setBedroomsMin(e.target.value);
                    setPage(1);
                  }}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {query.isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i}>
                <CardContent className="p-0">
                  <Skeleton className="h-44 w-full rounded-b-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-3/4" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : query.isError ? (
          <Card>
            <CardContent className="py-12 text-center text-sm text-destructive">
              {getErrorMessage(query.error, "Không tải được danh sách tin đăng")}
            </CardContent>
          </Card>
        ) : (data?.items ?? []).length === 0 ? (
          <Card>
            <CardContent className="py-16 text-center text-sm text-muted-foreground">
              <Home className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
              Không tìm thấy tin đăng nào phù hợp với bộ lọc.
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {(data?.items ?? []).map((p) => (
                <Link key={p.id} to="/tin-dang/$slug" params={{ slug: p.slug }}>
                  <Card className="overflow-hidden py-0 gap-0 h-full transition hover:shadow-md">
                    <div className="relative h-44 bg-muted">
                      {p.thumbnailUrl ? (
                        <img
                          src={p.thumbnailUrl}
                          alt={p.title}
                          className="w-full h-full object-cover"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <ImageIcon className="h-10 w-10 text-muted-foreground/40" />
                        </div>
                      )}
                      <Badge className="absolute top-2 left-2">
                        {p.type === 1 ? "Bán" : "Cho thuê"}
                      </Badge>
                    </div>
                    <CardContent className="p-4 space-y-2">
                      <div className="text-lg font-semibold text-primary">
                        {formatListingPrice(p.price, p.type, p.rentPaymentCycle)}
                      </div>
                      <div className="font-medium line-clamp-2">{p.title}</div>
                      <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        {[p.district, p.city].filter(Boolean).join(", ")}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground pt-1">
                        {p.bedrooms != null && (
                          <span className="flex items-center gap-1">
                            <BedDouble className="h-3.5 w-3.5" />
                            {p.bedrooms} PN
                          </span>
                        )}
                        {p.bathrooms != null && (
                          <span className="flex items-center gap-1">
                            <Bath className="h-3.5 w-3.5" />
                            {p.bathrooms} PT
                          </span>
                        )}
                        {p.area != null && (
                          <span className="flex items-center gap-1">
                            <Ruler className="h-3.5 w-3.5" />
                            {p.area} m²
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
            {data && data.totalPages > 1 && (
              <div className="flex items-center justify-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Trang trước
                </Button>
                <span className="text-sm text-muted-foreground">
                  Trang {data.page}/{data.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= data.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Trang sau
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
