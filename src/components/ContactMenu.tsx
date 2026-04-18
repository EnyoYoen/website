import MinimizeButton from "./MinimizeButton";
import MenuButton from "./MenuButton";
import FooterIcon from "./FooterIcon";
import { useEffect, useState } from "react";
import "./Menu.css";
import "./ContactMenu.css";

interface ContactMenuProps {
  callback: (button: number) => void;
  minimizedText: string;
  minimize: boolean;
  text?: string;
  minimizeOnClick?: boolean;
  className?: string;
}

const ContactMenu = ({
  callback,
  minimizedText,
  text,
  minimize,
  minimizeOnClick = true,
  className,
}: ContactMenuProps) => {
  const [isMinimized, setIsMinimized] = useState(minimize);

  useEffect(() => {
    setIsMinimized(minimize);
  }, [minimize]);

  const onMinimize = () => {
    setIsMinimized(!isMinimized);
  };

  const onClick = () => {
    if (minimizeOnClick) {
      setIsMinimized(true);
    }
    callback(-1);
  };

  const contactLinks = {
    GitHub: "https://github.com/EnyoYoen",
    LinkedIn: "https://fr.linkedin.com/in/yoen-peyrot-0176ab2ba",
    Discord: "https://discordapp.com/users/yoen.",
    Email: "mailto:yoen.peyrot@insa-lyon.fr",
  };

  if (isMinimized) {
    return <MinimizeButton onClick={onMinimize} label={minimizedText} />;
  } else {
    return (
      <div className={`menu-container${className ? ` ${className}` : ""}`}>
        <MinimizeButton onClick={onMinimize} label="Minimize" />
        <div className="menu-content">
          <p className="menu-text">{text || ""}</p>
          <div className="menu-buttons contact-buttons">
            {Object.keys(contactLinks).map((icon) => (
              <div key={icon} className="contact-button-group">
                <FooterIcon
                  icon={
                    icon as
                      | "GitHub"
                      | "LinkedIn"
                      | "Twitter"
                      | "Instagram"
                      | "Facebook"
                      | "Discord"
                      | "Email"
                  }
                  link={contactLinks[icon as keyof typeof contactLinks]}
                />
                <p className="contact-label">{icon}</p>
              </div>
            ))}
          </div>
          <div className="contact-back-button">
            <MenuButton
              label="BACK"
              onClick={onClick}
            />
          </div>
        </div>
      </div>
    );
  }
};

export default ContactMenu;
