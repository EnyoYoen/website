import Switch from "./components/Switch";
import Background, {
  BackgroundPlanetTransition,
  BackgroundMenuTransition,
  BackgroundFocusProjectPin,
  BackgroundProjectDiveTransition,
} from "./components/Background";
import "./App.css";
import MainMenu from "./components/MainMenu";
import SubMenu from "./components/SubMenu";
import { useEffect, useRef, useState } from "react";
import { menuText } from "./content/menuText";
import { gsap } from "gsap";
import { Route, Routes, useLocation, useNavigate } from "react-router-dom";
import ProjectA from "./pages/projects/ProjectA";
import ProjectB from "./pages/projects/ProjectB";
import ProjectC from "./pages/projects/ProjectC";
import ProjectD from "./pages/projects/ProjectD";

export enum MenuEnum {
  MAIN,
  ABOUT_ME,
  PROJECTS,
  SKILLS,
  RESUME,
  CONTACT,
  START,
}

function toString(menu: MenuEnum): string {
  switch (menu) {
    case MenuEnum.MAIN:
      return "MENU";
    case MenuEnum.RESUME:
      return "RESUME";
    case MenuEnum.ABOUT_ME:
      return "ABOUT ME";
    case MenuEnum.SKILLS:
      return "SKILLS";
    case MenuEnum.CONTACT:
      return "CONTACT";
    case MenuEnum.PROJECTS:
      return "PROJECTS";
    default:
      return "";
  }
}

function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [menu, setMenu] = useState<MenuEnum>(MenuEnum.START);
  const [isSubMenuMinimized, setIsSubMenuMinimized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [transitionOverlayOpacity, setTransitionOverlayOpacity] = useState(0);
  const submenuOpenTimeoutRef = useRef<number | null>(null);
  const projectTransitionInProgressRef = useRef(false);
  const projectTransitionTimelineRef = useRef<gsap.core.Timeline | null>(null);
  const wasOnProjectRouteRef = useRef(false);
  const projectButtons = ["PROJECT A", "PROJECT B", "PROJECT C", "PROJECT D", "BACK"];
  const projectRoutes = [
    "/projects/project-a",
    "/projects/project-b",
    "/projects/project-c",
    "/projects/project-d",
  ];
  const menuTextByEnum: Partial<Record<MenuEnum, string>> = {
    [MenuEnum.ABOUT_ME]: menuText.aboutMe,
    [MenuEnum.PROJECTS]: menuText.projects,
    [MenuEnum.SKILLS]: menuText.skills,
    [MenuEnum.RESUME]: menuText.resume,
    [MenuEnum.CONTACT]: menuText.contact,
  };

  const scheduleSubMenuReopen = () => {
    if (submenuOpenTimeoutRef.current !== null) {
      window.clearTimeout(submenuOpenTimeoutRef.current);
    }

    setIsSubMenuMinimized(true);
    submenuOpenTimeoutRef.current = window.setTimeout(() => {
      setIsSubMenuMinimized(false);
      submenuOpenTimeoutRef.current = null;
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (submenuOpenTimeoutRef.current !== null) {
        window.clearTimeout(submenuOpenTimeoutRef.current);
      }

      projectTransitionTimelineRef.current?.kill();
    };
  }, []);

  useEffect(() => {
    const onProjectRoute = location.pathname.startsWith("/projects/");
    if (!onProjectRoute && wasOnProjectRouteRef.current) {
      setMenu(MenuEnum.MAIN);
      setIsSubMenuMinimized(false);
      setTransitionOverlayOpacity(0);
      BackgroundMenuTransition();
    }

    wasOnProjectRouteRef.current = onProjectRoute;
  }, [location.pathname]);

  const startProjectPageTransition = (projectIndex: number) => {
    if (projectTransitionInProgressRef.current) {
      return;
    }

    if (submenuOpenTimeoutRef.current !== null) {
      window.clearTimeout(submenuOpenTimeoutRef.current);
      submenuOpenTimeoutRef.current = null;
    }

    projectTransitionInProgressRef.current = true;
    setIsSubMenuMinimized(true);

    const fadeState = { opacity: 0 };
    const targetRoute = projectRoutes[projectIndex];

    if (!targetRoute) {
      projectTransitionInProgressRef.current = false;
      return;
    }

    projectTransitionTimelineRef.current?.kill();
    projectTransitionTimelineRef.current = gsap.timeline();

    projectTransitionTimelineRef.current.to(fadeState, {
      duration: 2.15,
      opacity: 1,
      ease: "power2.in",
      onUpdate: () => {
        setTransitionOverlayOpacity(fadeState.opacity);
      },
    });

    BackgroundProjectDiveTransition(projectIndex, () => {
      setTransitionOverlayOpacity(0);
      projectTransitionInProgressRef.current = false;
      navigate(targetRoute);
    });
  };

  const callback = (button: number) => {
    if (button === -1) {
      if (submenuOpenTimeoutRef.current !== null) {
        window.clearTimeout(submenuOpenTimeoutRef.current);
        submenuOpenTimeoutRef.current = null;
      }
      setIsSubMenuMinimized(false);
      setMenu(MenuEnum.MAIN);
      BackgroundMenuTransition();
    } else {
      setMenu((button + 1) as MenuEnum);
      BackgroundPlanetTransition(button);
      scheduleSubMenuReopen();
    }
  };

  const onProjectRoute = location.pathname.startsWith("/projects/");

  return (
    <div>
      <div className="app-container">
        <Background darkMode={darkMode} />

        {!onProjectRoute && (
          <div className="app-switch-container">
            <Switch
              darkMode={darkMode}
              onToggle={() => setDarkMode((prev) => !prev)}
            ></Switch>
          </div>
        )}

        {!onProjectRoute && (
          <div className="app-menu-container">
            {menu === MenuEnum.START || menu === MenuEnum.MAIN ? (
              <MainMenu callback={callback} start={menu === MenuEnum.START} />
            ) : menu === MenuEnum.PROJECTS ? (
              <SubMenu
                callback={(button) => {
                  if (button === projectButtons.length - 1) {
                    callback(-1);
                  } else if (button >= 0 && button < projectButtons.length - 1) {
                    startProjectPageTransition(button);
                  }
                }}
                menu={menu}
                minimizedText={toString(menu)}
                text={menuTextByEnum[MenuEnum.PROJECTS] ?? ""}
                buttons={projectButtons}
                onButtonHover={(button) => {
                  if (button < projectButtons.length - 1) {
                    BackgroundFocusProjectPin(button);
                  }
                }}
                minimizeOnClick={false}
                className="menu-projects"
                minimize={isSubMenuMinimized}
              ></SubMenu>
            ) : (
              <SubMenu
                callback={() => callback(-1)}
                menu={menu}
                minimizedText={toString(menu)}
                text={menuTextByEnum[menu] ?? ""}
                minimize={isSubMenuMinimized}
              ></SubMenu>
            )}
          </div>
        )}

        <Routes>
          <Route path="/projects/project-a" element={<ProjectA />} />
          <Route path="/projects/project-b" element={<ProjectB />} />
          <Route path="/projects/project-c" element={<ProjectC />} />
          <Route path="/projects/project-d" element={<ProjectD />} />
        </Routes>

        <div
          className="app-transition-overlay"
          style={{ opacity: transitionOverlayOpacity }}
        />
      </div>
    </div>
  );
}

export default App;
