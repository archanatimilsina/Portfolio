import React, { useEffect, useState, useSyncExternalStore } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  getGestureNavStatus,
  setGestureNavStatus,
  subscribeGestureNav,
} from '../js/gestureNavState';

/**
 * Floating onboarding card that promotes Gesture Navigation ("GESNAV").
 *
 * · Appears when the landing page opens and auto-dismisses after 1 minute.
 * · Skipped entirely when Gesture Nav is already activated.
 * · The ✕ closes it at any time.
 * · "Okay" swaps the intro copy for a step-by-step guide with animated
 *   drawings of every gesture and where it navigates.
 */

const DISPLAY_MS = 60_000; // show for 1 minute

const GESTURES = [
  { id: 'circle',   label: 'Skills',     route: '/skills',     draw: 'M50 15 A35 35 0 1 1 50 85 A35 35 0 1 1 50 15' },
  { id: 'triangle', label: 'Projects',   route: '/projects',   draw: 'M50 20 L82 78 L18 78 Z' },
  { id: 'check',    label: 'Experience', route: '/experience', draw: 'M20 52 L42 74 L82 26' },
  { id: 'caret',    label: 'Contact',    route: '/contact',    draw: 'M18 74 L50 28 L82 74' },
  { id: 'pigtail',  label: 'About',      route: '/about',      draw: 'M22 72 C18 46 40 30 58 40 C74 49 68 74 50 70 C32 66 34 44 52 42 C68 40 78 54 78 68' },
  { id: 'arrow',    label: 'Home',       route: '/',           draw: 'M18 50 L80 50 M58 28 L80 50 L58 72' },
];

/* ------------------------------------------------------------------ */
/* animations                                                          */
/* ------------------------------------------------------------------ */
const cardIn = keyframes`
  from { opacity: 0; transform: translateY(28px) scale(.94); }
  to   { opacity: 1; transform: translateY(0) scale(1); }
`;
const bounce = keyframes`
  0%, 100% { transform: translateY(0) rotate(-6deg); }
  50%      { transform: translateY(-8px) rotate(6deg); }
`;
const pulse = keyframes`
  0%, 100% { box-shadow: 0 0 0 0 rgba(82,214,138,.55); }
  70%      { box-shadow: 0 0 0 12px rgba(82,214,138,0); }
`;
const shimmer = keyframes`
  0%   { background-position: -220% center; }
  100% { background-position: 220% center; }
`;
const drawStroke = keyframes`
  0%   { stroke-dashoffset: 340; }
  55%  { stroke-dashoffset: 0; }
  100% { stroke-dashoffset: 0; }
`;
const shrink = keyframes`
  from { transform: scaleX(1); }
  to   { transform: scaleX(0); }
`;

/* ------------------------------------------------------------------ */
/* download path helper for the animated SVG                           */
/* ------------------------------------------------------------------ */
function GestureArt({ $delay = 0, $size = 46 }) {
  return (
    <ArtSvg viewBox="0 0 100 100" $size={$size} aria-hidden="true">
      {GESTURES.map((g, i) => (
        <ArtPath
          key={g.id}
          d={g.draw}
          $delay={$delay + i * 0.28}
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      ))}
    </ArtSvg>
  );
}

