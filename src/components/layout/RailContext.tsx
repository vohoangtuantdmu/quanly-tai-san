import { createContext, useContext } from "react";

/**
 * Trạng thái rail sống ở AppShell, nhưng nút mở nó lại nằm trên thanh nổi của trang Bản
 * đồ. Context là đường ngắn nhất để trang con điều khiển rail mà không phải khoan prop
 * xuyên qua router outlet.
 */
export const RailContext = createContext<{ openRail: () => void } | null>(null);

export function useRail() {
  return useContext(RailContext);
}
