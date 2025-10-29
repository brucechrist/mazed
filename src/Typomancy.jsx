import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import nlp from 'compromise';
import './typomancy.css';

const tools = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'lexicon', label: 'Lexicon', icon: '🔤' },
  { id: 'sentences', label: 'Sentences', icon: '🧭' },
  { id: 'annotations', label: 'Annotations', icon: '📝' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚' },
];

const ANNOTATIONS_STORAGE_KEY = 'typomancy:annotations';

const annotationToneOptions = [
  {
    id: 'critical',
    label: 'Needs change',
    description: 'Flag wording that carries the wrong vibe.',
  },
  {
    id: 'caution',
    label: 'Watch closely',
    description: 'Moments to monitor or soften.',
  },
  {
    id: 'celebrate',
    label: 'Keep it',
    description: 'Phrases that land well and deserve to stay.',
  },
];

const DEFAULT_SIDEBAR_WIDTH = 240;
const DEFAULT_ANALYSIS_WIDTH = 360;
const MIN_SIDEBAR_WIDTH = 180;
const MIN_ANALYSIS_WIDTH = 260;
const MIN_MAIN_WIDTH = 420;
const HANDLE_WIDTH = 12;

export default function Typomancy({ onBack }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [activeTool, setActiveTool] = useState(tools[0].id);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);
  const [annotations, setAnnotations] = useState(() => {
    if (typeof window === 'undefined') return [];
    try {
      const stored = window.localStorage.getItem(ANNOTATIONS_STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Unable to read Typomancy annotations', error);
      return [];
    }
  });
  const [annotationDraft, setAnnotationDraft] = useState(null);
  const [sidebarWidth, setSidebarWidth] = useState(DEFAULT_SIDEBAR_WIDTH);
  const [analysisWidth, setAnalysisWidth] = useState(DEFAULT_ANALYSIS_WIDTH);
  const [activeResize, setActiveResize] = useState(null);

  const shellRef = useRef(null);
  const sidebarWidthRef = useRef(DEFAULT_SIDEBAR_WIDTH);
  const analysisWidthRef = useRef(DEFAULT_ANALYSIS_WIDTH);
  const textareaRef = useRef(null);

  useEffect(() => {
    sidebarWidthRef.current = sidebarWidth;
  }, [sidebarWidth]);

  useEffect(() => {
    analysisWidthRef.current = analysisWidth;
  }, [analysisWidth]);

  useEffect(() => {
    if (!activeResize) {
      return;
    }

    const handlePointerMove = (event) => {
      const point = 'touches' in event ? event.touches[0] : event;
      if (!point) {
        return;
      }

      if ('touches' in event && event.cancelable) {
        event.preventDefault();
      }

      const shell = shellRef.current;
      if (!shell) {
        return;
      }

      const rect = shell.getBoundingClientRect();
      const availableWidth = rect.width - HANDLE_WIDTH * 2;

      if (activeResize === 'sidebar') {
        const analysis = analysisWidthRef.current;
        const rawWidth = point.clientX - rect.left - HANDLE_WIDTH / 2;
        const maxSidebar = Math.max(
          MIN_SIDEBAR_WIDTH,
          availableWidth - MIN_MAIN_WIDTH - analysis
        );
        const nextWidth = Math.min(
          Math.max(rawWidth, MIN_SIDEBAR_WIDTH),
          maxSidebar
        );
        sidebarWidthRef.current = nextWidth;
        setSidebarWidth(nextWidth);
      } else if (activeResize === 'analysis') {
        const sidebar = sidebarWidthRef.current;
        const rawWidth = rect.right - point.clientX - HANDLE_WIDTH / 2;
        const maxAnalysis = Math.max(
          MIN_ANALYSIS_WIDTH,
          availableWidth - MIN_MAIN_WIDTH - sidebar
        );
        const nextWidth = Math.min(
          Math.max(rawWidth, MIN_ANALYSIS_WIDTH),
          maxAnalysis
        );
        analysisWidthRef.current = nextWidth;
        setAnalysisWidth(nextWidth);
      }
    };

    const stopResizing = () => {
      setActiveResize(null);
    };

    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('touchmove', handlePointerMove);
    window.addEventListener('mouseup', stopResizing);
    window.addEventListener('touchend', stopResizing);
    window.addEventListener('touchcancel', stopResizing);
    window.addEventListener('blur', stopResizing);

    return () => {
      window.removeEventListener('mousemove', handlePointerMove);
      window.removeEventListener('touchmove', handlePointerMove);
      window.removeEventListener('mouseup', stopResizing);
      window.removeEventListener('touchend', stopResizing);
      window.removeEventListener('touchcancel', stopResizing);
      window.removeEventListener('blur', stopResizing);
    };
  }, [activeResize]);

  useEffect(() => {
    if (!activeResize || typeof document === 'undefined') {
      return;
    }

    const { body } = document;
    const previousUserSelect = body.style.userSelect;
    const previousCursor = body.style.cursor;
    body.style.userSelect = 'none';
    body.style.cursor = 'col-resize';

    return () => {
      body.style.userSelect = previousUserSelect;
      body.style.cursor = previousCursor;
    };
  }, [activeResize]);

  const applyTextUpdate = useCallback(
    (valueOrUpdater) => {
      setText((prev) =>
        typeof valueOrUpdater === 'function'
          ? valueOrUpdater(prev)
          : valueOrUpdater
      );
      if (!autoAnalyze) {
        setResults(null);
        setLastAnalyzed(null);
      }
    },
    [autoAnalyze]
  );

  const handleTextDragOver = useCallback((event) => {
    if (!event?.dataTransfer) {
      return;
    }

    const types = event.dataTransfer.types;
    const hasPlainText =
      !!types &&
      ((typeof types.includes === 'function' && types.includes('text/plain')) ||
        (typeof types.contains === 'function' && types.contains('text/plain')) ||
        Array.from(types).includes('text/plain'));

    if (hasPlainText) {
      event.preventDefault();
      event.dataTransfer.dropEffect = 'copy';
    }
  }, []);

  const handleTextDrop = useCallback(
    (event) => {
      const target = textareaRef.current;
      if (!target || !event?.dataTransfer) {
        return;
      }

      const droppedText = event.dataTransfer.getData('text/plain');
      if (typeof droppedText !== 'string' || droppedText.length === 0) {
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      const selectionStart = target.selectionStart ?? target.value.length;
      const selectionEnd = target.selectionEnd ?? selectionStart;
      const currentValue = target.value;

      const nextValue =
        currentValue.slice(0, selectionStart) +
        droppedText +
        currentValue.slice(selectionEnd);

      applyTextUpdate(nextValue);

      const nextCursor = selectionStart + droppedText.length;
      requestAnimationFrame(() => {
        if (!textareaRef.current) {
          return;
        }

        textareaRef.current.focus();
        textareaRef.current.selectionStart = nextCursor;
        textareaRef.current.selectionEnd = nextCursor;
      });
    },
    [applyTextUpdate]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem(
        ANNOTATIONS_STORAGE_KEY,
        JSON.stringify(annotations)
      );
    } catch (error) {
      console.warn('Unable to persist Typomancy annotations', error);
    }
  }, [annotations]);

  const runAnalysis = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setResults(null);
      setLastAnalyzed(null);
      return;
    }

    const doc = nlp(trimmed);
    const categories = {
      nouns: '#Noun',
      adjectives: '#Adjective',
      verbs: '#Verb',
      adverbs: '#Adverb',
    };

    const lexical = Object.entries(categories).reduce((acc, [key, tag]) => {
      const words = doc
        .match(tag)
        .normalize({ punctuation: true })
        .out('array');
      const freq = {};
      words.forEach((word) => {
        const clean = word.toLowerCase().replace(/[^a-z0-9'-]+/g, '');
        if (!clean) return;
        freq[clean] = (freq[clean] || 0) + 1;
      });
      acc[key] = Object.entries(freq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 12);
      return acc;
    }, {});

    const words = trimmed.match(/\b[\w']+\b/g) || [];
    const sentences = doc.sentences().out('array');

    const sentenceItems = sentences.map((sentence, index) => {
      const sentenceWords = sentence.match(/\b[\w']+\b/g) || [];
      return {
        index: index + 1,
        text: sentence.trim(),
        wordCount: sentenceWords.length,
        charCount: sentence.length,
      };
    });

    const longestSentence = sentenceItems.reduce(
      (longest, sentence) =>
        !longest || sentence.wordCount > longest.wordCount ? sentence : longest,
      null
    );

    const frequencyMap = words.reduce((map, word) => {
      const clean = word.toLowerCase().replace(/[^a-z0-9'-]+/g, '');
      if (!clean) return map;
      map.set(clean, (map.get(clean) || 0) + 1);
      return map;
    }, new Map());

    const vocabularyFrequency = Array.from(frequencyMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([word, count]) => ({ word, count }));

    const uniqueWords = new Set(
      words
        .map((word) => word.toLowerCase().replace(/[^a-z0-9'-]+/g, ''))
        .filter(Boolean)
    );

    const stats = {
      wordCount: words.length,
      charCount: trimmed.length,
      sentenceCount: sentences.length,
      paragraphCount:
        trimmed.split(/\n\s*\n/).filter(Boolean).length || (trimmed ? 1 : 0),
      readingMinutes: words.length / 200,
      averageWordLength: words.length
        ? words.join('').replace(/[^a-z0-9]/gi, '').length / words.length
        : 0,
      averageSentenceLength: sentences.length
        ? words.length / sentences.length
        : 0,
      lexicalDensity: words.length
        ? (uniqueWords.size / words.length) * 100
        : 0,
      uniqueWords: uniqueWords.size,
      hapaxLegomena: vocabularyFrequency.filter(({ count }) => count === 1).length,
    };

    setResults({
      lexical,
      stats,
      sentences: {
        items: sentenceItems,
        longest: longestSentence,
      },
      vocabulary: {
        top: vocabularyFrequency.slice(0, 20),
        frequency: vocabularyFrequency,
      },
    });
    setLastAnalyzed(new Date());
  }, [text]);

  useEffect(() => {
    if (autoAnalyze) {
      runAnalysis();
    }
  }, [text, autoAnalyze, runAnalysis]);

  const annotationSummary = useMemo(() => {
    if (!annotations.length) return null;
    return annotations.reduce(
      (acc, annotation) => {
        acc.total += 1;
        acc.byTone[annotation.tone] = (acc.byTone[annotation.tone] || 0) + 1;
        return acc;
      },
      { total: 0, byTone: {} }
    );
  }, [annotations]);

  const formatMinutes = useCallback((minutes) => {
    if (!minutes) return 'Less than a minute';
    if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
    return minutes < 10 ? `${minutes.toFixed(1)} min` : `${Math.round(minutes)} min`;
  }, []);

  const startResize = useCallback(
    (panel) => (event) => {
      event.preventDefault();
      if (event.type === 'touchstart') {
        event.stopPropagation();
      }
      setActiveResize(panel);
    },
    []
  );

  const resetSidebarWidth = useCallback(() => {
    sidebarWidthRef.current = DEFAULT_SIDEBAR_WIDTH;
    setSidebarWidth(DEFAULT_SIDEBAR_WIDTH);
  }, []);

  const resetAnalysisWidth = useCallback(() => {
    analysisWidthRef.current = DEFAULT_ANALYSIS_WIDTH;
    setAnalysisWidth(DEFAULT_ANALYSIS_WIDTH);
  }, []);

  const computeAnnotationIndices = useCallback((sentenceText, annotation) => {
    if (!annotation?.selection) return null;
    const normalizedSentence = sentenceText.toLowerCase();
    const target = annotation.selection.toLowerCase();

    if (
      typeof annotation.startIndex === 'number' &&
      normalizedSentence.slice(
        annotation.startIndex,
        annotation.startIndex + target.length
      ) === target
    ) {
      return {
        start: annotation.startIndex,
        end: annotation.startIndex + target.length,
      };
    }

    const dynamicIndex = normalizedSentence.indexOf(target);
    if (dynamicIndex === -1) {
      return null;
    }
    return { start: dynamicIndex, end: dynamicIndex + target.length };
  }, []);

  const renderSentenceWithAnnotations = useCallback(
    (sentenceText, sentenceAnnotations) => {
      if (!sentenceAnnotations?.length) {
        return sentenceText;
      }

      const segments = [];
      let cursor = 0;

      const matches = sentenceAnnotations
        .map((annotation) => {
          const indices = computeAnnotationIndices(sentenceText, annotation);
          if (!indices) {
            return null;
          }
          return { ...indices, annotation };
        })
        .filter(Boolean)
        .sort((a, b) => a.start - b.start);

      matches.forEach(({ start, end, annotation }) => {
        if (start > cursor) {
          segments.push(sentenceText.slice(cursor, start));
        }
        if (start < cursor) {
          return;
        }
        segments.push(
          <span
            key={`${annotation.id}-highlight`}
            className={`annotation-highlight ${annotation.tone}`}
          >
            [{sentenceText.slice(start, end)}]
          </span>
        );
        cursor = Math.max(cursor, end);
      });

      if (cursor < sentenceText.length) {
        segments.push(sentenceText.slice(cursor));
      }

      return segments;
    },
    [computeAnnotationIndices]
  );

  const startAnnotation = useCallback((sentence) => {
    setAnnotationDraft({
      sentenceIndex: sentence.index,
      selection: '',
      note: '',
      tone: annotationToneOptions[0].id,
      error: null,
    });
  }, []);

  const cancelAnnotation = useCallback(() => {
    setAnnotationDraft(null);
  }, []);

  const updateAnnotationDraft = useCallback((field, value) => {
    setAnnotationDraft((prev) =>
      prev
        ? {
            ...prev,
            [field]: value,
            error: null,
          }
        : prev
    );
  }, []);

  const removeAnnotation = useCallback((id) => {
    setAnnotations((prev) => prev.filter((annotation) => annotation.id !== id));
  }, []);

  const handleAnnotationSubmit = useCallback(
    (event) => {
      event.preventDefault();
      if (!annotationDraft || !results?.sentences?.items?.length) {
        return;
      }

      const sentence = results.sentences.items.find(
        (item) => item.index === annotationDraft.sentenceIndex
      );

      if (!sentence) {
        return;
      }

      const selection = annotationDraft.selection.trim();
      const note = annotationDraft.note.trim();

      if (!selection) {
        setAnnotationDraft((prev) => ({ ...prev, error: 'Select the words to isolate.' }));
        return;
      }

      const indices = computeAnnotationIndices(sentence.text, {
        selection,
        startIndex: sentence.text
          .toLowerCase()
          .indexOf(selection.toLowerCase()),
      });

      if (!indices) {
        setAnnotationDraft((prev) => ({
          ...prev,
          error: 'That phrasing is not present in this sentence.',
        }));
        return;
      }

      if (!note) {
        setAnnotationDraft((prev) => ({
          ...prev,
          error: 'Add a short note explaining the change.',
        }));
        return;
      }

      const newAnnotation = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sentenceIndex: sentence.index,
        sentenceText: sentence.text,
        selection,
        tone: annotationDraft.tone,
        note,
        startIndex: indices.start,
        createdAt: new Date().toISOString(),
      };

      setAnnotations((prev) => [...prev, newAnnotation]);
      setAnnotationDraft(null);
    },
    [annotationDraft, computeAnnotationIndices, results]
  );

  const renderAnnotationBadges = useCallback((sentenceAnnotations, sentenceText) => {
    const missing = sentenceAnnotations.filter(
      (annotation) => !computeAnnotationIndices(sentenceText, annotation)
    );

    if (!missing.length) {
      return null;
    }

    return (
      <div className="annotation-warning">
        {missing.length === 1
          ? 'A stored annotation no longer matches this sentence.'
          : 'Some stored annotations no longer match this sentence.'}
      </div>
    );
  }, [computeAnnotationIndices]);

  const sentenceSummary = useMemo(() => {
    if (!results?.sentences?.items?.length) return null;
    const { items } = results.sentences;
    const avgChars =
      items.reduce((sum, sentence) => sum + sentence.charCount, 0) / items.length;
    const shortest = items.reduce(
      (shortestSentence, sentence) =>
        !shortestSentence || sentence.wordCount < shortestSentence.wordCount
          ? sentence
          : shortestSentence,
      null
    );
    return {
      avgChars,
      shortest,
    };
  }, [results]);

  const quickActions = useMemo(
    () => [
      {
        id: 'clear',
        label: 'Clear',
        icon: '🧹',
        onClick: () => applyTextUpdate(''),
      },
      {
        id: 'trim',
        label: 'Trim space',
        icon: '✂️',
        onClick: () =>
          applyTextUpdate((prev) => prev.replace(/\s+\n/g, '\n').replace(/\n{3,}/g, '\n\n').trim()),
      },
      {
        id: 'uppercase',
        label: 'Uppercase',
        icon: '🔠',
        onClick: () => applyTextUpdate((prev) => prev.toUpperCase()),
      },
      {
        id: 'lowercase',
        label: 'Lowercase',
        icon: '🔡',
        onClick: () => applyTextUpdate((prev) => prev.toLowerCase()),
      },
    ],
    [applyTextUpdate]
  );

  const copyStats = useCallback(async () => {
    if (!results || typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      return;
    }

    const overview = [
      `Words: ${results.stats.wordCount}`,
      `Unique words: ${results.stats.uniqueWords}`,
      `Sentences: ${results.stats.sentenceCount}`,
      `Reading time: ${formatMinutes(results.stats.readingMinutes)}`,
      `Lexical density: ${results.stats.lexicalDensity.toFixed(1)}%`,
    ].join('\n');

    try {
      await navigator.clipboard.writeText(overview);
    } catch (error) {
      console.error('Unable to copy Typomancy stats', error);
    }
  }, [formatMinutes, results]);

  const renderAnalysis = () => {
    if (!results) {
      return (
        <div className="empty-state">
          <h3>Awaiting incantation ✨</h3>
          <p>Begin typing in the central canvas to conjure typomantic insights.</p>
        </div>
      );
    }

    switch (activeTool) {
      case 'overview': {
        const {
          wordCount,
          charCount,
          sentenceCount,
          paragraphCount,
          readingMinutes,
          averageWordLength,
          averageSentenceLength,
          lexicalDensity,
          uniqueWords,
          hapaxLegomena,
        } = results.stats;

        return (
          <div className="panel-section">
            <div className="stat-grid">
              {[
                { label: 'Words', value: wordCount },
                { label: 'Sentences', value: sentenceCount },
                { label: 'Paragraphs', value: paragraphCount },
                { label: 'Unique words', value: uniqueWords },
                { label: 'Lexical density', value: `${lexicalDensity.toFixed(1)}%` },
                { label: 'Reading time', value: formatMinutes(readingMinutes) },
              ].map((stat) => (
                <div key={stat.label} className="stat-card">
                  <span className="stat-value">{stat.value}</span>
                  <span className="stat-label">{stat.label}</span>
                </div>
              ))}
            </div>
            <div className="stat-details">
              <p>Characters (with spaces): {charCount}</p>
              <p>Average word length: {averageWordLength.toFixed(2)} letters</p>
              <p>Average sentence length: {averageSentenceLength.toFixed(1)} words</p>
              <p>Hapax legomena (words used once): {hapaxLegomena}</p>
            </div>
            {results.sentences.longest && (
              <div className="highlight-card">
                <h4>Longest sentence</h4>
                <p>{results.sentences.longest.text}</p>
                <span>{results.sentences.longest.wordCount} words</span>
              </div>
            )}
          </div>
        );
      }
      case 'lexicon': {
        return (
          <div className="panel-section">
            {Object.entries(results.lexical).map(([category, words]) => (
              <div key={category} className="lexical-group">
                <h4>{category.charAt(0).toUpperCase() + category.slice(1)}</h4>
                {words.length ? (
                  <ul>
                    {words.map(({ word, count }) => (
                      <li key={word}>
                        <span>{word}</span>
                        <span className="count">×{count}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty-group">No {category} detected yet.</p>
                )}
              </div>
            ))}
          </div>
        );
      }
      case 'sentences': {
        if (!results.sentences.items.length) {
          return <p>No sentences detected yet.</p>;
        }

        return (
          <div className="panel-section sentence-panel">
            {sentenceSummary && (
              <div className="sentence-summary">
                <div>
                  <h4>Average sentence length</h4>
                  <p>{sentenceSummary.avgChars.toFixed(0)} characters</p>
                </div>
                <div>
                  <h4>Shortest sentence</h4>
                  <p>{sentenceSummary.shortest.text}</p>
                </div>
              </div>
            )}
            <ul className="sentence-list">
              {results.sentences.items.map((sentence) => {
                const sentenceAnnotations = annotations.filter(
                  (annotation) => annotation.sentenceIndex === sentence.index
                );

                return (
                  <li
                    key={sentence.index}
                    className={`sentence-item ${
                      sentence === results.sentences.longest ? 'longest' : ''
                    }`}
                  >
                    <span className="sentence-index">#{sentence.index}</span>
                    <div className="sentence-body">
                      <p>
                        {renderSentenceWithAnnotations(
                          sentence.text,
                          sentenceAnnotations
                        )}
                      </p>
                    <span>
                      {sentence.wordCount} words • {sentence.charCount} characters
                    </span>
                    <div className="sentence-actions">
                      <button
                        className="pill-button tertiary inline"
                        type="button"
                        onClick={() => startAnnotation(sentence)}
                      >
                        Annotate
                      </button>
                    </div>
                    {annotationDraft?.sentenceIndex === sentence.index && (
                      <form
                        className="annotation-form"
                        onSubmit={handleAnnotationSubmit}
                      >
                        <label>
                          <span>Words to isolate</span>
                          <input
                            type="text"
                            value={annotationDraft.selection}
                            onChange={(event) =>
                              updateAnnotationDraft('selection', event.target.value)
                            }
                            placeholder="Type the exact words to capture"
                          />
                        </label>
                        <label>
                          <span>Reflection</span>
                          <textarea
                            value={annotationDraft.note}
                            onChange={(event) =>
                              updateAnnotationDraft('note', event.target.value)
                            }
                            rows={3}
                            placeholder="Explain why this phrasing should change."
                          />
                        </label>
                        <fieldset>
                          <legend>How does it feel?</legend>
                          <div className="tone-options">
                            {annotationToneOptions.map((option) => (
                              <label key={option.id}>
                                <input
                                  type="radio"
                                  name="annotation-tone"
                                  value={option.id}
                                  checked={annotationDraft.tone === option.id}
                                  onChange={() =>
                                    updateAnnotationDraft('tone', option.id)
                                  }
                                />
                                <span className={`tone-label ${option.id}`}>
                                  {option.label}
                                </span>
                                <span className="tone-description">
                                  {option.description}
                                </span>
                              </label>
                            ))}
                          </div>
                        </fieldset>
                        {annotationDraft.error && (
                          <p className="annotation-error">{annotationDraft.error}</p>
                        )}
                        <div className="annotation-form-actions">
                          <button className="pill-button" type="submit">
                            Save annotation
                          </button>
                          <button
                            className="pill-button tertiary"
                            type="button"
                            onClick={cancelAnnotation}
                          >
                            Cancel
                          </button>
                        </div>
                      </form>
                    )}
                      <div className="sentence-annotations">
                        {sentenceAnnotations.map((annotation) => (
                          <div key={annotation.id} className="annotation-card">
                            <div className="annotation-card-header">
                              <span className={`annotation-tag ${annotation.tone}`}>
                                {annotationToneOptions.find(
                                  (option) => option.id === annotation.tone
                                )?.label || 'Annotation'}
                              </span>
                              <span className="annotation-time">
                                {new Date(annotation.createdAt).toLocaleString()}
                              </span>
                            </div>
                            <p className="annotation-note">{annotation.note}</p>
                            <button
                              type="button"
                              className="annotation-remove"
                              onClick={() => removeAnnotation(annotation.id)}
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                      {renderAnnotationBadges(sentenceAnnotations, sentence.text)}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        );
      }
      case 'annotations': {
        if (!annotations.length) {
          return (
            <div className="panel-section empty-state">
              <h3>No annotations yet</h3>
              <p>
                Choose a sentence and isolate the words that need attention to build
                your personal writing lexicon.
              </p>
            </div>
          );
        }

        const summary =
          annotationSummary || {
            total: annotations.length,
            byTone: {},
          };

        return (
          <div className="panel-section annotations-panel">
            <div className="annotation-summary-grid">
              <div className="summary-card">
                <span className="summary-value">{summary.total}</span>
                <span className="summary-label">Total annotations</span>
              </div>
              {annotationToneOptions.map((option) => (
                <div key={option.id} className="summary-card subtle">
                  <span className="summary-value">
                    {summary.byTone[option.id] || 0}
                  </span>
                  <span className="summary-label">{option.label}</span>
                </div>
              ))}
            </div>
            <ul className="annotation-collection">
              {annotations.map((annotation) => (
                <li key={annotation.id} className="annotation-collection-item">
                  <header>
                    <span className={`annotation-tag ${annotation.tone}`}>
                      {annotationToneOptions.find(
                        (option) => option.id === annotation.tone
                      )?.label || 'Annotation'}
                    </span>
                    <span className="annotation-time">
                      {new Date(annotation.createdAt).toLocaleString()}
                    </span>
                  </header>
                  <p className="annotation-sentence">
                    {renderSentenceWithAnnotations(
                      annotation.sentenceText,
                      [annotation]
                    )}
                  </p>
                  <p className="annotation-note">{annotation.note}</p>
                </li>
              ))}
            </ul>
          </div>
        );
      }
      case 'vocabulary': {
        return (
          <div className="panel-section">
            <div className="vocab-meta">
              <p>
                Unique words: <strong>{results.stats.uniqueWords}</strong>
              </p>
              <p>
                Diversity ratio:{' '}
                <strong>
                  {results.stats.wordCount
                    ? ((results.stats.uniqueWords / results.stats.wordCount) * 100).toFixed(1)
                    : 0}
                  %
                </strong>
              </p>
            </div>
            <div className="vocab-table">
              {results.vocabulary.top.map(({ word, count }) => (
                <div key={word} className="vocab-row">
                  <span>{word}</span>
                  <span className="count">×{count}</span>
                </div>
              ))}
            </div>
          </div>
        );
      }
      default:
        return null;
    }
  };

  return (
    <div className="typomancy">
      <div
        className="typomancy-shell"
        ref={shellRef}
        style={{
          gridTemplateColumns: `${sidebarWidth}px ${HANDLE_WIDTH}px 1fr ${HANDLE_WIDTH}px ${analysisWidth}px`,
        }}
      >
        <aside className="tool-sidebar">
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
          <h2>Typomancy Tools</h2>
          <div className="tool-buttons">
            {tools.map((tool) => (
              <button
                key={tool.id}
                className={`tool-button ${activeTool === tool.id ? 'active' : ''}`}
                onClick={() => setActiveTool(tool.id)}
              >
                <span className="icon">{tool.icon}</span>
                {tool.label}
              </button>
            ))}
          </div>
          <div className="toggle">
            <label className="switch">
              <input
                type="checkbox"
                checked={autoAnalyze}
                onChange={() => setAutoAnalyze((prev) => !prev)}
              />
              <span className="slider" />
            </label>
            <span>Auto analyze</span>
          </div>
          {!autoAnalyze && (
            <button className="pill-button" onClick={runAnalysis}>
              Analyze now
            </button>
          )}
          <button
            className="pill-button secondary"
            onClick={copyStats}
            disabled={!results}
          >
            Copy stats
          </button>
          {lastAnalyzed && (
            <p className="timestamp">
              Last run <span>{lastAnalyzed.toLocaleTimeString()}</span>
            </p>
          )}
        </aside>
        <div
          className={`resize-handle sidebar ${activeResize === 'sidebar' ? 'active' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize tool sidebar"
          onMouseDown={startResize('sidebar')}
          onTouchStart={startResize('sidebar')}
          onDoubleClick={resetSidebarWidth}
        />
        <main className="writing-panel">
          <header>
            <h1>Spellbinding Draft</h1>
            <p>Compose in the central canvas. Insights awaken in the panel to your right.</p>
          </header>
          <textarea
            className="text-input"
            ref={textareaRef}
            value={text}
            onChange={(event) => applyTextUpdate(event.target.value)}
            onDragOver={handleTextDragOver}
            onDrop={handleTextDrop}
            placeholder="Summon your prose here..."
          />
          <div className="quick-actions">
            {quickActions.map((action) => (
              <button
                key={action.id}
                className="pill-button tertiary"
                onClick={action.onClick}
              >
                <span className="icon">{action.icon}</span>
                {action.label}
              </button>
            ))}
          </div>
          {results && (
            <div className="inline-stats">
              <span>Words: {results.stats.wordCount}</span>
              <span>Sentences: {results.stats.sentenceCount}</span>
              <span>Reading time: {formatMinutes(results.stats.readingMinutes)}</span>
            </div>
          )}
        </main>
        <div
          className={`resize-handle analysis ${activeResize === 'analysis' ? 'active' : ''}`}
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize analysis panel"
          onMouseDown={startResize('analysis')}
          onTouchStart={startResize('analysis')}
          onDoubleClick={resetAnalysisWidth}
        />
        <section className="analysis-panel">{renderAnalysis()}</section>
      </div>
    </div>
  );
}
