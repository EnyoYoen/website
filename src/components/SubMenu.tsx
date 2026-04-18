import Menu from "./Menu";

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
}: SubMenuProps) => {
  return (
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
