import React from 'react';
import { useResource } from './ResourceContext.jsx';
import { RIcon, XIcon } from './ResourceIcons.jsx';
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

const MOOD_LEVELS = {
  vibrant: { label: 'Vibrant', color: '#2ecc71' },
  balanced: { label: 'Balanced', color: '#1abc9c' },
  reflective: { label: 'Reflective', color: '#f1c40f' },
  depleted: { label: 'Depleted', color: '#e67e22' },
  overwhelmed: { label: 'Overwhelmed', color: '#e74c3c' },
  serene: { label: 'Serene', color: '#8e44ad' },
  reset: { label: 'Reset', color: '#95a5a6' },
};

const SAMPLE_MOOD_TIMELINE = [
  { id: 'segment-01', spanLabel: '05:00', level: 'serene', note: 'Deep sleep' },
  { id: 'segment-02', spanLabel: '06:00', level: 'serene', note: 'Morning routine' },
  { id: 'segment-03', spanLabel: '07:00', level: 'balanced', note: 'Breakfast & planning' },
  { id: 'segment-04', spanLabel: '08:00', level: 'vibrant', note: 'Creative focus' },
  { id: 'segment-05', spanLabel: '09:00', level: 'vibrant', note: 'Deep work' },
  { id: 'segment-06', spanLabel: '10:00', level: 'balanced', note: 'Team sync' },
  { id: 'segment-07', spanLabel: '11:00', level: 'balanced', note: 'Flow continues' },
  { id: 'segment-08', spanLabel: '12:00', level: 'reflective', note: 'Midday review' },
  { id: 'segment-09', spanLabel: '13:00', level: 'reset', note: 'Break & reset' },
  { id: 'segment-10', spanLabel: '14:00', level: 'vibrant', note: 'Strategy session' },
  { id: 'segment-11', spanLabel: '15:00', level: 'balanced', note: 'Build momentum' },
  { id: 'segment-12', spanLabel: '16:00', level: 'depleted', note: 'Energy dip' },
  { id: 'segment-13', spanLabel: '17:00', level: 'overwhelmed', note: 'Unexpected fire drill' },
  { id: 'segment-14', spanLabel: '18:00', level: 'reflective', note: 'Debrief' },
  { id: 'segment-15', spanLabel: '19:00', level: 'balanced', note: 'Workout' },
  { id: 'segment-16', spanLabel: '20:00', level: 'vibrant', note: 'Dinner with friends' },
  { id: 'segment-17', spanLabel: '21:00', level: 'reflective', note: 'Journaling' },
  { id: 'segment-18', spanLabel: '22:00', level: 'serene', note: 'Wind-down' },
  { id: 'segment-19', spanLabel: '23:00', level: 'serene', note: 'Resting' },
  { id: 'segment-20', spanLabel: '00:00', level: 'serene', note: 'Sleep' },
  { id: 'segment-21', spanLabel: '01:00', level: 'serene', note: 'Sleep' },
  { id: 'segment-22', spanLabel: '02:00', level: 'serene', note: 'Sleep' },
  { id: 'segment-23', spanLabel: '03:00', level: 'serene', note: 'Sleep' },
  { id: 'segment-24', spanLabel: '04:00', level: 'serene', note: 'Sleep' },
];

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

const createChartOptions = (isDark) => ({
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
    borderColor: isDark ? 'rgba(241, 243, 251, 0.12)' : 'rgba(17, 20, 28, 0.12)',
    scaleMargins: { top: 0.08, bottom: 0.28 },
  },
  timeScale: {
    borderColor: isDark ? 'rgba(241, 243, 251, 0.12)' : 'rgba(17, 20, 28, 0.12)',
    rightOffset: 8,
    barSpacing: 9,
  },
  crosshair: {
    mode: 1,
    vertLine: {
      color: 'rgba(17, 102, 229, 0.35)',
      width: 1,
      style: 0,
    },
    horzLine: {
      color: 'rgba(17, 102, 229, 0.35)',
      width: 1,
      style: 0,
    },
  },
  localization: {
    dateFormat: 'MMM dd',
  },
});

