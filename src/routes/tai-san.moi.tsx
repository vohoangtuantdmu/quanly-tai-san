import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useStore } from "@/lib/store";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Check } from "lucide-react";
import type { Asset, AssetType, OwnershipType } from "@/lib/types";

export const Route = createFileRoute("/tai-san/moi")({
  head: () => ({ meta: [{ title: "Tạo tài sản mới — Quản Lý Tài Sản" }] }),
  component: NewAsset,
});

const STEPS = ["Thông tin cơ bản", "Địa chỉ & vị trí", "Giá trị & thời điểm", "Ảnh đại diện"];

function NewAsset() {
  const navigate = useNavigate();
  const store = useStore();
  const [step, setStep] = useState(0);

  const [name, setName] = useState("");
  const [type, setType] = useState<AssetType>("Nhà riêng");
  const [ownershipType, setOwnershipType] = useState<OwnershipType>("Sở hữu");
  const [city, setCity] = useState("");
  const [district, setDistrict] = useState("");
  const [ward, setWard] = useState("");
  const [addressDetail, setAddressDetail] = useState("");
  const [area, setArea] = useState(0);
  const [currentValue, setCurrentValue] = useState(0);
  const [acquisitionDate, setAcquisitionDate] = useState(new Date().toISOString().slice(0, 10));
  const [thumbnail, setThumbnail] = useState("https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=800");

  const canNext = () => {
    if (step === 0) return !!name.trim();
    if (step === 1) return !!city && !!district;
    return true;
  };

  const handleFinish = () => {
    const asset: Asset = {
      id: `a-${Date.now()}`, name, type, ownershipType,
      status: ownershipType === "Sở hữu" ? "Đang sử dụng" : "Trống",
      city, district, ward, addressDetail,
      lat: 10.77 + Math.random() * 0.1, lng: 106.7 + Math.random() * 0.1,
      area, currentValue, acquisitionDate: new Date(acquisitionDate).toISOString(),
      thumbnail,
    };
    store.addAsset(asset);
    toast.success("Đã tạo tài sản mới", { description: asset.name });
    navigate({ to: "/tai-san/$id", params: { id: asset.id } });
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      <div>
        <Button variant="ghost" size="sm" asChild className="mb-3"><Link to="/tai-san"><ArrowLeft className="h-4 w-4 mr-1.5" />Quay lại</Link></Button>
        <h1 className="text-2xl font-semibold tracking-tight">Tạo tài sản mới</h1>
      </div>

      {/* Stepper */}
      <div className="flex items-center gap-2">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center gap-2 flex-1">
            <div className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-medium shrink-0 ${i < step ? "bg-success text-success-foreground" : i === step ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              {i < step ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className={`text-xs font-medium hidden md:block ${i === step ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
            {i < STEPS.length - 1 && <div className={`flex-1 h-0.5 ${i < step ? "bg-success" : "bg-muted"}`} />}
          </div>
        ))}
      </div>

      <Card>
        <CardHeader><CardTitle className="text-base">{STEPS[step]}</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {step === 0 && (
            <>
              <div className="space-y-2"><Label>Tên tài sản *</Label><Input value={name} onChange={(e) => setName(e.target.value)} placeholder="VD: Nhà phố Quận 7" /></div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Loại tài sản</Label>
                  <Select value={type} onValueChange={(v) => setType(v as AssetType)}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["Nhà riêng", "Căn hộ", "Đất", "Biệt thự", "Nhà mặt phố", "Văn phòng", "Khác"].map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Hình thức</Label>
                  <RadioGroup value={ownershipType} onValueChange={(v) => setOwnershipType(v as OwnershipType)} className="flex gap-4 pt-2">
                    <div className="flex items-center gap-2"><RadioGroupItem value="Sở hữu" id="own" /><Label htmlFor="own" className="font-normal">Sở hữu</Label></div>
                    <div className="flex items-center gap-2"><RadioGroupItem value="Đi thuê" id="lease" /><Label htmlFor="lease" className="font-normal">Đi thuê</Label></div>
                  </RadioGroup>
                </div>
              </div>
            </>
          )}
          {step === 1 && (
            <>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2"><Label>Thành phố *</Label><Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="TP. Hồ Chí Minh" /></div>
                <div className="space-y-2"><Label>Quận/Huyện *</Label><Input value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="Quận 7" /></div>
                <div className="space-y-2"><Label>Phường/Xã</Label><Input value={ward} onChange={(e) => setWard(e.target.value)} placeholder="Phường Tân Phong" /></div>
                <div className="space-y-2"><Label>Diện tích (m²)</Label><Input type="number" value={area || ""} onChange={(e) => setArea(Number(e.target.value))} /></div>
              </div>
              <div className="space-y-2"><Label>Địa chỉ chi tiết</Label><Input value={addressDetail} onChange={(e) => setAddressDetail(e.target.value)} placeholder="123 Nguyễn Thị Thập" /></div>
            </>
          )}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Giá trị hiện tại (VNĐ)</Label>
                <Input type="number" value={currentValue || ""} onChange={(e) => setCurrentValue(Number(e.target.value))} disabled={ownershipType === "Đi thuê"} />
                {ownershipType === "Đi thuê" && <p className="text-xs text-muted-foreground">Bỏ qua với tài sản đi thuê.</p>}
              </div>
              <div className="space-y-2">
                <Label>{ownershipType === "Sở hữu" ? "Ngày mua" : "Ngày bắt đầu thuê"}</Label>
                <Input type="date" value={acquisitionDate} onChange={(e) => setAcquisitionDate(e.target.value)} />
              </div>
            </div>
          )}
          {step === 3 && (
            <div className="space-y-3">
              <Label>Ảnh đại diện</Label>
              <div className="rounded-md border-2 border-dashed border-border p-4">
                <img src={thumbnail} alt="preview" className="rounded-md w-full h-56 object-cover" />
                <Input className="mt-3" placeholder="URL ảnh" value={thumbnail} onChange={(e) => setThumbnail(e.target.value)} />
                <p className="text-xs text-muted-foreground mt-2">Prototype dùng URL. Trong bản đầy đủ có thể upload trực tiếp.</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between">
        <Button variant="outline" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
          <ArrowLeft className="h-4 w-4 mr-1.5" />Bước trước
        </Button>
        {step < STEPS.length - 1 ? (
          <Button onClick={() => setStep((s) => s + 1)} disabled={!canNext()}>
            Bước tiếp <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        ) : (
          <Button onClick={handleFinish} disabled={!name.trim()}>
            <Check className="h-4 w-4 mr-1.5" />Hoàn tất tạo tài sản
          </Button>
        )}
      </div>
    </div>
  );
}
