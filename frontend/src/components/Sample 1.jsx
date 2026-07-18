import React, { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import styled, { createGlobalStyle, keyframes, css } from 'styled-components';

const API_BASE = import.meta.env.VITE_API_URL;
const BASE = `${API_BASE}/api`;


const T = {
  bg:     '#f6f5f0',
  paper:  '#fcfaf6',
  white:  '#ffffff',
  ink:    '#1a1a2e',
  green:  '#2d6a4f',
  bright: '#52d68a',
  border: '#d8d4cc',
  muted:  '#eceae3',
  soft:   '#7a7567',
  gold:   '#d4af37',
};

const TYPE_COLOR = { solo: T.bright, group: '#93c5fd', academic: '#fbbf24', open_source: '#f9a8d4' };
const TYPE_LABEL = { solo: 'Solo', group: 'Group', academic: 'Academic', open_source: 'Open Source' };


const NAV_LINKS = [
  { to: '/about',      label: 'About' },
  { to: '/skills',     label: 'Skills' },
  { to: '/experience', label: 'Experience' },
  { to: '/projects',   label: 'Projects' },
  { to: '/contact',    label: 'Contact' },
];

const HERO_CHIPS = [
  { label: 'React',      top: '10%', right: '6%',  rot: -6 },
  { label: 'Django',     top: '26%', right: '1%',  rot: 4 },
  { label: 'PostgreSQL', top: '46%', right: '9%',  rot: -4 },
  { label: 'Node.js',    top: '64%', right: '2%',  rot: 6 },
  { label: 'Figma',      top: '82%', right: '13%', rot: -3 },
];

const STATS = [
  { n: '3+',  l: 'Years Building' },
  { n: '20+', l: 'Projects Shipped' },
  { n: '10+', l: 'Tools & Frameworks' },
  { n: 'NP',  l: 'Based in Nepal' },
];

const SKILL_GROUPS = [
  { label: 'Frontend', items: ['React', 'styled-components', 'Vite', 'Framer Motion', 'Accessibility'] },
  { label: 'Backend',  items: ['Django', 'Django REST Framework', 'Node.js', 'PostgreSQL'] },
  { label: 'Practice', items: ['Git', 'Figma', 'Testing', 'Code Review'] },
];

const EXPERIENCE_PREVIEW = [
  { role: 'Full-Stack Developer', org: 'Freelance / Self-Directed', period: '2024 — Present', current: true,
    blurb: 'Designing and building full-stack products end to end, from schema to shipped interface.' },
  { role: 'Frontend Developer', org: 'Independent Projects', period: '2023 — 2024', current: false,
    blurb: 'Focused on interface systems, motion, and component architecture across a family of personal apps.' },
  { role: 'Started Learning to Code', org: 'Self-Taught', period: '2022', current: false,
    blurb: 'Picked up HTML, CSS and JavaScript, and never really stopped.' },
];

const FALLBACK_PROJECTS = [
  { id: 'fallback-1', name: 'Jibun AI — Self Space', project_type: 'solo',
    tech: 'React · Django · PostgreSQL',
    description: 'A private life-logging app for goals, notes, wishes and watch-lists — built for one very specific user.',
    github_link: '' },
  { id: 'fallback-2', name: 'Portfolio & Case Studies', project_type: 'solo',
    tech: 'React · styled-components · Vite',
    description: 'This site — a hand-built portfolio sharing one component system across every page.',
    github_link: '' },
  { id: 'fallback-3', name: 'Open Source Contributions', project_type: 'open_source',
    tech: 'Various',
    description: 'Small fixes and features contributed to tools used daily.',
    github_link: '' },
];


const GlobalStyle = createGlobalStyle`
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@400;600;700;800&family=DM+Sans:wght@300;400;500;600&family=DM+Mono:wght@400;500&display=swap');

  *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }

  html { scroll-behavior: smooth; }

  body {
    background: ${T.bg};
    color: ${T.ink};
    font-family: 'DM Sans', sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  a { color: inherit; }

  :focus-visible {
    outline: 2px solid ${T.green};
    outline-offset: 3px;
    border-radius: 4px;
  }

  @media (prefers-reduced-motion: reduce) {
    *, *::before, *::after {
      animation-duration: 0.001ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.001ms !important;
      scroll-behavior: auto !important;
    }
  }
`;


const fadeUp   = keyframes`from{opacity:0;transform:translateY(18px);}to{opacity:1;transform:translateY(0);}`;
const floatY   = keyframes`0%,100%{transform:translateY(0) rotate(var(--rot));}50%{transform:translateY(-10px) rotate(var(--rot));}`;
const pulseDot = keyframes`0%,100%{opacity:1;}50%{opacity:.4;}`;
const bounce   = keyframes`0%,100%{transform:translateY(0);opacity:.4;}50%{transform:translateY(6px);opacity:1;}`;
const shimmer  = keyframes`0%{background-position:-500px 0;}100%{background-position:500px 0;}`;


function Reveal({ children, delay = 0 }) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold: 0.15 }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return <RevealWrap ref={ref} $visible={visible} $delay={delay}>{children}</RevealWrap>;
}

