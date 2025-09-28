import React, { useCallback, useEffect, useMemo, useState } from 'react';
import nlp from 'compromise';
import './typomancy.css';

const POS_TAGS = {
  nouns: '#Noun',
  adjectives: '#Adjective',
  verbs: '#Verb',
  adverbs: '#Adverb',
};

const POS_ORDER = ['nouns', 'adjectives', 'verbs', 'adverbs'];

const POS_LABEL = {
  nouns: 'Nouns',
  adjectives: 'Adjectives',
  verbs: 'Verbs',
  adverbs: 'Adverbs',
};

const ENTITY_TAGS = {
  people: '#Person+',
  places: '#Place+',
  organizations: '#Organization+',
};

const POSITIVE_WORDS = new Set([
  'accomplish',
  'advance',
  'amazing',
  'balance',
  'calm',
  'celebrate',
  'creative',
  'delight',
  'empower',
  'excellent',
  'extraordinary',
  'focus',
  'glow',
  'gratitude',
  'growth',
  'harmony',
  'hope',
  'inspire',
  'joy',
  'kind',
  'love',
  'mastery',
  'peace',
  'progress',
  'radiant',
  'serene',
  'success',
  'thrive',
  'victory',
  'wisdom',
]);

const NEGATIVE_WORDS = new Set([
  'anxious',
  'battle',
  'broken',
  'chaos',
  'criticize',
  'defeat',
  'doubt',
  'fear',
  'frustration',
  'gloom',
  'grief',
  'hurt',
  'loss',
  'lonely',
  'regret',
  'resist',
  'sad',
  'stress',
  'struggle',
  'tired',
  'toxic',
  'worry',
]);

const SAMPLE_TEXT = `Ritual begins before sunrise. I breathe, I notice the spark of curiosity, and I invite it to speak. The questions arrive like soft comets, guiding my attention toward the work that matters today. In this space I test daring sentences, challenge assumptions, and track the verbs that keep my craft alive. Each paragraph becomes a spell for progress, sharpening both intention and tone.`;

