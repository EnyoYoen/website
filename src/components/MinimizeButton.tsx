import React from "react";
import "./MinimizeButton.css";

interface MinimizeButtonProps {
  onClick: () => void;
  label: string;
}

const MinimizeButton: React.FC<MinimizeButtonProps> = ({ onClick, label }) => {
  return (
    <button className="minimize-button" onClick={onClick}>
      <span className="minimize-button-line"></span>
      {label}
    </button>
  );
};

export default MinimizeButton;
