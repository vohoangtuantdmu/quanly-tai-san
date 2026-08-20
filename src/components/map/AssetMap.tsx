// Bản đồ danh mục tài sản cho dashboard — KHÁC PropertyMap (Marketplace) ở 3 điểm:
// basemap Positron xám nhạt (để panel trắng nổi lên đọc được), pin hình giọt nước theo
// trạng thái + loại tài sản, và gom cụm bằng leaflet.markercluster.
// Client-only, nạp qua React.lazy (xem AssetMapClient.tsx).
import "leaflet/dist/leaflet.css";
import "leaflet.markercluster/dist/MarkerCluster.css";
import L from "leaflet";
// Kéo phần khai báo bổ sung cho namespace `L` (L.MarkerCluster, MarkerClusterGroupOptions).
// react-leaflet-cluster đã nạp plugin này ở runtime; import lặp là idempotent.
import "leaflet.markercluster";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import MarkerClusterGroup from "react-leaflet-cluster";
import { useEffect, useRef } from "react";
import type { AssetMapItem } from "@/lib/api/assets";
import type { AssetStatusCode, AssetTypeCode } from "@/constants/enums";

// Positron: tile gần như đơn sắc, không có đường đỏ/vàng gắt như OSM mặc định — đây là
// điều kiện để panel trắng bán trong suốt đặt lên trên vẫn đọc rõ.
const POSITRON_URL = "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png";
const POSITRON_ATTRIB =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> &copy; <a href="https://carto.com/attributions">CARTO</a>';

// Tâm dự phòng khi chưa có tài sản nào có toạ độ (TP.HCM)
const FALLBACK_CENTER: L.LatLngTuple = [10.7769, 106.7009];

// Dùng token ngữ nghĩa sẵn có, không đặt bảng màu riêng cho bản đồ.
const STATUS_COLOR: Record<AssetStatusCode, string> = {
  1: "var(--color-info)", // Đang sử dụng
  2: "var(--color-success)", // Đang cho thuê
  3: "var(--color-warning)", // Đang rao bán
  4: "var(--color-muted-foreground)", // Trống
  5: "var(--color-muted-foreground)", // Đã bán
  6: "var(--color-destructive)", // Hết hạn thuê
};

// Glyph 24-viewBox theo loại tài sản, vẽ bên trong pin
const TYPE_GLYPH: Record<AssetTypeCode, string> = {
  1: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>', // Nhà riêng
  2: '<path d="M7 21V4h10v17"/><path d="M10 8h4M10 12h4M10 16h4"/>', // Căn hộ
  3: '<path d="M3 8.5h18v8H3z"/><path d="M3 12.5h18"/>', // Đất
  4: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>', // Biệt thự
  5: '<path d="M4 11.5 12 4l8 7.5V20a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1z"/>', // Nhà mặt phố
  6: '<path d="M7 21V4h10v17"/><path d="M10 8h4M10 12h4M10 16h4"/>', // Văn phòng
  99: '<circle cx="12" cy="12" r="4"/>', // Khác
};

type LocatedAsset = AssetMapItem & { latitude: number; longitude: number };

function hasLocation(a: AssetMapItem): a is LocatedAsset {
  return a.latitude != null && a.longitude != null;
}

// Icon là bất biến theo (trạng thái, loại, đang nổi bật) — cache lại để đổi hover không
// phải dựng lại DivIcon cho toàn bộ marker.
const iconCache = new Map<string, L.DivIcon>();

function pinIcon(status: AssetStatusCode, type: AssetTypeCode, active: boolean): L.DivIcon {
  const key = `${status}|${type}|${active}`;
  const cached = iconCache.get(key);
  if (cached) return cached;

  const color = STATUS_COLOR[status] ?? STATUS_COLOR[4];
  const glyph = TYPE_GLYPH[type] ?? TYPE_GLYPH[99];
  const html = `<svg width="32" height="40" viewBox="0 0 32 40" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M16 1C7.716 1 1 7.716 1 16c0 9.9 15 23 15 23s15-13.1 15-23c0-8.284-6.716-15-15-15z"
            fill="white" stroke="${color}" stroke-width="2"/>
      <g transform="translate(9 8) scale(0.583)" fill="none" stroke="${color}"
         stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">${glyph}</g>
    </svg>`;

  // className mang mã trạng thái để iconCreateFunction đọc lại được khi tô màu cụm —
  // Leaflet MarkerOptions không có chỗ gắn dữ liệu tuỳ ý nên đây là đường ngắn nhất.
  const icon = L.divIcon({
    html,
    className: `asset-pin asset-pin--s${status}${active ? " asset-pin--active" : ""}`,
    iconSize: [32, 40],
    iconAnchor: [16, 40],
  });
  iconCache.set(key, icon);
  return icon;
}

