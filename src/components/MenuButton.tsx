import React from "react";
import "./MenuButton.css";

interface MenuButtonProps {
  onClick: () => void;
  label: string;
}

const MenuButton: React.FC<MenuButtonProps> = ({ onClick, label }) => {
  return (
    <div onClick={onClick} className="menu-button-anim">
      <button className="menu-button">{label}</button>
    </div>
  );
};

export default MenuButton;
