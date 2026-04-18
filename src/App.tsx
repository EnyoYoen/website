import Switch from "./components/Switch";
import Background, {
  BackgroundPlanetTransition,
  BackgroundMenuTransition,
  BackgroundFocusProjectPin,
} from "./components/Background";
import "./App.css";
import MainMenu from "./components/MainMenu";
import SubMenu from "./components/SubMenu";
import { useEffect, useRef, useState } from "react";

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
  const [menu, setMenu] = useState<MenuEnum>(MenuEnum.START);
  const [isSubMenuMinimized, setIsSubMenuMinimized] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const submenuOpenTimeoutRef = useRef<number | null>(null);
  const projectButtons = ["PROJECT A", "PROJECT B", "PROJECT C", "PROJECT D", "BACK"];

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
    };
  }, []);

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

  return (
    <div>
      <div className="app-container">
        <Background darkMode={darkMode} />
        <div className="app-switch-container">
          <Switch
            darkMode={darkMode}
            onToggle={() => setDarkMode((prev) => !prev)}
          ></Switch>
        </div>
        <div className="app-menu-container">
          {menu === MenuEnum.START || menu === MenuEnum.MAIN ? (
            <MainMenu callback={callback} start={menu === MenuEnum.START} />
          ) : menu === MenuEnum.PROJECTS ? (
            <SubMenu
              callback={(button) => {
                if (button === projectButtons.length - 1) {
                  callback(-1);
                }
              }}
              menu={menu}
              minimizedText={toString(menu)}
              text="Hover a project button to rotate the planet and center its pin."
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
              text="lorem ipsum dolor sit amet consectetur adipiscing elit sed do"
              minimize={isSubMenuMinimized}
            ></SubMenu>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
