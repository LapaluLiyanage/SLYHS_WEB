import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import SmartLink from '../components/SmartLink';
import { NewsletterForm } from '../components/Footer';
import { SlimFooter } from '../components/Footer';
import { getPosts } from '../lib/api';

const TOPICS = [
  ['Field notes', 'What members saw, heard and photographed on walks and surveys.'],
  ['Species spotlights', 'One Sri Lankan reptile or amphibian at a time, and what makes it special.'],
  ['Member research', 'Projects and findings from our Researcher and Author members.'],
  ['Conservation news', 'Threats, rescues and what the society is doing about them.']
];

const fmtDate = (d) => new Intl.DateTimeFormat('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Colombo' }).format(new Date(d));
const safeImg = (u) => (typeof u === 'string' && /^https:\/\//i.test(u) ? u : '');

/** Post body: "## Heading" lines and paragraphs, rendered as text (never as HTML). */
function Body({ text }) {
  return text.split(/\n\s*\n/).map((blk, i) => {
    const t = blk.trim();
    if (!t) return null;
    return t.startsWith('## ') ? <h2 key={i}>{t.slice(3)}</h2> : <p key={i}>{t}</p>;
  });
}

function ComingSoon() {
  return (
    <section className="blog-soon">
      <span className="eyebrow">The SLYHS blog</span>
      <h1 className="blog-title">Coming <span className="serif">soon.</span></h1>
      <p className="blog-lead">We are getting the society started. Our first stories from the field, the lab and our members will land here. Leave your email and we will tell you when the first post is live.</p>
      <div className="blog-signup"><NewsletterForm /></div>
      <ul className="blog-topics">
        {TOPICS.map(([h, t]) => <li key={h} className="glass-card"><strong>{h}</strong><span>{t}</span></li>)}
      </ul>
      <SmartLink to="/join" className="btn btn-outline">Join the society and write for us →</SmartLink>
    </section>
  );
}

function PostList({ posts }) {
  return (
    <section className="blog-list-wrap">
      <span className="eyebrow">The SLYHS blog</span>
      <h1 className="blog-title">Stories from the <span className="serif">field.</span></h1>
      <div className="blog-grid">
        {posts.map((p) => (
          <SmartLink key={p.slug} to={'/blog/' + p.slug} className="blog-card glass-card">
            {safeImg(p.cover) && <img src={safeImg(p.cover)} alt="" loading="lazy" />}
            <span className="blog-date">{fmtDate(p.date)}{p.author ? ' · ' + p.author : ''}</span>
            <h2>{p.title}</h2>
            {p.excerpt && <p>{p.excerpt}</p>}
            <span className="blog-more">Read →</span>
          </SmartLink>
        ))}
      </div>
    </section>
  );
}

function Post({ post }) {
  return (
    <article className="blog-post">
      <SmartLink to="/blog" className="policy-back">← All posts</SmartLink>
      <span className="blog-date">{fmtDate(post.date)}{post.author ? ' · ' + post.author : ''}</span>
      <h1 className="blog-title">{post.title}</h1>
      {post.excerpt && <p className="blog-lead">{post.excerpt}</p>}
      {safeImg(post.cover) && <img className="blog-cover" src={safeImg(post.cover)} alt="" />}
      <div className="blog-body"><Body text={post.body || ''} /></div>
    </article>
  );
}

export default function Blog() {
  const { post: slug } = useParams();
  const [posts, setPosts] = useState(undefined); // undefined = loading, null = unreachable

  useEffect(() => {
    let dead = false;
    getPosts().then((r) => { if (!dead) setPosts(r); });
    return () => { dead = true; };
  }, []);

  let content;
  if (posts === undefined) content = <div className="blog-loading" aria-busy="true">Loading…</div>;
  else if (slug) {
    const p = (posts || []).find((x) => x.slug === slug);
    content = p ? <Post post={p} /> : (
      <section className="blog-soon">
        <h1 className="blog-title">Post not found</h1>
        <p className="blog-lead">That post is not published (yet).</p>
        <SmartLink to="/blog" className="btn btn-outline">Back to the blog →</SmartLink>
      </section>
    );
  } else if (!posts || !posts.length) content = <ComingSoon />;
  else content = <PostList posts={posts} />;

  return (
    <main className="page-blog">
      <div className="blog">{content}</div>
      <SlimFooter />
    </main>
  );
}
