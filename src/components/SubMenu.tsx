import Menu from "./Menu";

interface SubMenuProps {
  callback: () => void;
  text: string;
  minimizedText: string;
}

const SubMenu = ({ callback, text, minimizedText }: SubMenuProps) => {
  return (
    <Menu
      callback={(_: number) => {
        callback();
      }}
      minimizedText={minimizedText}
      buttons={["BACK"]}
      text={text}
      minimize={true}
    />
  );
};

export default SubMenu;