const applyCandlestickOptions = (series, isDark) => {
  if (!series) return;
  const upColor = isDark ? '#2ecc71' : '#16a085';
  series.applyOptions({
    upColor,
    borderUpColor: upColor,
    wickUpColor: upColor,
    downColor: '#e74c3c',
    borderDownColor: '#e74c3c',
    wickDownColor: '#e74c3c',
    priceScaleId: 'right',
  });
};

const applyVolumeOptions = (series) => {
  if (!series) return;
  series.applyOptions({
    priceFormat: { type: 'volume' },
    priceScaleId: '',
    scaleMargins: { top: 0.8, bottom: 0 },
  });
};

export default function TimelineBar({
  focusLabel = 'Tools',
  quickActions = [],
  theme = 'dark',
  onOpenSettings = () => {},
  onOpenProfile = () => {},
  onOpenAkashicRecords = () => {},
  isAnyAppOpen = false,
}) {
  const { resource = 0, xResource = 0 } = useResource() || {};
  const actions = quickActions.filter(Boolean);
  const [isInsightsOpen, setIsInsightsOpen] = React.useState(false);
  const chartContainerRef = React.useRef(null);
  const tradingViewFrameRef = React.useRef(null);
  const animationFrameRef = React.useRef(null);
  const fallbackTimeoutRef = React.useRef(null);

  const [chartMode, setChartMode] = React.useState('tradingview');
  const [isChartReady, setIsChartReady] = React.useState(false);
  const [chartStatusMessage, setChartStatusMessage] = React.useState(
    'Loading TradingView chart…'
  );
  const [chartFootnote, setChartFootnote] = React.useState(
    'Live BTC/USDT market data provided by TradingView.'
  );
  const [chartData, setChartData] = React.useState(null);

  const chartResourcesRef = React.useRef({
    chart: null,
    candleSeries: null,
    volumeSeries: null,
    resizeObserver: null,
  });

  const moodSegments = React.useMemo(
    () =>
      SAMPLE_MOOD_TIMELINE.map((segment) => {
        const levelMeta = MOOD_LEVELS[segment.level] ?? {
          label: segment.level,
          color: '#7f8c8d',
        };

        return {
          ...segment,
          levelMeta,
        };
      }),
    []
  );

  const insightsPanelId = 'timeline-insights-panel';
  const tradingViewFrameId = React.useMemo(
    () => `tradingview-frame-${Math.random().toString(36).slice(2, 10)}`,
    []
  );

  const tradingViewEmbedUrl = React.useMemo(() => {
    const params = new URLSearchParams({
      frameElementId: tradingViewFrameId,
      symbol: 'BINANCE:BTCUSDT',
      interval: '60',
      hidetoptoolbar: '0',
      hidesidetoolbar: '0',
      symboledit: '0',
      saveimage: '0',
      toolbarbg: theme === 'dark' ? '#131722' : '#f1f3f6',
      studies: '[]',
      hideideas: '1',
      theme: theme === 'dark' ? 'dark' : 'light',
      style: '1',
      timezone: 'Etc/UTC',
      enable_publishing: '0',
      allow_symbol_change: '0',
      details: '0',
      calendar: '0',
      hotlist: '0',
      hidevolume: '0',
      withdateranges: '1',
      show_popup_button: '0',
    });

    return `https://s.tradingview.com/widgetembed/?${params.toString()}`;
  }, [theme, tradingViewFrameId]);

  const clearFallbackTimeout = React.useCallback(() => {
    if (fallbackTimeoutRef.current) {
      clearTimeout(fallbackTimeoutRef.current);
      fallbackTimeoutRef.current = null;
    }
  }, []);

  const resetLightweightChart = React.useCallback(() => {
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
    const { candleSeries, volumeSeries } = chartResourcesRef.current;
    if (!candleSeries || !volumeSeries || !dataset) {
      return;
    }

    candleSeries.setData(dataset.map(({ volume, ...candlestick }) => candlestick));

    volumeSeries.setData(
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

  const toggleInsightsPanel = () => {
    setIsInsightsOpen((prev) => !prev);
  };

  const closeInsightsPanel = () => {
    setIsInsightsOpen(false);
  };

  React.useEffect(() => {
    return () => {
      clearFallbackTimeout();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      resetLightweightChart();
    };
  }, [clearFallbackTimeout, resetLightweightChart]);

  React.useEffect(() => {
    if (!isInsightsOpen) {
      clearFallbackTimeout();
      setIsChartReady(false);
      setChartMode('tradingview');
      setChartData(null);
      setChartStatusMessage('Loading TradingView chart…');
      setChartFootnote('Live BTC/USDT market data provided by TradingView.');
      resetLightweightChart();
    }
  }, [clearFallbackTimeout, isInsightsOpen, resetLightweightChart]);

  React.useEffect(() => {
    if (chartMode !== 'lightweight') {
      resetLightweightChart();
    }
  }, [chartMode, resetLightweightChart]);

  React.useEffect(() => {
    if (!isInsightsOpen || chartMode !== 'tradingview') {
      return;
    }

    setIsChartReady(false);
    setChartStatusMessage('Loading TradingView chart…');
    setChartFootnote('Live BTC/USDT market data provided by TradingView.');

    fallbackTimeoutRef.current = window.setTimeout(() => {
      setChartStatusMessage('TradingView unavailable. Loading fallback preview…');
      setChartFootnote('Data shown is simulated for demonstration purposes.');
      setChartMode('lightweight');
    }, 10000);

    return () => {
      clearFallbackTimeout();
    };
  }, [chartMode, clearFallbackTimeout, isInsightsOpen, tradingViewEmbedUrl]);

  React.useEffect(() => {
    if (!isInsightsOpen || chartMode !== 'lightweight') {
      return;
    }

    let cancelled = false;
    const abortController = new AbortController();

    const initializeChart = async () => {
      setIsChartReady(false);
      setChartStatusMessage('Loading lightweight chart…');
      setChartFootnote('Data shown is simulated for demonstration purposes.');
      setChartData(null);

      let chartsModule;
      try {
        chartsModule = await getLightweightChartsModule();
      } catch (error) {
        if (!cancelled) {
          console.error('Failed to load lightweight-charts module', error);
          setChartStatusMessage('Unable to load chart preview.');
          setChartFootnote('Install lightweight-charts to enable the BTC market preview.');
        }
        return;
      }

      if (cancelled) {
        return;
      }

      const { createChart, CrosshairMode } = chartsModule;
      const isDark = theme === 'dark';
      const baseOptions = createChartOptions(isDark);

      const ensureSurface = () =>
        new Promise((resolve) => {
          const attemptInitialization = () => {
            const target = chartContainerRef.current;
            if (!target || cancelled) {
              resolve(false);
              return;
            }

            const { width, height } = target.getBoundingClientRect();
            if (!width || !height) {
              animationFrameRef.current = requestAnimationFrame(attemptInitialization);
              return;
            }

            resetLightweightChart();

            const chart = createChart(target, {
              ...baseOptions,
              width,
              height,
              crosshair: {
                ...baseOptions.crosshair,
                mode: CrosshairMode.Normal,
              },
            });

            chart.resize(width, height);

            const candleSeries = chart.addCandlestickSeries();
            applyCandlestickOptions(candleSeries, isDark);

            const volumeSeries = chart.addHistogramSeries();
            applyVolumeOptions(volumeSeries);

            const priceScale = chart.priceScale('right');
            if (priceScale) {
              priceScale.applyOptions({
                borderColor: baseOptions.rightPriceScale.borderColor,
                scaleMargins: { top: 0.08, bottom: 0.28 },
              });
            }

            const volumeScale = chart.priceScale('');
            if (volumeScale) {
              volumeScale.applyOptions({ scaleMargins: { top: 0.75, bottom: 0 } });
            }

            let resizeObserver = chartResourcesRef.current.resizeObserver;
            if (!resizeObserver && typeof ResizeObserver !== 'undefined') {
              resizeObserver = new ResizeObserver((entries) => {
                const entry = entries[0];
                if (!entry) return;
                const { width: nextWidth, height: nextHeight } = entry.contentRect;
                chart.resize(nextWidth, nextHeight);
              });
            }

            if (resizeObserver) {
              resizeObserver.disconnect();
              resizeObserver.observe(target);
            }

            chartResourcesRef.current = {
              chart,
              candleSeries,
              volumeSeries,
              resizeObserver: resizeObserver ?? null,
            };

            if (animationFrameRef.current) {
              cancelAnimationFrame(animationFrameRef.current);
              animationFrameRef.current = null;
            }

            resolve(true);
          };

          attemptInitialization();
        });

      const surfaceReady = await ensureSurface();
      if (!surfaceReady || cancelled) {
        return;
      }

      const fetchCandleData = async () => {
        const endpoint =
          'https://api.binance.com/api/v3/klines?symbol=BTCUSDT&interval=1h&limit=240';

        try {
          setChartStatusMessage('Fetching Binance BTC/USDT (1h)…');
          const response = await fetch(endpoint, { signal: abortController.signal });
          if (!response.ok) {
            throw new Error(`Request failed with status ${response.status}`);
          }

          const payload = await response.json();
          if (cancelled || abortController.signal.aborted) {
            return null;
          }

          if (Array.isArray(payload) && payload.length > 0) {
            const dataset = payload.map((kline) => ({
              time: Math.floor(kline[0] / 1000),
              open: parseFloat(kline[1]),
              high: parseFloat(kline[2]),
              low: parseFloat(kline[3]),
              close: parseFloat(kline[4]),
              volume: parseFloat(kline[5]),
            }));

            return { dataset, label: 'Binance BTC/USDT (1h)', isFallback: false };
          }
        } catch (error) {
          if (cancelled || abortController.signal.aborted) {
            return null;
          }
          console.warn('Falling back to sample BTC dataset', error);
        }

        if (cancelled || abortController.signal.aborted) {
          return null;
        }

        return {
          dataset: NORMALIZED_SAMPLE_CANDLE_DATA,
          label: 'sample BTC dataset',
          isFallback: true,
        };
      };

      const result = await fetchCandleData();
      if (!result || cancelled) {
        return;
      }

      setChartData(result.dataset);
      applyDatasetToSeries(result.dataset, isDark);
      setChartFootnote(
        result.isFallback
          ? 'Using fallback BTC dataset (offline mode).'
          : `Data sourced from ${result.label}.`
      );
      setChartStatusMessage('');
      setIsChartReady(true);

      if (chartResourcesRef.current.chart) {
        chartResourcesRef.current.chart.timeScale().fitContent();
      }
    };

    initializeChart();

    return () => {
      cancelled = true;
      abortController.abort();
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
    };
  }, [applyDatasetToSeries, chartMode, isInsightsOpen, theme, resetLightweightChart]);

  React.useEffect(() => {
    if (
      chartMode !== 'lightweight' ||
      !chartResourcesRef.current.chart ||
      !chartResourcesRef.current.candleSeries
    ) {
      return;
    }

    const isDark = theme === 'dark';
    chartResourcesRef.current.chart.applyOptions(createChartOptions(isDark));
    applyCandlestickOptions(chartResourcesRef.current.candleSeries, isDark);
    applyDatasetToSeries(chartData, isDark);
  }, [applyDatasetToSeries, chartData, chartMode, theme]);

  React.useEffect(() => {
    if (
      chartMode === 'lightweight' &&
      isInsightsOpen &&
      chartResourcesRef.current.chart &&
      chartData
    ) {
      chartResourcesRef.current.chart.timeScale().fitContent();
    }
  }, [chartData, chartMode, isInsightsOpen]);

  const handleTradingViewLoad = React.useCallback(() => {
    if (!isInsightsOpen || chartMode !== 'tradingview') {
      return;
    }

    clearFallbackTimeout();
    setIsChartReady(true);
    setChartStatusMessage('');
    setChartFootnote('Live BTC/USDT market data provided by TradingView.');
  }, [chartMode, clearFallbackTimeout, isInsightsOpen]);

  const handleTradingViewError = React.useCallback(() => {
    if (!isInsightsOpen || chartMode !== 'tradingview') {
      return;
    }

    clearFallbackTimeout();
    setChartStatusMessage('TradingView unavailable. Loading fallback preview…');
    setChartFootnote('Data shown is simulated for demonstration purposes.');
    setChartMode('lightweight');
  }, [chartMode, clearFallbackTimeout, isInsightsOpen]);

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
        <div
          className="timeline-bar__section timeline-bar__section--mood"
          role="group"
          aria-label="Mood timeline prototype"
        >
          <div className="timeline-bar__mood-header">
            <div className="timeline-bar__label">Mood & Moments</div>
            <span className="timeline-bar__mood-caption">Snapshot</span>
          </div>
          <div className="timeline-bar__mood-grid" role="list" aria-label="Mood timeline segments">
            {moodSegments.map((segment) => (
              <span
                key={segment.id}
                className="timeline-bar__mood-cell"
                role="listitem"
                aria-label={`${segment.spanLabel}: ${segment.levelMeta.label}${
                  segment.note ? ` – ${segment.note}` : ''
                }`}
                title={`${segment.spanLabel} • ${segment.levelMeta.label}${
                  segment.note ? ` – ${segment.note}` : ''
                }`}
                style={{ '--mood-color': segment.levelMeta.color }}
              />
            ))}
          </div>
        </div>
        <div className="timeline-bar__section timeline-bar__section--toggles" role="group" aria-label="Currencies">
          {[
            { label: 'R', value: resource, Icon: RIcon },
            { label: 'X', value: xResource, Icon: XIcon },
          ].map(({ label, value, Icon }) => (
            <div
              key={label}
              className="timeline-bar__resource"
              aria-label={`${label} balance`}
            >
              <span className="timeline-bar__resource-icon" aria-hidden="true">
                <Icon />
              </span>
              <div className="timeline-bar__resource-meta">
                <span className="timeline-bar__resource-label">{label}</span>
                <span className="timeline-bar__resource-value">{value}</span>
              </div>
            </div>
          ))}
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
              <iframe
                ref={tradingViewFrameRef}
                id={tradingViewFrameId}
                key={`${tradingViewEmbedUrl}-${chartMode}`}
                title="TradingView BTC/USDT chart"
                src={chartMode === 'tradingview' ? tradingViewEmbedUrl : 'about:blank'}
                className={`timeline-insights__chart-surface${
                  chartMode === 'tradingview' ? '' : ' is-hidden'
                }`}
                allow="fullscreen"
                frameBorder="0"
                onLoad={handleTradingViewLoad}
                onError={handleTradingViewError}
                aria-hidden={
                  chartMode === 'tradingview' && isChartReady ? 'false' : 'true'
                }
              />
              <div
                ref={chartContainerRef}
                className={`timeline-insights__chart-surface${
                  chartMode === 'lightweight' ? '' : ' is-hidden'
                }`}
                aria-hidden={
                  chartMode === 'lightweight' && isChartReady ? 'false' : 'true'
                }
              />
              {!isChartReady && (
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
