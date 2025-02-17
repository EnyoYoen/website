import Footer from "./components/Footer";
import Switch from "./components/Switch";
import Background, {
  BackgroundPlanetTransition,
  BackgroundMenuTransition,
} from "./components/Background";
import "./App.css";
import MainMenu from "./components/MainMenu";
import SubMenu from "./components/SubMenu";
import { useState } from "react";

enum MenuEnum {
  MAIN,
  RESUME,
  ABOUT_ME,
  SKILLS,
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
    default:
      return "";
  }
}

function App() {
  const [menu, setMenu] = useState<MenuEnum>(MenuEnum.START);

  const callback = (button: number) => {
    if (button === -1) {
      setMenu(MenuEnum.MAIN);
      BackgroundMenuTransition();
    } else {
      setMenu((button + 1) as MenuEnum);
      BackgroundPlanetTransition(button);
    }
  };

  return (
    <div>
      <div className="app-container">
        <Background />
        <div className="app-switch-container">
          <Switch></Switch>
        </div>
        <div className="app-menu-container">
          {menu === MenuEnum.START || menu === MenuEnum.MAIN ? (
            <MainMenu callback={callback} start={menu === MenuEnum.START} />
          ) : (
            <SubMenu
              callback={() => callback(-1)}
              minimizedText={toString(menu)}
              text="lorem ipsum dolor sit amet consectetur adipiscing elit sed do"
            ></SubMenu>
          )}
        </div>
      </div>
      <Footer></Footer>
    </div>
  );
}

export default App;