const RevealWrap = styled.div`
  opacity: 0;
  transform: translateY(26px);
  transition: opacity 0.7s ease ${p => p.$delay}s, transform 0.7s cubic-bezier(.16,1,.3,1) ${p => p.$delay}s;
  ${p => p.$visible && css`opacity: 1; transform: translateY(0);`}
`;


export default function LandingPage() {
  const [menuOpen, setMenuOpen]     = useState(false);
  const [projects, setProjects]     = useState([]);
  const [projLoading, setProjLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(`${BASE}/projectListView/`);
        if (!res.ok) throw new Error('bad response');
        const data = await res.json();
        const list = Array.isArray(data) ? data : data.results || [];
        if (alive) setProjects(list.length ? list.slice(0, 3) : FALLBACK_PROJECTS);
      } catch {
        if (alive) setProjects(FALLBACK_PROJECTS);
      } finally {
        if (alive) setProjLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <>
      <GlobalStyle />
      <Page>

        <Nav>
          <NavInner>
            <Brand to="/">
              <BrandMark>AT</BrandMark>
              <BrandName>Archana <em>Timilsina</em></BrandName>
            </Brand>

            <NavLinks>
              {NAV_LINKS.map(l => (
                <NavItem key={l.to} to={l.to}>{l.label}</NavItem>
              ))}
            </NavLinks>

            <MenuToggle onClick={() => setMenuOpen(o => !o)} aria-label="Toggle menu" $open={menuOpen}>
              <span /><span /><span />
            </MenuToggle>
          </NavInner>

          {menuOpen && (
            <MobileMenu>
              {NAV_LINKS.map(l => (
                <MobileItem key={l.to} to={l.to} onClick={() => setMenuOpen(false)}>
                  {l.label}
                </MobileItem>
              ))}
            </MobileMenu>
          )}
        </Nav>

        <Hero>
          <HeroInner>
            <HeroEyebrow><span />Full-Stack Developer — Based in Nepal</HeroEyebrow>
            <HeroTitle>
              Hi, I'm Archana.<br />
              I build <em>calm, considered</em> software.
            </HeroTitle>
            <HeroSub>
              Full-stack developer who cares about interfaces that feel intentional,
              backends that don't creak under pressure, and the small personal
              details that make software feel like someone actually uses it.
            </HeroSub>

            <HeroCTARow>
              <CTAPrimary to="/projects">View My Work →</CTAPrimary>
              <CTASecondary to="/contact">Say Hello</CTASecondary>
            </HeroCTARow>

            <MobileChipRow>
              {HERO_CHIPS.map(c => <MobileChip key={c.label}>{c.label}</MobileChip>)}
            </MobileChipRow>
          </HeroInner>

          <ChipField>
            {HERO_CHIPS.map((c, i) => (
              <PinnedChip
                key={c.label}
                style={{ top: c.top, right: c.right, '--rot': `${c.rot}deg`, animationDelay: `${i * 0.4}s` }}
              >
                {c.label}
              </PinnedChip>
            ))}
          </ChipField>

          <ScrollCue>
            <span>Scroll</span>
            <ScrollLine />
          </ScrollCue>
        </Hero>

        <StatsStrip>
          {STATS.map(s => (
            <StatCell key={s.l}>
              <StatNum>{s.n}</StatNum>
              <StatLabel>{s.l}</StatLabel>
            </StatCell>
          ))}
        </StatsStrip>

        <Reveal>
          <Section>
            <Eyebrow>01 — About</Eyebrow>
            <AboutGrid>
              <div>
                <SectionTitle>A little about how I work.</SectionTitle>
                <SectionLead>
                  I'm a full-stack developer based in Nepal, currently splitting my time
                  between client work and a handful of personal apps I keep rebuilding
                  until they feel right. Off-screen I'm probably re-organizing a list,
                  watching a slow drama, or writing something down I'll otherwise forget.
                </SectionLead>
                <SectionLink to="/about">Read the full story →</SectionLink>
              </div>
              <NoteCard>
                <NoteTape />
                <NoteText>"Ship it, then improve it."</NoteText>
                <NoteMeta>— pinned to my monitor, permanently</NoteMeta>
              </NoteCard>
            </AboutGrid>
          </Section>
        </Reveal>

        <Reveal delay={0.05}>
          <Section $tint>
            <Eyebrow>02 — Toolkit</Eyebrow>
            <SectionTitle>Tools I reach for.</SectionTitle>
            <SkillGroups>
              {SKILL_GROUPS.map(g => (
                <SkillGroup key={g.label}>
                  <SkillGroupLabel>{g.label}</SkillGroupLabel>
                  <SkillChipRow>
                    {g.items.map(item => <SkillChip key={item}>{item}</SkillChip>)}
                  </SkillChipRow>
                </SkillGroup>
              ))}
            </SkillGroups>
            <SectionLink to="/skills">See the full skillset →</SectionLink>
          </Section>
        </Reveal>

        <Reveal delay={0.05}>
          <Section>
            <Eyebrow>03 — Path</Eyebrow>
            <SectionTitle>Where I've been building.</SectionTitle>
            <Timeline>
              {EXPERIENCE_PREVIEW.map((e, i) => (
                <TimelineItem key={i}>
                  <TimelineDot $current={e.current} />
                  <TimelineBody>
                    <TimelineTop>
                      <TimelineRole>{e.role}</TimelineRole>
                      <TimelinePeriod>{e.period}</TimelinePeriod>
                    </TimelineTop>
                    <TimelineOrg>{e.org}</TimelineOrg>
                    <TimelineBlurb>{e.blurb}</TimelineBlurb>
                  </TimelineBody>
                </TimelineItem>
              ))}
            </Timeline>
            <SectionLink to="/experience">View full experience →</SectionLink>
          </Section>
        </Reveal>

        <Reveal delay={0.05}>
          <Section $tint>
            <Eyebrow>04 — Selected Work</Eyebrow>
            <SectionTitle>A few things I've shipped.</SectionTitle>

            <ProjectsGrid>
              {projLoading
                ? Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)
                : projects.map((p, i) => {
                    const color = TYPE_COLOR[p.project_type] || T.green;
                    return (
                      <ProjectCard key={p.id}>
                        <ProjectTape $pos={i % 2 === 0 ? 'left' : 'right'} />
                        <ProjectTop>
                          <ProjectBadge $color={color}>
                            {TYPE_LABEL[p.project_type] || p.project_type || 'Project'}
                          </ProjectBadge>
                          {p.github_link && (
                            <ProjectGh href={p.github_link} target="_blank" rel="noopener noreferrer">
                              ↗ GitHub
                            </ProjectGh>
                          )}
                        </ProjectTop>
                        <ProjectName>{p.name}</ProjectName>
                        {p.tech && <ProjectTech>{p.tech}</ProjectTech>}
                        {p.description && <ProjectDesc>{p.description}</ProjectDesc>}
                      </ProjectCard>
                    );
                  })
              }
            </ProjectsGrid>

            <SectionLinkCenter to="/projects">View all projects →</SectionLinkCenter>
          </Section>
        </Reveal>

        <ContactCTA>
          <ContactInner>
            <ContactHeading>Let's build something worth logging.</ContactHeading>
            <ContactSub>Got an idea, a role, or just want to say hi? My inbox is always open.</ContactSub>
            <ContactBtn to="/contact">Get In Touch</ContactBtn>
            <ContactEmail href="mailto:hello@archanatimilsina.dev">
              or write directly to hello@archanatimilsina.dev
            </ContactEmail>
          </ContactInner>
        </ContactCTA>

        <Footer>
          <FooterInner>
            <FooterBrand>
              <BrandMark $dark>AT</BrandMark>
              <div>
                <FooterName>Archana Timilsina</FooterName>
                <FooterRole>Full-Stack Developer · Nepal</FooterRole>
              </div>
            </FooterBrand>

            <FooterLinks>
              {NAV_LINKS.map(l => (
                <FooterLink key={l.to} to={l.to}>{l.label}</FooterLink>
              ))}
            </FooterLinks>

            <FooterSocial>
              <a href="#" target="_blank" rel="noopener noreferrer">GitHub</a>
              <a href="#" target="_blank" rel="noopener noreferrer">LinkedIn</a>
              <a href="mailto:hello@archanatimilsina.dev">Email</a>
            </FooterSocial>
          </FooterInner>
          <FooterBottom>
            © {new Date().getFullYear()} Archana Timilsina — built by hand, section by section.
          </FooterBottom>
        </Footer>

      </Page>
    </>
  );
}

