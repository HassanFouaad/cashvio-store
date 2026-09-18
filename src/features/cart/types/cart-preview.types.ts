import type {
  CreateOrderPreviewRequest,
  FulfillmentMethod,
  OrderPreviewResponse,
  PublicFulfillmentMethodDto,
} from "@/features/checkout/types/checkout.types";

export enum CartPreviewError {
  LOAD_FAILED = "previewError",
  NO_METHODS = "noFulfillmentMethods",
}

export interface CartPreviewState {
  preview: OrderPreviewResponse | null;
  isPreviewLoading: boolean;
  previewError: CartPreviewError | null;
}

export interface CartPreviewRequestSnapshot {
  body: CreateOrderPreviewRequest;
  revision: number;
}

export interface CartPreviewResult {
  request: CartPreviewRequestSnapshot;
  preview: OrderPreviewResponse | null;
  error: CartPreviewError | null;
}

export interface CartMethodsResult {
  storeId: string;
  revision: number;
  methods: PublicFulfillmentMethodDto[];
  error: CartPreviewError | null;
}

export interface CartMethodSelection {
  storeId: string;
  method: FulfillmentMethod;
}

export interface ResolveCartPreviewInput {
  request: CartPreviewRequestSnapshot | null;
  result: CartPreviewResult | null;
  hasItems: boolean;
  isInitialized: boolean;
  methodsError: CartPreviewError | null;
}

export interface UseCartOrderPreviewResult extends CartPreviewState {
  fulfillmentMethod: FulfillmentMethod | null;
  availableMethods: PublicFulfillmentMethodDto[];
  setFulfillmentMethod: (method: FulfillmentMethod) => void;
  refetchPreview: () => void;
}
