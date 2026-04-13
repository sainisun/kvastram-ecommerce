'use client';

import { StatReveal } from '@/components/ui/RevealOnScroll';

interface StatData {
  num: string;
  label: string;
}

interface StatsSectionProps {
  statsData: StatData[];
}

export function StatsSection({ statsData }: StatsSectionProps) {
  return (
    <section className="px-4 py-8 sm:px-6 md:px-8 md:py-10">
      <StatReveal />
      <div className="stats-shell-prem">
        <div className="stats-glow stats-glow-left" />
        <div className="stats-glow stats-glow-right" />

        <div className="stats-track-prem">
          {statsData.map((stat, i) => (
            <article
              key={i}
              data-stat-reveal
              className="stats-card-prem"
              style={{ transitionDelay: `${i * 0.12}s` }}
            >
              <span className="stats-accent-prem" />
              <div className="stats-number-wrap-prem">
                <span className="stat-num-prem">{stat.num}</span>
              </div>
              <span className="stat-label-prem">{stat.label}</span>
            </article>
          ))}
        </div>
      </div>

      <style jsx>{`
        .stats-shell-prem {
          position: relative;
          max-width: 1440px;
          margin: 0 auto;
          overflow: hidden;
          border: 1px solid rgba(30, 24, 18, 0.08);
          border-radius: 24px;
          background:
            radial-gradient(circle at top left, rgba(191, 161, 118, 0.14), transparent 30%),
            radial-gradient(circle at bottom right, rgba(34, 29, 22, 0.08), transparent 34%),
            linear-gradient(180deg, #f8f4ed 0%, #fdfbf7 52%, #f6f0e7 100%);
          box-shadow:
            0 24px 60px rgba(38, 29, 20, 0.08),
            inset 0 1px 0 rgba(255, 255, 255, 0.7);
        }

        .stats-track-prem {
          position: relative;
          z-index: 1;
          display: flex;
          gap: 14px;
          overflow-x: auto;
          padding: 18px;
          scrollbar-width: none;
          -ms-overflow-style: none;
        }

        .stats-track-prem::-webkit-scrollbar {
          display: none;
        }

        .stats-card-prem {
          position: relative;
          display: flex;
          flex: 0 0 calc(50% - 7px);
          min-width: 150px;
          min-height: 172px;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          padding: 26px 18px 24px;
          border-radius: 18px;
          border: 1px solid rgba(32, 24, 18, 0.07);
          background:
            linear-gradient(180deg, rgba(255, 255, 255, 0.92), rgba(247, 242, 234, 0.92));
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.9),
            0 12px 30px rgba(48, 36, 25, 0.06);
          opacity: 0;
          transform: translateY(24px) scale(0.98);
          transition:
            opacity 0.8s ease,
            transform 0.8s ease,
            box-shadow 0.35s ease,
            border-color 0.35s ease;
        }

        .stats-card-prem::after {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            135deg,
            rgba(255, 255, 255, 0.45),
            transparent 40%,
            transparent 65%,
            rgba(191, 161, 118, 0.08)
          );
          pointer-events: none;
        }

        .stats-card-prem.visible {
          opacity: 1;
          transform: translateY(0) scale(1);
        }

        .stats-card-prem:hover {
          transform: translateY(-6px) scale(1.01);
          border-color: rgba(160, 126, 86, 0.18);
          box-shadow:
            inset 0 1px 0 rgba(255, 255, 255, 0.95),
            0 18px 40px rgba(48, 36, 25, 0.11);
        }

        .stats-accent-prem {
          width: 44px;
          height: 3px;
          margin-bottom: 20px;
          border-radius: 999px;
          background: linear-gradient(90deg, #c8a46d 0%, #8e6b3d 100%);
          box-shadow: 0 0 20px rgba(200, 164, 109, 0.35);
          animation: accentPulse 3.6s ease-in-out infinite;
        }

        .stats-number-wrap-prem {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          min-height: 72px;
        }

        .stat-num-prem {
          position: relative;
          z-index: 1;
          display: block;
          font-family: var(--font-display);
          font-size: clamp(2.2rem, 4vw, 3.6rem);
          font-weight: 400;
          line-height: 0.95;
          letter-spacing: -0.04em;
          color: #17120d;
          text-shadow: 0 1px 0 rgba(255, 255, 255, 0.4);
        }

        .stat-label-prem {
          margin-top: 16px;
          text-align: center;
          font-size: 0.72rem;
          font-weight: 500;
          letter-spacing: 0.28em;
          text-transform: uppercase;
          color: rgba(52, 43, 33, 0.72);
        }

        .stats-glow {
          position: absolute;
          width: 220px;
          height: 220px;
          border-radius: 999px;
          filter: blur(55px);
          opacity: 0.45;
          pointer-events: none;
        }

        .stats-glow-left {
          top: -80px;
          left: -70px;
          background: rgba(210, 182, 137, 0.24);
          animation: driftLeft 12s ease-in-out infinite;
        }

        .stats-glow-right {
          right: -90px;
          bottom: -120px;
          background: rgba(111, 89, 59, 0.16);
          animation: driftRight 14s ease-in-out infinite;
        }

        @media (min-width: 768px) {
          .stats-track-prem {
            gap: 0;
            overflow: visible;
            padding: 20px;
          }

          .stats-card-prem {
            flex: 1 1 25%;
            min-width: 0;
            border-radius: 0;
            min-height: 220px;
            border-top: none;
            border-bottom: none;
            border-left: none;
            border-right: 1px solid rgba(32, 24, 18, 0.08);
            background: transparent;
            box-shadow: none;
          }

          .stats-card-prem:first-child {
            border-top-left-radius: 18px;
            border-bottom-left-radius: 18px;
          }

          .stats-card-prem:last-child {
            border-right: none;
            border-top-right-radius: 18px;
            border-bottom-right-radius: 18px;
          }

          .stats-card-prem:hover {
            background: rgba(255, 252, 247, 0.52);
            box-shadow:
              inset 0 0 0 1px rgba(160, 126, 86, 0.12),
              0 16px 35px rgba(48, 36, 25, 0.08);
          }

          .stat-label-prem {
            font-size: 0.78rem;
          }
        }

        @media (max-width: 767px) {
          .stats-card-prem {
            scroll-snap-align: start;
          }
        }

        @keyframes accentPulse {
          0%,
          100% {
            transform: scaleX(0.92);
            opacity: 0.78;
          }
          50% {
            transform: scaleX(1.06);
            opacity: 1;
          }
        }

        @keyframes driftLeft {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(26px, 20px, 0);
          }
        }

        @keyframes driftRight {
          0%,
          100% {
            transform: translate3d(0, 0, 0);
          }
          50% {
            transform: translate3d(-28px, -18px, 0);
          }
        }
      `}</style>
    </section>
  );
}