const Page = styled.div`
  position: relative;
  overflow-x: hidden;
  &::before {
    content: '';
    position: fixed;
    inset: 0;
    background-image:
      linear-gradient(rgba(26,26,46,.035) 1px, transparent 1px),
      linear-gradient(90deg, rgba(26,26,46,.035) 1px, transparent 1px);
    background-size: 52px 52px;
    pointer-events: none;
    z-index: 0;
  }
`;

const Nav = styled.nav`
  position: sticky;
  top: 0;
  z-index: 200;
  background: ${T.bg};
  border-bottom: 2px solid ${T.ink};
`;

const NavInner = styled.div`
  max-width: 1280px;
  margin: 0 auto;
  height: 64px;
  padding: 0 2rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const Brand = styled(Link)`
  display: flex;
  align-items: center;
  gap: 0.7rem;
  text-decoration: none;
`;

const BrandMark = styled.span`
  width: 34px; height: 34px;
  border-radius: 9px;
  display: flex; align-items: center; justify-content: center;
  font-family: 'Syne', sans-serif; font-weight: 800; font-size: 0.85rem;
  background: ${p => p.$dark ? T.bg : `linear-gradient(135deg, ${T.green}, ${T.bright})`};
  color: ${p => p.$dark ? T.ink : '#fff'};
  border: ${p => p.$dark ? `2px solid ${T.ink}` : 'none'};
  flex-shrink: 0;
