import {
  ChiTietApiItem,
  DatHangApiItem,
} from "../../types/Api.d";
import {
  danhSachDatHangCaPhe,
  danhSachDatHangCaPheChiTiet,
} from "./CallApi";

type CafeOrderListResponse<TOrder> = {
  data?: { items?: TOrder[] };
};

type CafeOrderDetailResponse<TDetail> = {
  data?: { items?: TDetail[] };
};

export const groupCafeOrderDetailsByOrderId = <
  TDetail extends ChiTietApiItem,
>(
  details: TDetail[],
) => {
  const detailsByOrderId = new Map<number, TDetail[]>();

  details.forEach((detail) => {
    const orderId = detail.iD_DatHang_BanCaPhe;
    if (orderId == null) return;

    const current = detailsByOrderId.get(orderId) ?? [];
    current.push(detail);
    detailsByOrderId.set(orderId, current);
  });

  return detailsByOrderId;
};

export const fetchCafeOrdersWithDetails = async <
  TOrder extends DatHangApiItem = DatHangApiItem,
  TDetail extends ChiTietApiItem = ChiTietApiItem,
>(
  status: number,
) => {
  const orderResponse =
    await danhSachDatHangCaPhe<CafeOrderListResponse<TOrder>>(status);
  const orders = orderResponse?.data?.items ?? [];
  const orderIds = orders
    .map((order) => order.id)
    .filter((id): id is number => typeof id === "number");

  if (orderIds.length === 0) {
    return {
      orders,
      details: [] as TDetail[],
      detailsByOrderId: new Map<number, TDetail[]>(),
    };
  }

  const detailResponse =
    await danhSachDatHangCaPheChiTiet<CafeOrderDetailResponse<TDetail>>(
      orderIds,
    );
  const details = detailResponse?.data?.items ?? [];

  return {
    orders,
    details,
    detailsByOrderId: groupCafeOrderDetailsByOrderId(details),
  };
};

export const fetchCafeOrderCount = async (status: number): Promise<number> => {
  const orderResponse =
    await danhSachDatHangCaPhe<CafeOrderListResponse<DatHangApiItem>>(status);

  return orderResponse?.data?.items?.length ?? 0;
};
