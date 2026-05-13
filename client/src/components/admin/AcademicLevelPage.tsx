import type { ProgramWithStats } from "../../types/program.types";
import {
  useLevelsBySchoolYear,
  useAddNextLevel,
  useRemoveLevel,
} from "../../hooks/useLevels";
import AcademicDetailCard from "./AcademicDetailCard";
import ConfirmationModal from "../ConfirmationModal";
import type { Level } from "../../types/level.types";
import { useMemo, useState } from "react";

interface AcademicLevelPageProps {
  program: ProgramWithStats;
  schoolYearId: string;
  onBackToPrograms: () => void;
}

const getLevelSortValue = (name: string) => {
  const gradeMatch = name.match(/Grade\s+(\d+)/i);
  if (gradeMatch) return Number(gradeMatch[1]);

  const yearMatch = name.match(/(\d+)(?:st|nd|rd|th)\s+Year/i);
  if (yearMatch) return Number(yearMatch[1]);

  const trailingNumberMatch = name.match(/(\d+)$/);
  return trailingNumberMatch ? Number(trailingNumberMatch[1]) : 0;
};

const AcademicLevelPage: React.FC<AcademicLevelPageProps> = ({
  program,
  schoolYearId,
  onBackToPrograms,
}) => {
  const [levelToDelete, setLevelToDelete] = useState<Level | null>(null);
  const { data: schoolYearLevels = [], isLoading } =
    useLevelsBySchoolYear(schoolYearId);

  const addNextLevelMutation = useAddNextLevel();
  const removeLevelMutation = useRemoveLevel();

  const levels = schoolYearLevels.filter(
    (level) => level.program_id === program.id,
  );
  const visibleLevels = useMemo(() => {
    const groupedLevels = new Map<string, Level[]>();

    levels.forEach((level) => {
      groupedLevels.set(level.name, [
        ...(groupedLevels.get(level.name) ?? []),
        level,
      ]);
    });

    return Array.from(groupedLevels.entries())
      .map(([name, items]) => ({
        name,
        items,
        primaryLevel: items[0],
      }))
      .sort((a, b) => getLevelSortValue(a.name) - getLevelSortValue(b.name));
  }, [levels]);

  const handleAddLevel = async () => {
    try {
      await addNextLevelMutation.mutateAsync({
        programId: program.id,
        schoolYearId,
      });
    } catch (error) {
      console.error("Failed to add level:", error);
    }
  };

  const handleRemoveLevel = async () => {
    if (visibleLevels.length === 0) return;

    const highestLevel = visibleLevels.reduce((highest, current) =>
      getLevelSortValue(current.name) > getLevelSortValue(highest.name)
        ? current
        : highest,
    );

    if (highestLevel.primaryLevel) {
      setLevelToDelete(highestLevel.primaryLevel);
    }
  };

  const confirmRemoveLevel = async () => {
    if (!levelToDelete) return;
    try {
      const matchingLevels = levels.filter(
        (level) => level.name === levelToDelete.name,
      );

      for (const level of matchingLevels) {
        await removeLevelMutation.mutateAsync(level.id);
      }

      setLevelToDelete(null);
    } catch (error) {
      console.error("Failed to remove level:", error);
    }
  };

  return (
    <div className="view-container">
      <div className="view-header">
        <button onClick={onBackToPrograms} className="back-button">
          Back to Programs
        </button>
        <div className="header-title">
          <h2 className="dashboard-section-title">Levels</h2>
          <p className="dashboard-section-subtitle">{program.name}</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleAddLevel}
            className="btn btn-primary create-program-btn"
            disabled={addNextLevelMutation.isPending}
            title="Add next level"
          >
            {addNextLevelMutation.isPending ? "..." : "+"}
          </button>
          {levels.length > 0 && (
            <button
              onClick={handleRemoveLevel}
              className="btn btn-secondary create-program-btn"
              disabled={removeLevelMutation.isPending}
              title="Remove highest level"
            >
              {removeLevelMutation.isPending ? "..." : "-"}
            </button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="dashboard-loading">
          <div className="loading-spinner"></div>
          <span className="loading-text">Loading levels...</span>
        </div>
      ) : levels.length === 0 ? (
        <div className="empty-state">
          <h3>No Levels Found</h3>
          <p>Get started by adding your first level.</p>
          <button
            onClick={handleAddLevel}
            className="btn btn-primary"
            disabled={addNextLevelMutation.isPending}
          >
            {addNextLevelMutation.isPending ? "..." : "+"}
          </button>
        </div>
      ) : (
        <div className="academic-detail-grid">
          {visibleLevels.map(({ name, items }) => (
            <AcademicDetailCard
              key={name}
              title={name}
              badge="Level"
              details={[
                { label: "Program", value: program.name },
                { label: "Type", value: program.type },
                ...(items.length > 1
                  ? [
                      {
                        label: "Records",
                        value: `${items.length} linked records`,
                      },
                    ]
                  : []),
              ]}
            />
          ))}
        </div>
      )}

      <ConfirmationModal
        isOpen={!!levelToDelete}
        title="Remove Level"
        message={`This will remove "${levelToDelete?.name ?? "this level"}" and its empty seeded sections/subjects. Levels already used by classes or enrollments cannot be removed.`}
        confirmLabel="Remove Level"
        isLoading={removeLevelMutation.isPending}
        onConfirm={confirmRemoveLevel}
        onClose={() => setLevelToDelete(null)}
      />
    </div>
  );
};

export default AcademicLevelPage;
