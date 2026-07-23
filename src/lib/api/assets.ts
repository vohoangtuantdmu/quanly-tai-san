import { api, toQuery } from "./http";
import { apiForm } from "./http";
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

export interface UnitInput {
  name: string;
  floorNumber?: number | null;
  area?: number | null;
  status?: UnitStatusCode;
  notes?: string | null;
}

// ---- Media ----
export interface AssetMediaItem {
  id: string;
  file: AssetMediaFile;
  caption: string | null;
  takenAt: string | null;
  sortOrder: number;
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

  linkProperty: (assetId: string, propertyId: number | string) =>
    api<AssetDetail>(`/assets/${assetId}/link-property/${propertyId}`, { method: "POST" }),
  unlinkProperty: (assetId: string) =>
    api<AssetDetail>(`/assets/${assetId}/link-property`, { method: "DELETE" }),

  units: {
    list: (assetId: string) => api<AssetUnit[]>(`/assets/${assetId}/units`),
    create: (assetId: string, body: UnitInput) =>
      api<AssetUnit>(`/assets/${assetId}/units`, { method: "POST", body }),
    update: (assetId: string, unitId: string, body: UnitInput) =>
      api<AssetUnit>(`/assets/${assetId}/units/${unitId}`, { method: "PUT", body }),
    remove: (assetId: string, unitId: string) =>
      api<void>(`/assets/${assetId}/units/${unitId}`, { method: "DELETE" }),
  },

  media: {
    list: (assetId: string) => api<AssetMediaItem[]>(`/assets/${assetId}/media`),
    upload: (assetId: string, files: File[], caption?: string, takenAt?: string) => {
      const fd = new FormData();
      for (const f of files) fd.append("Files", f);
      if (caption) fd.append("Caption", caption);
      if (takenAt) fd.append("TakenAt", takenAt);
      return apiForm<AssetMediaItem[]>(`/assets/${assetId}/media`, fd, "POST");
    },
    remove: (assetId: string, mediaId: string) =>
      api<void>(`/assets/${assetId}/media/${mediaId}`, { method: "DELETE" }),
    setThumbnail: (assetId: string, file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return apiForm<AssetDetail>(`/assets/${assetId}/thumbnail`, fd, "PUT");
    },
  },
};
