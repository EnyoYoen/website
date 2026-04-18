import GitHub from "../assets/images/vector/github.svg";
import LinkedIn from "../assets/images/vector/linkedin.svg";
import Twitter from "../assets/images/vector/twitter.svg";
import Instagram from "../assets/images/vector/instagram.svg";
import Facebook from "../assets/images/vector/facebook.svg";
import Discord from "../assets/images/vector/discord.svg";
import Email from "../assets/images/vector/email.svg";
import "./FooterIcon.css";

interface FooterIconProps {
  icon:
    | "GitHub"
    | "LinkedIn"
    | "Twitter"
    | "Instagram"
    | "Facebook"
    | "Discord"
    | "Email";
  link: string;
}

const icons = {
  GitHub,
  LinkedIn,
  Twitter,
  Instagram,
  Facebook,
  Discord,
  Email,
};

const FooterIcon = ({ icon, link }: FooterIconProps) => {
  return (
    <a href={link} target="_blank" className="footer-icon">
      <button type="button">
        <img src={icons[icon]} alt={icon} />
      </button>
    </a>
  );
};

export default FooterIcon;
