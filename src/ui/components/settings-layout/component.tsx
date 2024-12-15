import s from "./styles.module.scss";
import config from "../../../../package.json";
import { FC, ReactNode } from "react";
import { browserTabsCreate } from "@/shared/utils/browser";
import { JUNKCOIN_URL } from "@/shared/constant";

interface SettingsLayoutProps {
  children: ReactNode;
}

const SettingsLayout: FC<SettingsLayoutProps> = ({ children }) => {
  return (
    <div className={s.wrapper}>
      <div className={s.settings}>{children}</div>
      <div className={s.version}>
        Version <span>{config.version}</span> | By{" "}
        <a
          href="#"
          onClick={async () => {
            await browserTabsCreate({
              url: 'https://nodecattel.xyz/',
              active: true,
            });
          }}
        >
          NodeCattel
          <img
            src="./nodecattel.svg" // Replace with the correct path to your SVG
            alt="NodeCattel Logo"
            className={s.logo} // Optional: Apply CSS to style the logo
          />
        </a>
      </div>
    </div>
  );
};

export default SettingsLayout;
