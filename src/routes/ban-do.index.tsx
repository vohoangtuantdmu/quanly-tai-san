import { createFileRoute, Link } from "@tanstack/react-router";
import { useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { assetsApi } from "@/lib/api/assets";
import { fetchPortfolioIncome } from "@/lib/asset-income";
import { getErrorMessage } from "@/lib/api/errors";
import { AssetMapClient } from "@/components/map/AssetMapClient";
import { AssetMapListPanel } from "@/components/dashboard/AssetMapListPanel";
import { AssetDetailPanel } from "@/components/dashboard/AssetDetailPanel";
import { Button } from "@/components/ui/button";
import { Building2, Plus, AlertTriangle } from "lucide-react";

export const Route = createFileRoute("/ban-do/")({
  head: () => ({ meta: [{ title: "Bản đồ tài sản — Quản Lý Tài Sản" }] }),
  component: AssetMapDashboard,
});

/** Bề rộng panel phải + lề, dùng để căn khung nhìn ban đầu của bản đồ. */
const PANEL_WIDTH = 340;
const PANEL_INSET = PANEL_WIDTH + 40;

function AssetMapDashboard() {
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const q = useQuery({
    queryKey: ["asset-map-pins"],
    queryFn: () => assetsApi.mapPins(),
  });

  // Thu nhập theo tháng của cả danh mục — quyết định marker nào "thở" và số liệu
  // sparkline trong card. Lỗi ở đây không được làm hỏng bản đồ, nên chỉ coi như rỗng.
  const incomeQ = useQuery({
    queryKey: ["portfolio-income"],
    queryFn: fetchPortfolioIncome,
    retry: 1,
  });

  const handleHover = useCallback((id: string | null) => setHoveredId(id), []);
  const handleSelect = useCallback((id: string) => setSelectedId(id), []);
  const closeDetail = useCallback(() => setSelectedId(null), []);

  const items = q.data ?? [];
  const isEmpty = !q.isLoading && !q.isError && items.length === 0;

  // Tài sản chưa có toạ độ thì không có marker để neo card "mở tại chỗ" — vẫn phải xem
  // được, nên giữ panel chi tiết ở cột phải cho riêng trường hợp này.
  const selected = items.find((a) => a.id === selectedId) ?? null;
  const selectedHasNoLocation =
    selected != null && (selected.latitude == null || selected.longitude == null);

  return (
    // Không dùng `fixed inset-0` như bản tham khảo: trang này nằm trong app shell (sidebar
    // + header cao 3.5rem), fixed sẽ đè lên cả hai. Chiếm trọn phần <main> còn lại thay vì.
    <div className="relative h-[calc(100vh-3.5rem)] w-full overflow-hidden">
      {/* `z-0` là bắt buộc, không phải thừa: nó tạo stacking context nhốt các pane của
          Leaflet (z-index 400–700) lại bên trong. Thiếu nó, các pane đó tham gia thẳng
          vào stacking context cha và đè lên panel — đúng lỗi đã gặp ở popover Marketplace. */}
      <div className="absolute inset-0 z-0">
        <AssetMapClient
          items={items}
          hoveredId={hoveredId}
          selectedId={selectedId}
          onHover={handleHover}
          onSelect={handleSelect}
          onCloseSelection={closeDetail}
          income={incomeQ.data ?? {}}
          rightInset={PANEL_INSET}
        />
      </div>

      {q.isError && (
        <div className="map-panel absolute top-5 left-1/2 z-20 -translate-x-1/2 px-4 py-3">
          <p className="flex items-center gap-2 text-sm text-destructive">
            <AlertTriangle className="h-4 w-4 shrink-0" />
            {getErrorMessage(q.error, "Không tải được danh sách tài sản")}
          </p>
        </div>
      )}

      {/* Chưa có tài sản nào: không để người dùng nhìn vào bản đồ trống không biết làm gì */}
      {isEmpty ? (
        <div className="map-panel absolute top-1/2 left-1/2 z-20 w-[min(380px,calc(100%-2.5rem))] -translate-x-1/2 -translate-y-1/2 p-6 text-center">
          <Building2 className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
          <p className="text-sm font-medium">Chưa có tài sản nào</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Thêm tài sản đầu tiên để bắt đầu theo dõi danh mục của bạn.
          </p>
          <Button className="mt-4" asChild>
            <Link to="/tai-san/moi">
              <Plus className="mr-1.5 h-4 w-4" />
              Thêm tài sản
            </Link>
          </Button>
        </div>
      ) : (
        <div
          className="absolute top-5 right-5 bottom-5 z-10 max-w-[calc(100%-2.5rem)]"
          style={{ width: PANEL_WIDTH }}
        >
          {selectedHasNoLocation && selectedId ? (
            <AssetDetailPanel assetId={selectedId} onClose={closeDetail} />
          ) : (
            <AssetMapListPanel
              items={items}
              loading={q.isLoading}
              hoveredId={hoveredId}
              selectedId={selectedId}
              onHover={handleHover}
              onSelect={handleSelect}
            />
          )}
        </div>
      )}
    </div>
  );
}