`;

const BrandName = styled.span`
  font-family: 'Syne', sans-serif; font-size: 1rem; font-weight: 700;
  color: ${T.ink}; letter-spacing: -0.02em;
  em { font-style: normal; color: ${T.green}; }
`;

const NavLinks = styled.div`
  display: flex; align-items: center; gap: 2.1rem;
  @media (max-width: 768px) { display: none; }
`;

const NavItem = styled(Link)`
  font-family: 'DM Sans', sans-serif; font-size: 0.88rem; font-weight: 500;
  color: ${T.soft}; text-decoration: none; position: relative; padding: 0.3rem 0;
  transition: color 0.2s ease;
  &::after {
    content: ''; position: absolute; left: 0; right: 100%; bottom: 0; height: 2px;
    background: ${T.green}; transition: right 0.25s ease;
  }
  &:hover { color: ${T.ink}; }
  &:hover::after { right: 0; }
`;

const MenuToggle = styled.button`
  display: none;
  flex-direction: column; gap: 5px;
  background: none; border: none; cursor: pointer; padding: 0.4rem;
  span {
    width: 22px; height: 2px; background: ${T.ink}; transition: all 0.25s ease;
    &:nth-child(1) { transform: ${p => p.$open ? 'translateY(7px) rotate(45deg)' : 'none'}; }
    &:nth-child(2) { opacity: ${p => p.$open ? 0 : 1}; }
    &:nth-child(3) { transform: ${p => p.$open ? 'translateY(-7px) rotate(-45deg)' : 'none'}; }
  }
  @media (max-width: 768px) { display: flex; }
