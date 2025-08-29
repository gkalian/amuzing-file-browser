import express from 'express';

export function registerLogger(app: express.Application) {
  // Simple request logger: prints JSON to stdout
  app.use((req, res, next) => {
    const start = Date.now();
    const { method } = req;
    const url = (req as any).originalUrl || req.url;
    const ua = req.get('user-agent') || '';
    res.on('finish', () => {
      const durationMs = Date.now() - start;
      const status = res.statusCode;
      const length = res.getHeader('content-length') || '-';
      // Structured line for easy parsing in log systems
      console.log(
        JSON.stringify({
          time: new Date().toISOString(),
          level: 'info',
          method,
          url,
          status,
          durationMs,
          length,
          ua,
        })
      );
    });
    next();
  });
}
