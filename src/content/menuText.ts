import mainText from "./menu/main.txt?raw";
import aboutMeText from "./menu/about-me.txt?raw";
import projectsText from "./menu/projects.txt?raw";
import skillsText from "./menu/skills.txt?raw";
import resumeText from "./menu/resume.txt?raw";
import contactText from "./menu/contact.txt?raw";

export const menuText = {
  main: mainText.trim(),
  aboutMe: aboutMeText.trim(),
  projects: projectsText.trim(),
  skills: skillsText.trim(),
  resume: resumeText.trim(),
  contact: contactText.trim(),
} as const;