`;

const MobileMenu = styled.div`
  display: flex; flex-direction: column;
  border-top: 1px solid ${T.border};
  animation: ${fadeUp} 0.25s ease both;
`;

const MobileItem = styled(Link)`
  padding: 0.9rem 2rem;
  font-family: 'DM Sans', sans-serif; font-size: 0.95rem; font-weight: 500;
  color: ${T.ink}; text-decoration: none;
  border-bottom: 1px solid ${T.border};
  &:active { background: ${T.muted}; }
`;

const Hero = styled.header`
  position: relative;
  max-width: 1280px;
  margin: 0 auto;
  padding: 5.5rem 2rem 6rem;
  min-height: 78vh;
  display: flex;
  flex-direction: column;
  justify-content: center;
  z-index: 1;
`;

const HeroInner = styled.div`
  max-width: 640px;
  animation: ${fadeUp} 0.6s ease both;
`;

const HeroEyebrow = styled.div`
  display: inline-flex; align-items: center; gap: 0.55rem;
  font-family: 'DM Mono', monospace; font-size: 0.78rem;
  color: ${T.soft}; letter-spacing: 0.02em; margin-bottom: 1.5rem;
  span {
    width: 7px; height: 7px; border-radius: 50%; background: ${T.green};
    animation: ${pulseDot} 2s ease infinite;
  }
`;

const HeroTitle = styled.h1`
  font-family: 'Syne', sans-serif;
  font-size: clamp(2.4rem, 5.4vw, 4.2rem);
  font-weight: 800; letter-spacing: -0.03em; line-height: 1.08;
  color: ${T.ink}; margin-bottom: 1.5rem;
  em {
    font-style: normal; color: ${T.green}; position: relative;
    &::after {
      content: ''; position: absolute; left: 0; right: 0; bottom: 4px; height: 10px;
      background: ${T.green}; opacity: 0.12; z-index: -1;
    }
  }
`;

const HeroSub = styled.p`
  font-size: 1.05rem; color: ${T.soft}; line-height: 1.8; max-width: 520px; margin-bottom: 2.25rem;
`;

const HeroCTARow = styled.div`display: flex; gap: 1rem; flex-wrap: wrap;`;

const btnBase = css`
  font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700;
  padding: 0.85rem 1.6rem; border-radius: 100px; text-decoration: none;
  display: inline-flex; align-items: center; gap: 0.5rem;
  transition: all 0.2s ease;
`;

const CTAPrimary = styled(Link)`
  ${btnBase}
  background: ${T.ink}; color: ${T.bg}; border: 2px solid ${T.ink};
  &:hover { background: ${T.green}; border-color: ${T.green}; transform: translateY(-2px); }
`;

const CTASecondary = styled(Link)`
  ${btnBase}
  background: transparent; color: ${T.ink}; border: 2px solid ${T.border};
  &:hover { border-color: ${T.ink}; transform: translateY(-2px); }
`;

const ChipField = styled.div`
  position: absolute; inset: 0; pointer-events: none;
  @media (max-width: 900px) { display: none; }
`;

const PinnedChip = styled.span`
  position: absolute;
  font-family: 'DM Mono', monospace; font-size: 0.78rem; font-weight: 500;
  background: ${T.white}; color: ${T.ink};
  border: 1.5px solid ${T.border};
  padding: 0.45rem 0.95rem; border-radius: 8px;
  box-shadow: 0 6px 18px rgba(26,26,46,0.07);
  transform: rotate(var(--rot));
  animation: ${floatY} 5s ease-in-out infinite;
  animation-delay: inherit;
