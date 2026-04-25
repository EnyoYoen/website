import { ReactNode } from "react";
import "./ProjectPageLayout.css";

interface ProjectLink {
  label: string;
  href: string;
}

interface ProjectPageLayoutProps {
  title: string;
  summary: string;
  stack: string[];
  children?: ReactNode;
  links?: ProjectLink[];
}

const ProjectPageLayout = ({ children }: ProjectPageLayoutProps) => {
  return (
    <div className="app-project-page">
      {children}
    </div>
  );
};

export default ProjectPageLayout;
