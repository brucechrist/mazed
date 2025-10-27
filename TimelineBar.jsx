import React from 'react';
import './timeline-bar.css';

const SAMPLE_CANDLE_DATA = [
  { time: '2024-02-01', open: 102.3, high: 104.2, low: 100.8, close: 103.6, volume: 284120 },
  { time: '2024-02-02', open: 103.6, high: 106.4, low: 102.2, close: 105.1, volume: 321884 },
  { time: '2024-02-05', open: 105.2, high: 108.1, low: 104.7, close: 107.4, volume: 352210 },
  { time: '2024-02-06', open: 107.1, high: 109.2, low: 105.4, close: 106.3, volume: 298761 },
  { time: '2024-02-07', open: 106.2, high: 108.8, low: 105.3, close: 108.4, volume: 310024 },
  { time: '2024-02-08', open: 108.6, high: 110.2, low: 107.3, close: 109.6, volume: 287410 },
  { time: '2024-02-09', open: 109.4, high: 112.1, low: 108.9, close: 111.3, volume: 365892 },
  { time: '2024-02-12', open: 111.5, high: 113.8, low: 110.8, close: 113.1, volume: 342107 },
  { time: '2024-02-13', open: 113.2, high: 114.9, low: 111.6, close: 112.4, volume: 329844 },
  { time: '2024-02-14', open: 112.6, high: 115.2, low: 111.8, close: 114.7, volume: 347012 },
  { time: '2024-02-15', open: 114.9, high: 117.4, low: 113.2, close: 116.8, volume: 382601 },
  { time: '2024-02-16', open: 116.5, high: 118.2, low: 115.4, close: 117.1, volume: 295884 },
  { time: '2024-02-20', open: 117.2, high: 119.8, low: 116.3, close: 118.9, volume: 301420 },
  { time: '2024-02-21', open: 118.8, high: 121.6, low: 118.1, close: 120.7, volume: 344105 },
  { time: '2024-02-22', open: 120.6, high: 123.2, low: 119.5, close: 121.4, volume: 356994 },
  { time: '2024-02-23', open: 121.6, high: 124.8, low: 120.7, close: 123.9, volume: 402285 },
  { time: '2024-02-26', open: 123.8, high: 126.4, low: 123.1, close: 125.2, volume: 389772 },
  { time: '2024-02-27', open: 125.4, high: 126.8, low: 123.7, close: 124.1, volume: 310225 },
  { time: '2024-02-28', open: 124.2, high: 125.6, low: 121.9, close: 122.3, volume: 298004 },
  { time: '2024-02-29', open: 122.1, high: 124.7, low: 121.4, close: 124.1, volume: 276593 },
  { time: '2024-03-01', open: 124.2, high: 127.8, low: 123.6, close: 127.1, volume: 418205 },
  { time: '2024-03-04', open: 127.3, high: 129.2, low: 126.5, close: 128.4, volume: 352900 },
  { time: '2024-03-05', open: 128.2, high: 130.6, low: 127.7, close: 129.5, volume: 361122 },
  { time: '2024-03-06', open: 129.4, high: 131.8, low: 128.6, close: 130.9, volume: 339870 },
  { time: '2024-03-07', open: 130.8, high: 133.4, low: 129.9, close: 132.6, volume: 372114 },
  { time: '2024-03-08', open: 132.4, high: 134.9, low: 131.2, close: 134.4, volume: 398621 },
  { time: '2024-03-11', open: 134.3, high: 136.5, low: 133.4, close: 135.2, volume: 312410 },
  { time: '2024-03-12', open: 135.3, high: 137.8, low: 134.6, close: 137.1, volume: 328504 },
  { time: '2024-03-13', open: 137.2, high: 139.4, low: 136.1, close: 138.6, volume: 347881 },
  { time: '2024-03-14', open: 138.4, high: 140.2, low: 137.3, close: 139.1, volume: 318702 },
  { time: '2024-03-15', open: 139.2, high: 141.6, low: 138.4, close: 140.8, volume: 356214 },
];

