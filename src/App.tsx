import { useEffect, useState, useCallback } from 'react';
import { Nav } from './components/Nav';
import { Hero } from './components/Hero';
import { Timeline } from './components/Timeline';
import { Skills } from './components/Skills';
import { Experience } from './components/Experience';
import { Projects } from './components/Projects';
import { Contact } from './components/Contact';
import { ResumePrint } from './components/ResumePrint';
import { ErrorScreen } from './components/ErrorScreen';
import { log } from './lib/logger';
import { loadProfileData, clearStaleStorageKeys } from './data/db';
import type { ProfileData } from './types';
import './App.css';
import './styles/snowflakes.css';
import './styles/print.css';

export default function App() {
  const [data, setData] = useState<ProfileData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showSnowflakes, setShowSnowflakes] = useState(true);

  const loadData = useCallback(async () => {
    setError(null);
    setData(null);
    log.info('APP', '=== Loading profile data ===');

    try {
      // Clear stale localStorage on retry to force a fresh fetch
      clearStaleStorageKeys();

      const data = await loadProfileData();
      log.info('APP', `Loaded: ${data.roles.length} roles, ${data.events.length} events, ${data.tools.length} tools, ${data.skills.length} skills, ${data.education.length} education, ${data.awards.length} awards, ${data.projects.length} projects, ${data.graph.nodes.length} graph nodes, ${data.graph.links.length} graph links`);
      setData(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load data';
      log.error('APP', `Initialization failed: ${message}`, err);
      setError(message);
    }
  }, []);

  useEffect(() => {
    log.info('APP', 'App component mounted');
    loadData();
  }, [loadData]);

  // Hide snowflakes once the user scrolls to "The Journey" (Timeline) section
  useEffect(() => {
    const handleScroll = () => {
      const timeline = document.getElementById('timeline');
      if (timeline) {
        const fadePoint = timeline.offsetTop - window.innerHeight * 0.5;
        setShowSnowflakes(window.scrollY < fadePoint);
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (error) {
    return <ErrorScreen error={error} onRetry={loadData} />;
  }

  if (!data) {
    return (
      <div className="loading-screen">
        <div className="loading-screen__spinner" />
        <p className="loading-screen__text">Loading the story…</p>
      </div>
    );
  }

  return (
    <>
      <div className={`snowflakes ${showSnowflakes ? '' : 'snowflakes--hidden'}`} aria-hidden="true">
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
        <div className="snowflake"><div className="inner">❅</div></div>
      </div>
      <Nav />
      <main>
        <Hero />
        <Timeline events={data.events} roles={data.roles} />
        <Skills graph={data.graph} />
        <Projects projects={data.projects} />
        <Experience roles={data.roles} education={data.education} awards={data.awards} />
        <Contact />
      </main>
      <ResumePrint data={data} />
    </>
  );
}