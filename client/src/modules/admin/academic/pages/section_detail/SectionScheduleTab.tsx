import { useMemo } from 'react';
import BaseCard from '@/components/BaseCard';
import EmptyState from '@/components/EmptyState';
import type { AcademicClass } from '../../api/class.api';
import {
  weekdayLabels,
  formatTime,
  getScheduleItems,
  type ScheduleItem,
} from '../../utils/section-details.utils';

type Props = {
  classes: AcademicClass[];
  isLoading: boolean;
  isError: boolean;
};

const SectionScheduleTab: React.FC<Props> = ({ classes, isLoading, isError }) => {
  const scheduleItems = useMemo(() => getScheduleItems(classes), [classes]);

  const scheduleByWeekday = useMemo(() => {
    const grouped = new Map<number, ScheduleItem[]>();

    scheduleItems.forEach((item) => {
      grouped.set(item.schedule.weekday, [
        ...(grouped.get(item.schedule.weekday) ?? []),
        item,
      ]);
    });

    grouped.forEach((items) => {
      items.sort((a, b) =>
        a.schedule.start_time.localeCompare(b.schedule.start_time),
      );
    });

    return grouped;
  }, [scheduleItems]);

  return (
    <BaseCard className="section-details-card" hover={false}>
      <div className="card-header">
        <h3 className="card-title">Weekly Schedule</h3>
        <span className="status-badge status-default">{scheduleItems.length} slot</span>
      </div>
      <div className="card-body">
        {isLoading ? (
          <div className="sections-loading">
            <div className="loading-spinner loading-spinner-sm" />
            <span className="loading-text">Loading schedule...</span>
          </div>
        ) : isError ? (
          <EmptyState
            title="Unable to Load Schedule"
            description="The schedule for this section could not be loaded right now."
          />
        ) : scheduleItems.length === 0 ? (
          <EmptyState
            title="No Schedule Found"
            description="Class schedules assigned to this section will appear here."
          />
        ) : (
          <div className="weekly-schedule-grid">
            {weekdayLabels.map((weekday) => {
              const items = scheduleByWeekday.get(weekday.value) ?? [];

              return (
                <div key={weekday.value} className="weekly-schedule-day">
                  <h4 className="weekly-schedule-day-title">{weekday.label}</h4>
                  {items.length === 0 ? (
                    <p className="weekly-schedule-empty">No classes</p>
                  ) : (
                    <div className="weekly-schedule-slots">
                      {items.map((item) => (
                        <div
                          key={`${item.classId}-${item.schedule.weekday}-${item.schedule.start_time}`}
                          className="weekly-schedule-slot"
                        >
                          <span className="weekly-schedule-subject">
                            {item.subjectName}
                          </span>
                          <span className="weekly-schedule-time">
                            {formatTime(item.schedule.start_time)} -{' '}
                            {formatTime(item.schedule.end_time)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </BaseCard>
  );
};

export default SectionScheduleTab;