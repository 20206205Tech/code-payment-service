import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';

// Khởi tạo exporter
const traceExporter = new OTLPTraceExporter({
  url: 'https://api.honeycomb.io/v1/traces',
  headers: {
    'x-honeycomb-team': process.env.HONEYCOMB_API_KEY ?? '',
  },
});

export const sdk = new NodeSDK({
  traceExporter,
  instrumentations: [getNodeAutoInstrumentations()],
  serviceName: 'code-payment-service',
});

// Chỉ khởi tạo một lần duy nhất
let isStarted = false;

export const initTracing = () => {
  if (isStarted) return;

  sdk.start();
  isStarted = true;
  console.log('Tracing initialized');
};

// Đảm bảo đóng SDK khi app tắt để giải phóng tài nguyên
process.on('SIGTERM', () => {
  sdk
    .shutdown()
    .then(() => console.log('Tracing terminated'))
    .finally(() => process.exit(0));
});