const NORMALIZED_SAMPLE_CANDLE_DATA = SAMPLE_CANDLE_DATA.map((point) => ({
  ...point,
  time: Math.floor(new Date(`${point.time}T00:00:00Z`).getTime() / 1000),
}));

let lightweightChartsPromise;

const getLightweightChartsModule = () => {
  if (!lightweightChartsPromise) {
    lightweightChartsPromise = import('lightweight-charts').catch((error) => {
      lightweightChartsPromise = null;
      throw error;
    });
  }
  return lightweightChartsPromise;
};

export default function TimelineBar({
  focusLabel = 'Tools',
  quickActions = [],
  autoLog = false,
  onToggleAutoLog = () => {},
  theme = 'dark',
  onToggleTheme = () => {},
  onOpenSettings = () => {},
  onOpenProfile = () => {},
  onOpenAkashicRecords = () => {},
  isAnyAppOpen = false,
}) {
  const actions = quickActions.filter(Boolean);
  const [isInsightsOpen, setIsInsightsOpen] = React.useState(false);
  const chartContainerRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const dataAbortRef = React.useRef(null);
  const chartResourcesRef = React.useRef({
    chart: null,
    candleSeries: null,
    volumeSeries: null,
    resizeObserver: null,
  });
  const datasetRef = React.useRef(null);
  const themeRef = React.useRef(theme);

  const [isChartReady, setIsChartReady] = React.useState(false);
  const [chartStatusMessage, setChartStatusMessage] = React.useState(
    'Open the insights panel to load the BTC market preview.'
  );
  const [chartFootnote, setChartFootnote] = React.useState(
    'Live BTC/USDT candles fetched from Binance.'
  );

  const cleanupChart = React.useCallback(() => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }

    const { chart, resizeObserver } = chartResourcesRef.current;
    if (resizeObserver) {
      resizeObserver.disconnect();
    }
    if (chart) {
      chart.remove();
    }

    chartResourcesRef.current = {
      chart: null,
      candleSeries: null,
      volumeSeries: null,
      resizeObserver: null,
    };
  }, []);

  const applyDatasetToSeries = React.useCallback((dataset, isDarkMode) => {
    if (
      !dataset ||
      !chartResourcesRef.current.candleSeries ||
      !chartResourcesRef.current.volumeSeries
    ) {
      return;
    }

    chartResourcesRef.current.candleSeries.setData(
      dataset.map(({ volume, ...candlestick }) => candlestick)
    );

    chartResourcesRef.current.volumeSeries.setData(
      dataset.map((point) => ({
        time: point.time,
        value: point.volume,
        color:
          point.close >= point.open
            ? isDarkMode
              ? 'rgba(46, 204, 113, 0.55)'
              : 'rgba(39, 174, 96, 0.45)'
            : isDarkMode
            ? 'rgba(231, 76, 60, 0.55)'
            : 'rgba(192, 57, 43, 0.45)',
      }))
    );
  }, []);

  const ensureSurface = React.useCallback((createChart, CrosshairMode) => {
    return new Promise((resolve) => {
      const attemptInitialization = () => {
        const target = chartContainerRef.current;
        if (!target) {
          resolve(false);
          return;
        }

        const { width, height } = target.getBoundingClientRect();
        if (!width || !height) {
          animationFrameRef.current = requestAnimationFrame(attemptInitialization);
          return;
        }

        let { chart, candleSeries, volumeSeries, resizeObserver } =
          chartResourcesRef.current;

        if (!chart) {
          const isDark = themeRef.current === 'dark';
          chart = createChart(target, {
            width,
            height,
            layout: {
              background: { color: 'transparent' },
              textColor: isDark ? '#f1f3fb' : '#11141c',
            },
            grid: {
              vertLines: {
                color: isDark
                  ? 'rgba(241, 243, 251, 0.08)'
                  : 'rgba(17, 20, 28, 0.08)',
              },
              horzLines: {
                color: isDark
                  ? 'rgba(241, 243, 251, 0.08)'
                  : 'rgba(17, 20, 28, 0.08)',
              },
            },
            crosshair: {
              mode: CrosshairMode.Normal,
              vertLine: { color: 'rgba(17, 102, 229, 0.35)', width: 1, style: 0 },
              horzLine: { color: 'rgba(17, 102, 229, 0.35)', width: 1, style: 0 },
            },
            rightPriceScale: {
              borderColor: isDark
                ? 'rgba(241, 243, 251, 0.12)'
                : 'rgba(17, 20, 28, 0.12)',
            },
            timeScale: {
              borderColor: isDark
                ? 'rgba(241, 243, 251, 0.12)'
                : 'rgba(17, 20, 28, 0.12)',
              rightOffset: 8,
              barSpacing: 9,
            },
            localization: {
              dateFormat: 'MMM dd',
            },
          });

          candleSeries = chart.addCandlestickSeries({
            upColor: isDark ? '#2ecc71' : '#16a085',
            borderUpColor: isDark ? '#2ecc71' : '#16a085',
            wickUpColor: isDark ? '#2ecc71' : '#16a085',
            downColor: '#e74c3c',
            borderDownColor: '#e74c3c',
            wickDownColor: '#e74c3c',
            priceScaleId: 'right',
          });

          volumeSeries = chart.addHistogramSeries({
            priceFormat: { type: 'volume' },
            priceScaleId: '',
            scaleMargins: { top: 0.8, bottom: 0 },
          });

          chart.priceScale('right').applyOptions({
            borderColor: isDark
              ? 'rgba(241, 243, 251, 0.12)'
              : 'rgba(17, 20, 28, 0.12)',
            scaleMargins: { top: 0.08, bottom: 0.28 },
          });
          chart.priceScale('').applyOptions({
            scaleMargins: { top: 0.75, bottom: 0 },
          });

          if (typeof ResizeObserver !== 'undefined') {
            resizeObserver = new ResizeObserver((entries) => {
              const entry = entries[0];
              if (!entry) return;
              const { width: nextWidth, height: nextHeight } = entry.contentRect;
              chart.resize(nextWidth, nextHeight);
            });
            resizeObserver.observe(target);
          } else {
            resizeObserver = null;
          }
        } else {
          chart.resize(width, height);
          if (resizeObserver && 'observe' in resizeObserver) {
            resizeObserver.disconnect();
            resizeObserver.observe(target);
          }
        }

        chartResourcesRef.current = {
          chart,
          candleSeries,
          volumeSeries,
          resizeObserver,
        };

        animationFrameRef.current = null;
        resolve(true);
      };

      attemptInitialization();
    });
  }, []);

  const toggleInsightsPanel = () => {
    setIsInsightsOpen((prev) => !prev);
  };

  const closeInsightsPanel = () => {
    setIsInsightsOpen(false);
  };

  const insightsPanelId = 'timeline-insights-panel';

  React.useEffect(() => {
    themeRef.current = theme;

    const { chart, candleSeries } = chartResourcesRef.current;
    if (!chart || !candleSeries) {
      return;
    }

    const isDark = theme === 'dark';

    chart.applyOptions({
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#f1f3fb' : '#11141c',
      },
      grid: {
        vertLines: {
          color: isDark
            ? 'rgba(241, 243, 251, 0.08)'
            : 'rgba(17, 20, 28, 0.08)',
        },
        horzLines: {
          color: isDark
            ? 'rgba(241, 243, 251, 0.08)'
            : 'rgba(17, 20, 28, 0.08)',
        },
      },
      rightPriceScale: {
        borderColor: isDark
          ? 'rgba(241, 243, 251, 0.12)'
          : 'rgba(17, 20, 28, 0.12)',
      },
      timeScale: {
        borderColor: isDark
          ? 'rgba(241, 243, 251, 0.12)'
          : 'rgba(17, 20, 28, 0.12)',
      },
    });

    candleSeries.applyOptions({
      upColor: isDark ? '#2ecc71' : '#16a085',
      borderUpColor: isDark ? '#2ecc71' : '#16a085',
      wickUpColor: isDark ? '#2ecc71' : '#16a085',
      downColor: '#e74c3c',
      borderDownColor: '#e74c3c',
      wickDownColor: '#e74c3c',
    });

    if (datasetRef.current) {
      applyDatasetToSeries(datasetRef.current, isDark);
    }
  }, [applyDatasetToSeries, theme]);

  React.useEffect(() => {
    if (!isInsightsOpen) {
      if (dataAbortRef.current) {
        dataAbortRef.current.abort();
        dataAbortRef.current = null;
      }
      datasetRef.current = null;
      setIsChartReady(false);
      setChartStatusMessage('Open the insights panel to load the BTC market preview.');
      setChartFootnote('Live BTC/USDT candles fetched from Binance.');
      cleanupChart();
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();
    dataAbortRef.current = abortController;

    setIsChartReady(false);
    setChartStatusMessage('Loading chart engine…');
    setChartFootnote('Live BTC/USDT candles fetched from Binance.');

    (async () => {
      let chartsModule;
      try {
        chartsModule = await getLightweightChartsModule();
      } catch (error) {
        console.error('Failed to load lightweight-charts module', error);
        if (!cancelled) {
          setChartStatusMessage('Unable to load chart preview.');
          setChartFootnote('Install lightweight-charts to enable the BTC preview.');
        }
        return;
      }

      if (cancelled || abortController.signal.aborted) {
        return;
      }

      const surfaceReady = await ensureSurface(
        chartsModule.createChart,
        chartsModule.CrosshairMode
      );

      if (!surfaceReady || cancelled || abortController.signal.aborted) {
        return;
      }

      const sources = [
        {
          label: 'Binance BTC/USDT (1h)',
          url: 'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=240',
        },
        {
          label: 'Binance BTC/USD (1h)',
          url: 'https://api.binance.com/api/v3/klines?symbol=BTCUSD&interval=1h&limit=240',
        },
      ];

      let dataset = null;
      let footnote = '';

      for (const source of sources) {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        try {
          setChartStatusMessage(`Fetching ${source.label}…`);
          const response = await fetch(source.url, { signal: abortController.signal });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const payload = await response.json();
          if (!Array.isArray(payload) || payload.length === 0) {
            throw new Error('Empty response payload');
          }

          dataset = payload.map((kline) => ({
            time: Math.floor(kline[0] / 1000),
            open: parseFloat(kline[1]),
            high: parseFloat(kline[2]),
            low: parseFloat(kline[3]),
            close: parseFloat(kline[4]),
            volume: parseFloat(kline[5]),
          }));

          if (!dataset.length) {
            throw new Error('Parsed dataset is empty');
          }

          footnote = `Live data · ${source.label}`;
          break;
        } catch (error) {
          if (abortController.signal.aborted) {
            return;
          }

          console.warn(`Failed to fetch ${source.label}`, error);
        }
      }

      if (!dataset) {
        if (cancelled || abortController.signal.aborted) {
          return;
        }

        setChartStatusMessage('Using fallback BTC dataset…');
        dataset = NORMALIZED_SAMPLE_CANDLE_DATA;
        footnote = 'Sample BTC dataset (offline fallback).';
      }

      if (cancelled || abortController.signal.aborted) {
        return;
      }

      datasetRef.current = dataset;
      applyDatasetToSeries(dataset, themeRef.current === 'dark');
      setChartFootnote(footnote);
      setChartStatusMessage('');
      setIsChartReady(true);

      if (chartResourcesRef.current.chart) {
        chartResourcesRef.current.chart.timeScale().fitContent();
      }
    })();

    return () => {
      cancelled = true;
      abortController.abort();
      dataAbortRef.current = null;
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [applyDatasetToSeries, cleanupChart, ensureSurface, isInsightsOpen]);

  React.useEffect(() => {
    return () => {
      if (dataAbortRef.current) {
        dataAbortRef.current.abort();
        dataAbortRef.current = null;
      }
      datasetRef.current = null;
      cleanupChart();
    };
  }, [cleanupChart]);

  React.useEffect(() => {
    if (isInsightsOpen && chartResourcesRef.current.chart) {
      chartResourcesRef.current.chart.timeScale().fitContent();
    }
  }, [isInsightsOpen]);

  return (
    <>
      <div className="timeline-bar" role="contentinfo" aria-label="Timeline">
        <div className="timeline-bar__section timeline-bar__section--panel-toggle">
          <button
            type="button"
            className={`timeline-bar__panel-toggle${isInsightsOpen ? ' is-open' : ''}`}
            onClick={toggleInsightsPanel}
            aria-controls={insightsPanelId}
            aria-expanded={isInsightsOpen}
            aria-label={`${isInsightsOpen ? 'Hide' : 'Show'} timeline insights`}
          >
            <span aria-hidden="true">{isInsightsOpen ? '×' : '^'}</span>
          </button>
        </div>
        <div className="timeline-bar__section timeline-bar__section--focus">
          <div className="timeline-bar__label">Current Focus</div>
          <div className="timeline-bar__focus" aria-live="polite">
            {focusLabel}
          </div>
          <div
            className={`timeline-bar__status${
              isAnyAppOpen ? ' timeline-bar__status--active' : ''
            }`}
          >
            {isAnyAppOpen ? 'App Active' : 'Exploring'}
          </div>
        </div>
        <div className="timeline-bar__section timeline-bar__section--actions">
          {actions.map((action) => (
            <button
              key={action.label}
              type="button"
              className={`timeline-bar__action${action.active ? ' is-active' : ''}`}
              onClick={() => action.onClick && action.onClick()}
              disabled={!action.onClick}
              aria-pressed={action.active}
              title={action.label}
            >
              <span className="timeline-bar__action-icon" aria-hidden="true">
                {action.icon}
              </span>
              <span>{action.label}</span>
            </button>
          ))}
        </div>
        <div className="timeline-bar__section timeline-bar__section--toggles">
          <button
            type="button"
            className="timeline-bar__pill"
            onClick={onToggleAutoLog}
          >
            <span className="timeline-bar__pill-label">Auto Log</span>
            <span className="timeline-bar__pill-value">{autoLog ? 'On' : 'Off'}</span>
          </button>
          <button
            type="button"
            className="timeline-bar__pill"
            onClick={onToggleTheme}
          >
            <span className="timeline-bar__pill-label">Theme</span>
            <span className="timeline-bar__pill-value">
              {theme === 'dark' ? 'Dark' : 'Light'}
            </span>
          </button>
        </div>
        <div className="timeline-bar__section timeline-bar__section--secondary">
          <button
            type="button"
            className="timeline-bar__ghost"
            onClick={onOpenSettings}
          >
            Settings
          </button>
          <button
            type="button"
            className="timeline-bar__ghost"
            onClick={onOpenProfile}
          >
            Profile
          </button>
          <button
            type="button"
            className="timeline-bar__ghost"
            onClick={onOpenAkashicRecords}
          >
            Akashic Records
          </button>
        </div>
      </div>
      <aside
        id={insightsPanelId}
        className={`timeline-insights${isInsightsOpen ? ' is-open' : ''}`}
        role="complementary"
        aria-label="Timeline insights"
      >
        <div className="timeline-insights__dialog" role="document">
          <div className="timeline-insights__header">
            <h2 className="timeline-insights__title">Insights Panel</h2>
            <button
              type="button"
              className="timeline-insights__close"
              onClick={closeInsightsPanel}
              aria-label="Close insights panel"
            >
              ×
            </button>
          </div>
          <div className="timeline-insights__body">
            <div
              className="timeline-insights__chart"
              role="img"
              aria-label="Candle and volume chart preview"
            >
              <div
                ref={chartContainerRef}
                className="timeline-insights__chart-surface"
                aria-hidden={isChartReady ? 'false' : 'true'}
              />
              {(!isChartReady || chartStatusMessage) && (
                <div className="timeline-insights__chart-status" role="status">
                  {chartStatusMessage || 'Preparing chart…'}
                </div>
              )}
            </div>
          </div>
          <p className="timeline-insights__footnote">{chartFootnote}</p>
        </div>
      </aside>
    </>
  );
}
