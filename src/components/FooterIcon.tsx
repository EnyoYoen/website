import React from "react";
import GitHub from "../assets/images/vector/github.svg";
import LinkedIn from "../assets/images/vector/linkedin.svg";
import Twitter from "../assets/images/vector/twitter.svg";
import Instagram from "../assets/images/vector/instagram.svg";
import Facebook from "../assets/images/vector/facebook.svg";
import Discord from "../assets/images/vector/discord.svg";
import Email from "../assets/images/vector/email.svg";

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
      <button
        className="rounded-md h-12 w-12 bg-slate-800 p-2.5 border border-transparent text-center text-sm text-white transition-all shadow-sm hover:shadow-lg focus:bg-slate-600 focus:shadow-none active:bg-slate-600 hover:bg-slate-600 active:shadow-none disabled:pointer-events-none disabled:opacity-50 disabled:shadow-none"
        type="button"
      >
        <img src={icons[icon]} alt={icon} />
      </button>
    </a>
  );
};

export default FooterIcon;
