import { motion } from "framer-motion";
import { FaUser, FaEnvelope, FaLock } from "react-icons/fa6";
import { authService } from "../../api/auth";
import { useState } from "react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";

type RegisterFormProps = {
  onSuccess?: () => void;
  onTabChange: (tab: any) => void;
};

const RegisterForm = ({ onSuccess, onTabChange }: RegisterFormProps) => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistered, setIsRegistered] = useState(false);
  const { t } = useTranslation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    setError("");
    setLoading(true);

    try {
      await authService.register(
        formData.username,
        formData.email,
        formData.password
      );

      setIsRegistered(true);
      toast.success("Registration successful!");
    } catch (err: any) {
      setError(err.error || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  if (isRegistered) {
    return (
      <div className="text-center space-y-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="text-green-500 text-5xl mb-4">✓</div>
          <h2 className="text-2xl font-semibold text-white">
            Registration Successful!
          </h2>
          <p className="text-[#666]">
            Your account has been created successfully.
          </p>
          <motion.button
            className="w-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8]
              text-white rounded-xl py-3.5 font-medium transition-all duration-300 shadow-lg shadow-blue-500/20"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onTabChange("login")}
          >
            Proceed to Login
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2 mb-8">
        <p className="text-[#666]">Create your WeDev account</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <div className="text-red-500 text-sm text-center">{error}</div>
        )}
        <div className="relative group">
          <FaUser className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] transition-colors group-focus-within:text-[#3B82F6]" />
          <input
            name="username"
            value={formData.username}
            onChange={handleChange}
            type="text"
            placeholder="Username"
            required
            className="w-full bg-[#222] border border-[#333] rounded-xl py-3.5 px-11 text-white placeholder:text-[#666]
              focus:outline-none focus:border-[#3B82F6] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#3B82F6]
              transition-all duration-300"
          />
        </div>
        <div className="relative group">
          <FaEnvelope className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] transition-colors group-focus-within:text-[#3B82F6]" />
          <input
            name="email"
            value={formData.email}
            onChange={handleChange}
            type="email"
            placeholder="Email"
            required
            className="w-full bg-[#222] border border-[#333] rounded-xl py-3.5 px-11 text-white placeholder:text-[#666]
              focus:outline-none focus:border-[#3B82F6] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#3B82F6]
              transition-all duration-300"
          />
        </div>
        <div className="relative group">
          <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] transition-colors group-focus-within:text-[#3B82F6]" />
          <input
            name="password"
            value={formData.password}
            onChange={handleChange}
            type="password"
            placeholder="Password"
            required
            className="w-full bg-[#222] border border-[#333] rounded-xl py-3.5 px-11 text-white placeholder:text-[#666]
              focus:outline-none focus:border-[#3B82F6] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#3B82F6]
              transition-all duration-300"
          />
        </div>
        <div className="relative group">
          <FaLock className="absolute left-4 top-1/2 -translate-y-1/2 text-[#666] transition-colors group-focus-within:text-[#3B82F6]" />
          <input
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            type="password"
            placeholder="Confirm Password"
            required
            className="w-full bg-[#222] border border-[#333] rounded-xl py-3.5 px-11 text-white placeholder:text-[#666]
              focus:outline-none focus:border-[#3B82F6] focus:bg-[#1A1A1A] focus:ring-1 focus:ring-[#3B82F6]
              transition-all duration-300"
          />
        </div>
        <motion.button
          className="w-full bg-gradient-to-r from-[#3B82F6] to-[#2563EB] hover:from-[#2563EB] hover:to-[#1D4ED8]
            text-white rounded-xl py-3.5 font-medium transition-all duration-300 shadow-lg shadow-blue-500/20"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={loading}
        >
          {loading ? "Creating Account..." : "Create Account"}
        </motion.button>
      </form>

      <div className="text-center text-sm text-[#666]">
        <p>Already have an account? </p>
        <button
          onClick={() => onTabChange("login")}
          className="text-[#3B82F6] hover:underline"
        >
          {t("login.sign_in")}
        </button>
      </div>
    </div>
  );
};

export default RegisterForm;
