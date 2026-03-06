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
    <div className="stats-bar-prem">
      <StatReveal />
      {statsData.map((stat, i) => (
        <div
          key={i}
          className="stat-item-prem"
          style={{ transitionDelay: `${i * 0.1}s` }}
        >
          <span className="stat-num-prem">{stat.num}</span>
          <span className="stat-label-prem">{stat.label}</span>
        </div>
      ))}
    </div>
  );
}