export default function GesNavPromo() {
  const [visible, setVisible] = useState(true);
  const [step, setStep] = useState('intro'); // 'intro' | 'guide'

  const status = useSyncExternalStore(
    subscribeGestureNav,
    getGestureNavStatus,
    getGestureNavStatus
  );
  const enabled = status === 'active';

  // Auto-dismiss 1 minute after opening. Clicking "Okay" bumps `step`,
  // which restarts the timer so the guide gets a full minute too.
  useEffect(() => {
    if (!visible) return undefined;
    const timer = setTimeout(() => setVisible(false), DISPLAY_MS);
    return () => clearTimeout(timer);
  }, [visible, step]);

  // Never pitch Gesture Nav to someone who's already using it — if it's
  // activated, the card stays hidden (and hides itself the moment the
  // visitor turns it on from the card or the header).
  if (!visible || enabled) return null;

  const close = () => setVisible(false);
  const activate = () => setGestureNavStatus(enabled ? 'inactive' : 'active');

  return (
    <Wrap role="dialog" aria-live="polite" aria-label="Gesture navigation introduction">
      <ProgressTrack aria-hidden="true">
        <ProgressBar key={step} />
      </ProgressTrack>

      <Card>
        <TopRow>
          <Badge $active={enabled}>
            <BadgeDot />
            GESNAV
          </Badge>
          <CloseBtn type="button" onClick={close} aria-label="Close">✕</CloseBtn>
        </TopRow>

        {step === 'intro' ? (
          <>
            <HandRow>
              <Hand aria-hidden="true">👆</Hand>
              <FloatingArt><GestureArt $size={54} /></FloatingArt>
            </HandRow>

            <Title>
              How about trying <em>GESNAV</em>?
            </Title>
            <Desc>
              Skip the clicks — draw a shape right on the screen and the site sails
              to the page you want. It takes ten seconds to learn.
            </Desc>

            <BtnRow>
              <OkayBtn type="button" onClick={() => setStep('guide')}>Okay</OkayBtn>
              <LaterBtn type="button" onClick={close}>Maybe later</LaterBtn>
            </BtnRow>
          </>
        ) : (
          <>
            <Title $small>
              Turn on <em>Gesture Nav</em>
            </Title>

            <Steps>
              <Step>
                <StepNum>1</StepNum>
                <span>
                  Flip it on with the button below (or the <b>Gesture Nav</b> button in the header).
                </span>
              </Step>
              <Step>
                <StepNum>2</StepNum>
                <span>
                  <b>Triple-click</b> (or triple-tap) anywhere on the page to open the drawing canvas.
                </span>
              </Step>
              <Step>
                <StepNum>3</StepNum>
                <span>
                  Draw one of the gestures, then pause — it navigates automatically. Triple-tap
                  again or press <b>Esc</b> to cancel.
                </span>
              </Step>
            </Steps>

            <GuideLabel>Gestures &amp; where they go</GuideLabel>
            <GestureGrid>
              {GESTURES.map((g, i) => (
                <GestureTile key={g.id} $delay={i * 0.12}>
                  <TileArt viewBox="0 0 100 100" aria-hidden="true">
                    <TilePath
                      d={g.draw}
                      $delay={i * 0.18}
                      fill="none"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </TileArt>
                  <TileText>
                    <TileName>{g.label}</TileName>
                    <TileRoute>{g.route}</TileRoute>
                  </TileText>
                </GestureTile>
              ))}
            </GestureGrid>

            <Hint>
              Tip: gestures are ignored when you start on buttons or text fields, so normal
              clicking keeps working.
            </Hint>

            <BtnRow>
              <OkayBtn type="button" onClick={activate}>
                {enabled ? '✓ Gesture Nav is on' : 'Turn on Gesture Nav'}
              </OkayBtn>
              <LaterBtn type="button" onClick={close}>Got it</LaterBtn>
            </BtnRow>
          </>
        )}
      </Card>
    </Wrap>
  );
}

/* ================================================================== */
/* styles                                                              */
/* ================================================================== */
const Wrap = styled.div`
  position: fixed;
  right: 1.5rem;
  bottom: 1.5rem;
  z-index: 950;
  width: min(370px, calc(100vw - 2rem));
  max-height: calc(100vh - 3rem);
  max-height: calc(100dvh - 3rem);
  display: flex;
  flex-direction: column;
  animation: ${cardIn} 0.45s cubic-bezier(0.34, 1.56, 0.64, 1) both;

  @media (max-width: 560px) {
    right: 1rem;
    left: 1rem;
    bottom: max(1rem, env(safe-area-inset-bottom));
    width: auto;
    max-height: calc(100vh - 2rem);
    max-height: calc(100dvh - 2rem);
  }
`;

