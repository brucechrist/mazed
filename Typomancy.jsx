import React, { useState } from 'react';
import nlp from 'compromise';
import './typomancy.css';

export default function Typomancy({ onBack }) {
  const [text, setText] = useState('');
  const [results, setResults] = useState(null);

  const analyze = () => {
    const doc = nlp(text);
    const categories = {
      nouns: '#Noun',
      adjectives: '#Adjective',
      verbs: '#Verb',
      adverbs: '#Adverb',
    };
    const res = {};
    Object.entries(categories).forEach(([key, tag]) => {
      const words = doc
        .match(tag)
        .normalize({ punctuation: true })
        .out('array');
      const freq = {};
      words.forEach((w) => {
        const clean = w.toLowerCase().replace(/[^a-z0-9']+/g, '');
        if (!clean) return;
        freq[clean] = (freq[clean] || 0) + 1;
      });
      res[key] = Object.entries(freq)
        .map(([word, count]) => ({ word, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);
    });
    setResults(res);
  };

  return (
    <div className="typomancy">
      <button className="back-button" onClick={onBack}>Back</button>
      <textarea
        className="text-input"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type or paste text here..."
      />
      <button className="action-button" onClick={analyze}>Analyze</button>
      {results && (
        <div className="results">
          {['nouns', 'adjectives', 'verbs', 'adverbs'].map((cat) => (
            <div key={cat} className="result-group">
              <h3>{cat.charAt(0).toUpperCase() + cat.slice(1)}</h3>
              <ul>
                {results[cat].map(({ word, count }) => (
                  <li key={word}>
                    {word} - {count}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
