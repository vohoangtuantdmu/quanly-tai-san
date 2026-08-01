// Bản đồ chuyên dụng cho Marketplace — marker dạng viên thuốc hiện giá, đồng bộ
// hover 2 chiều với danh sách. Tách riêng khỏi LeafletMap (dùng cho picker vị trí/
// hiển thị 1 điểm ở Nhóm A) vì nhu cầu marker hoàn toàn khác (custom DivIcon, click/
// hover callback theo từng item) — nhưng TÁI SỬ DỤNG đúng cấu hình OSM tile/attribution
// đã dùng ở LeafletMap, không setup lại từ đầu.
// Client-only, load qua React.lazy (xem PropertyMapClient.tsx).
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { MapContainer, TileLayer, Marker, useMap } from "react-leaflet";
import { useEffect, useMemo } from "react";
import { formatCurrency } from "@/lib/format";
import type { ListingTypeCode } from "@/constants/enums";

const OSM_URL = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png";
const OSM_ATTRIB = '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>';

// Bán = navy (màu primary chủ đạo của app), Cho thuê = xanh (màu success) —
// dùng đúng token ngữ nghĩa hệ thống, không tạo bảng màu riêng cho Marketplace.
const TYPE_BORDER: Record<ListingTypeCode, string> = {
  1: "var(--color-primary)",
  2: "var(--color-success)",
};

export interface PropertyMapPoint {
  id: string;
  lat: number;
  lng: number;
  price: number;
  type: ListingTypeCode;
}

function pillIcon(point: PropertyMapPoint, hovered: boolean): L.DivIcon {
  const border = TYPE_BORDER[point.type];
  const padding = hovered ? "5px 11px" : "4px 10px";
  const bg = hovered ? border : "white";
  const color = hovered ? "white" : "#111827";
  const shadow = hovered ? "0 4px 10px rgba(0,0,0,0.25)" : "0 1px 3px rgba(0,0,0,0.15)";
  const scale = hovered ? "scale(1.15)" : "scale(1)";
  const label = formatCurrency(point.price, { compact: true });
  const html = `<div style="display:inline-flex;align-items:center;padding:${padding};border-radius:999px;background:${bg};color:${color};border:2px solid ${border};font-size:12px;font-weight:600;white-space:nowrap;box-shadow:${shadow};transform:${scale};transition:transform 150ms, background 150ms, color 150ms;">${label}</div>`;
  return L.divIcon({
    html,
    className: "property-pill-marker", // reset style mặc định của leaflet cho div icon
    iconSize: undefined,
    iconAnchor: [hovered ? 30 : 26, 14],
  });
}

function FitBounds({ points }: { points: PropertyMapPoint[] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length === 0) return;
    if (points.length === 1) {
      map.flyTo([points[0].lat, points[0].lng], 14, { duration: 0.5 });
      return;
    }
    const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
    map.flyToBounds(bounds, { padding: [40, 40], duration: 0.5, maxZoom: 15 });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [points.map((p) => p.id).join(","), map]);
  return null;
}

interface PropertyMapProps {
  points: PropertyMapPoint[];
  hoveredId: string | null;
  onHoverPoint: (id: string | null) => void;
  onClickPoint: (id: string) => void;
  defaultCenter: [number, number];
  className?: string;
}

export default function PropertyMap({
  points,
  hoveredId,
  onHoverPoint,
  onClickPoint,
  defaultCenter,
  className,
}: PropertyMapProps) {
  const icons = useMemo(
    () => new Map(points.map((p) => [p.id, pillIcon(p, p.id === hoveredId)])),
    [points, hoveredId],
  );

  return (
    <div className={className} style={{ height: "100%", width: "100%" }}>
      <MapContainer
        center={defaultCenter}
        zoom={12}
        style={{ height: "100%", width: "100%" }}
        scrollWheelZoom
      >
        <TileLayer url={OSM_URL} attribution={OSM_ATTRIB} />
        <FitBounds points={points} />
        {points.map((p) => (
          <Marker
            key={p.id}
            position={[p.lat, p.lng]}
            icon={icons.get(p.id)}
            eventHandlers={{
              mouseover: () => onHoverPoint(p.id),
              mouseout: () => onHoverPoint(null),
              click: () => onClickPoint(p.id),
            }}
          />
        ))}
      </MapContainer>
    </div>
  );
}
