import MenuButton from "./MenuButton";
import MinimizeButton from "./MinimizeButton";
import { useState } from "react";
import "./Menu.css";

interface MenuProps {
  callback: (button: number) => void;
}

const Menu = ({ callback }: MenuProps) => {
  const [isMinimized, setIsMinimized] = useState(false);

  const onMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const onClick = (button: number) => {
    setIsMinimized(true);
    callback(button);
  };

  if (isMinimized) {
    return <MinimizeButton onClick={onMinimize} label="Menu" />;
  } else {
    return (
      <div className="menu-container">
        <MinimizeButton onClick={onMinimize} label="Minimize" />
        <div className="menu-content">
          <p className="menu-text">
            lorem ipsum dolor sit amet consectetur adipiscing elit sed do
            eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim
            ad minim veniam quis nostrud exercitation ullamco laboris nisi ut
            aliquip ex ea commodo consequat duis aute irure dolor in
            reprehenderit voluptate velit esse cillum dolore fugiat nulla
            pariatur excepteur sint occaecat cupidatat non proident sunt culpa
            qui officia deserunt mollit anim id est laborum
          </p>
          <div className="menu-buttons">
            <MenuButton label="RESUME" onClick={() => onClick(1)} />
            <MenuButton label="ABOUT ME" onClick={() => onClick(2)} />
            <MenuButton label="SKILLS" onClick={() => onClick(3)} />
            <MenuButton label="CONTACT" onClick={() => onClick(4)} />
          </div>
        </div>
      </div>
    );
  }
};

export default Menu;
