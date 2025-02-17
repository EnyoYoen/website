import Menu from "./Menu";

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
      buttons={["RESUME", "ABOUT ME", "SKILLS", "CONTACT"]}
      text="lorem ipsum dolor sit amet consectetur adipiscing elit sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim
            ad minim veniam quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat duis aute irure dolor in
            reprehenderit voluptate velit esse cillum dolore fugiat nulla
            pariatur excepteur sint occaecat cupidatat non proident sunt culpa
            qui officia deserunt mollit anim id est laborum"
    ></Menu>
  );
};

export default MainMenu;