/** Tô cụm theo trạng thái chiếm đa số — giữ được thông tin trạng thái cả khi zoom xa. */
function clusterIcon(cluster: L.MarkerCluster): L.DivIcon {
  const count = cluster.getChildCount();
  const tally = new Map<number, number>();
  for (const m of cluster.getAllChildMarkers()) {
    const cls = (m.options.icon?.options as L.DivIconOptions | undefined)?.className ?? "";
    const code = Number(/asset-pin--s(\d+)/.exec(cls)?.[1]);
    if (Number.isFinite(code)) tally.set(code, (tally.get(code) ?? 0) + 1);
  }
  let top = 4;
  let topCount = -1;
  for (const [code, n] of tally) {
    if (n > topCount) {
      top = code;
      topCount = n;
    }
  }
  const color = STATUS_COLOR[top as AssetStatusCode] ?? STATUS_COLOR[4];
  const size = count >= 50 ? 64 : count >= 10 ? 52 : 40;
  const font = count >= 50 ? 18 : count >= 10 ? 16 : 14;

  return L.divIcon({
    html: `<div class="asset-cluster" style="width:${size}px;height:${size}px;font-size:${font}px;background:${color};box-shadow:0 0 0 8px color-mix(in oklab, ${color} 15%, transparent)">${count}</div>`,
    className: "asset-cluster-wrap",
    iconSize: L.point(size, size),
  });
}

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Khung nhìn ban đầu vừa đủ bao trọn tài sản đang có (không phải toàn Việt Nam trống
 * trải). Chừa lề phải rộng hơn để pin không nằm khuất dưới panel danh sách.
 */
function FitToAssets({ items, rightInset }: { items: LocatedAsset[]; rightInset: number }) {
  const map = useMap();
  const fitted = useRef(false);

  useEffect(() => {
    if (fitted.current || items.length === 0) return;
    fitted.current = true;
    if (items.length === 1) {
      map.setView([items[0].latitude, items[0].longitude], 14, { animate: false });
      return;
    }
    map.fitBounds(L.latLngBounds(items.map((a) => [a.latitude, a.longitude] as L.LatLngTuple)), {
      paddingTopLeft: [48, 48],
      paddingBottomRight: [rightInset, 48],
      maxZoom: 15,
    });
  }, [items, map, rightInset]);

  return null;
}

/** Chọn tài sản từ panel danh sách → đưa pin tương ứng vào tầm nhìn. */
function PanToSelected({ target }: { target: LocatedAsset | null }) {
  const map = useMap();
  const lastId = useRef<string | null>(null);

  useEffect(() => {
    if (!target || lastId.current === target.id) return;
    lastId.current = target.id;
    map.setView([target.latitude, target.longitude], Math.max(map.getZoom(), 13), {
      animate: !prefersReducedMotion(),
    });
  }, [target, map]);

  return null;
}

export interface AssetMapProps {
  items: AssetMapItem[];
  hoveredId: string | null;
  selectedId: string | null;
  onHover: (id: string | null) => void;
  onSelect: (id: string) => void;
  /** Bề rộng vùng bị panel che ở mép phải, để căn khung nhìn ban đầu cho đúng. */
  rightInset?: number;
}

export default function AssetMap({
  items,
  hoveredId,
  selectedId,
  onHover,
  onSelect,
  rightInset = 380,
}: AssetMapProps) {
  const located = items.filter(hasLocation);
  const selected = located.find((a) => a.id === selectedId) ?? null;

  return (
    <MapContainer
      center={FALLBACK_CENTER}
      zoom={11}
      zoomControl={false}
      scrollWheelZoom
      style={{ height: "100%", width: "100%" }}
    >
      <TileLayer url={POSITRON_URL} attribution={POSITRON_ATTRIB} />
      <FitToAssets items={located} rightInset={rightInset} />
      <PanToSelected target={selected} />

      <MarkerClusterGroup
        chunkedLoading
        showCoverageOnHover={false}
        maxClusterRadius={56}
        iconCreateFunction={clusterIcon}
      >
        {located.map((a) => (
          <Marker
            key={a.id}
            position={[a.latitude, a.longitude]}
            icon={pinIcon(a.status, a.type, a.id === hoveredId || a.id === selectedId)}
            alt={a.name}
            eventHandlers={{
              mouseover: () => onHover(a.id),
              mouseout: () => onHover(null),
              click: () => onSelect(a.id),
              keypress: (e) => {
                if ((e.originalEvent as KeyboardEvent).key === "Enter") onSelect(a.id);
              },
            }}
          />
        ))}
      </MarkerClusterGroup>
    </MapContainer>
  );
}
