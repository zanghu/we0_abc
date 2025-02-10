import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LoginForm from "./LoginForm";
import RegisterForm from "./RegisterForm";
import useUserStore from "../../stores/userSlice";

type TabType = "login" | "register";
type LoginProps = {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
};

const Login = ({ isOpen, onClose }: LoginProps) => {
  const [activeTab, setActiveTab] = useState<TabType>("login");
  const { closeLoginModal } = useUserStore();

  // 统一处理关闭逻辑
  const handleClose = () => {
    onClose();
    closeLoginModal();
  };

  // 处理登录成功
  const handleSuccess = () => {
    handleClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - 点击遮罩关闭 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 grid place-items-center z-50"
          >
            <div className="w-full max-w-md bg-[#1A1A1A] rounded-2xl p-8 shadow-2xl border border-[#333]">
              {/* Close button - 点击关闭按钮关闭 */}
              <button
                onClick={handleClose}
                className="absolute right-4 top-4 text-[#666] hover:text-[#888] transition-colors"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "login" && (
                  <LoginForm
                    onSuccess={handleSuccess}
                    onTabChange={setActiveTab}
                  />
                )}
                {activeTab === "register" && (
                  <RegisterForm
                    onSuccess={handleSuccess}
                    onTabChange={setActiveTab}
                  />
                )}
              </motion.div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default Login;