`;

const MobileChipRow = styled.div`
  display: none;
  flex-wrap: wrap; gap: 0.5rem; margin-top: 1.75rem;
  @media (max-width: 900px) { display: flex; }
`;

const MobileChip = styled.span`
  font-family: 'DM Mono', monospace; font-size: 0.74rem;
  background: ${T.white}; border: 1.5px solid ${T.border};
  padding: 0.35rem 0.8rem; border-radius: 100px; color: ${T.soft};
`;

const ScrollCue = styled.div`
  position: absolute; bottom: 0.5rem; left: 2rem;
  display: flex; align-items: center; gap: 0.6rem;
  font-family: 'DM Mono', monospace; font-size: 0.68rem;
  text-transform: uppercase; letter-spacing: 0.15em; color: ${T.soft};
  @media (max-width: 640px) { display: none; }
`;

const ScrollLine = styled.span`
  width: 2px; height: 26px; background: ${T.border}; position: relative; overflow: hidden;
  &::after {
    content: ''; position: absolute; top: 0; left: 0; width: 100%; height: 8px;
    background: ${T.green}; animation: ${bounce} 1.6s ease-in-out infinite;
  }
`;


const StatsStrip = styled.div`
  position: relative; z-index: 1;
  max-width: 1280px; margin: 0 auto;
  padding: 2.25rem 2rem;
  border-top: 1.5px solid ${T.border};
  border-bottom: 1.5px solid ${T.border};
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  @media (max-width: 640px) { grid-template-columns: repeat(2, 1fr); gap: 1.5rem; }
`;

const StatCell = styled.div`
  text-align: center;
  border-right: 1px solid ${T.border};
  &:last-child { border-right: none; }
  @media (max-width: 640px) { border-right: none; }
`;

const StatNum = styled.div`
  font-family: 'Syne', sans-serif; font-size: 1.8rem; font-weight: 800; color: ${T.ink};
`;

const StatLabel = styled.div`
  font-family: 'DM Mono', monospace; font-size: 0.68rem; text-transform: uppercase;
  letter-spacing: 0.1em; color: ${T.soft}; margin-top: 0.35rem;
`;


const Section = styled.section`
  position: relative; z-index: 1;
  max-width: 1280px; margin: 0 auto;
  padding: 6rem 2rem;
  background: ${p => p.$tint ? T.paper : 'transparent'};
`;

const Eyebrow = styled.div`
  font-family: 'DM Mono', monospace; font-size: 0.72rem; font-weight: 500;
  text-transform: uppercase; letter-spacing: 0.18em; color: ${T.green};
  margin-bottom: 1rem;
`;

const SectionTitle = styled.h2`
  font-family: 'Syne', sans-serif; font-size: clamp(1.6rem, 3vw, 2.3rem);
  font-weight: 800; letter-spacing: -0.02em; color: ${T.ink}; margin-bottom: 1.25rem;
`;

const SectionLead = styled.p`
  font-size: 1rem; color: ${T.soft}; line-height: 1.85; max-width: 520px; margin-bottom: 1.75rem;
`;

const SectionLink = styled(Link)`
  font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700;
  color: ${T.green}; text-decoration: none; display: inline-flex; align-items: center;
  border-bottom: 2px solid transparent; padding-bottom: 2px; transition: border-color 0.2s ease;
  &:hover { border-color: ${T.green}; }
`;

const SectionLinkCenter = styled(SectionLink)`
  display: flex; justify-content: center; margin: 2.5rem auto 0; width: fit-content;
`;


const AboutGrid = styled.div`
  display: grid; grid-template-columns: 1.4fr 1fr; gap: 3.5rem; align-items: start;
  @media (max-width: 780px) { grid-template-columns: 1fr; gap: 2.5rem; }
`;

const NoteCard = styled.div`
  background: ${T.white}; border: 1.5px solid ${T.border}; border-radius: 4px;
  padding: 1.75rem 1.5rem; position: relative;
  transform: rotate(-2deg);
  box-shadow: 0 10px 28px rgba(26,26,46,0.07);
  max-width: 320px;
