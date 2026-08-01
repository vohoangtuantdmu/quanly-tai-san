import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import {
  propertiesApi,
  type PublicListingFilters,
  type PublicPropertySummaryDto,
} from "@/lib/api/properties";
import { getErrorMessage } from "@/lib/api/errors";
import { type ListingTypeCode } from "@/constants/enums";
import { PublicHeader } from "@/components/public/PublicHeader";
import { PropertyListCard } from "@/components/public/PropertyListCard";
import { PropertyMapClient } from "@/components/map/PropertyMapClient";
import type { PropertyMapPoint } from "@/components/map/PropertyMap";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Search, MapPin, SlidersHorizontal, Home, ChevronDown } from "lucide-react";

export const Route = createFileRoute("/tin-dang/")({
  head: () => ({ meta: [{ title: "Tin đăng bất động sản — Marketplace" }] }),
  component: PublicListingsPage,
});

const DEFAULT_CENTER: [number, number] = [10.7769, 106.7009]; // TP.HCM

function PublicListingsPage() {
  const [type, setType] = useState<ListingTypeCode>(1);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [priceMin, setPriceMin] = useState<number | null>(null);
  const [priceMax, setPriceMax] = useState<number | null>(null);
  const [bedroomsMin, setBedroomsMin] = useState<number | null>(null);
  const [keywordInput, setKeywordInput] = useState("");
  const [keyword, setKeyword] = useState("");
  const [page, setPage] = useState(1);

  // Đồng bộ hover 2 chiều Card <-> Marker + click marker cuộn tới card
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [highlightedId, setHighlightedId] = useState<string | null>(null);
  const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
    bedroomsMin: bedroomsMin ?? "",
    keyword,
    page,
    pageSize: 20,
  };

  const query = useQuery({
    queryKey: ["public-listings", filters],
    queryFn: () => propertiesApi.search(filters),
    placeholderData: keepPreviousData,
    retry: 1,
  });

  const data = query.data;
  const items = useMemo(() => data?.items ?? [], [data]);

  const mapPoints: PropertyMapPoint[] = useMemo(
    () =>
      items
        .filter(
          (p): p is PublicPropertySummaryDto & { latitude: number; longitude: number } =>
            p.latitude != null && p.longitude != null,
        )
        .map((p) => ({
          id: p.id,
          lat: p.latitude,
          lng: p.longitude,
          price: p.price,
          type: p.type,
        })),
    [items],
  );

  const handleMarkerClick = (id: string) => {
    const el = cardRefs.current[id];
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    setHighlightedId(id);
    setTimeout(() => setHighlightedId((cur) => (cur === id ? null : cur)), 1500);
  };

  const activeFilterCount = (city.trim() ? 1 : 0) + (district.trim() ? 1 : 0);

  return (
    <div className="h-screen flex flex-col bg-background">
      <PublicHeader />

      {/* Filter chips — sticky ngay dưới header */}
      <div className="border-b bg-card/95 backdrop-blur px-4 py-2.5 flex flex-wrap items-center gap-2">
        <div className="inline-flex rounded-md border p-0.5">
          <Button
            size="sm"
            variant={type === 1 ? "default" : "ghost"}
            className="h-8 rounded-sm"
            onClick={() => {
              setType(1);
              setPage(1);
            }}
          >
            Bán
          </Button>
          <Button
            size="sm"
            variant={type === 2 ? "default" : "ghost"}
            className="h-8 rounded-sm"
            onClick={() => {
              setType(2);
              setPage(1);
            }}
          >
            Cho thuê
          </Button>
        </div>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              Khoảng giá
              {(priceMin != null || priceMax != null) && (
                <span className="ml-1 text-primary">•</span>
              )}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Từ (VNĐ)</Label>
              <CurrencyInput
                value={priceMin}
                onChange={(v) => {
                  setPriceMin(v);
                  setPage(1);
                }}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Đến (VNĐ)</Label>
              <CurrencyInput
                value={priceMax}
                onChange={(v) => {
                  setPriceMax(v);
                  setPage(1);
                }}
              />
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              Phòng ngủ
              {bedroomsMin != null && <span className="ml-1 text-primary">•</span>}
              <ChevronDown className="h-3.5 w-3.5 ml-1" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56">
            <Label className="text-xs">Tối thiểu</Label>
            <div className="flex gap-1.5 mt-1.5">
              {[null, 1, 2, 3, 4].map((n) => (
                <Button
                  key={String(n)}
                  size="sm"
                  variant={bedroomsMin === n ? "default" : "outline"}
                  className="h-8 flex-1 px-0"
                  onClick={() => {
                    setBedroomsMin(n);
                    setPage(1);
                  }}
                >
                  {n == null ? "Tất cả" : `${n}+`}
                </Button>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        <Popover>
          <PopoverTrigger asChild>
            <Button size="sm" variant="outline" className="h-8">
              <SlidersHorizontal className="h-3.5 w-3.5 mr-1" />
              Thêm bộ lọc
              {activeFilterCount > 0 && (
                <span className="ml-1 text-primary">({activeFilterCount})</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-72 space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">Thành phố</Label>
              <Input
                value={city}
                onChange={(e) => {
                  setCity(e.target.value);
                  setPage(1);
                }}
                placeholder="VD: TP. Hồ Chí Minh"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Quận/Huyện</Label>
              <Input
                value={district}
                onChange={(e) => {
                  setDistrict(e.target.value);
                  setPage(1);
                }}
                placeholder="VD: Quận 7"
              />
            </div>
          </PopoverContent>
        </Popover>

        <div className="relative flex-1 min-w-[200px] max-w-sm ml-auto">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tiêu đề, mô tả..."
            className="pl-9 h-8"
            value={keywordInput}
            onChange={(e) => setKeywordInput(e.target.value)}
          />
        </div>
      </div>

      {/* Split view: List 40% / Map 60% — mỗi bên cuộn/cố định độc lập */}
      <div className="flex-1 min-h-0 flex flex-col lg:flex-row">
        <div className="lg:w-2/5 flex-1 lg:flex-none overflow-y-auto p-4 space-y-4">
          <p className="text-sm text-muted-foreground">
            {query.isLoading ? "Đang tải..." : `${data?.totalCount ?? 0} bất động sản`}
          </p>

          {query.isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="overflow-hidden py-0 gap-0">
                  <Skeleton className="aspect-[4/3] w-full rounded-none" />
                  <div className="p-4 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                </Card>
              ))}
            </div>
          ) : query.isError ? (
            <Card className="p-8 text-center text-sm text-destructive">
              {getErrorMessage(query.error, "Không tải được danh sách tin đăng")}
            </Card>
          ) : items.length === 0 ? (
            <Card className="p-10 text-center text-sm text-muted-foreground space-y-1.5">
              <Home className="h-10 w-10 mx-auto text-muted-foreground/40 mb-1" />
              <p>Không tìm thấy tin đăng nào phù hợp với bộ lọc.</p>
              <p>Thử mở rộng bán kính tìm kiếm hoặc bỏ bớt bộ lọc.</p>
            </Card>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3">
                {items.map((p) => (
                  <PropertyListCard
                    key={p.id}
                    property={p}
                    ref={(el) => {
                      cardRefs.current[p.id] = el;
                    }}
                    hovered={hoveredId === p.id}
                    highlighted={highlightedId === p.id}
                    onHover={() => setHoveredId(p.id)}
                    onLeave={() => setHoveredId((cur) => (cur === p.id ? null : cur))}
                  />
                ))}
              </div>
              {data && data.totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 pt-2">
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

        {/* Map — cố định, không cuộn theo danh sách */}
        <div className="hidden lg:block lg:w-3/5 relative border-l">
          {mapPoints.length === 0 && !query.isLoading ? (
            <div className="h-full flex items-center justify-center text-sm text-muted-foreground bg-muted/30">
              <div className="text-center space-y-1">
                <MapPin className="h-8 w-8 mx-auto text-muted-foreground/40" />
                <p>Không có tin đăng nào có toạ độ để hiện trên bản đồ.</p>
              </div>
            </div>
          ) : (
            <PropertyMapClient
              points={mapPoints}
              hoveredId={hoveredId}
              onHoverPoint={setHoveredId}
              onClickPoint={handleMarkerClick}
              defaultCenter={DEFAULT_CENTER}
            />
          )}
        </div>
      </div>
    </div>
  );
}
