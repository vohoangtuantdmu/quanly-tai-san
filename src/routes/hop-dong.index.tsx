import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { formatDate, formatVND, daysUntil } from "@/lib/format";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ContractStatusBadge } from "@/components/StatusBadge";
import { Plus, Search, AlertTriangle } from "lucide-react";
import type { ContractDirection, ContractStatus } from "@/lib/types";
import { RenewContractDialog, TerminateContractDialog } from "@/components/contracts/ContractDialogs";

export const Route = createFileRoute("/hop-dong/")({
  head: () => ({ meta: [{ title: "Quản lý hợp đồng — Quản Lý Tài Sản" }] }),
  component: ContractList,
});

function ContractList() {
  const navigate = useNavigate();
  const store = useStore();
  const [q, setQ] = useState("");
  const [fDir, setFDir] = useState<ContractDirection | "all">("all");
  const [fStatus, setFStatus] = useState<ContractStatus | "all" | "expiring">("all");
  const [renewOpen, setRenewOpen] = useState<string | null>(null);
  const [termOpen, setTermOpen] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return store.contracts.filter((c) => {
      if (fDir !== "all" && c.direction !== fDir) return false;
      if (fStatus === "expiring") {
        if (c.status !== "Đang hiệu lực") return false;
        const d = daysUntil(c.endDate);
        if (!(d >= 0 && d <= 60)) return false;
      } else if (fStatus !== "all" && c.status !== fStatus) return false;
      if (q) {
        const asset = store.assets.find((a) => a.id === c.assetId);
        const cp = store.contacts.find((x) => x.id === c.counterpartyId);
        const text = `${c.code} ${asset?.name ?? ""} ${cp?.name ?? ""}`.toLowerCase();
        if (!text.includes(q.toLowerCase())) return false;
      }
      return true;
    });
  }, [store.contracts, store.assets, store.contacts, q, fDir, fStatus]);

  return (
    <div className="p-6 space-y-5 max-w-[1400px]">
      <div className="flex items-end justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Quản lý hợp đồng</h1>
          <p className="text-sm text-muted-foreground mt-1">Tất cả hợp đồng thuê hai chiều: cho thuê tài sản của bạn và thuê từ chủ nhà khác.</p>
        </div>
        <Button onClick={() => navigate({ to: "/hop-dong/moi" })}><Plus className="h-4 w-4 mr-1.5" />Tạo hợp đồng mới</Button>
      </div>

      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Tìm mã HĐ, tài sản, đối tác..." className="pl-9" value={q} onChange={(e) => setQ(e.target.value)} />
          </div>
          <Select value={fDir} onValueChange={(v) => setFDir(v as ContractDirection | "all")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả chiều</SelectItem>
              <SelectItem value="Cho thuê">Cho thuê</SelectItem>
              <SelectItem value="Đi thuê">Đi thuê</SelectItem>
            </SelectContent>
          </Select>
          <Select value={fStatus} onValueChange={(v) => setFStatus(v as ContractStatus | "all" | "expiring")}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tất cả trạng thái</SelectItem>
              <SelectItem value="expiring">Sắp hết hạn (60 ngày)</SelectItem>
              {["Đang hiệu lực", "Nháp", "Hết hạn", "Đã chấm dứt", "Đã gia hạn"].map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Mã HĐ</TableHead>
                <TableHead>Tài sản</TableHead>
                <TableHead>Chiều</TableHead>
                <TableHead>Đối tác</TableHead>
                <TableHead>Kỳ hạn</TableHead>
                <TableHead className="text-right">Giá thuê</TableHead>
                <TableHead>Trạng thái</TableHead>
                <TableHead></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 && (
                <TableRow><TableCell colSpan={8} className="text-center py-10 text-muted-foreground text-sm">Không có hợp đồng nào phù hợp.</TableCell></TableRow>
              )}
              {filtered.map((c) => {
                const asset = store.assets.find((a) => a.id === c.assetId);
                const unit = c.unitId ? store.units.find((u) => u.id === c.unitId) : null;
                const cp = store.contacts.find((x) => x.id === c.counterpartyId);
                const remaining = daysUntil(c.endDate);
                return (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.code}
                      {c.parentContractId && <Badge variant="outline" className="ml-2 text-xs">Nối tiếp</Badge>}
                    </TableCell>
                    <TableCell>
                      <Link to="/tai-san/$id" params={{ id: c.assetId }} className="hover:underline">{asset?.name}</Link>
                      {unit && <div className="text-xs text-muted-foreground">{unit.name}</div>}
                    </TableCell>
                    <TableCell><Badge variant={c.direction === "Cho thuê" ? "default" : "secondary"}>{c.direction}</Badge></TableCell>
                    <TableCell className="text-sm">{cp?.name ?? "—"}</TableCell>
                    <TableCell className="text-sm">
                      <div>{formatDate(c.startDate)}</div>
                      <div className="text-xs text-muted-foreground">→ {formatDate(c.endDate)}</div>
                    </TableCell>
                    <TableCell className="text-right font-medium">
                      {formatVND(c.rentAmount)}
                      <div className="text-xs text-muted-foreground font-normal">{c.paymentCycle}</div>
                    </TableCell>
                    <TableCell>
                      <ContractStatusBadge status={c.status} />
                      {c.status === "Đang hiệu lực" && remaining >= 0 && remaining <= 30 && (
                        <div className="text-xs text-warning-foreground mt-1 flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Còn {remaining} ngày</div>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {c.status === "Đang hiệu lực" && (
                        <div className="flex gap-1 justify-end">
                          <Button size="sm" variant="outline" onClick={() => setRenewOpen(c.id)}>Gia hạn</Button>
                          <Button size="sm" variant="ghost" onClick={() => setTermOpen(c.id)}>Chấm dứt</Button>
                        </div>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {renewOpen && <RenewContractDialog contractId={renewOpen} open={!!renewOpen} onOpenChange={(v: boolean) => !v && setRenewOpen(null)} />}
      {termOpen && <TerminateContractDialog contractId={termOpen} open={!!termOpen} onOpenChange={(v: boolean) => !v && setTermOpen(null)} />}
    </div>
  );
}