`;

const NoteTape = styled.span`
  position: absolute; top: -8px; left: 32px; width: 56px; height: 16px;
  background: rgba(212,175,55,0.22); transform: rotate(-8deg);
`;

const NoteText = styled.p`
  font-family: 'DM Mono', monospace; font-style: italic; font-size: 1rem;
  color: ${T.ink}; line-height: 1.6; margin-bottom: 0.75rem;
`;

const NoteMeta = styled.p`
  font-size: 0.75rem; color: ${T.soft};
`;


const SkillGroups = styled.div`
  display: flex; flex-direction: column; gap: 1.5rem;
  margin: 1.75rem 0 2rem;
`;

const SkillGroup = styled.div`
  display: flex; align-items: baseline; gap: 1.5rem; flex-wrap: wrap;
`;

const SkillGroupLabel = styled.span`
  font-family: 'Syne', sans-serif; font-size: 0.72rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.1em; color: ${T.soft};
  width: 90px; flex-shrink: 0;
`;

const SkillChipRow = styled.div`display: flex; flex-wrap: wrap; gap: 0.6rem;`;

const SkillChip = styled.span`
  font-size: 0.85rem; color: ${T.ink}; background: ${T.white};
  border: 1.5px solid ${T.border}; padding: 0.4rem 0.9rem; border-radius: 100px;
  transition: border-color 0.2s ease, transform 0.2s ease;
  &:hover { border-color: ${T.green}; transform: translateY(-2px); }
`;


const Timeline = styled.div`
  display: flex; flex-direction: column; margin: 2rem 0 2rem; max-width: 620px;
`;

const TimelineItem = styled.div`
  display: grid; grid-template-columns: 24px 1fr; gap: 1.4rem;
  padding-bottom: 2rem; position: relative;
  &:not(:last-child)::after {
    content: ''; position: absolute; left: 11px; top: 24px; bottom: 0; width: 2px;
    background: ${T.border};
  }
`;

const TimelineDot = styled.div`
  width: 24px; height: 24px; border-radius: 50%; flex-shrink: 0; z-index: 1;
  background: ${p => p.$current ? T.green : T.white};
  border: 2px solid ${T.green};
`;

const TimelineBody = styled.div``;

const TimelineTop = styled.div`
  display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; flex-wrap: wrap;
`;

const TimelineRole = styled.h3`
  font-family: 'Syne', sans-serif; font-size: 1.02rem; font-weight: 700; color: ${T.ink};
`;

const TimelinePeriod = styled.span`
  font-family: 'DM Mono', monospace; font-size: 0.72rem; color: ${T.soft};
`;

const TimelineOrg = styled.p`
  font-size: 0.85rem; color: ${T.green}; font-weight: 500; margin: 0.2rem 0 0.5rem;
`;

const TimelineBlurb = styled.p`
  font-size: 0.88rem; color: ${T.soft}; line-height: 1.7;
`;


const ProjectsGrid = styled.div`
  display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 1.5rem; margin: 2rem 0;
`;

const ProjectCard = styled.div`
  background: ${T.white}; border: 1.5px solid ${T.border}; border-radius: 14px;
  padding: 1.6rem; position: relative; overflow: hidden;
  display: flex; flex-direction: column; gap: 0.75rem;
  transition: transform 0.22s ease, box-shadow 0.22s ease, border-color 0.22s ease;
  &:hover {
    transform: translateY(-4px);
    box-shadow: 0 16px 40px rgba(26,26,46,0.09);
    border-color: ${T.green};
  }
`;

const ProjectTape = styled.span`
  position: absolute; top: -6px; width: 52px; height: 16px;
  background: rgba(45,106,79,0.14);
  ${p => p.$pos === 'left' ? 'left: 18px; transform: rotate(-10deg);' : 'right: 18px; transform: rotate(9deg);'}
