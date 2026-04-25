import ProjectPageLayout from "./ProjectPageLayout";

const ProjectA = () => {
  return (
    <ProjectPageLayout
      title="PROJECT A"
      summary="AAAA."
      stack={["React", "TypeScript", "Three.js", "GSAP"]}
      links={[
        { label: "GitHub", href: "https://github.com/EnyoYoen/website" },
      ]}
    >
      <p className="project-page-section">

      </p>
    </ProjectPageLayout>
  );
};

export default ProjectA;
