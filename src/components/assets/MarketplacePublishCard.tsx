import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { assetsApi } from "@/lib/api/assets";
import {
  propertiesApi,
  formatListingPrice,
  type CreatePropertyListingInput,
} from "@/lib/api/properties";
import { getErrorMessage } from "@/lib/api/errors";
import { ApiError } from "@/lib/auth/types";
import {
  LISTING_TYPE,
  PAYMENT_CYCLE,
  PROPERTY_STATUS,
  PROPERTY_STATUS_CLASS,
  enumOptions,
  type ListingTypeCode,
  type PaymentCycleCode,
} from "@/constants/enums";
import { CurrencyInput } from "@/components/CurrencyInput";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Globe, Check, Loader2, ImageIcon, ExternalLink, Eye } from "lucide-react";

/**
 * Card "Đăng tin công khai lên Marketplace" trong tab Rao bán.
 * Ẩn nút nếu tài sản đã có tin liên kết (linkedPropertyId != null).
 */
export function MarketplacePublishCard({ assetId }: { assetId: string }) {
  const [open, setOpen] = useState(false);
  // Đọc từ cache ["asset", assetId] (trang chi tiết đã load) để biết đã có tin chưa
  const assetQ = useQuery({
    queryKey: ["asset", assetId],
    queryFn: () => assetsApi.detail(assetId),
    retry: 1,
  });

  const linked = assetQ.data?.linkedPropertyId != null;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base flex items-center gap-2">
          <Globe className="h-4 w-4" />
          Đăng tin công khai lên Marketplace
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {linked ? (
          <LinkedListingStatus assetId={assetId} />
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Tạo tin rao công khai để khách chưa đăng nhập cũng xem được. Tin sẽ chờ quản trị viên
              duyệt trước khi hiển thị.
            </p>
            <Button onClick={() => setOpen(true)} disabled={assetQ.isLoading}>
              <Globe className="h-4 w-4 mr-1.5" />
              Đăng tin công khai
            </Button>
          </>
        )}
      </CardContent>

      <PublishDialog key={String(open)} assetId={assetId} open={open} onOpenChange={setOpen} />
    </Card>
  );
}

/** Trạng thái tin đăng công khai hiện tại của tài sản (khi đã liên kết). */
function LinkedListingStatus({ assetId }: { assetId: string }) {
  const query = useQuery({
    queryKey: ["my-listings"],
    queryFn: () => propertiesApi.myListings(),
    retry: 1,
  });

  const listing = (query.data ?? []).find((l) => l.linkedAssetId === assetId);

  return (
    <div className="space-y-3">
      {query.isLoading ? (
        <p className="text-sm text-muted-foreground">Đang tải trạng thái tin đăng...</p>
      ) : listing ? (
        <div className="flex items-center gap-3 flex-wrap">
          <Badge variant="outline" className={PROPERTY_STATUS_CLASS[listing.status]}>
            {PROPERTY_STATUS[listing.status]}
          </Badge>
          <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
            <Eye className="h-3.5 w-3.5" />
            {listing.viewCount} lượt xem
          </span>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">
          Tài sản này đã có tin đăng trên marketplace.
        </p>
      )}
      <Button variant="outline" asChild>
        <Link to="/my-listings">
          Xem trong Tin đăng của tôi
          <ExternalLink className="h-3.5 w-3.5 ml-1.5" />
        </Link>
      </Button>
    </div>
  );
}

const STEP_LABELS = ["Loại tin", "Nội dung", "Thông số", "Chọn ảnh", "Xác nhận"];