`;

const ProjectTop = styled.div`display: flex; justify-content: space-between; align-items: center;`;

const ProjectBadge = styled.span`
  font-family: 'Syne', sans-serif; font-size: 0.6rem; font-weight: 700;
  text-transform: uppercase; letter-spacing: 0.08em;
  color: ${p => p.$color}; background: ${p => p.$color}18; border: 1px solid ${p => p.$color}40;
  padding: 0.2rem 0.6rem; border-radius: 100px;
`;

const ProjectGh = styled.a`
  font-family: 'Syne', sans-serif; font-size: 0.68rem; font-weight: 700;
  color: ${T.green}; text-decoration: none;
  &:hover { text-decoration: underline; }
`;

const ProjectName = styled.h3`
  font-family: 'Syne', sans-serif; font-size: 1.05rem; font-weight: 800; color: ${T.ink};
`;

const ProjectTech = styled.p`
  font-size: 0.78rem; color: ${T.green}; font-weight: 500;
`;

const ProjectDesc = styled.p`
  font-size: 0.85rem; color: ${T.soft}; line-height: 1.65;
  display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
`;

const SkeletonCard = styled.div`
  height: 168px; border-radius: 14px; border: 1.5px solid ${T.border};
  background: linear-gradient(90deg, ${T.muted} 25%, ${T.white} 50%, ${T.muted} 75%);
  background-size: 500px 100%;
  animation: ${shimmer} 1.4s infinite linear;
`;


const ContactCTA = styled.section`
  position: relative; z-index: 1;
  background: ${T.ink}; padding: 6rem 2rem; text-align: center;
`;

const ContactInner = styled.div`max-width: 560px; margin: 0 auto;`;

const ContactHeading = styled.h2`
  font-family: 'Syne', sans-serif; font-size: clamp(1.8rem, 4vw, 2.6rem);
  font-weight: 800; color: ${T.bg}; letter-spacing: -0.02em; margin-bottom: 1rem;
`;

const ContactSub = styled.p`
  font-size: 1rem; color: rgba(246,245,240,0.6); line-height: 1.7; margin-bottom: 2.25rem;
`;

const ContactBtn = styled(Link)`
  ${btnBase}
  background: ${T.bright}; color: ${T.ink}; border: 2px solid ${T.bright};
  &:hover { background: ${T.bg}; border-color: ${T.bg}; transform: translateY(-2px); }
`;

const ContactEmail = styled.a`
  display: block; margin-top: 1.4rem;
  font-family: 'DM Mono', monospace; font-size: 0.8rem;
  color: rgba(246,245,240,0.45); text-decoration: none;
  &:hover { color: ${T.bright}; }
`;


const Footer = styled.footer`
  position: relative; z-index: 1;
  background: ${T.bg}; padding: 3.5rem 2rem 2rem;
`;

const FooterInner = styled.div`
  max-width: 1280px; margin: 0 auto;
  display: flex; justify-content: space-between; align-items: center; gap: 2rem; flex-wrap: wrap;
  padding-bottom: 2rem; border-bottom: 1px solid ${T.border};
`;

const FooterBrand = styled.div`display: flex; align-items: center; gap: 0.75rem;`;

const FooterName = styled.div`font-family: 'Syne', sans-serif; font-size: 0.88rem; font-weight: 700; color: ${T.ink};`;
const FooterRole = styled.div`font-size: 0.72rem; color: ${T.soft}; margin-top: 0.1rem;`;

const FooterLinks = styled.div`display: flex; gap: 1.5rem; flex-wrap: wrap;`;

const FooterLink = styled(Link)`
  font-size: 0.82rem; color: ${T.soft}; text-decoration: none;
  &:hover { color: ${T.green}; }
`;

const FooterSocial = styled.div`
  display: flex; gap: 1.25rem;
  a { font-size: 0.82rem; color: ${T.soft}; text-decoration: none; }
  a:hover { color: ${T.green}; }
`;

const FooterBottom = styled.div`
  max-width: 1280px; margin: 1.5rem auto 0;
  font-family: 'DM Mono', monospace; font-size: 0.72rem; color: ${T.soft}; opacity: 0.7;
  text-align: center;
`;