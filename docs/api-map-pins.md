# Đề xuất endpoint `GET /assets/map-pins`

Yêu cầu gửi đội backend (.NET API). Frontend đã sẵn sàng nhận, chưa gọi được.

## Vấn đề hiện tại

Dashboard bản đồ (`/ban-do`) cần **toạ độ** của mọi tài sản để vẽ pin. Nhưng:

- `GET /assets` trả `AssetListItem` — **không có** `location`
- Chỉ `GET /assets/{id}` mới trả `location: { latitude, longitude }`

Nên `assetsApi.mapPins()` (`src/lib/api/assets.ts`) buộc phải ghép ở client:
1 request danh sách + **1 request detail cho mỗi tài sản** (chạy 8 luồng song song, trần
200 tài sản). Danh mục 120 tài sản = **121 request** mỗi lần mở bản đồ, chỉ để lấy hai số
`latitude`/`longitude`.

Hệ quả: bản đồ tải chậm rõ rệt khi danh mục lớn, và tạo tải không cần thiết lên API.

Đã giảm nhẹ được một phần ở phía frontend (nạp sẵn detail vào cache React Query để mở chi
tiết tài sản không gọi lại), nhưng **không sửa được gốc** — số request lúc tải bản đồ vẫn
tỉ lệ thuận với số tài sản.

## Đề xuất

```
GET /assets/map-pins
```

Không tham số. Trả về **toàn bộ** tài sản của người dùng hiện tại (không phân trang — đây
là dữ liệu để vẽ bản đồ, cần đủ mới đúng).

### Response `200 OK`

```jsonc
[
  {
    "id": "3f2a...",
    "name": "Biệt thự Thảo Điền",
    "type": 2,
    "ownershipType": 1,
    "status": 2,
    "city": "TP. Hồ Chí Minh",
    "district": "Thủ Đức",
    "currentValue": 24500000000,
    "thumbnailUrl": "https://.../thumb.jpg",
    "linkedPropertyId": null,
    "latitude": 10.8021, // null nếu tài sản chưa gắn vị trí
    "longitude": 106.7411 // null nếu tài sản chưa gắn vị trí
  }
]
```

Tức là **đúng shape của `AssetListItem` hiện có, cộng thêm `latitude` và `longitude`**.
Không cần trường nào khác — frontend chỉ dùng bấy nhiêu để vẽ pin, gom cụm và hiển thị thẻ
xem nhanh.

### Ràng buộc

| Điểm | Yêu cầu |
| --- | --- |
| Tài sản chưa có vị trí | Vẫn phải trả về, với `latitude`/`longitude` = `null`. Frontend liệt kê chúng riêng trong overlay danh sách kèm nút "Bổ sung" — bỏ sót là người dùng không biết mình còn tài sản chưa gắn vị trí. |
| Phân quyền | Chỉ trả tài sản của người dùng đang đăng nhập, đúng như `GET /assets`. |
| Sắp xếp | Không quan trọng, frontend tự xử lý. |
| Phân trang | Không. Nếu buộc phải có trần thì đặt ở phía server và nêu rõ trong response header. |

## Sau khi backend có endpoint

Đổi thân `assetsApi.mapPins()` thành đúng một dòng:

```ts
mapPins: (): Promise<AssetMapItem[]> => api<AssetMapItem[]>("/assets/map-pins"),
```

Rồi bỏ tham số `onDetail` ở đó và bỏ lời gọi `queryClient.setQueryData` trong
`src/routes/ban-do.index.tsx` — phần nạp cache sinh ra chỉ để chữa cháy cho cách ghép ở
client, hết N+1 thì không còn lý do tồn tại. Cùng lúc bỏ luôn hai hằng `MAP_PIN_LIMIT` và
`MAP_PIN_CONCURRENCY`.

Lưu ý `staleTime: 60_000` ở `AssetDetailDialog` và `AssetDetailPanel`: nó tồn tại **vì** có
phần nạp cache (không có nó thì dữ liệu vừa nạp bị coi là stale ngay và vẫn refetch nền,
nạp cache thành vô nghĩa). Khi bỏ nạp cache thì cân nhắc bỏ luôn để hai chỗ này quay về
mặc định — lúc đó endpoint mới không còn tải sẵn detail nữa, giữ staleTime chỉ làm dữ liệu
cũ đi mà không đổi lại được gì.

Kiểu `AssetMapItem` đã khớp sẵn với response đề xuất nên **không component nào phía trên
phải sửa**.
