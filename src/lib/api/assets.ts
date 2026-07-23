import { api, toQuery } from "./http";
import { apiForm } from "./http";
import type {
  AssetSummaryDto,
  AssetDetailDto,
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetSearchQuery,
  AssetNearbyDto,
  AssetUnitDto,
  AssetUnitRequest,
  AssetMediaDto,
  AddressDto,
  GeoPointDto,
  StoredFileDto,
  PagedResult,
} from "@/types/asset";

// Re-export spec types (nguồn sự thật duy nhất là src/types/asset.ts).
export type {
  AssetSummaryDto,
  AssetDetailDto,
  AssetCreateRequest,
  AssetUpdateRequest,
  AssetSearchQuery,
  AssetNearbyDto,
  AssetUnitDto,
  AssetUnitRequest,
  AssetMediaDto,
  AddressDto,
  GeoPointDto,
  StoredFileDto,
  PagedResult,
} from "@/types/asset";

// Legacy aliases để tránh phải sửa hết callers cùng lúc.
export type AssetListItem = AssetSummaryDto;
export type AssetDetail = AssetDetailDto;
export type CreateAssetInput = AssetCreateRequest;
export type UpdateAssetInput = AssetUpdateRequest;
export type NearbyAsset = AssetNearbyDto;
export type AssetUnit = AssetUnitDto;
export type UnitInput = AssetUnitRequest;
export type AssetMediaItem = AssetMediaDto;
export type AssetMediaFile = StoredFileDto;
export type AssetAddress = AddressDto;
export type GeoLocation = GeoPointDto;

// Filter dùng ở UI: cho phép "" để tương thích Select "all".
export interface AssetListFilters extends Omit<AssetSearchQuery, "type" | "status" | "ownershipType"> {
  type?: AssetSearchQuery["type"] | "";
  status?: AssetSearchQuery["status"] | "";
  ownershipType?: AssetSearchQuery["ownershipType"] | "";
}

// ---- API functions ----
export const assetsApi = {
  list: (f: AssetListFilters = {}) =>
    api<PagedResult<AssetSummaryDto>>(`/assets${toQuery({ ...f, page: f.page ?? 1, pageSize: f.pageSize ?? 20 })}`),
  detail: (id: string) => api<AssetDetailDto>(`/assets/${id}`),
  create: (body: AssetCreateRequest) => api<AssetDetailDto>("/assets", { method: "POST", body }),
  update: (id: string, body: AssetUpdateRequest) =>
    api<AssetDetailDto>(`/assets/${id}`, { method: "PUT", body }),
  remove: (id: string) => api<void>(`/assets/${id}`, { method: "DELETE" }),
  nearby: (lat: number, lng: number, radiusMeters: number, limit = 50) =>
    api<AssetNearbyDto[]>(
      `/assets/nearby${toQuery({ latitude: lat, longitude: lng, radiusMeters, limit })}`,
    ),

  linkProperty: (assetId: string, propertyId: number) =>
    api<AssetDetailDto>(`/assets/${assetId}/link-property/${propertyId}`, { method: "POST" }),
  unlinkProperty: (assetId: string) =>
    api<AssetDetailDto>(`/assets/${assetId}/link-property`, { method: "DELETE" }),

  units: {
    list: (assetId: string) => api<AssetUnitDto[]>(`/assets/${assetId}/units`),
    create: (assetId: string, body: AssetUnitRequest) =>
      api<AssetUnitDto>(`/assets/${assetId}/units`, { method: "POST", body }),
    update: (assetId: string, unitId: string, body: AssetUnitRequest) =>
      api<AssetUnitDto>(`/assets/${assetId}/units/${unitId}`, { method: "PUT", body }),
    remove: (assetId: string, unitId: string) =>
      api<void>(`/assets/${assetId}/units/${unitId}`, { method: "DELETE" }),
  },

  media: {
    list: (assetId: string) => api<AssetMediaDto[]>(`/assets/${assetId}/media`),
    upload: (assetId: string, files: File[], caption?: string, takenAt?: string) => {
      const fd = new FormData();
      for (const f of files) fd.append("Files", f);
      if (caption) fd.append("Caption", caption);
      if (takenAt) fd.append("TakenAt", takenAt);
      return apiForm<AssetMediaDto[]>(`/assets/${assetId}/media`, fd, "POST");
    },
    remove: (assetId: string, mediaId: string) =>
      api<void>(`/assets/${assetId}/media/${mediaId}`, { method: "DELETE" }),
    setThumbnail: (assetId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiForm<AssetDetailDto>(`/assets/${assetId}/thumbnail`, fd, "PUT");
    },
  },
};
