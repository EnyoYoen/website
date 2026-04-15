import React from "react";
import "./MenuButton.css";

interface MenuButtonProps {
  onClick: () => void;
  label: string;
  onHover?: () => void;
  onLeave?: () => void;
}

const MenuButton: React.FC<MenuButtonProps> = ({
  onClick,
  label,
  onHover,
  onLeave,
}) => {
  return (
    <div
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      className="menu-button-anim"
    >
      <button className="menu-button">{label}</button>
    </div>
  );
};

export default MenuButton;
