import "./ResumePreviewButton.css";

interface ResumePreviewButtonProps {
  active: boolean;
  onClick: () => void;
}

const ResumePreviewButton = ({ active, onClick }: ResumePreviewButtonProps) => {
  return (
    <button
      type="button"
      className={`resume-preview-button${active ? " active" : ""}`}
      onClick={onClick}
    >
      <span className="resume-preview-button-orb" aria-hidden="true" />
      <span className="resume-preview-button-copy">
        <span className="resume-preview-button-label">
          {active ? "HIDE PREVIEW" : "PREVIEW"}
        </span>
      </span>
    </button>
  );
};

export default ResumePreviewButton;
