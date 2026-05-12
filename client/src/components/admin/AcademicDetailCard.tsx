import BaseCard from '../BaseCard';

interface AcademicDetail {
  label: string;
  value: string;
}

interface AcademicDetailCardProps {
  title: string;
  badge: string;
  details: AcademicDetail[];
}

const AcademicDetailCard: React.FC<AcademicDetailCardProps> = ({
  title,
  badge,
  details,
}) => {
  return (
    <BaseCard className="academic-detail-card">
      <div className="card-header">
        <div className="academic-detail-card-header">
          <h3 className="card-title">{title}</h3>
          <span className="status-badge status-default">{badge}</span>
        </div>
      </div>
      <div className="card-body">
        <div className="academic-detail-list">
          {details.map((detail) => (
            <div key={detail.label} className="academic-detail-row">
              <span className="detail-label">{detail.label}</span>
              <span className="detail-value">{detail.value}</span>
            </div>
          ))}
        </div>
      </div>
    </BaseCard>
  );
};

export default AcademicDetailCard;