const buildFrequencyList = (terms) => {
  const freq = {};
  terms.forEach((term) => {
    const clean = term.toLowerCase().replace(/[^a-z0-9']+/g, '');
    if (!clean) return;
    freq[clean] = (freq[clean] || 0) + 1;
  });
  return Object.entries(freq)
    .map(([word, count]) => ({ word, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
};

const computeNgrams = (words, size, limit = 6) => {
  if (!Array.isArray(words) || words.length < size) return [];
  const freq = {};
  for (let i = 0; i <= words.length - size; i += 1) {
    const gram = words.slice(i, i + size).join(' ');
    freq[gram] = (freq[gram] || 0) + 1;
  }
  return Object.entries(freq)
    .map(([phrase, count]) => ({ phrase, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
};

const formatReadTime = (minutes) => {
  if (!minutes || Number.isNaN(minutes)) return '—';
  if (minutes < 1) {
    const seconds = Math.max(20, Math.round(minutes * 60));
    return `${seconds}s read`;
  }
  const rounded = Math.ceil(minutes);
  return `${rounded} min${rounded === 1 ? '' : 's'} read`;
};

export default function Typomancy({ onBack }) {
  const [text, setText] = useState('');
  const [analysis, setAnalysis] = useState(null);
  const [autoAnalyze, setAutoAnalyze] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const runAnalysis = useCallback(() => {
    const trimmed = text.trim();
    if (!trimmed) {
      setAnalysis(null);
      return;
    }

    const doc = nlp(trimmed);

    const categories = Object.entries(POS_TAGS).reduce((acc, [key, tag]) => {
      const words = doc.match(tag).normalize({ punctuation: true }).out('array');
      acc[key] = buildFrequencyList(words);
      return acc;
    }, {});

    const sentenceList = doc.sentences().out('array');
    const wordList = doc
      .words()
      .out('array')
      .map((w) => w.toLowerCase().replace(/[^a-z0-9']+/g, ''))
      .filter(Boolean);

    const uniqueWords = new Set(wordList);
    const paragraphCount = trimmed.split(/\n{2,}/).filter(Boolean).length || 1;
    const wordCount = wordList.length;
    const sentenceCount = sentenceList.length || (trimmed ? 1 : 0);
    const lexicalDensity = wordCount ? uniqueWords.size / wordCount : 0;

    const bigrams = computeNgrams(wordList, 2);
    const trigrams = computeNgrams(wordList, 3);

    const entities = Object.entries(ENTITY_TAGS).reduce((acc, [key, tag]) => {
      const matches = doc.match(tag).normalize({ punctuation: true }).out('array');
      acc[key] = buildFrequencyList(matches).slice(0, 8);
      return acc;
    }, {});

    const sentimentCounts = wordList.reduce(
      (totals, token) => {
        if (POSITIVE_WORDS.has(token)) {
          totals.positive += 1;
        } else if (NEGATIVE_WORDS.has(token)) {
          totals.negative += 1;
        }
        return totals;
      },
      { positive: 0, negative: 0 }
    );

    const toneScore = sentimentCounts.positive - sentimentCounts.negative;
    let toneLabel = 'Neutral';
    if (toneScore > 1) toneLabel = 'Positive';
    if (toneScore < -1) toneLabel = 'Negative';

    const stats = {
      wordCount,
      uniqueWords: uniqueWords.size,
      sentenceCount,
      paragraphCount,
      charCount: trimmed.replace(/\s+/g, '').length,
      lexicalDensity,
      averageSentenceLength: sentenceCount ? wordCount / sentenceCount : 0,
      readTime: wordCount / 200,
    };

    setAnalysis({
      categories,
      stats,
      sentiment: {
        ...sentimentCounts,
        tone: toneLabel,
        magnitude: Math.abs(toneScore),
      },
      phrases: { bigrams, trigrams },
      entities,
    });
  }, [text]);

  useEffect(() => {
    if (!autoAnalyze) return undefined;
    const timeout = setTimeout(() => {
      runAnalysis();
    }, 150);
    return () => clearTimeout(timeout);
  }, [text, autoAnalyze, runAnalysis]);

  useEffect(() => {
    if (!feedback) return undefined;
    const id = setTimeout(() => setFeedback(null), 2400);
    return () => clearTimeout(id);
  }, [feedback]);

  const summary = useMemo(() => {
    if (!analysis) return '';
    const { stats, sentiment, categories } = analysis;
    const topNouns = categories.nouns?.slice(0, 5).map(({ word }) => word).join(', ') || '—';
    return [
      'Typomancy Snapshot',
      `Words: ${stats.wordCount}`,
      `Unique words: ${stats.uniqueWords}`,
      `Sentences: ${stats.sentenceCount}`,
      `Lexical density: ${(stats.lexicalDensity * 100).toFixed(1)}%`,
      `Tone: ${sentiment.tone}`,
      `Top nouns: ${topNouns}`,
    ].join('\n');
  }, [analysis]);

  const handleAnalyze = useCallback(() => {
    runAnalysis();
  }, [runAnalysis]);

  const handleClear = () => {
    setText('');
    setAnalysis(null);
  };

  const handleSample = () => {
    setText(SAMPLE_TEXT);
  };

  const handleCopySummary = async () => {
    if (!summary) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(summary);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = summary;
        textarea.setAttribute('readonly', '');
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setFeedback('Summary copied to clipboard.');
    } catch (err) {
      setFeedback('Copy failed. Select the text manually.');
    }
  };

  const statsView = analysis?.stats;
  const sentimentView = analysis?.sentiment;

  return (
    <div className="typomancy">
      <header className="typo-header">
        <button className="back-button" onClick={onBack}>Back</button>
        <div className="typo-title">
          <h1>Typomancy Lab</h1>
          <p>Write with clarity, surface the interesting words, and understand the tone at a glance.</p>
        </div>
      </header>

      <section className="typo-editor">
        <textarea
          className="text-input"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Drop in your paragraph, a brainstorm, or a ritual prompt. Typomancy will map its patterns."
        />
        <div className="typo-toolbar">
          <button className="action-button" onClick={handleAnalyze}>Analyze</button>
          <label className="toggle">
            <input
              type="checkbox"
              checked={autoAnalyze}
              onChange={(e) => setAutoAnalyze(e.target.checked)}
            />
            Auto analyze
          </label>
          <button className="ghost-button" onClick={handleClear} disabled={!text}>Clear</button>
          <button className="ghost-button" onClick={handleSample}>Load sample</button>
          <button
            className="ghost-button"
            onClick={handleCopySummary}
            disabled={!analysis}
          >
            Copy summary
          </button>
        </div>
        {feedback && <div className="typo-feedback">{feedback}</div>}
      </section>

      {analysis && (
        <section className="typo-panels">
          <article className="insights-card stats">
            <h2>Snapshot</h2>
            <div className="stat-grid">
              <div className="stat-item">
                <span>Words</span>
                <strong>{statsView.wordCount}</strong>
              </div>
              <div className="stat-item">
                <span>Unique words</span>
                <strong>{statsView.uniqueWords}</strong>
              </div>
              <div className="stat-item">
                <span>Sentences</span>
                <strong>{statsView.sentenceCount}</strong>
              </div>
              <div className="stat-item">
                <span>Paragraphs</span>
                <strong>{statsView.paragraphCount}</strong>
              </div>
              <div className="stat-item">
                <span>Avg sentence length</span>
                <strong>{statsView.averageSentenceLength.toFixed(1)}</strong>
              </div>
              <div className="stat-item">
                <span>Lexical density</span>
                <strong>{(statsView.lexicalDensity * 100).toFixed(1)}%</strong>
              </div>
              <div className="stat-item">
                <span>Characters (no spaces)</span>
                <strong>{statsView.charCount}</strong>
              </div>
              <div className="stat-item">
                <span>Estimated read</span>
                <strong>{formatReadTime(statsView.readTime)}</strong>
              </div>
            </div>
          </article>

          <article className="insights-card sentiment">
            <h2>Tone Gauge</h2>
            <div className="tone-pill tone-pill--label">{sentimentView.tone}</div>
            <div className="tone-bar">
              <div
                className="tone-bar-fill tone-bar-fill--positive"
                style={{ width: `${Math.min(sentimentView.positive * 10, 100)}%` }}
              />
              <div
                className="tone-bar-fill tone-bar-fill--negative"
                style={{ width: `${Math.min(sentimentView.negative * 10, 100)}%` }}
              />
            </div>
            <div className="tone-grid">
              <div>
                <span>Positive cues</span>
                <strong>{sentimentView.positive}</strong>
              </div>
              <div>
                <span>Negative cues</span>
                <strong>{sentimentView.negative}</strong>
              </div>
            </div>
            <p className="tone-note">
              Tone scoring uses a lightweight ritual lexicon. Add more emotional vocabulary to shift the reading instantly.
            </p>
          </article>

          <article className="insights-card pos-breakdown">
            <h2>Word Families</h2>
            <div className="pos-columns">
              {POS_ORDER.map((key) => (
                <div key={key} className="pos-column">
                  <h3>{POS_LABEL[key]}</h3>
                  {analysis.categories[key]?.length ? (
                    <ul>
                      {analysis.categories[key].map(({ word, count }) => (
                        <li key={`${key}-${word}`}>
                          <span>{word}</span>
                          <strong>{count}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty">No {POS_LABEL[key].toLowerCase()} detected.</p>
                  )}
                </div>
              ))}
            </div>
          </article>

          <article className="insights-card key-phrases">
            <h2>Key Phrases</h2>
            <div className="phrase-lists">
              <div>
                <h3>Bigrams</h3>
                {analysis.phrases.bigrams.length ? (
                  <ul>
                    {analysis.phrases.bigrams.map(({ phrase, count }) => (
                      <li key={`bigram-${phrase}`}>
                        <span>{phrase}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Add more sentences to expose phrase patterns.</p>
                )}
              </div>
              <div>
                <h3>Trigrams</h3>
                {analysis.phrases.trigrams.length ? (
                  <ul>
                    {analysis.phrases.trigrams.map(({ phrase, count }) => (
                      <li key={`trigram-${phrase}`}>
                        <span>{phrase}</span>
                        <strong>{count}</strong>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="empty">Build longer flows to reveal narrative loops.</p>
                )}
              </div>
            </div>
          </article>

          <article className="insights-card entities">
            <h2>Named Entities</h2>
            <div className="entity-grid">
              {Object.entries(analysis.entities).map(([key, list]) => (
                <div key={key} className="entity-column">
                  <h3>{key.charAt(0).toUpperCase() + key.slice(1)}</h3>
                  {list?.length ? (
                    <ul>
                      {list.map(({ word, count }) => (
                        <li key={`${key}-${word}`}>
                          <span>{word}</span>
                          <strong>{count}</strong>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="empty">No {key} detected yet.</p>
                  )}
                </div>
              ))}
            </div>
          </article>
        </section>
      )}
    </div>
  );
}
