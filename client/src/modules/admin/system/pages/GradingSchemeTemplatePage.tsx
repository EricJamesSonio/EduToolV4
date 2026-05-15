import React, { useState } from 'react';
import TemplatesTab from './scheme-template/tabs/TemplatesTab';
import ProgramAssignmentTab from './scheme-template/tabs/ProgramAssignmentTab';

type TabKey = 'templates' | 'assignment';

const TAB_OPTIONS: Array<{ key: TabKey; label: string }> = [
  { key: 'templates', label: 'Templates' },
  { key: 'assignment', label: 'Program Assignment' },
];

interface GradingSchemeTemplatePageProps {
  onBack: () => void;
}

const GradingSchemeTemplatePage: React.FC<GradingSchemeTemplatePageProps> = ({
  onBack,
}) => {
  const [activeTab, setActiveTab] = useState<TabKey>('templates');

  return (
    <div className="grading-scheme-page system-detail-page">
      <div className="grading-scheme-page-header">
        <div className="grading-scheme-page-header-left">
          <button
            type="button"
            className="btn btn-sm btn-outline grading-scheme-page-back"
            onClick={onBack}
          >
            ← Back
          </button>

          <div>
            <h2 className="grading-scheme-page-title">
              Grading Scheme Templates
            </h2>

            <p className="grading-scheme-page-description">
              Build reusable grading templates and assign them to programs by
              school year.
            </p>
          </div>
        </div>
      </div>

      {/* Tab switcher */}
      <div className="grading-scheme-tab-bar">
        {TAB_OPTIONS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            className={`grading-scheme-tab-btn ${
              activeTab === tab.key ? 'is-active' : ''
            }`}
            onClick={() => setActiveTab(tab.key)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="grading-scheme-tab-content">
        {activeTab === 'templates' && <TemplatesTab />}
        {activeTab === 'assignment' && <ProgramAssignmentTab />}
      </div>
    </div>
  );
};

export default GradingSchemeTemplatePage;