import { Link, useRouterState } from "@tanstack/react-router";
import {
  Map as MapIcon,
  Building2,
  FileText,
  Users,
  Wallet,
  Bell,
  Tag,
  Megaphone,
  Globe,
  ShieldCheck,
  ChevronsLeft,
} from "lucide-react";
import { useAuth } from "@/lib/auth/AuthContext";
import { UserMenu } from "@/components/layout/UserMenu";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export const RAIL_WIDTH = 72;

// "Tổng quan" đã gộp vào Bản đồ tài sản — "/" giờ chỉ redirect, không còn mục riêng.
const ITEMS = [
  { title: "Bản đồ tài sản", url: "/ban-do", icon: MapIcon },
  { title: "Tài sản", url: "/tai-san", icon: Building2 },
  { title: "Hợp đồng", url: "/hop-dong", icon: FileText },
  { title: "Sổ đối tác", url: "/doi-tac", icon: Users },
  { title: "Sổ thu chi", url: "/thu-chi", icon: Wallet },
  { title: "Nhắc lịch", url: "/nhac-lich", icon: Bell },
  { title: "Rao bán", url: "/rao-ban", icon: Tag },
  { title: "Tin đăng của tôi", url: "/my-listings", icon: Megaphone },
] as const;

export interface IconRailProps {
  /** "static" = chiếm chỗ cố định ở trang thường; "overlay" = đè lên bản đồ, tạm thời. */
  variant: "static" | "overlay";
  onCollapse: () => void;
  /** Overlay tự đóng sau khi chọn xong một mục điều hướng. */
  onNavigate?: () => void;
}

export function IconRail({ variant, onCollapse, onNavigate }: IconRailProps) {
  const pathname = useRouterState({ select: (r) => r.location.pathname });
  const { isAdmin } = useAuth();
  const isActive = (u: string) => (u === "/" ? pathname === "/" : pathname.startsWith(u));

  const railItem = (key: string, title: string, active: boolean, content: React.ReactNode) => (
    <Tooltip key={key}>
      <TooltipTrigger asChild>{content}</TooltipTrigger>
      {/* Không giãn rail khi hover — chỉ hiện tooltip bên phải */}
      <TooltipContent side="right" sideOffset={8}>
        {title}
      </TooltipContent>
    </Tooltip>
  );

  return (
    <TooltipProvider delayDuration={300}>
      <nav
        aria-label="Điều hướng chính"
        className={`icon-rail flex shrink-0 flex-col items-center gap-1 py-3 ${
          variant === "overlay" ? "icon-rail--overlay" : ""
        }`}
        style={{ width: RAIL_WIDTH }}
      >
        <Link
          to="/ban-do"
          onClick={onNavigate}
          aria-label="Trang chủ"
          className="mb-2 flex h-10 w-10 items-center justify-center rounded-xl bg-white text-[#1E2761] focus-visible:ring-2 focus-visible:ring-[#F2A93B] focus-visible:outline-none"
        >
          <Building2 className="h-5 w-5" />
        </Link>

        {ITEMS.map((it) =>
          railItem(
            it.url,
            it.title,
            isActive(it.url),
            <Link
              to={it.url}
              onClick={onNavigate}
              aria-label={it.title}
              aria-current={isActive(it.url) ? "page" : undefined}
              className={`icon-rail__item ${isActive(it.url) ? "icon-rail__item--active" : ""}`}
            >
              <it.icon className="h-5 w-5" />
            </Link>,
          ),
        )}

        {isAdmin &&
          railItem(
            "/admin",
            "Duyệt tin đăng",
            isActive("/admin"),
            <Link
              to="/admin/properties"
              onClick={onNavigate}
              aria-label="Duyệt tin đăng"
              className={`icon-rail__item ${isActive("/admin") ? "icon-rail__item--active" : ""}`}
            >
              <ShieldCheck className="h-5 w-5" />
            </Link>,
          )}

        <div className="my-1 h-px w-8 bg-white/15" />

        {railItem(
          "marketplace",
          "Marketplace (tab mới)",
          false,
          <a
            href="/tin-dang"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Marketplace"
            className="icon-rail__item"
          >
            <Globe className="h-5 w-5" />
          </a>,
        )}

        <div className="mt-auto flex flex-col items-center gap-2">
          {railItem(
            "collapse",
            "Thu gọn thanh điều hướng",
            false,
            <button
              type="button"
              onClick={onCollapse}
              aria-label="Thu gọn thanh điều hướng"
              className="icon-rail__item"
            >
              <ChevronsLeft className="h-4 w-4" />
            </button>,
          )}
          {/* Avatar luôn ở đáy — cũng là nơi truy cập hồ sơ/đăng xuất */}
          <div className="icon-rail__avatar">
            <UserMenu compact />
          </div>
        </div>
      </nav>
    </TooltipProvider>
  );
}
