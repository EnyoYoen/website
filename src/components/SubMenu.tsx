import Menu from "./Menu";
import ResumeMenu from "./ResumeMenu";
import ContactMenu from "./ContactMenu";
import { MenuEnum } from "../App";

interface SubMenuProps {
  callback: (button: number) => void;
  text: string;
  minimizedText: string;
  buttons?: string[];
  onButtonHover?: (button: number) => void;
  onButtonLeave?: (button: number) => void;
  minimizeOnClick?: boolean;
  className?: string;
  minimize?: boolean;
  menu: MenuEnum;
}

const SubMenu = ({
  callback,
  text,
  minimizedText,
  buttons,
  onButtonHover,
  onButtonLeave,
  minimizeOnClick,
  className,
  minimize,
  menu,
}: SubMenuProps) => {
  return menu === MenuEnum.RESUME ? (
    <ResumeMenu
      callback={callback}
      minimizedText={minimizedText}
      minimize={minimize ?? false}
      text={text}
      minimizeOnClick={minimizeOnClick}
      className={className}
      menu={menu}
    />
  ) : menu === MenuEnum.CONTACT ? (
    <ContactMenu
      callback={callback}
      minimizedText={minimizedText}
      minimize={minimize ?? false}
      text={text}
      minimizeOnClick={minimizeOnClick}
      className={className}
    />
  ) : (
    <Menu
      callback={callback}
      minimizedText={minimizedText}
      buttons={buttons ?? ["BACK"]}
      text={text}
      minimize={minimize ?? false}
      onButtonHover={onButtonHover}
      onButtonLeave={onButtonLeave}
      minimizeOnClick={minimizeOnClick}
      className={className}
    />
  );
};

export default SubMenu;
