import React, { useEffect, useState } from "react";
import { getTokenUsage } from "../../api/tokens";
import { Spin } from "antd";
import useUserStore from "../../stores/userSlice";
import { useTranslation } from "react-i18next";

interface TokenUsage {
  tokensUsed: number;
  monthlyLimit: number;
  monthYear: string;
}

export function TokensSettings() {
  const [usage, setUsage] = useState<TokenUsage | null>(null);
  const [loading, setLoading] = useState(true);
  const token = useUserStore.getState().token;
  const { t } = useTranslation();
  useEffect(() => {
    const fetchUsage = async () => {
      try {
        if (!token) return;
        const data = await getTokenUsage(token as string);
        if (data) {
          setUsage(data);
        }
      } finally {
        setLoading(false);
      }
    };
    fetchUsage();
  }, [token]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[200px]">
        <Spin />
      </div>
    );
  }

  if (!usage) return null;

  const usagePercent = (usage.tokensUsed / usage.monthlyLimit) * 100;
  const remaining = usage.monthlyLimit - usage.tokensUsed;

  // Calculate next reset date
  const nextReset = new Date();
  nextReset.setMonth(nextReset.getMonth() + 1);
  nextReset.setDate(1);
  const daysUntilReset = Math.ceil(
    (nextReset.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
  );

  return (
    <div>
      <h2 className="text-[16px] font-medium text-white mb-4 translate">
        {t("usage.usage")}
      </h2>

      {/* Progress Card */}
      <div className="bg-blue-700/20 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between mb-3">
          <div className="text-[15px] text-white translate">{t("usage.monthly_usage")}</div>
        </div>

        {/* Progress bar */}
        <div className="bg-black/20 rounded-full h-1.5 mb-2">
          <div
            className="bg-blue-500 h-full rounded-full"
            style={{ width: `${Math.min(usagePercent, 100)}%` }}
          />
        </div>
        <div className="flex justify-between text-[14px]">
          <span className="text-white translate">
            {usage.tokensUsed.toLocaleString()} {t("usage.tokens_used")}
          </span>
          <span className="text-white translate">
            {remaining.toLocaleString()} {t("usage.remaining")}
          </span>
        </div>
      </div>

      {/* Usage Stats */}
      <div className="space-y-4">
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-gray-400 translate">{t("usage.billing_cycle")}</span>
          <span className="text-white translate">{usage.monthYear}</span>
        </div>
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-gray-400 translate">{t("usage.next_reset")}</span>
          <span className="text-white translate">{daysUntilReset} {t("usage.days")}</span>
        </div>
        <div className="flex justify-between items-center text-[14px]">
          <span className="text-gray-400 translate">{t("usage.monthly_limit")}</span>
          <span className="text-white">
            {usage.tokensUsed.toLocaleString()} /{" "}
            {usage.monthlyLimit.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Buy More Button */}
      <button className="mt-8 w-full bg-blue-500 hover:bg-blue-600 text-white rounded-lg px-4 py-1.5 transition-colors text-[14px]">
        <span className="translate">{t("usage.buy_tokens")}</span>
      </button>
    </div>
  );
}
