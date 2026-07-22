import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import { assetsApi, type CreateAssetInput } from "@/lib/api/assets";
import {
  ASSET_TYPE,
  OWNERSHIP_TYPE,
  enumOptions,
  type AssetTypeCode,
  type OwnershipTypeCode,
} from "@/constants/enums";
import { CurrencyInput } from "@/components/CurrencyInput";
import { getErrorMessage } from "@/lib/api/errors";

export const Route = createFileRoute("/tai-san/moi")({
  head: () => ({ meta: [{ title: "Tạo tài sản mới — Quản Lý Tài Sản" }] }),
  component: NewAsset,
});

const STEPS = ["Thông tin cơ bản", "Địa chỉ", "Giá trị & thời điểm", "Xác nhận"];

function toIsoUtcOrNull(v: string): string | null {
  if (!v) return null;
  const d = new Date(v);
  if (isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate())).toISOString();
}

function NewAsset() {
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [type, setType] = useState<AssetTypeCode>(1);
  const [ownershipType, setOwnershipType] = useState<OwnershipTypeCode>(1);
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [detail, setDetail] = useState("");
  const [area, setArea] = useState<number | null>(null);
  const [currentValue, setCurrentValue] = useState<number | null>(null);
  const [acquisitionDate, setAcquisitionDate] = useState("");
  const [notes, setNotes] = useState("");

  const canNext =
    (step === 0 && name.trim().length > 0) ||
    (step === 1 && city.trim() && district.trim() && ward.trim()) ||
    step === 2 ||
    step === 3;

  const mutation = useMutation({
    mutationFn: (body: CreateAssetInput) => assetsApi.create(body),
    onSuccess: (created) => {
      toast.success("Đã tạo tài sản");
      qc.invalidateQueries({ queryKey: ["assets"] });
      navigate({ to: "/tai-san/$id", params: { id: created.id } });
    },
    onError: (err) => toast.error(getErrorMessage(err, "Không tạo được tài sản")),
  });

  const submit = () => {
    const body: CreateAssetInput = {
      name: name.trim(),
      type,
      ownershipType,
      address: { city: city.trim(), district: district.trim(), ward: ward.trim(), detail: detail.trim() || null },
      location: null,
      area: area ?? null,
      currentValue: ownershipType === 2 ? null : currentValue ?? null,
      acquisitionDate: toIsoUtcOrNull(acquisitionDate),
      notes: notes.trim() || null,
    };
    mutation.mutate(body);
  };

  return (
    <div className="p-6 max-w-3xl space-y-5">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="sm" asChild><Link to="/tai-san"><ArrowLeft className="h-4 w-4 mr-1" />Quay lại</Link></Button>
      </div>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Thêm tài sản mới</h1>
        <p className="text-sm text-muted-foreground mt-1">Bước {step + 1}/{STEPS.length} · {STEPS[step]}</p>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`h-8 w-8 shrink-0 rounded-full flex items-center justify-center text-xs font-semibold ${
              i < step ? "bg-primary text-primary-foreground"
              : i === step ? "bg-primary text-primary-foreground"
              : "bg-muted text-muted-foreground"
            }`}>{i < step ? <Check className="h-4 w-4" /> : i + 1}</div>
            {i < STEPS.length - 1 && <div className={`h-0.5 flex-1 mx-2 ${i < step ? "bg-primary" : "bg-border"}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-lg">{STEPS[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2">
                <Label htmlFor="name">Tên tài sản *</Label>
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nhà phố Quận 7" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Loại tài sản</Label>
                  <Select value={String(type)} onValueChange={(v) => setType(Number(v) as AssetTypeCode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {enumOptions(ASSET_TYPE).map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hình thức sở hữu</Label>
                  <Select value={String(ownershipType)} onValueChange={(v) => setOwnershipType(Number(v) as OwnershipTypeCode)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {enumOptions(OWNERSHIP_TYPE).map((o) => <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2"><Label>Thành phố *</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="TP. Hồ Chí Minh" /></div>
                <div className="space-y-2"><Label>Quận/Huyện *</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Quận 7" /></div>
                <div className="space-y-2"><Label>Phường/Xã *</Label><Input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Phường Tân Phong" /></div>
                <div className="space-y-2"><Label>Số nhà, đường</Label><Input value={detail} onChange={(e) => setDetail(e.target.value)} /></div>
              </div>
              <p className="text-xs text-muted-foreground">Chọn vị trí trên bản đồ sẽ được bổ sung ở bản cập nhật sau.</p>
            </>
          )}

          {step === 2 && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label>Diện tích (m²)</Label>
                  <Input inputMode="decimal" value={area ?? ""} onChange={(e) => { const v = e.target.value; setArea(v === "" ? null : Number(v)); }} />
                </div>
                <div className="space-y-2">
                  <Label>{ownershipType === 2 ? "Ngày bắt đầu thuê" : "Ngày mua"}</Label>
                  <Input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
                </div>
              </div>
              {ownershipType !== 2 && (
                <div className="space-y-2">
                  <Label>Giá trị hiện tại</Label>
                  <CurrencyInput value={currentValue} onChange={setCurrentValue} placeholder="0" />
                </div>
              )}
              <div className="space-y-2">
                <Label>Ghi chú</Label>
                <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} />
              </div>
            </>
          )}

          {step === 3 && (
            <div className="space-y-2 text-sm">
              <SummaryRow label="Tên" value={name} />
              <SummaryRow label="Loại" value={ASSET_TYPE[type]} />
              <SummaryRow label="Hình thức" value={OWNERSHIP_TYPE[ownershipType]} />
              <SummaryRow label="Địa chỉ" value={[detail, ward, district, city].filter(Boolean).join(", ")} />
              <SummaryRow label="Diện tích" value={area ? `${area} m²` : "—"} />
              {ownershipType !== 2 && <SummaryRow label="Giá trị hiện tại" value={currentValue ? new Intl.NumberFormat("vi-VN").format(currentValue) + " ₫" : "—"} />}
              <SummaryRow label={ownershipType === 2 ? "Ngày bắt đầu thuê" : "Ngày mua"} value={acquisitionDate || "—"} />
              {notes && <SummaryRow label="Ghi chú" value={notes} />}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => (step === 0 ? navigate({ to: "/tai-san" }) : setStep(step - 1))} disabled={mutation.isPending}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />{step === 0 ? "Huỷ" : "Quay lại"}
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep(step + 1)} disabled={!canNext}>Tiếp<ArrowRight className="h-4 w-4 ml-1.5" /></Button>
        ) : (
          <Button onClick={submit} disabled={mutation.isPending}>
            {mutation.isPending ? "Đang tạo..." : "Tạo tài sản"}
          </Button>
        )}
      </div>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4 py-1.5 border-b last:border-0">
      <span className="text-muted-foreground">{label}</span>
      <span className="font-medium text-right">{value}</span>
    </div>
  );
}