const ProgressTrack = styled.div`
  flex-shrink: 0;
  height: 4px;
  margin: 0 1rem -2px;
  background: #eceae3;
  border-radius: 100px;
  overflow: hidden;
  position: relative;
  z-index: 2;
`;
const ProgressBar = styled.div`
  height: 100%;
  width: 100%;
  transform-origin: left center;
  background: linear-gradient(90deg, #2d6a4f, #52d68a, #d4af37);
  animation: ${shrink} ${DISPLAY_MS}ms linear forwards;
`;

const Card = styled.div`
  position: relative;
  background: linear-gradient(165deg, #ffffff 0%, #fbfaf6 100%);
  border: 1.5px solid #d8d4cc;
  border-radius: 20px;
  padding: 1.25rem 1.35rem 1.4rem;
  box-shadow: 0 22px 55px rgba(26, 26, 46, 0.18);
  min-height: 0;
  overflow-x: hidden;
  overflow-y: auto;
  overscroll-behavior: contain;
  scrollbar-width: thin;
  scrollbar-color: #d8d4cc transparent;

  &::-webkit-scrollbar { width: 6px; }
  &::-webkit-scrollbar-thumb { background: #d8d4cc; border-radius: 100px; }

  &::before {
    content: '';
    position: absolute;
    inset: -40% -60% auto auto;
    width: 220px;
    height: 220px;
    background: radial-gradient(circle, rgba(82, 214, 138, 0.22), transparent 70%);
    pointer-events: none;
  }

  @media (max-width: 560px) {
    padding: 1.15rem 1.15rem 1.25rem;
  }
`;

const TopRow = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 0.75rem;
`;

const Badge = styled.span`
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-family: 'Syne', sans-serif;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 2px;
  text-transform: uppercase;
  color: ${(p) => (p.$active ? '#2d6a4f' : '#7a7567')};
  background: ${(p) => (p.$active ? '#e4f1ea' : '#f6f5f0')};
  border: 1.5px solid ${(p) => (p.$active ? '#52d68a' : '#d8d4cc')};
  padding: 0.22rem 0.6rem;
  border-radius: 100px;
`;
const BadgeDot = styled.span`
  width: 7px;
  height: 7px;
  border-radius: 50%;
  background: #52d68a;
  animation: ${pulse} 1.8s ease-out infinite;
`;

const CloseBtn = styled.button`
  width: 28px;
  height: 28px;
  border-radius: 50%;
  border: 1.5px solid #d8d4cc;
  background: #ffffff;
  color: #7a7567;
  font-size: 0.8rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.18s ease;
  &:hover {
    background: #1a1a2e;
    border-color: #1a1a2e;
    color: #f6f5f0;
    transform: rotate(90deg);
  }
`;

const HandRow = styled.div`
  display: flex;
  align-items: center;
  gap: 0.9rem;
  margin-bottom: 0.6rem;
`;
const Hand = styled.span`
  font-size: 2rem;
  line-height: 1;
  display: inline-block;
  animation: ${bounce} 1.6s ease-in-out 3;
`;
const FloatingArt = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ArtSvg = styled.svg`
  width: ${(p) => p.$size}px;
  height: ${(p) => p.$size}px;
  overflow: visible;
