import { forwardRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import { formatListingPrice, type PublicPropertySummaryDto } from "@/lib/api/properties";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heart, MapPin, BedDouble, Bath, Ruler, ImageIcon, CheckCircle2 } from "lucide-react";

/** "Đăng 2 ngày trước" — chỉ hiện khi có createdAt (field còn cần backend xác nhận). */
function postedAgoLabel(iso: string): string {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
  if (days <= 0) return "Đăng hôm nay";
  if (days === 1) return "Đăng 1 ngày trước";
  if (days < 30) return `Đăng ${days} ngày trước`;
  const months = Math.floor(days / 30);
  return `Đăng ${months} tháng trước`;
}

interface PropertyListCardProps {
  property: PublicPropertySummaryDto;
  hovered: boolean;
  highlighted: boolean;
  onHover: () => void;
  onLeave: () => void;
}

export const PropertyListCard = forwardRef<HTMLDivElement, PropertyListCardProps>(
  function PropertyListCard({ property: p, hovered, highlighted, onHover, onLeave }, ref) {
    const [favorited, setFavorited] = useState(false);
    const distanceKm = p.distanceMeters != null ? p.distanceMeters / 1000 : null;

    return (
      <div ref={ref} onMouseEnter={onHover} onMouseLeave={onLeave}>
        <Link to="/tin-dang/$slug" params={{ slug: p.slug }}>
          <Card
            className={`overflow-hidden py-0 gap-0 h-full transition-all duration-150 ${
              hovered ? "shadow-lg -translate-y-0.5" : "shadow-sm"
            } ${highlighted ? "ring-2 ring-primary" : ""}`}
          >
            <div className="relative aspect-[4/3] bg-muted">
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
              <button
                type="button"
                aria-label={favorited ? "Bỏ yêu thích" : "Yêu thích"}
                onClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  setFavorited((f) => !f);
                }}
                className="absolute top-2 right-2 h-8 w-8 rounded-full bg-white/90 backdrop-blur flex items-center justify-center shadow-sm hover:bg-white transition-colors"
              >
                <Heart
                  className={`h-4 w-4 ${favorited ? "fill-destructive text-destructive" : "text-muted-foreground"}`}
                />
              </button>
              <Badge className="absolute top-2 left-2 bg-success/90 hover:bg-success/90 text-success-foreground gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Đã duyệt
              </Badge>
            </div>
            <div className="p-4 space-y-1.5">
              <div className="text-lg font-bold text-foreground">
                {formatListingPrice(p.price, p.type, p.rentPaymentCycle)}
              </div>
              <div className="font-medium line-clamp-1">{p.title}</div>
              <div className="text-sm text-muted-foreground flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5 shrink-0" />
                <span className="truncate">
                  {[p.district, p.city].filter(Boolean).join(", ")}
                  {distanceKm != null && ` · ${distanceKm.toFixed(1)}km`}
                </span>
              </div>
              <div className="flex items-center gap-3 text-xs text-muted-foreground pt-0.5">
                {p.bedrooms != null && (
                  <span className="flex items-center gap-1">
                    <BedDouble className="h-3.5 w-3.5" />
                    {p.bedrooms} PN
                  </span>
                )}
                {p.bathrooms != null && (
                  <span className="flex items-center gap-1">
                    <Bath className="h-3.5 w-3.5" />
                    {p.bathrooms} WC
                  </span>
                )}
                {p.area != null && (
                  <span className="flex items-center gap-1">
                    <Ruler className="h-3.5 w-3.5" />
                    {p.area}m²
                  </span>
                )}
              </div>
              {p.createdAt && (
                <div className="text-xs text-muted-foreground/80 pt-0.5">
                  {postedAgoLabel(p.createdAt)}
                </div>
              )}
            </div>
          </Card>
        </Link>
      </div>
    );
  },
);
