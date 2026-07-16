import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useStore } from "@/lib/store";
import { formatVND, formatDate, daysUntil } from "@/lib/format";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AssetStatusBadge, ContractStatusBadge, UnitStatusBadge } from "@/components/StatusBadge";
import { ArrowLeft, Pencil, Trash2, Tag, MapPin, Ruler, Calendar, Wallet, Wrench, ImagePlus, FileText, Package, Bell, Plus, AlertTriangle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { RenewContractDialog, TerminateContractDialog } from "@/components/contracts/ContractDialogs";
import { AddMaintenanceDialog } from "@/components/AddMaintenanceDialog";

export const Route = createFileRoute("/tai-san/$id")({
  head: () => ({ meta: [{ title: "Chi tiết tài sản — Quản Lý Tài Sản" }] }),
  component: AssetDetail,
});

function AssetDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const store = useStore();
  const asset = store.assets.find((a) => a.id === id);

  const [renewOpen, setRenewOpen] = useState<string | null>(null);
  const [termOpen, setTermOpen] = useState<string | null>(null);
  const [maintOpen, setMaintOpen] = useState(false);

  if (!asset) {
    return (
      <div className="p-6">
        <p className="text-muted-foreground">Không tìm thấy tài sản.</p>
        <Button variant="outline" className="mt-4" asChild><Link to="/tai-san">Quay lại danh sách</Link></Button>
      </div>
    );
  }

  const units = store.units.filter((u) => u.assetId === id);
  const assetContracts = store.contracts.filter((c) => c.assetId === id);
  const cashflow = store.cashflow.filter((e) => e.assetId === id);
  const documents = store.documents.filter((d) => d.assetId === id);
  const media = store.media.filter((m) => m.assetId === id);
  const equipment = store.equipment.filter((e) => e.assetId === id);
  const maintenance = store.maintenance.filter((m) => m.assetId === id);

  const totalIn = cashflow.filter((e) => e.direction === "Thu").reduce((s, e) => s + e.amount, 0);
  const totalOut = cashflow.filter((e) => e.direction === "Chi").reduce((s, e) => s + e.amount, 0);

  const handleDelete = () => {
    store.deleteAsset(id);
    toast.success("Đã xoá tài sản");
    navigate({ to: "/tai-san" });
  };

  return (
    <div className="max-w-[1400px]">
      {/* Header */}
      <div className="relative h-56 bg-gradient-to-br from-primary/20 to-primary/5 overflow-hidden">
        <img src={asset.thumbnail} alt={asset.name} className="w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute top-4 left-4">
          <Button variant="secondary" size="sm" asChild>
            <Link to="/tai-san"><ArrowLeft className="h-4 w-4 mr-1.5" />Quay lại</Link>
          </Button>
        </div>
        <div className="absolute bottom-4 left-6 right-6 flex items-end justify-between gap-4 flex-wrap">
          <div className="text-primary-foreground">
            <div className="flex items-center gap-2 mb-2">
              <AssetStatusBadge status={asset.status} />
              <Badge variant="secondary">{asset.type}</Badge>
              <Badge variant="secondary">{asset.ownershipType}</Badge>
            </div>
            <h1 className="text-3xl font-semibold text-white drop-shadow">{asset.name}</h1>
            <div className="flex items-center gap-1.5 text-white/90 text-sm mt-1">
              <MapPin className="h-4 w-4" />
              {asset.addressDetail}, {asset.ward}, {asset.district}, {asset.city}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {asset.status !== "Đang rao bán" && asset.ownershipType === "Sở hữu" && (
              <Button variant="secondary" size="sm"><Tag className="h-4 w-4 mr-1.5" />Đăng rao bán</Button>
            )}
            <Button variant="secondary" size="sm"><Pencil className="h-4 w-4 mr-1.5" />Sửa</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-4 w-4 mr-1.5" />Xoá</Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Xoá tài sản "{asset.name}"?</AlertDialogTitle>
                  <AlertDialogDescription>Toàn bộ hợp đồng, giấy tờ, thu chi liên quan sẽ vẫn giữ nhưng tài sản này sẽ biến mất khỏi danh sách.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Huỷ</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete}>Xoá</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </div>
      </div>

      <div className="p-6">
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="w-full justify-start overflow-x-auto flex-wrap h-auto">
            <TabsTrigger value="overview">Tổng quan</TabsTrigger>
            <TabsTrigger value="units">Tầng/Phòng {units.length > 0 && <Badge variant="secondary" className="ml-1.5">{units.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="contracts">Hợp đồng {assetContracts.length > 0 && <Badge variant="secondary" className="ml-1.5">{assetContracts.length}</Badge>}</TabsTrigger>
            <TabsTrigger value="media">Ảnh</TabsTrigger>
            <TabsTrigger value="documents">Giấy tờ</TabsTrigger>
            <TabsTrigger value="cashflow">Thu chi</TabsTrigger>
            <TabsTrigger value="equipment">Thiết bị</TabsTrigger>
            <TabsTrigger value="maintenance">Sửa chữa</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-4 space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              <Card className="lg:col-span-2">
                <CardHeader><CardTitle className="text-base">Thông tin cơ bản</CardTitle></CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                    <div><dt className="text-muted-foreground text-xs">Loại tài sản</dt><dd className="font-medium mt-1">{asset.type}</dd></div>
                    <div><dt className="text-muted-foreground text-xs">Hình thức</dt><dd className="font-medium mt-1">{asset.ownershipType}</dd></div>
                    <div><dt className="text-muted-foreground text-xs">Trạng thái</dt><dd className="mt-1"><AssetStatusBadge status={asset.status} /></dd></div>
                    <div><dt className="text-muted-foreground text-xs flex items-center gap-1"><Ruler className="h-3 w-3" />Diện tích</dt><dd className="font-medium mt-1">{asset.area} m²</dd></div>
                    <div><dt className="text-muted-foreground text-xs flex items-center gap-1"><Wallet className="h-3 w-3" />Giá trị hiện tại</dt><dd className="font-medium mt-1">{asset.ownershipType === "Sở hữu" ? formatVND(asset.currentValue) : "—"}</dd></div>
                    <div><dt className="text-muted-foreground text-xs flex items-center gap-1"><Calendar className="h-3 w-3" />{asset.ownershipType === "Sở hữu" ? "Ngày mua" : "Ngày bắt đầu thuê"}</dt><dd className="font-medium mt-1">{formatDate(asset.acquisitionDate)}</dd></div>
                    {asset.floors && <div><dt className="text-muted-foreground text-xs">Số tầng</dt><dd className="font-medium mt-1">{asset.floors}</dd></div>}
                    {asset.bedrooms && <div><dt className="text-muted-foreground text-xs">Phòng ngủ</dt><dd className="font-medium mt-1">{asset.bedrooms}</dd></div>}
                  </dl>
                </CardContent>
              </Card>
              <Card>
                <CardHeader><CardTitle className="text-base">Vị trí trên bản đồ</CardTitle></CardHeader>
                <CardContent>
                  <div className="relative h-52 rounded-md overflow-hidden bg-muted">
                    <img src="https://images.unsplash.com/photo-1524661135-423995f22d0b?w=800" alt="Bản đồ" className="w-full h-full object-cover opacity-70" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <MapPin className="h-10 w-10 text-primary drop-shadow-lg fill-primary/50" />
                    </div>
                  </div>
                  <div className="text-xs text-muted-foreground mt-2">Toạ độ: {asset.lat.toFixed(4)}, {asset.lng.toFixed(4)}</div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="units" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Danh sách tầng/phòng</CardTitle>
                <Button size="sm" variant="outline"><Plus className="h-4 w-4 mr-1.5" />Thêm phòng</Button>
              </CardHeader>
              <CardContent>
                {units.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Tài sản này khai thác nguyên căn — chưa chia phòng.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Tên</TableHead><TableHead>Tầng</TableHead><TableHead>Diện tích</TableHead><TableHead>Trạng thái</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {units.map((u) => (
                        <TableRow key={u.id}>
                          <TableCell className="font-medium">{u.name}</TableCell>
                          <TableCell>Tầng {u.floor}</TableCell>
                          <TableCell>{u.area} m²</TableCell>
                          <TableCell><UnitStatusBadge status={u.status} /></TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contracts" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Hợp đồng của tài sản này</CardTitle>
                <Button size="sm" asChild><Link to="/hop-dong/moi" search={{ assetId: id }}><Plus className="h-4 w-4 mr-1.5" />Tạo hợp đồng</Link></Button>
              </CardHeader>
              <CardContent>
                {assetContracts.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted-foreground">Chưa có hợp đồng nào.</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Mã HĐ</TableHead><TableHead>Chiều</TableHead><TableHead>Đối tác</TableHead>
                        <TableHead>Kỳ hạn</TableHead><TableHead className="text-right">Giá thuê</TableHead>
                        <TableHead>Trạng thái</TableHead><TableHead></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {assetContracts.map((c) => {
                        const cp = store.contacts.find((x) => x.id === c.counterpartyId);
                        const unit = c.unitId ? store.units.find((u) => u.id === c.unitId) : null;
                        const remaining = daysUntil(c.endDate);
                        return (
                          <TableRow key={c.id}>
                            <TableCell>
                              <div className="font-medium">{c.code}</div>
                              {unit && <div className="text-xs text-muted-foreground">{unit.name}</div>}
                            </TableCell>
                            <TableCell><Badge variant={c.direction === "Cho thuê" ? "default" : "secondary"}>{c.direction}</Badge></TableCell>
                            <TableCell className="text-sm">{cp?.name ?? "—"}</TableCell>
                            <TableCell className="text-sm">
                              <div>{formatDate(c.startDate)}</div>
                              <div className="text-xs text-muted-foreground">→ {formatDate(c.endDate)}</div>
                            </TableCell>
                            <TableCell className="text-right font-medium">{formatVND(c.rentAmount)}<div className="text-xs text-muted-foreground font-normal">{c.paymentCycle}</div></TableCell>
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
                              {c.parentContractId && <Badge variant="outline" className="text-xs">Nối tiếp</Badge>}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
            {renewOpen && <RenewContractDialog contractId={renewOpen} open={!!renewOpen} onOpenChange={(v: boolean) => !v && setRenewOpen(null)} />}
            {termOpen && <TerminateContractDialog contractId={termOpen} open={!!termOpen} onOpenChange={(v: boolean) => !v && setTermOpen(null)} />}
          </TabsContent>

          <TabsContent value="media" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Ảnh theo timeline</CardTitle>
                <Button size="sm" variant="outline"><ImagePlus className="h-4 w-4 mr-1.5" />Tải ảnh lên</Button>
              </CardHeader>
              <CardContent>
                {media.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">Chưa có ảnh.</div> : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {media.map((m) => (
                      <div key={m.id} className="group">
                        <div className="aspect-square rounded-md overflow-hidden bg-muted">
                          <img src={m.url} alt={m.caption} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                        </div>
                        <div className="mt-1.5 text-xs font-medium truncate">{m.caption}</div>
                        <div className="text-xs text-muted-foreground">{formatDate(m.takenAt)}</div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="documents" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Giấy tờ pháp lý</CardTitle>
                <Button size="sm" variant="outline"><FileText className="h-4 w-4 mr-1.5" />Thêm giấy tờ</Button>
              </CardHeader>
              <CardContent>
                {documents.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">Chưa có giấy tờ.</div> : (
                  <Table>
                    <TableHeader>
                      <TableRow><TableHead>Tên</TableHead><TableHead>Loại</TableHead><TableHead>Ngày cấp</TableHead><TableHead>Hết hạn</TableHead></TableRow>
                    </TableHeader>
                    <TableBody>
                      {documents.map((d) => {
                        const days = d.expiryDate ? daysUntil(d.expiryDate) : null;
                        return (
                          <TableRow key={d.id}>
                            <TableCell className="font-medium">{d.name}</TableCell>
                            <TableCell><Badge variant="outline">{d.type}</Badge></TableCell>
                            <TableCell>{formatDate(d.issuedDate)}</TableCell>
                            <TableCell>
                              {d.expiryDate ? (
                                <div>
                                  <div>{formatDate(d.expiryDate)}</div>
                                  {days !== null && (days < 0 ? (
                                    <Badge variant="outline" className="mt-1 border-destructive/30 text-destructive text-xs">Đã hết hạn</Badge>
                                  ) : days < 60 ? (
                                    <Badge variant="outline" className="mt-1 border-warning/40 text-warning-foreground text-xs">Còn {days} ngày</Badge>
                                  ) : null)}
                                </div>
                              ) : "—"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cashflow" className="mt-4 space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tổng thu</div><div className="text-xl font-semibold text-success mt-1">{formatVND(totalIn)}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Tổng chi</div><div className="text-xl font-semibold text-destructive mt-1">{formatVND(totalOut)}</div></CardContent></Card>
              <Card><CardContent className="p-4"><div className="text-xs text-muted-foreground">Lợi nhuận</div><div className={`text-xl font-semibold mt-1 ${totalIn - totalOut >= 0 ? "text-success" : "text-destructive"}`}>{formatVND(totalIn - totalOut)}</div></CardContent></Card>
            </div>
            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader><TableRow><TableHead>Ngày</TableHead><TableHead>Loại</TableHead><TableHead>Mô tả</TableHead><TableHead className="text-right">Số tiền</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {cashflow.slice(0, 20).map((e) => (
                      <TableRow key={e.id}>
                        <TableCell>{formatDate(e.occurredAt)}</TableCell>
                        <TableCell><Badge variant="outline">{e.category}</Badge></TableCell>
                        <TableCell className="text-sm">{e.description}</TableCell>
                        <TableCell className={`text-right font-medium ${e.direction === "Thu" ? "text-success" : "text-destructive"}`}>
                          {e.direction === "Thu" ? "+" : "−"} {formatVND(e.amount)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="equipment" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Trang thiết bị</CardTitle>
                <Button size="sm" variant="outline"><Package className="h-4 w-4 mr-1.5" />Thêm thiết bị</Button>
              </CardHeader>
              <CardContent>
                {equipment.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">Chưa có thiết bị.</div> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Tên</TableHead><TableHead>Số lượng</TableHead><TableHead>Tình trạng</TableHead><TableHead>Nguồn gốc</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {equipment.map((e) => (
                        <TableRow key={e.id}>
                          <TableCell className="font-medium">{e.name}</TableCell>
                          <TableCell>{e.quantity}</TableCell>
                          <TableCell><Badge variant="outline">{e.condition}</Badge></TableCell>
                          <TableCell className="text-sm text-muted-foreground">{e.source}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="maintenance" className="mt-4">
            <Card>
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle className="text-base">Lịch sử sửa chữa</CardTitle>
                <Button size="sm" onClick={() => setMaintOpen(true)}><Wrench className="h-4 w-4 mr-1.5" />Ghi nhận sửa chữa</Button>
              </CardHeader>
              <CardContent>
                {maintenance.length === 0 ? <div className="text-center py-8 text-sm text-muted-foreground">Chưa có ghi chép nào.</div> : (
                  <Table>
                    <TableHeader><TableRow><TableHead>Tiêu đề</TableHead><TableHead>Thời gian</TableHead><TableHead>Nhà thầu</TableHead><TableHead className="text-right">Chi phí</TableHead></TableRow></TableHeader>
                    <TableBody>
                      {maintenance.map((m) => {
                        const contractor = m.contractorId ? store.contacts.find((c) => c.id === m.contractorId) : null;
                        return (
                          <TableRow key={m.id}>
                            <TableCell>
                              <div className="font-medium">{m.title}</div>
                              {m.description && <div className="text-xs text-muted-foreground">{m.description}</div>}
                            </TableCell>
                            <TableCell className="text-sm">
                              {formatDate(m.startDate)}{m.endDate && ` → ${formatDate(m.endDate)}`}
                            </TableCell>
                            <TableCell className="text-sm">{contractor?.name ?? "—"}</TableCell>
                            <TableCell className="text-right font-medium">{formatVND(m.cost)}</TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
                <p className="mt-3 text-xs text-muted-foreground flex items-center gap-1.5">
                  <Bell className="h-3 w-3" />
                  Mọi chi phí sửa chữa nhập ở đây tự động xuất hiện ở "Sổ thu chi" của tài sản.
                </p>
              </CardContent>
            </Card>
            <AddMaintenanceDialog assetId={id} open={maintOpen} onOpenChange={setMaintOpen} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
