"use client";

import { init as initApm, type AgentConfigOptions } from "@elastic/apm-rum";
import { useEffect, useRef } from "react";

function buildElasticApmConfig(): AgentConfigOptions | null {
  if (process.env.NEXT_PUBLIC_ELASTIC_APM_ACTIVE !== "true") {
    return null;
  }

  const serverUrl = process.env.NEXT_PUBLIC_ELASTIC_APM_SERVER_URL;
  if (!serverUrl) {
    return null;
  }

  const apiBase = process.env.NEXT_PUBLIC_API_URL;

  return {
    serviceName:
      process.env.NEXT_PUBLIC_ELASTIC_APM_SERVICE_NAME ?? "cashvio-store-front",
    serverUrl,
    environment: process.env.NODE_ENV,
    active: true,
    distributedTracingOrigins: [serverUrl, apiBase].filter(
      (origin): origin is string => Boolean(origin),
    ),
    breakdownMetrics: true,
  };
}

export function ElasticApmInit(): null {
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) {
      return;
    }

    const config = buildElasticApmConfig();
    if (!config) {
      return;
    }

    initApm(config);
    initializedRef.current = true;
  }, []);

  return null;
}
