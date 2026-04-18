import MenuButton from "./MenuButton";
import MinimizeButton from "./MinimizeButton";
import { useEffect, useState } from "react";
import "./Menu.css";

interface MenuProps {
  callback: (button: number) => void;
  minimizedText: string;
  buttons: string[];
  minimize: boolean;
  text?: string;
  onButtonHover?: (button: number) => void;
  onButtonLeave?: (button: number) => void;
  minimizeOnClick?: boolean;
  className?: string;
}

const Menu = ({
  callback,
  minimizedText,
  buttons,
  text,
  minimize,
  onButtonHover,
  onButtonLeave,
  minimizeOnClick = true,
  className,
}: MenuProps) => {
  const [isMinimized, setIsMinimized] = useState(minimize);

  useEffect(() => {
    setIsMinimized(minimize);
  }, [minimize]);

  const onMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const onClick = (button: number) => {
    if (minimizeOnClick) {
      setIsMinimized(true);
    }
    callback(button);
  };

  if (isMinimized) {
    return <MinimizeButton onClick={onMinimize} label={minimizedText} />;
  } else {
    return (
      <div className={`menu-container${className ? ` ${className}` : ""}`}>
        <MinimizeButton onClick={onMinimize} label="Minimize" />
        <div className="menu-content">
          <p className="menu-text">{text || ""}</p>
          <div className="menu-buttons">
            {buttons.map((buttonLabel, index) => (
              <MenuButton
                key={index}
                label={buttonLabel}
                onClick={() => onClick(index)}
                onHover={() => onButtonHover?.(index)}
                onLeave={() => onButtonLeave?.(index)}
              />
            ))}
          </div>
        </div>
      </div>
    );
  }
};

export default Menu;
