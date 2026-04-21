import Menu from "./Menu";
import { menuText } from "../content/menuText";

interface MainMenuProps {
  callback: (button: number) => void;
  start: boolean;
}

const MainMenu = ({ callback, start }: MainMenuProps) => {
  return (
    <Menu
      callback={callback}
      minimizedText="Menu"
      minimize={!start}
      buttons={["ABOUT ME", "PROJECTS", "SKILLS", "RESUME", "CONTACT"]}
      text={menuText.main}
    ></Menu>
  );
};

export default MainMenu;
