import { useEffect, useState } from "react";
import MenuButton from "./MenuButton";
import MinimizeButton from "./MinimizeButton";
import { MenuEnum } from "../App";
import ResumePreviewButton from "./ResumePreviewButton";
import "./ResumeMenu.css";

interface ResumeMenuProps {
  callback: (button: number) => void;
  minimizedText: string;
  minimize: boolean;
  text?: string;
  minimizeOnClick?: boolean;
  className?: string;
  menu: MenuEnum;
}

const ResumeMenu = ({
  callback,
  minimizedText,
  minimize,
  text,
  minimizeOnClick = true,
  className,
  menu,
}: ResumeMenuProps) => {
  const [isMinimized, setIsMinimized] = useState(minimize);
  const [showResumeScreen, setShowResumeScreen] = useState(false);

  useEffect(() => {
    setIsMinimized(minimize);
  }, [minimize]);

  useEffect(() => {
    if (menu !== MenuEnum.RESUME || isMinimized) {
      setShowResumeScreen(false);
    }
  }, [menu, isMinimized]);

  const onMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const onClick = (button: number) => {
    if (minimizeOnClick) {
      setIsMinimized(true);
    }
    callback(button);
  };

  const openResume = () => {
    setShowResumeScreen(true);
    window.open("/resume.pdf", "_blank", "noopener,noreferrer");
  };

  const downloadResume = () => {
    const link = document.createElement("a");
    link.href = "/resume.pdf";
    link.download = "resume.pdf";
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  if (isMinimized) {
    return <MinimizeButton onClick={onMinimize} label={minimizedText} />;
  }

  return (
    <div className="menu-shell">
      <div className={`menu-container${className ? ` ${className}` : ""}`}>
        <MinimizeButton onClick={onMinimize} label="Minimize" />
        <div className="menu-content">
          <p className="menu-text">{text || ""}</p>
          <div className="resume-menu-actions-row">
            <ResumePreviewButton
              active={showResumeScreen}
              onClick={() => setShowResumeScreen((prev) => !prev)}
            />
          </div>
          <div className="resume-menu-actions-row">
            <MenuButton label="OPEN RESUME" onClick={openResume} />
            <MenuButton label="DOWNLOAD PDF" onClick={downloadResume} />
          </div>
          <div className="resume-menu-back-row">
            <MenuButton label="BACK" onClick={() => onClick(0)} />
          </div>
        </div>
      </div>

      {showResumeScreen && (
        <div className="menu-resume-screen" aria-label="Resume preview panel">
          <iframe
            className="menu-resume-preview"
            src="/resume.pdf#view=FitH"
            title="Resume preview"
          />
        </div>
      )}
    </div>
  );
};

export default ResumeMenu;
