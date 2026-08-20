import { useEffect, useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import type { AssetMapItem } from "@/lib/api/assets";
import { ASSET_STATUS, ASSET_STATUS_CLASS, type AssetStatusCode } from "@/constants/enums";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, ImageIcon, MapPinOff, ArrowRight } from "lucide-react";

type StatusFilter = "all" | AssetStatusCode;

const TABS: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Tất cả" },
  { value: 2, label: "Thuê" },
  { value: 3, label: "Bán" },
  { value: 4, label: "Trống" },
];

export interface AssetMapListPanelProps {
  items: AssetMapItem[];
  loading: boolean;
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
}

export function AssetMapListPanel({
  items,
  loading,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
}: AssetMapListPanelProps) {
  const [tab, setTab] = useState<StatusFilter>("all");
  const cardRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  // Click marker trên bản đồ → cuộn card tương ứng vào tầm nhìn (đồng bộ 2 chiều)
  useEffect(() => {
    if (!selectedId) return;
    cardRefs.current[selectedId]?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [selectedId]);

  const shown = tab === "all" ? items : items.filter((a) => a.status === tab);
  const countOf = (t: StatusFilter) =>
    t === "all" ? items.length : items.filter((a) => a.status === t).length;

  return (
    <div className="map-panel flex h-full flex-col overflow-hidden">
      <div className="shrink-0 space-y-3 p-5 pb-3">
        <div className="flex items-baseline justify-between gap-2">
          <h2 className="text-sm font-medium tracking-wide">Tài sản của tôi</h2>
          <span className="text-xs tabular-nums text-muted-foreground">
            {loading ? "—" : `${items.length}`}
          </span>
        </div>
        <div className="flex gap-1 rounded-md border p-0.5">
          {TABS.map((t) => (
            <button
              key={String(t.value)}
              type="button"
              onClick={() => setTab(t.value)}
              aria-pressed={tab === t.value}
              className={`flex-1 cursor-pointer rounded-sm px-2 py-1 text-xs font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring ${
                tab === t.value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-accent"
              }`}
            >
              {t.label}
              {!loading && countOf(t.value) > 0 && (
                <span className="ml-1 tabular-nums opacity-70">{countOf(t.value)}</span>
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-2">
        {loading ? (
          <div className="space-y-2 px-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-[68px] w-full rounded-lg" />
            ))}
          </div>
        ) : shown.length === 0 ? (
          <div className="px-2 py-10 text-center text-sm text-muted-foreground">
            <Building2 className="mx-auto mb-2 h-8 w-8 text-muted-foreground/40" />
            Không có tài sản nào ở trạng thái này.
          </div>
        ) : (
          <ul className="space-y-1">
            {shown.map((a) => {
              const active = a.id === hoveredId || a.id === selectedId;
              const noLocation = a.latitude == null || a.longitude == null;
              return (
                <li key={a.id}>
                  <button
                    type="button"
                    ref={(el) => {
                      cardRefs.current[a.id] = el;
                    }}
                    onClick={() => onSelect(a.id)}
                    onMouseEnter={() => onHover(a.id)}
                    onMouseLeave={() => onHover(null)}
                    onFocus={() => onHover(a.id)}
                    onBlur={() => onHover(null)}
                    className={`w-full cursor-pointer rounded-lg border p-2.5 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${
                      active
                        ? "border-primary/40 bg-accent"
                        : "border-transparent hover:bg-accent/60"
                    }`}
                  >
                    <div className="flex gap-2.5">
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted">
                        {a.thumbnailUrl ? (
                          <img
                            src={a.thumbnailUrl}
                            alt=""
                            loading="lazy"
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <ImageIcon className="h-4 w-4 text-muted-foreground/50" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-sm font-medium">{a.name}</div>
                        <div className="truncate text-xs text-muted-foreground">
                          {[a.district, a.city].filter(Boolean).join(", ") || "—"}
                        </div>
                        <div className="mt-1 flex flex-wrap items-center gap-1.5">
                          <Badge
                            variant="outline"
                            className={`px-1.5 py-0 text-[11px] ${ASSET_STATUS_CLASS[a.status]}`}
                          >
                            {ASSET_STATUS[a.status]}
                          </Badge>
                          {a.currentValue != null && (
                            <span className="text-xs font-semibold tabular-nums">
                              {formatCurrency(a.currentValue, { compact: true })}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                    {/* Tài sản chưa gắn toạ độ vẫn phải thấy ở đây, kèm lối bổ sung vị trí —
                        nếu ẩn đi người dùng sẽ tưởng bị mất tài sản. */}
                    {noLocation && (
                      <div className="mt-2 flex items-center gap-1.5 border-t pt-2 text-[11px] text-muted-foreground">
                        <MapPinOff className="h-3 w-3 shrink-0" />
                        <span>Chưa có vị trí trên bản đồ</span>
                        <Link
                          to="/tai-san/$id/sua"
                          params={{ id: a.id }}
                          onClick={(e) => e.stopPropagation()}
                          className="ml-auto shrink-0 font-medium text-primary hover:underline"
                        >
                          Bổ sung
                        </Link>
                      </div>
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="shrink-0 border-t p-3">
        <Button variant="ghost" size="sm" className="w-full" asChild>
          <Link to="/tai-san">
            Xem tất cả tài sản
            <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
