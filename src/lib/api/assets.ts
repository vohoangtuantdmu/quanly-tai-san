import { api, toQuery } from "./http";
import type {
  AssetStatusCode,
  AssetTypeCode,
  OwnershipTypeCode,
  UnitStatusCode,
} from "@/constants/enums";

// ---- Types ----
export interface AssetAddress {
  city: string;
  district: string;
  ward: string;
  detail?: string | null;
}

export interface GeoLocation {
  latitude: number;
  longitude: number;
}

export interface AssetListItem {
  id: string;
  name: string;
  type: AssetTypeCode;
  ownershipType: OwnershipTypeCode;
  status: AssetStatusCode;
  city: string;
  district: string;
  currentValue: number | null;
  thumbnailUrl: string | null;
  linkedPropertyId?: string | null;
}

export interface AssetMediaFile {
  url: string;
  fileName?: string;
  contentType?: string;
  sizeBytes?: number;
}

export interface AssetDetail {
  id: string;
  name: string;
  type: AssetTypeCode;
  ownershipType: OwnershipTypeCode;
  status: AssetStatusCode;
  address: AssetAddress;
  location: GeoLocation | null;
  area: number | null;
  currentValue: number | null;
  acquisitionDate: string | null;
  notes: string | null;
  thumbnail: AssetMediaFile | null;
  linkedPropertyId: string | null;
  unitCount: number;
  activeContractCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAssetInput {
  name: string;
  type: AssetTypeCode;
  ownershipType: OwnershipTypeCode;
  address: AssetAddress;
  location?: GeoLocation | null;
  area?: number | null;
  currentValue?: number | null;
  acquisitionDate?: string | null;
  notes?: string | null;
}

export interface UpdateAssetInput extends CreateAssetInput {
  status: AssetStatusCode;
}

export interface PagedResult<T> {
  items: T[];
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
}

export interface AssetListFilters {
  keyword?: string;
  type?: AssetTypeCode | "";
  status?: AssetStatusCode | "";
  ownershipType?: OwnershipTypeCode | "";
  city?: string;
  page?: number;
  pageSize?: number;
}

export interface NearbyAsset {
  id: string;
  name: string;
  type: AssetTypeCode;
  status: AssetStatusCode;
  latitude: number;
  longitude: number;
  distanceMeters: number;
}

// ---- Units ----
export interface AssetUnit {
  id: string;
  name: string;
  floorNumber: number | null;
  area: number | null;
  status: UnitStatusCode;
  notes: string | null;
}

// ---- API functions ----
export const assetsApi = {
  list: (f: AssetListFilters = {}) =>
    api<PagedResult<AssetListItem>>(`/assets${toQuery({ ...f, page: f.page ?? 1, pageSize: f.pageSize ?? 20 })}`),
  detail: (id: string) => api<AssetDetail>(`/assets/${id}`),
  create: (body: CreateAssetInput) => api<AssetDetail>("/assets", { method: "POST", body }),
  update: (id: string, body: UpdateAssetInput) =>
    api<AssetDetail>(`/assets/${id}`, { method: "PUT", body }),
  remove: (id: string) => api<void>(`/assets/${id}`, { method: "DELETE" }),
  nearby: (lat: number, lng: number, radiusMeters: number, limit = 50) =>
    api<NearbyAsset[]>(
      `/assets/nearby${toQuery({ latitude: lat, longitude: lng, radiusMeters, limit })}`,
    ),

  units: {
    list: (assetId: string) => api<AssetUnit[]>(`/assets/${assetId}/units`),
  },
};
