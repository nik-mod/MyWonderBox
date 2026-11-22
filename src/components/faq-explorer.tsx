'use client';

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, Search, X } from 'lucide-react';
import { gsap, useGSAP } from './motion';

const topics = [
  ['all', 'ყველა კითხვა'],
  ['boxes', 'ყუთების შესახებ'],
  ['ordering', 'შეკვეთა და მიწოდება'],
] as const;

export type FAQ = {
  id: string;
  topic: 'boxes' | 'ordering';
  question: string;
  answer: string;
};

function searchText(value: string) {
  return value.normalize('NFKC').toLocaleLowerCase('ka');
}

export function FAQExplorer({ questions }: { questions: FAQ[] }) {
  const [query, setQuery] = useState('');
  const [topic, setTopic] = useState<(typeof topics)[number][0]>('all');
  const [linkedQuestion, setLinkedQuestion] = useState('');
  const root = useRef<HTMLDivElement>(null);
  const input = useRef<HTMLInputElement>(null);
  const { contextSafe } = useGSAP({ scope: root });
  const animateAnswer = contextSafe((details: HTMLDetailsElement) => {
    const answer = details.querySelector('.faq-answer');
    if (!answer) return;
    gsap.killTweensOf(answer);
    if (!details.open || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      gsap.set(answer, { clearProps: 'transform,opacity' });
      return;
    }
    gsap.fromTo(answer, { y: -5, opacity: .58 }, {
      y: 0, opacity: 1, duration: .26, ease: 'power2.out', clearProps: 'transform,opacity',
    });
  });

  useEffect(() => {
    const openFromHash = () => {
      const id = window.location.hash.slice(1);
      if (!questions.some(question => question.id === id)) {
        setLinkedQuestion('');
        return;
      }
      setQuery('');
      setTopic('all');
      setLinkedQuestion(id);
    };
    openFromHash();
    window.addEventListener('hashchange', openFromHash);
    return () => window.removeEventListener('hashchange', openFromHash);
  }, [questions]);

  useEffect(() => {
    if (!linkedQuestion) return;
    const question = document.getElementById(linkedQuestion);
    if (!(question instanceof HTMLDetailsElement)) return;
    question.open = true;
    question.scrollIntoView({ block: 'start', behavior: 'instant' });
  }, [linkedQuestion]);

  const terms = searchText(query).trim().split(/\s+/).filter(Boolean);
  const visible = questions.filter(({ topic: category, question, answer }) => {
    if (topic !== 'all' && category !== topic) return false;
    const content = searchText(`${question} ${answer}`);
    return terms.every(term => content.includes(term));
  });
  const clearFilters = () => {
    setQuery('');
    setTopic('all');
    input.current?.focus();
  };

  return (
    <div className="faq-explorer" ref={root}>
      <div className="faq-search">
        <Search size={19} aria-hidden="true" />
        <input ref={input} type="search" value={query} onChange={event => setQuery(event.target.value)}
          placeholder="მოძებნე კითხვა" aria-label="მოძებნე კითხვა" />
        {query && <button type="button" aria-label="ძიების გასუფთავება" onClick={() => {
          setQuery('');
          input.current?.focus();
        }}><X size={18} aria-hidden="true" /></button>}
      </div>
      <div className="faq-topics" role="group" aria-label="კითხვების თემა">
        {topics.map(([value, label]) => <button type="button" key={value} aria-pressed={topic === value}
          onClick={() => setTopic(value)}>{label}</button>)}
      </div>
      <p className="sr-only" role="status">{visible.length} კითხვა</p>
      <div className="faq-list prose">
        {visible.map(({ id, question, answer }) => (
          <details id={id} key={id} onToggle={event => animateAnswer(event.currentTarget)}>
            <summary>{question}</summary>
            <div className="faq-answer"><p>{answer}</p></div>
          </details>
        ))}
      </div>
      {!visible.length && (
        <div className="faq-no-results">
          <p>კითხვა ვერ მოიძებნა. სცადე სხვა სიტყვა ან თემა.</p>
          <button type="button" className="text-link" onClick={clearFilters}>
            ყველა კითხვის ნახვა <ArrowUpRight size={17} aria-hidden="true" />
          </button>
        </div>
      )}
      <div className="faq-help">
        <Link href="/contact">დაგვიკავშირდი <ArrowUpRight size={18} aria-hidden="true" /></Link>
      </div>
    </div>
  );
}
