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

let lightweightChartsPromise;

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
  const chartResourcesRef = React.useRef({
    chart: null,
    candleSeries: null,
    volumeSeries: null,
    resizeObserver: null,
  });
  const [isChartReady, setIsChartReady] = React.useState(false);
  const [chartError, setChartError] = React.useState(null);

  const toggleInsightsPanel = () => {
    setIsInsightsOpen((prev) => !prev);
  };

  const closeInsightsPanel = () => {
    setIsInsightsOpen(false);
  };

  const insightsPanelId = 'timeline-insights-panel';

  React.useEffect(() => {
    if (!isInsightsOpen) {
      return undefined;
    }

    let cancelled = false;
    let animationFrame;

    const initializeChart = async () => {
      const container = chartContainerRef.current;
      if (!container || chartResourcesRef.current.chart) {
        return;
      }

      setIsChartReady(false);
      setChartError(null);

      if (!lightweightChartsPromise) {
        lightweightChartsPromise = import('lightweight-charts');
      }

      const { createChart, CrosshairMode } = await lightweightChartsPromise;
      if (cancelled) {
        return;
      }

      const ensureDimensionsAndCreate = () => {
        const target = chartContainerRef.current;
        if (!target || chartResourcesRef.current.chart || cancelled) {
          return;
        }

        const { width, height } = target.getBoundingClientRect();
        if (!width || !height) {
          animationFrame = requestAnimationFrame(ensureDimensionsAndCreate);
          return;
        }

        const chart = createChart(target, {
          width,
          height,
          layout: {
            background: { color: 'transparent' },
            textColor: '#11141c',
          },
          grid: {
            vertLines: { color: 'rgba(17, 20, 28, 0.08)' },
            horzLines: { color: 'rgba(17, 20, 28, 0.08)' },
          },
          crosshair: {
            mode: CrosshairMode.Normal,
            vertLine: { color: 'rgba(17, 102, 229, 0.35)', width: 1, style: 0 },
            horzLine: { color: 'rgba(17, 102, 229, 0.35)', width: 1, style: 0 },
          },
          rightPriceScale: {
            borderColor: 'rgba(17, 20, 28, 0.12)',
          },
          timeScale: {
            borderColor: 'rgba(17, 20, 28, 0.12)',
            rightOffset: 8,
            barSpacing: 9,
          },
          localization: {
            dateFormat: 'MMM dd',
          },
        });

        const candleSeries = chart.addCandlestickSeries({
          upColor: '#16a085',
          borderUpColor: '#16a085',
          wickUpColor: '#16a085',
          downColor: '#e74c3c',
          borderDownColor: '#e74c3c',
          wickDownColor: '#e74c3c',
          priceScaleId: 'right',
        });
        candleSeries.setData(
          SAMPLE_CANDLE_DATA.map(({ volume, ...candlestick }) => candlestick)
        );

        const volumeSeries = chart.addHistogramSeries({
          priceFormat: { type: 'volume' },
          priceScaleId: '',
          scaleMargins: { top: 0.8, bottom: 0 },
        });
        volumeSeries.setData(
          SAMPLE_CANDLE_DATA.map((point) => ({
            time: point.time,
            value: point.volume,
            color:
              point.close >= point.open
                ? 'rgba(39, 174, 96, 0.5)'
                : 'rgba(192, 57, 43, 0.5)',
          }))
        );

        chart.priceScale('right').applyOptions({
          borderColor: 'rgba(17, 20, 28, 0.12)',
          scaleMargins: { top: 0.08, bottom: 0.28 },
        });
        chart.priceScale('').applyOptions({
          scaleMargins: { top: 0.75, bottom: 0 },
        });

        chart.timeScale().fitContent();

        const resizeObserver =
          typeof ResizeObserver !== 'undefined'
            ? new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                const { width: nextWidth, height: nextHeight } = entry.contentRect;
                chart.resize(nextWidth, nextHeight);
              })
            : null;

        if (resizeObserver) {
          resizeObserver.observe(target);
        }

        chartResourcesRef.current = {
          chart,
          candleSeries,
          volumeSeries,
          resizeObserver,
        };

        if (!cancelled) {
          setIsChartReady(true);
        }
      };

      ensureDimensionsAndCreate();
    };

    initializeChart().catch((error) => {
      if (!cancelled) {
        console.error('Failed to load lightweight chart', error);
        setChartError('Unable to load the market view right now.');
      }
    });

    return () => {
      cancelled = true;
      if (animationFrame) {
        cancelAnimationFrame(animationFrame);
      }
    };
  }, [isInsightsOpen]);

  React.useEffect(() => () => {
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

  React.useEffect(() => {
    if (!chartResourcesRef.current.chart) {
      return;
    }

    const isDark = theme === 'dark';

    chartResourcesRef.current.chart.applyOptions({
      layout: {
        background: { color: 'transparent' },
        textColor: isDark ? '#f1f3fb' : '#11141c',
      },
      grid: {
        vertLines: {
          color: isDark ? 'rgba(241, 243, 251, 0.08)' : 'rgba(17, 20, 28, 0.08)',
        },
        horzLines: {
          color: isDark ? 'rgba(241, 243, 251, 0.08)' : 'rgba(17, 20, 28, 0.08)',
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

    chartResourcesRef.current.candleSeries.applyOptions({
      upColor: isDark ? '#2ecc71' : '#16a085',
      borderUpColor: isDark ? '#2ecc71' : '#16a085',
      wickUpColor: isDark ? '#2ecc71' : '#16a085',
      downColor: '#e74c3c',
      borderDownColor: '#e74c3c',
      wickDownColor: '#e74c3c',
    });

    chartResourcesRef.current.volumeSeries.setData(
      SAMPLE_CANDLE_DATA.map((point) => ({
        time: point.time,
        value: point.volume,
        color:
          point.close >= point.open
            ? isDark
              ? 'rgba(46, 204, 113, 0.55)'
              : 'rgba(39, 174, 96, 0.45)'
            : isDark
            ? 'rgba(231, 76, 60, 0.55)'
            : 'rgba(192, 57, 43, 0.45)',
      }))
    );
  }, [theme]);

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
            className={`timeline-bar__panel-toggle${
              isInsightsOpen ? ' is-open' : ''
            }`}
            onClick={toggleInsightsPanel}
            aria-controls={insightsPanelId}
            aria-expanded={isInsightsOpen}
            aria-label={`${isInsightsOpen ? 'Hide' : 'Show'} timeline insights`}
          >
            <span
              aria-hidden="true"
              className="timeline-bar__panel-toggle-icon"
            >
              {isInsightsOpen ? (
                <svg viewBox="0 0 16 16" className="timeline-bar__panel-toggle-icon-close">
                  <path d="M4.5 4.5l7 7M11.5 4.5l-7 7" />
                </svg>
              ) : (
                <svg
                  viewBox="0 0 16 16"
                  className="timeline-bar__panel-toggle-icon-chevron"
                >
                  <path d="M6.5 4l4 4-4 4" />
                </svg>
              )}
            </span>
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
              className={`timeline-bar__action${
                action.active ? ' is-active' : ''
              }`}
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
            <div className="timeline-insights__chart-shell">
              <div className="timeline-insights__chart-toolbar">
                <div className="timeline-insights__chart-symbol">BTC · USDT</div>
                <div className="timeline-insights__chart-meta">1H · Simulated feed</div>
              </div>
              <div
                className="timeline-insights__chart"
                ref={chartContainerRef}
                data-ready={isChartReady}
                data-error={chartError ? 'true' : 'false'}
              >
                <div
                  className="timeline-insights__chart-status"
                  role="status"
                  aria-hidden={isChartReady || chartError ? 'true' : 'false'}
                >
                  Loading market view…
                </div>
                <div
                  className="timeline-insights__chart-status timeline-insights__chart-status--error"
                  role="alert"
                  aria-hidden={chartError ? 'false' : 'true'}
                >
                  {chartError || 'Unable to load the market view right now.'}
                </div>
              </div>
            </div>
            <p className="timeline-insights__footnote">
              Prototype data powered by TradingView’s lightweight-charts. Live
              account hooks will stream here next.
            </p>
          </div>
        </div>
      </aside>
    </>
  );
}
