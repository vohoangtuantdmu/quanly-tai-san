import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { formatVND, formatDate, daysUntil, monthKey } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Building2, TrendingUp, TrendingDown, AlertTriangle, ArrowRight, CalendarClock, FileWarning } from "lucide-react";
import { ContractStatusBadge } from "@/components/StatusBadge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from "recharts";

export const Route = createFileRoute("/")({
  head: () => ({ meta: [{ title: "Tổng quan — Quản Lý Tài Sản" }] }),
  component: Dashboard,
});

function StatCard({ icon: Icon, label, value, tone, sub }: { icon: React.ElementType; label: string; value: string; tone: "primary" | "success" | "destructive" | "warning"; sub?: string }) {
  const toneMap = {
    primary: "bg-primary/10 text-primary",
    success: "bg-success/15 text-success",
    destructive: "bg-destructive/15 text-destructive",
    warning: "bg-warning/20 text-warning-foreground",
  };
  return (
    <Card>
      <CardContent className="p-5">
        <div className="flex items-center justify-between">
          <div className="min-w-0">
            <div className="text-xs uppercase tracking-wide text-muted-foreground">{label}</div>
            <div className="mt-1 text-2xl font-semibold truncate">{value}</div>
            {sub && <div className="mt-1 text-xs text-muted-foreground">{sub}</div>}
          </div>
          <div className={`flex h-10 w-10 items-center justify-center rounded-md ${toneMap[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function Dashboard() {
  const { assets, contracts, cashflow, reminders, documents } = useStore();

  const now = new Date();
  const thisMonth = monthKey(now);

  const stats = useMemo(() => {
    const monthIn = cashflow.filter((e) => e.direction === "Thu" && monthKey(e.occurredAt) === thisMonth).reduce((s, e) => s + e.amount, 0);
    const monthOut = cashflow.filter((e) => e.direction === "Chi" && monthKey(e.occurredAt) === thisMonth).reduce((s, e) => s + e.amount, 0);
    const expiring = contracts.filter((c) => c.status === "Đang hiệu lực" && daysUntil(c.endDate) <= 30 && daysUntil(c.endDate) >= 0).length;
    return { monthIn, monthOut, expiring };
  }, [cashflow, contracts, thisMonth]);

  const chartData = useMemo(() => {
    const map: Record<string, { month: string; thu: number; chi: number }> = {};
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = monthKey(d);
      map[key] = { month: `T${d.getMonth() + 1}`, thu: 0, chi: 0 };
    }
    cashflow.forEach((e) => {
      const k = monthKey(e.occurredAt);
      if (map[k]) {
        if (e.direction === "Thu") map[k].thu += e.amount;
        else map[k].chi += e.amount;
      }
    });
    return Object.values(map);
  }, [cashflow]);

  const upcomingReminders = reminders
    .filter((r) => r.enabled && daysUntil(r.dueDate) >= 0 && daysUntil(r.dueDate) <= 7)
    .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime());

  const expiringContracts = contracts
    .filter((c) => c.status === "Đang hiệu lực" && daysUntil(c.endDate) <= 30 && daysUntil(c.endDate) >= 0)
    .sort((a, b) => new Date(a.endDate).getTime() - new Date(b.endDate).getTime());

  const expiringDocs = documents
    .filter((d) => d.expiryDate && daysUntil(d.expiryDate) <= 60 && daysUntil(d.expiryDate) >= -30)
    .sort((a, b) => new Date(a.expiryDate!).getTime() - new Date(b.expiryDate!).getTime());

  return (
    <div className="p-6 space-y-6 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Trang tổng quan</h1>
          <p className="text-sm text-muted-foreground mt-1">Toàn cảnh danh mục tài sản, thu chi và các mốc quan trọng.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={Building2} label="Tổng tài sản" value={String(assets.length)} tone="primary" sub={`${assets.filter(a => a.ownershipType === "Sở hữu").length} sở hữu · ${assets.filter(a => a.ownershipType === "Đi thuê").length} đi thuê`} />
        <StatCard icon={TrendingUp} label="Thu tháng này" value={formatVND(stats.monthIn)} tone="success" />
        <StatCard icon={TrendingDown} label="Chi tháng này" value={formatVND(stats.monthOut)} tone="destructive" />
        <StatCard icon={AlertTriangle} label="HĐ sắp hết hạn" value={String(stats.expiring)} tone="warning" sub="Trong vòng 30 ngày" />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Thu / Chi 6 tháng gần nhất</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border)" />
                <XAxis dataKey="month" stroke="var(--color-muted-foreground)" fontSize={12} />
                <YAxis stroke="var(--color-muted-foreground)" fontSize={12} tickFormatter={(v) => `${(v / 1_000_000).toFixed(0)}tr`} />
                <Tooltip formatter={(v: number) => formatVND(v)} contentStyle={{ background: "var(--color-card)", border: "1px solid var(--color-border)", borderRadius: 8 }} />
                <Legend />
                <Bar dataKey="thu" name="Thu" fill="var(--color-chart-2)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="chi" name="Chi" fill="var(--color-chart-4)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><CalendarClock className="h-4 w-4 text-primary" /> Nhắc lịch 7 ngày tới</CardTitle>
            <Link to="/nhac-lich" className="text-xs text-primary flex items-center gap-1 hover:underline">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {upcomingReminders.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Không có lịch nhắc nào.</p>}
            {upcomingReminders.map((r) => (
              <div key={r.id} className="flex items-start justify-between gap-3 p-3 rounded-md border bg-muted/30">
                <div className="min-w-0">
                  <div className="text-sm font-medium truncate">{r.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{r.type} · {formatDate(r.dueDate)}</div>
                </div>
                <Badge variant="outline" className="shrink-0">{daysUntil(r.dueDate)} ngày</Badge>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><AlertTriangle className="h-4 w-4 text-warning-foreground" /> HĐ sắp hết hạn</CardTitle>
            <Link to="/hop-dong" className="text-xs text-primary flex items-center gap-1 hover:underline">Xem tất cả <ArrowRight className="h-3 w-3" /></Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringContracts.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Không có hợp đồng nào.</p>}
            {expiringContracts.map((c) => {
              const asset = assets.find((a) => a.id === c.assetId);
              return (
                <div key={c.id} className="p-3 rounded-md border bg-muted/30">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="text-sm font-medium truncate">{c.code}</div>
                      <div className="text-xs text-muted-foreground truncate">{asset?.name}</div>
                    </div>
                    <ContractStatusBadge status={c.status} />
                  </div>
                  <div className="mt-2 text-xs text-muted-foreground">Hết hạn: {formatDate(c.endDate)} · còn {daysUntil(c.endDate)} ngày</div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base flex items-center gap-2"><FileWarning className="h-4 w-4 text-destructive" /> Giấy tờ sắp hết hạn</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {expiringDocs.length === 0 && <p className="text-sm text-muted-foreground py-4 text-center">Không có giấy tờ nào.</p>}
            {expiringDocs.map((d) => {
              const asset = assets.find((a) => a.id === d.assetId);
              const days = daysUntil(d.expiryDate!);
              return (
                <div key={d.id} className="p-3 rounded-md border bg-muted/30">
                  <div className="text-sm font-medium truncate">{d.name}</div>
                  <div className="text-xs text-muted-foreground truncate">{asset?.name} · {d.type}</div>
                  <div className={`mt-1 text-xs ${days < 0 ? "text-destructive" : days < 30 ? "text-warning-foreground" : "text-muted-foreground"}`}>
                    {days < 0 ? `Đã quá hạn ${Math.abs(days)} ngày` : `Còn ${days} ngày (${formatDate(d.expiryDate!)})`}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
