import { useAppState } from "@/ui/states/appState";
import PasswordInput from "@/ui/components/password-input";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { t } from "i18next";
import { ss } from "@/ui/utils";
import { useWalletState } from "@/ui/states/walletState";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import LogoIcon from "@/ui/icons/Logo";
import { useBodyClass } from "../../../utils/useBodyClass";

interface FormType {
  password: string;
  confirmPassword: string;
}

const CreatePassword = () => {
  const navigate = useNavigate();

  const randomClass = ["splash-1", "splash-2", "splash-3"][
    Math.floor(Math.random() * 3)
  ];
  useBodyClass(randomClass);

  const formFields: { name: keyof FormType; label: string }[] = [
    {
      label: t("create_password.password"),
      name: "password",
    },
    {
      label: t("create_password.confirm_password"),
      name: "confirmPassword",
    },
  ];

  const { register, handleSubmit } = useForm<FormType>({
    defaultValues: {
      confirmPassword: "",
      password: "",
    },
  });
  const { updateAppState } = useAppState(ss(["updateAppState"]));
  const { vaultIsEmpty } = useWalletState(ss(["vaultIsEmpty"]));

  useEffect(() => {
    if (!vaultIsEmpty) navigate("/account/login");
  }, [vaultIsEmpty, navigate]);

  const createPassword = async ({ confirmPassword, password }: FormType) => {
    if (password === confirmPassword) {
      await updateAppState({ password, isUnlocked: true });
    } else {
      toast.error("Passwords dismatches");
    }
  };

  return (
    <form className="form" onSubmit={handleSubmit(createPassword)}>
      <div className="flex flex-col gap-7 items-center w-full">
        <div className="flex justify-center p-2 rounded-xl">
          <LogoIcon
            className={
              "text-white w-40 h-40 hover:scale-110 duration-100 transition-transform"
            }
          />
        </div>
        <div className="text-lg text-center font-[Roboto] uppercase tracking-widest">
          Yo-ho-ho!
        </div>
      </div>
      <p className="form-title">{t("create_password.create_password")}</p>
      {formFields.map((i, f) => (
        <PasswordInput
          tabIndex={f + 1}
          showSeparateLabel={false}
          key={i.name}
          register={register}
          {...i}
        />
      ))}

      <button className="btn primary" type="submit">
        {t("create_password.create_password")}
      </button>
    </form>
  );
};

export default CreatePassword;
