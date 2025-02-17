import MenuButton from "./MenuButton";
import MinimizeButton from "./MinimizeButton";
import { useState } from "react";
import "./Menu.css";

const Menu = () => {
  const onClick = () => {
    console.log("Button clicked"); // TODO
  };

  const [isMinimized, setIsMinimized] = useState(false);

  const onMinimize = () => {
    setIsMinimized(!isMinimized);
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
            <MenuButton label="RESUME" onClick={onClick} />
            <MenuButton label="ABOUT ME" onClick={onClick} />
            <MenuButton label="SKILLS" onClick={onClick} />
            <MenuButton label="CONTACT" onClick={onClick} />
          </div>
        </div>
      </div>
    );
  }
};

export default Menu;
