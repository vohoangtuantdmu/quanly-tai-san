import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { StoreProvider } from "@/lib/store";
import { AuthProvider } from "@/lib/auth/AuthContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { EmailNotConfirmedBanner } from "@/components/auth/EmailNotConfirmedBanner";
import { UserMenu } from "@/components/layout/UserMenu";
import { IconRail } from "@/components/layout/IconRail";
import { Toaster } from "@/components/ui/sonner";
import { isPublicPath } from "@/lib/publicPaths";
import { PanelLeftOpen } from "lucide-react";
import { RailContext } from "@/components/layout/RailContext";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Không tìm thấy trang</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn tìm không tồn tại hoặc đã được di chuyển.
        </p>
        <div className="mt-6">
          <Link
            to="/ban-do"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Về bản đồ tài sản
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Không tải được trang</h1>
        <p className="mt-2 text-sm text-muted-foreground">Đã có lỗi xảy ra. Bạn có thể thử lại.</p>
        <div className="mt-6 flex justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Thử lại
          </button>
          <a
            href="/"
            className="rounded-md border border-input bg-background px-4 py-2 text-sm font-medium hover:bg-accent"
          >
            Về trang chủ
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Tổng quan — Quản Lý Tài Sản" },
      {
        name: "description",
        content:
          "Quản lý tài sản, hợp đồng thuê, thu chi, giấy tờ và nhắc lịch cho chủ sở hữu và người quản lý bất động sản cá nhân.",
      },
      { property: "og:title", content: "Tổng quan — Quản Lý Tài Sản" },
      {
        property: "og:description",
        content:
          "Quản lý tài sản, hợp đồng thuê, thu chi, giấy tờ và nhắc lịch cho chủ sở hữu và người quản lý bất động sản cá nhân.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Tổng quan — Quản Lý Tài Sản" },
      {
        name: "twitter:description",
        content:
          "Quản lý tài sản, hợp đồng thuê, thu chi, giấy tờ và nhắc lịch cho chủ sở hữu và người quản lý bất động sản cá nhân.",
      },
      {
        property: "og:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3fd4e92d-33d7-498f-b0e7-7fb7e7acd410/id-preview-51adc2ec--59343277-9417-41ca-9535-172b07627c64.lovable.app-1784196920416.png",
      },
      {
        name: "twitter:image",
        content:
          "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/3fd4e92d-33d7-498f-b0e7-7fb7e7acd410/id-preview-51adc2ec--59343277-9417-41ca-9535-172b07627c64.lovable.app-1784196920416.png",
      },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="vi">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <StoreProvider>
          <AppShell />
          <Toaster position="top-right" richColors />
        </StoreProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

/** Route mà bản đồ phải chiếm trọn viewport — rail thu gọn, không header, không banner. */
const MAP_PATH = "/ban-do";

function AppShell() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isMapPage = pathname === MAP_PATH || pathname === MAP_PATH + "/";

  // Rail mặc định ẨN ở màn Bản đồ, HIỆN ở mọi trang khác. Đặt lại theo route mỗi lần
  // chuyển trang: rời bản đồ là rail cố định tự trở lại, người dùng không phải tự bật.
  const [railOpen, setRailOpen] = useState(!isMapPage);
  useEffect(() => setRailOpen(!isMapPage), [isMapPage]);
  const railApi = useMemo(() => ({ openRail: () => setRailOpen(true) }), []);

  if (isPublicPath(pathname)) {
    return <Outlet />;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      {/* Trang thường: rail chiếm chỗ cố định. Màn bản đồ: rail là lớp phủ tạm thời để
          bản đồ vẫn giữ trọn chiều rộng. */}
      {railOpen && !isMapPage && (
        <IconRail variant="static" onCollapse={() => setRailOpen(false)} />
      )}

      {isMapPage && railOpen && (
        <>
          <button
            type="button"
            aria-label="Đóng thanh điều hướng"
            className="fixed inset-0 z-[1200] bg-black/20"
            onClick={() => setRailOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 z-[1201]">
            <IconRail
              variant="overlay"
              onCollapse={() => setRailOpen(false)}
              onNavigate={() => setRailOpen(false)}
            />
          </div>
        </>
      )}

      {/* Rail đang thu: nút tròn nhỏ để mở lại. Ở màn bản đồ, nút ☰ nằm trên thanh nổi
          của chính trang đó nên không cần nút này. */}
      {!railOpen && !isMapPage && (
        <button
          type="button"
          onClick={() => setRailOpen(true)}
          aria-label="Mở thanh điều hướng"
          className="fixed top-3 left-3 z-40 flex h-9 w-9 items-center justify-center rounded-full border bg-card/90 shadow-md backdrop-blur transition-colors hover:bg-card focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <PanelLeftOpen className="h-4 w-4" />
        </button>
      )}

      <RailContext.Provider value={railApi}>
        <div className="flex min-w-0 flex-1 flex-col">
          {!isMapPage && (
            <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b bg-card/80 px-4 backdrop-blur">
              <div className="flex-1 text-sm text-muted-foreground">Nền tảng Quản Lý Tài Sản</div>
              <UserMenu />
            </header>
          )}
          {!isMapPage && <EmailNotConfirmedBanner />}
          <main className={isMapPage ? "h-screen min-w-0" : "min-w-0 flex-1"}>
            <ProtectedRoute>
              <Outlet />
            </ProtectedRoute>
          </main>
        </div>
      </RailContext.Provider>
    </div>
  );
}