`;
const ArtPath = styled.path`
  stroke: #2d6a4f;
  stroke-width: 5;
  stroke-dasharray: 340;
  stroke-dashoffset: 340;
  animation: ${drawStroke} 3s ease-in-out 1 both;
  animation-delay: ${(p) => p.$delay}s;
  &:nth-of-type(2n) { stroke: #52d68a; }
`;

const Title = styled.h3`
  font-family: 'Syne', sans-serif;
  font-size: ${(p) => (p.$small ? '1.15rem' : '1.3rem')};
  font-weight: 800;
  line-height: 1.2;
  letter-spacing: -0.02em;
  color: #1a1a2e;
  margin-bottom: 0.45rem;

  em {
    font-style: normal;
    background: linear-gradient(90deg, #2d6a4f, #52d68a, #d4af37, #2d6a4f);
    background-size: 220% auto;
    -webkit-background-clip: text;
    background-clip: text;
    -webkit-text-fill-color: transparent;
    animation: ${shimmer} 2.5s linear 2;
  }
`;

const Desc = styled.p`
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.86rem;
  line-height: 1.55;
  color: #7a7567;
  margin-bottom: 1rem;
`;

const BtnRow = styled.div`
  display: flex;
  gap: 0.55rem;
  margin-top: 1rem;
`;
const OkayBtn = styled.button`
  flex: 1;
  padding: 0.62rem 1rem;
  border-radius: 100px;
  border: 2px solid #2d6a4f;
  background: #2d6a4f;
  color: #f6f5f0;
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover {
    background: #1a1a2e;
    border-color: #1a1a2e;
    transform: translateY(-2px);
    box-shadow: 0 8px 20px rgba(26, 26, 46, 0.22);
  }
  &:active { transform: translateY(0); }
`;
const LaterBtn = styled.button`
  padding: 0.62rem 1rem;
  border-radius: 100px;
  border: 1.5px solid #d8d4cc;
  background: transparent;
  color: #7a7567;
  font-family: 'Syne', sans-serif;
  font-size: 0.82rem;
  font-weight: 700;
  cursor: pointer;
  transition: all 0.2s ease;
  &:hover { border-color: #1a1a2e; color: #1a1a2e; }
`;

const Steps = styled.ol`
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  margin: 0 0 1rem;
`;
const Step = styled.li`
  display: flex;
  align-items: flex-start;
  gap: 0.6rem;
  font-family: 'DM Sans', system-ui, sans-serif;
  font-size: 0.82rem;
  line-height: 1.45;
  color: #1a1a2e;
  b { color: #2d6a4f; }
`;
const StepNum = styled.span`
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  margin-top: 0.05rem;
  border-radius: 50%;
  background: #e4f1ea;
  border: 1.5px solid #52d68a;
  color: #2d6a4f;
  font-family: 'Syne', sans-serif;
  font-size: 0.66rem;
  font-weight: 800;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const GuideLabel = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 0.62rem;
  font-weight: 800;
  letter-spacing: 1.5px;
  text-transform: uppercase;
  color: #7a7567;
  margin-bottom: 0.55rem;
`;

const GestureGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 0.5rem;

  @media (max-width: 380px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;
const GestureTile = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.25rem;
  background: #ffffff;
  border: 1.5px solid #eceae3;
  border-radius: 12px;
  padding: 0.55rem 0.35rem 0.45rem;
  transition: all 0.18s ease;
  animation: ${cardIn} 0.4s ease both;
  animation-delay: ${(p) => p.$delay}s;
  &:hover {
    border-color: #52d68a;
    transform: translateY(-3px);
    box-shadow: 0 8px 18px rgba(45, 106, 79, 0.12);
  }
`;
const TileArt = styled.svg`
  width: 34px;
  height: 34px;
  overflow: visible;
`;
const TilePath = styled.path`
  stroke: #2d6a4f;
  stroke-width: 6;
  stroke-dasharray: 340;
  stroke-dashoffset: 340;
  animation: ${drawStroke} 2.4s ease-in-out 1 both;
  animation-delay: ${(p) => p.$delay}s;
`;
const TileText = styled.div`
  text-align: center;
  line-height: 1.2;
`;
const TileName = styled.div`
  font-family: 'Syne', sans-serif;
  font-size: 0.68rem;
  font-weight: 800;
  color: #1a1a2e;
`;
const TileRoute = styled.div`
  font-size: 0.6rem;
  color: #7a7567;
  font-family: 'SF Mono', ui-monospace, monospace;
`;

const Hint = styled.p`
  font-size: 0.72rem;
  line-height: 1.45;
  color: #7a7567;
  margin-top: 0.75rem;
  padding: 0.5rem 0.65rem;
  background: #f6f5f0;
  border-left: 3px solid #d4af37;
  border-radius: 0 8px 8px 0;
`;
