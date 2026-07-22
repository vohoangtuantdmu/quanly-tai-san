// Bảng mã enum dùng chung — backend trả số, UI hiển thị chữ.

export const ASSET_TYPE = {
  1: "Nhà riêng",
  2: "Căn hộ",
  3: "Đất",
  4: "Biệt thự",
  5: "Nhà mặt phố",
  6: "Văn phòng",
  99: "Khác",
} as const;
export type AssetTypeCode = keyof typeof ASSET_TYPE;

export const OWNERSHIP_TYPE = { 1: "Sở hữu", 2: "Đi thuê" } as const;
export type OwnershipTypeCode = keyof typeof OWNERSHIP_TYPE;

export const ASSET_STATUS = {
  1: "Đang sử dụng",
  2: "Đang cho thuê",
  3: "Đang rao bán",
  4: "Trống",
  5: "Đã bán",
  6: "Hết hạn thuê",
} as const;
export type AssetStatusCode = keyof typeof ASSET_STATUS;

// Class Tailwind cho badge trạng thái tài sản
export const ASSET_STATUS_CLASS: Record<AssetStatusCode, string> = {
  1: "bg-info/15 text-info border-info/30",
  2: "bg-success/15 text-success border-success/30",
  3: "bg-warning/20 text-warning-foreground border-warning/40",
  4: "bg-muted text-muted-foreground border-border",
  5: "bg-secondary text-secondary-foreground border-border",
  6: "bg-destructive/15 text-destructive border-destructive/30",
};

export const UNIT_STATUS = { 1: "Trống", 2: "Đang cho thuê", 3: "Đang sửa chữa" } as const;
export type UnitStatusCode = keyof typeof UNIT_STATUS;

export const UNIT_STATUS_CLASS: Record<UnitStatusCode, string> = {
  1: "bg-muted text-muted-foreground border-border",
  2: "bg-success/15 text-success border-success/30",
  3: "bg-warning/20 text-warning-foreground border-warning/40",
};

export const CONTRACT_DIRECTION = { 1: "Cho thuê", 2: "Đi thuê" } as const;
export type ContractDirectionCode = keyof typeof CONTRACT_DIRECTION;

export const CONTRACT_STATUS = {
  1: "Nháp",
  2: "Đang hiệu lực",
  3: "Hết hạn",
  4: "Đã chấm dứt",
  5: "Đã gia hạn",
} as const;
export type ContractStatusCode = keyof typeof CONTRACT_STATUS;

export const CONTRACT_STATUS_CLASS: Record<ContractStatusCode, string> = {
  1: "bg-muted text-muted-foreground border-border",
  2: "bg-success/15 text-success border-success/30",
  3: "bg-warning/20 text-warning-foreground border-warning/40",
  4: "bg-destructive/15 text-destructive border-destructive/30",
  5: "bg-info/15 text-info border-info/30",
};

export const PAYMENT_CYCLE = {
  1: "Hàng tháng",
  2: "Hàng quý",
  3: "Nửa năm",
  4: "Hàng năm",
} as const;
export type PaymentCycleCode = keyof typeof PAYMENT_CYCLE;

export const TAX_RESPONSIBILITY = { 1: "Chủ nhà", 2: "Người thuê" } as const;
export type TaxResponsibilityCode = keyof typeof TAX_RESPONSIBILITY;

export const CONTACT_TYPE = {
  1: "Người thuê",
  2: "Chủ nhà",
  3: "Môi giới",
  4: "Nhà thầu",
  99: "Khác",
} as const;
export type ContactTypeCode = keyof typeof CONTACT_TYPE;

export const CONTACT_TYPE_CLASS: Record<ContactTypeCode, string> = {
  1: "bg-info/15 text-info border-info/30",
  2: "bg-success/15 text-success border-success/30",
  3: "bg-warning/20 text-warning-foreground border-warning/40",
  4: "bg-secondary text-secondary-foreground border-border",
  99: "bg-muted text-muted-foreground border-border",
};

// Helper: chuyển object enum thành mảng { value, label } cho <Select>
export function enumOptions<T extends Record<number, string>>(e: T): { value: number; label: string }[] {
  return Object.entries(e).map(([k, v]) => ({ value: Number(k), label: v }));
}
