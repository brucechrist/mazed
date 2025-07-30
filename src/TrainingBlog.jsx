import React, { useState, useRef, useEffect, useCallback } from 'react';
import './training-blog.css';

export default function TrainingBlog({ onBack }) {
  const [posts, setPosts] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i, text: `Post #${i + 1}` }))
  );
  const [loading, setLoading] = useState(false);
  const containerRef = useRef(null);

  const fetchMore = useCallback(() => {
    if (loading) return;
    setLoading(true);
    setTimeout(() => {
      setPosts((prev) =>
        prev.concat(
          Array.from({ length: 10 }, (_, i) => ({
            id: prev.length + i,
            text: `Post #${prev.length + i + 1}`,
          }))
        )
      );
      setLoading(false);
    }, 300);
  }, [loading]);

  const handleScroll = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;
    if (el.scrollTop + el.clientHeight >= el.scrollHeight - 50) {
      fetchMore();
    }
  }, [fetchMore]);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('scroll', handleScroll);
    return () => el.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  return (
    <div className="training-blog" id="training-blog" ref={containerRef}>
      <button className="back-button" onClick={onBack}>Back</button>
      {posts.map((p) => (
        <div key={p.id} className="blog-post">
          {p.text}
        </div>
      ))}
      {loading && <p>Loading...</p>}
    </div>
  );
}
