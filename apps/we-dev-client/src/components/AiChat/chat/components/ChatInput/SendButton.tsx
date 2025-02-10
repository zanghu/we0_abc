import React from "react";
import classNames from "classnames";
import type { SendButtonProps } from "./types";
import { useTranslation } from "react-i18next";

export const SendButton: React.FC<SendButtonProps> = ({
  isLoading,
  isUploading,
  hasInput,
  hasUploadingImages,
  onClick,
}) => {
  const { t } = useTranslation();

  return (
    <button
      type="submit"
      onClick={onClick}
      disabled={isLoading || (!hasInput && !hasUploadingImages) || isUploading}
      className={classNames(
        "p-2 rounded-lg transition-all duration-200 flex items-center gap-2",
        hasInput && !isUploading && !hasUploadingImages
          ? "bg-purple-500 dark:bg-purple-600 hover:bg-purple-600 dark:hover:bg-purple-700 text-white"
          : "bg-gray-100 dark:bg-gray-500/20 text-gray-400 dark:text-gray-500 cursor-not-allowed",
        (isLoading || isUploading) && "opacity-50 cursor-not-allowed"
      )}
    >
      <span className="text-sm font-medium">{t("chat.buttons.send")}</span>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        className="w-4 h-4"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M5 12h14M12 5l7 7-7 7"
        />
      </svg>
    </button>
  );
};
