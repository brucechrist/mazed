import React, { useState } from 'react';
import InfiniteScroll from 'react-infinite-scroll-component';
import './training-blog.css';

export default function TrainingBlog({ onBack }) {
  const [posts, setPosts] = useState(
    Array.from({ length: 10 }, (_, i) => ({ id: i, text: `Post #${i + 1}` }))
  );

  const fetchMore = () => {
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
    <div className="training-blog" id="training-blog">
      <button className="back-button" onClick={onBack}>Back</button>
      <InfiniteScroll
        dataLength={posts.length}
        next={fetchMore}
        hasMore={true}
        scrollableTarget="training-blog"
        loader={<p>Loading...</p>}
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
