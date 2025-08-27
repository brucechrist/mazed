import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import './tools-blog.css';

export default function ToolsBlog({ onBack }) {
  const [posts, setPosts] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i, text: `Post #${i + 1}` }))
  );
  const [hasMore, setHasMore] = useState(true);

  const fetchMore = () => {
    if (posts.length >= 100) {
      setHasMore(false);
      return;
    }
    setTimeout(() => {
      setPosts((prev) =>
        prev.concat(
          Array.from({ length: 10 }, (_, i) => ({
            id: prev.length + i,
            text: `Post #${prev.length + i + 1}`,
          }))
        )
      );
    }, 300);
  };

  return (
    <div className="tools-blog" id="tools-blog">
      <button className="back-button" onClick={onBack}>Back</button>
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchMore}
        hasMore={hasMore}
        loader={<p>Loading...</p>}
        scrollableTarget="tools-blog"
      >
        {posts.map((p) => (
          <div key={p.id} className="blog-post">
            {p.text}
          </div>
        ))}
      </InfiniteScroll>
    </div>
  );
}
