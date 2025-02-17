import FooterIcon from "./FooterIcon";

const Footer = () => {
  const icons = {
    GitHub: "https://github.com/EnyoYoen",
    LinkedIn: "https://fr.linkedin.com/in/yoen-peyrot-0176ab2ba",
    Discord: "https://discordapp.com/users/yoen.",
    Email: "mailto:yoen.peyrot@insa-lyon.fr",
  };

  return (
    <footer className="fixed bottom-0 left-0 z-20 w-full p-4 bg-white border-t border-gray-200 shadow-sm md:p-6 dark:bg-gray-700 dark:border-gray-600 flex justify-center items-center">
      <div className="flex space-x-4">
        {Object.keys(icons).map((icon) => (
          <FooterIcon
            key={icon}
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
            link={icons[icon as keyof typeof icons]}
          />
        ))}
      </div>
    </footer>
  );
};

export default Footer;
