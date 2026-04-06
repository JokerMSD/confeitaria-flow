export interface MercadoPagoPaymentResolution {
  isPaid: boolean;
  isRejected: boolean;
  isPending: boolean;
}

function normalizeStatus(value: string | null | undefined) {
  return value?.trim().toLowerCase() ?? null;
}

export function resolveMercadoPagoPaymentStatus(input: {
  status: string | null | undefined;
  statusDetail: string | null | undefined;
}): MercadoPagoPaymentResolution {
  const status = normalizeStatus(input.status);
  const statusDetail = normalizeStatus(input.statusDetail);

  if (status === "processed") {
    return {
      isPaid: true,
      isRejected: false,
      isPending: false,
    };
  }

  if (
    status === "failed" ||
    status === "canceled" ||
    status === "cancelled" ||
    status === "expired" ||
    status === "refunded" ||
    status === "charged_back"
  ) {
    return {
      isPaid: false,
      isRejected: true,
      isPending: false,
    };
  }

  if (
    status === "processing" ||
    status === "action_required" ||
    status === "created" ||
    status === "in_review"
  ) {
    return {
      isPaid: false,
      isRejected: false,
      isPending: true,
    };
  }

  if (
    statusDetail === "accredited" ||
    statusDetail === "partially_refunded"
  ) {
    return {
      isPaid: true,
      isRejected: false,
      isPending: false,
    };
  }

  return {
    isPaid: false,
    isRejected: false,
    isPending: true,
  };
}