function PublishDialog({
  assetId,
  open,
  onOpenChange,
}: {
  assetId: string;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const qc = useQueryClient();
  const [step, setStep] = useState(0);

  // Bước 1
  const [type, setType] = useState<ListingTypeCode>(1);
  const [rentPaymentCycle, setRentPaymentCycle] = useState<PaymentCycleCode>(1);
  // Bước 2
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState<number | null>(null);
  const [prefilled, setPrefilled] = useState(false);
  // Bước 3
  const [floors, setFloors] = useState("");
  const [bedrooms, setBedrooms] = useState("");
  const [bathrooms, setBathrooms] = useState("");
  const [frontage, setFrontage] = useState("");
  const [houseDirection, setHouseDirection] = useState("");
  const [legalStatus, setLegalStatus] = useState("");
  const [furnitureState, setFurnitureState] = useState("");
  const [propertyType, setPropertyType] = useState("");
  // Bước 4
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [conflict, setConflict] = useState<string | null>(null);

  // Prefill giá từ rao bán nội bộ (404 = chưa có → bỏ qua im lặng)
  const saleQ = useQuery({
    queryKey: ["asset-sale-listing", assetId],
    queryFn: () => assetsApi.saleListing.get(assetId),
    enabled: open,
    retry: 1,
  });
  if (open && !prefilled && saleQ.data?.askingPrice && price === null) {
    setPrice(saleQ.data.askingPrice);
    setPrefilled(true);
  }

  const mediaQ = useQuery({
    queryKey: ["asset-media", assetId],
    queryFn: () => assetsApi.media.list(assetId),
    enabled: open,
    retry: 1,
  });
  const media = mediaQ.data ?? [];

  const num = (s: string): number | null => (s.trim() === "" ? null : Number(s));

  const create = useMutation({
    mutationFn: () => {
      const body: CreatePropertyListingInput = {
        type,
        title: title.trim(),
        description: description.trim(),
        price: price ?? 0,
        rentPaymentCycle: type === 2 ? rentPaymentCycle : null,
        floors: num(floors),
        bedrooms: num(bedrooms),
        bathrooms: num(bathrooms),
        frontage: num(frontage),
        houseDirection: houseDirection.trim() || null,
        legalStatus: legalStatus.trim() || null,
        furnitureState: furnitureState.trim() || null,
        propertyType: propertyType.trim() || null,
        selectedAssetMediaIds: selectedIds,
      };
      return propertiesApi.createFromAsset(assetId, body);
    },
    onSuccess: () => {
      // linkedPropertyId đổi → ẩn nút đăng tin; my-listings có tin mới
      qc.invalidateQueries({ queryKey: ["asset", assetId] });
      qc.invalidateQueries({ queryKey: ["my-listings"] });
      // TODO: khi backend có GET /property-listings/preview/{id} thì thêm link xem trước bản nháp
      toast.success("Đã gửi tin đăng, đang chờ duyệt.");
      onOpenChange(false);
    },
    onError: (err) => {
      if (err instanceof ApiError && err.status === 409) {
        setConflict(getErrorMessage(err, "Tài sản này đã có tin đăng liên kết."));
        return;
      }
      toast.error(getErrorMessage(err, "Không gửi được tin đăng"));
    },
  });

  const priceLabel = type === 2 ? "Giá thuê (VNĐ)" : "Giá bán (VNĐ)";

  const canNext = (): boolean => {
    if (step === 1) {
      if (!title.trim()) return toastFalse("Vui lòng nhập tiêu đề");
      if (!description.trim()) return toastFalse("Vui lòng nhập mô tả");
      if (!price || price <= 0) return toastFalse("Vui lòng nhập giá hợp lệ");
    }
    if (step === 3 && selectedIds.length === 0) {
      return toastFalse("Chọn ít nhất 1 ảnh để đăng tin");
    }
    return true;
  };

  const toggleImage = (id: string) =>
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  return (
    <Dialog open={open} onOpenChange={(v) => !create.isPending && onOpenChange(v)}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Đăng tin công khai — Bước {step + 1}/5</DialogTitle>
          <DialogDescription>{STEP_LABELS[step]}</DialogDescription>
        </DialogHeader>

        {/* thanh tiến trình các bước */}
        <div className="flex items-center gap-1.5">
          {STEP_LABELS.map((label, i) => (
            <div
              key={label}
              className={`h-1.5 flex-1 rounded ${i <= step ? "bg-primary" : "bg-muted"}`}
            />
          ))}
        </div>

        <div className="py-2">
          {/* Bước 1 — loại tin */}
          {step === 0 && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label>Loại tin *</Label>
                <RadioGroup
                  className="flex gap-6"
                  value={String(type)}
                  onValueChange={(v) => setType(Number(v) as ListingTypeCode)}
                >
                  {enumOptions(LISTING_TYPE).map((o) => (
                    <div key={o.value} className="flex items-center gap-2">
                      <RadioGroupItem value={String(o.value)} id={`lt-${o.value}`} />
                      <Label htmlFor={`lt-${o.value}`} className="cursor-pointer font-medium">
                        {o.label}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              {type === 2 && (
                <div className="space-y-2 max-w-xs">
                  <Label>Chu kỳ thanh toán *</Label>
                  <Select
                    value={String(rentPaymentCycle)}
                    onValueChange={(v) => setRentPaymentCycle(Number(v) as PaymentCycleCode)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {enumOptions(PAYMENT_CYCLE).map((o) => (
                        <SelectItem key={o.value} value={String(o.value)}>
                          {o.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          )}

          {/* Bước 2 — nội dung */}
          {step === 1 && (
            <div className="space-y-3">
              <div className="space-y-2">
                <Label>Tiêu đề *</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="VD: Nhà phố 3 tầng mặt tiền Quận 7"
                />
              </div>
              <div className="space-y-2">
                <Label>Mô tả *</Label>
                <Textarea
                  rows={5}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Mô tả chi tiết vị trí, tiện ích, tình trạng..."
                />
              </div>
              <div className="space-y-2 max-w-xs">
                <Label>{priceLabel} *</Label>
                <CurrencyInput value={price} onChange={setPrice} />
                {prefilled && (
                  <p className="text-xs text-muted-foreground">
                    Đã điền sẵn từ giá rao bán nội bộ — bạn có thể sửa lại.
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Bước 3 — thông số */}
          {step === 2 && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Số tầng</Label>
                <Input
                  type="number"
                  min={0}
                  value={floors}
                  onChange={(e) => setFloors(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Mặt tiền (m)</Label>
                <Input
                  type="number"
                  min={0}
                  value={frontage}
                  onChange={(e) => setFrontage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phòng ngủ</Label>
                <Input
                  type="number"
                  min={0}
                  value={bedrooms}
                  onChange={(e) => setBedrooms(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Phòng tắm</Label>
                <Input
                  type="number"
                  min={0}
                  value={bathrooms}
                  onChange={(e) => setBathrooms(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Hướng nhà</Label>
                <Input
                  value={houseDirection}
                  onChange={(e) => setHouseDirection(e.target.value)}
                  placeholder="VD: Đông Nam"
                />
              </div>
              <div className="space-y-2">
                <Label>Loại hình BĐS</Label>
                <Input
                  value={propertyType}
                  onChange={(e) => setPropertyType(e.target.value)}
                  placeholder="VD: Nhà phố"
                />
              </div>
              <div className="space-y-2">
                <Label>Tình trạng pháp lý</Label>
                <Input
                  value={legalStatus}
                  onChange={(e) => setLegalStatus(e.target.value)}
                  placeholder="VD: Sổ hồng riêng"
                />
              </div>
              <div className="space-y-2">
                <Label>Nội thất</Label>
                <Input
                  value={furnitureState}
                  onChange={(e) => setFurnitureState(e.target.value)}
                  placeholder="VD: Đầy đủ nội thất"
                />
              </div>
            </div>
          )}

          {/* Bước 4 — chọn ảnh */}
          {step === 3 && (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Chọn ảnh từ thư viện của tài sản để hiển thị công khai (ít nhất 1 ảnh).
              </p>
              {mediaQ.isLoading ? (
                <div className="text-sm text-muted-foreground">Đang tải ảnh...</div>
              ) : media.length === 0 ? (
                <div className="py-8 text-center text-sm text-muted-foreground">
                  <ImageIcon className="h-10 w-10 mx-auto text-muted-foreground/40 mb-2" />
                  Tài sản chưa có ảnh nào. Hãy thêm ảnh ở tab Ảnh trước khi đăng tin.
                </div>
              ) : (
                <div className="grid grid-cols-3 md:grid-cols-4 gap-2">
                  {media.map((m) => {
                    const checked = selectedIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleImage(m.id)}
                        className={`relative aspect-square rounded-md overflow-hidden border-2 ${
                          checked ? "border-primary" : "border-transparent"
                        }`}
                      >
                        <img src={m.file.url} alt="" className="w-full h-full object-cover" />
                        <span
                          className={`absolute top-1 right-1 h-5 w-5 rounded-full flex items-center justify-center ${
                            checked
                              ? "bg-primary text-primary-foreground"
                              : "bg-black/40 text-white"
                          }`}
                        >
                          {checked && <Check className="h-3.5 w-3.5" />}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
              <div className="text-xs text-muted-foreground">Đã chọn {selectedIds.length} ảnh.</div>
            </div>
          )}

          {/* Bước 5 — xác nhận */}
          {step === 4 && (
            <ConfirmStep
              type={type}
              title={title}
              price={price}
              rentPaymentCycle={rentPaymentCycle}
              imageCount={selectedIds.length}
              conflict={conflict}
            />
          )}
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <Button
            variant="outline"
            onClick={() => (step === 0 ? onOpenChange(false) : setStep((s) => s - 1))}
            disabled={create.isPending}
          >
            {step === 0 ? "Huỷ" : "Quay lại"}
          </Button>
          {step < 4 ? (
            <Button
              onClick={() => {
                if (canNext()) setStep((s) => s + 1);
              }}
            >
              Tiếp tục
            </Button>
          ) : (
            <Button onClick={() => create.mutate()} disabled={create.isPending}>
              {create.isPending && <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />}
              {create.isPending ? "Đang gửi..." : "Gửi tin đăng"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ConfirmStep({
  type,
  title,
  price,
  rentPaymentCycle,
  imageCount,
  conflict,
}: {
  type: ListingTypeCode;
  title: string;
  price: number | null;
  rentPaymentCycle: PaymentCycleCode;
  imageCount: number;
  conflict: string | null;
}) {
  const rows = useMemo(
    () => [
      ["Loại tin", LISTING_TYPE[type]],
      ["Tiêu đề", title || "—"],
      ["Giá", price ? formatListingPrice(price, type, type === 2 ? rentPaymentCycle : null) : "—"],
      ["Số ảnh đã chọn", String(imageCount)],
    ],
    [type, title, price, rentPaymentCycle, imageCount],
  );

  return (
    <div className="space-y-3">
      <div className="rounded-md border divide-y">
        {rows.map(([label, value]) => (
          <div key={label} className="flex justify-between gap-3 px-3 py-2 text-sm">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-right">{value}</span>
          </div>
        ))}
      </div>
      {conflict ? (
        <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-sm text-destructive space-y-1.5">
          <div>{conflict}</div>
          <Link
            to="/my-listings"
            className="inline-flex items-center gap-1 font-medium hover:underline"
          >
            Tới "Tin đăng của tôi" để sửa tin hiện có
            <ExternalLink className="h-3.5 w-3.5" />
          </Link>
        </div>
      ) : (
        <div className="rounded-md border border-warning/40 bg-warning/10 px-3 py-2 text-xs text-warning-foreground">
          Tin đăng sẽ ở trạng thái <Badge variant="outline">Chờ duyệt</Badge> cho tới khi quản trị
          viên phê duyệt.
        </div>
      )}
    </div>
  );
}

// Helper: hiện toast lỗi và trả false để chặn chuyển bước
function toastFalse(msg: string): false {
  toast.error(msg);
  return false;
}
