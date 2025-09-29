import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import nlp from 'compromise';
import './typomancy.css';

const tools = [
  { id: 'overview', label: 'Overview', icon: '📊' },
  { id: 'lexicon', label: 'Lexicon', icon: '🔤' },
  { id: 'sentences', label: 'Sentences', icon: '🧭' },
  { id: 'vocabulary', label: 'Vocabulary', icon: '📚' },
];

export default function Typomancy({ onBack }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);
  const [activeTool, setActiveTool] = useState(tools[0].id);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [lastAnalyzed, setLastAnalyzed] = useState(null);

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

  const formatMinutes = useCallback((minutes) => {
    if (!minutes) return 'Less than a minute';
    if (minutes < 1) return `${Math.max(1, Math.round(minutes * 60))} sec`;
    return minutes < 10 ? `${minutes.toFixed(1)} min` : `${Math.round(minutes)} min`;
  }, []);

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
              {results.sentences.items.map((sentence) => (
                <li
                  key={sentence.index}
                  className={`sentence-item ${
                    sentence === results.sentences.longest ? 'longest' : ''
                  }`}
                >
                  <span className="sentence-index">#{sentence.index}</span>
                  <div className="sentence-body">
                    <p>{sentence.text}</p>
                    <span>
                      {sentence.wordCount} words • {sentence.charCount} characters
                    </span>
                  </div>
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
      <div className="typomancy-shell">
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
        <main className="writing-panel">
          <header>
            <h1>Spellbinding Draft</h1>
            <p>Compose in the central canvas. Insights awaken in the panel to your right.</p>
          </header>
          <textarea
            className="text-input"
            value={text}
            onChange={(event) => applyTextUpdate(event.target.value)}
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
        <section className="analysis-panel">{renderAnalysis()}</section>
      </div>
    </div>
  );
}
