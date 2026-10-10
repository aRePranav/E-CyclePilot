import '@testing-library/jest-dom';

interface JsdomBlobImpl {
  _buffer?: {
    toString(encoding: string): string;
  };
}

if (typeof Blob !== 'undefined' && !Blob.prototype.text) {
  Blob.prototype.text = async function (): Promise<string> {
    const sym = Reflect.ownKeys(this).find(
      (k) => typeof k === 'symbol' && (k.description === 'impl' || String(k).includes('impl')),
    );
    if (sym) {
      const impl = (this as unknown as Record<string | symbol, unknown>)[sym] as
        JsdomBlobImpl | undefined;
      if (impl?._buffer) {
        return impl._buffer.toString('utf8');
      }
    }
    return '';
  };
}
