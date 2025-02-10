import bcrypt from "bcryptjs";
import User from "@/models/User";
import {
  AuthError,
  AuthResponse,
  PasswordUpdateCredentials,
  UserCredentials,
  UserData,
} from "@/types/auth.types";
import { generateToken } from "@/utils/auth";

export type OAuthProvider = "github" | "wechat";
export type LoginOrigin = "web" | "client";
export const createErrorResponse = (
  message: string,
  status: number = 400
): AuthError => {
  return { message, status };
};

export const formatUserResponse = (user: {
  _id: string;
  username: string;
  email: string;
  avatar?: string;
}): UserData => {
  return {
    _id: user._id,
    username: user.username,
    email: user.email,
    avatar: user.avatar,
  };
};

export const register = async (
  credentials: UserCredentials
): Promise<AuthResponse | AuthError> => {
  try {
    const { username, email, password } = credentials;

    const existingUser = await User.findOne({
      $or: [{ email }, { username }],
    });

    if (existingUser) {
      return createErrorResponse("User already exists");
    }

    const user = await User.create({ username, email, password });
    const token = await generateToken(user._id);

    return { token, user: formatUserResponse(user) };
  } catch (error) {
    console.error(error);
    return createErrorResponse("Registration failed", 500);
  }
};

export const login = async (
  credentials: UserCredentials
): Promise<AuthResponse | AuthError> => {
  try {
    const { email, password } = credentials;

    const user = await User.findOne({ email });
    if (!user) {
      return createErrorResponse("User not found", 404);
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return createErrorResponse("Invalid password", 401);
    }

    const token = await generateToken(user._id);
    return { token, user: formatUserResponse(user) };
  } catch (error) {
    console.error(error);
    return createErrorResponse("Login failed", 500);
  }
};

export const updatePassword = async (
  credentials: PasswordUpdateCredentials
): Promise<{ message: string } | AuthError> => {
  try {
    const { email, oldPassword, newPassword } = credentials;

    const user = await User.findOne({ email });
    if (!user) {
      return createErrorResponse("User not found", 404);
    }

    const isValid = await bcrypt.compare(oldPassword, user.password);
    if (!isValid) {
      return createErrorResponse("Invalid password", 401);
    }

    user.password = newPassword;
    await user.save();

    return { message: "Password updated" };
  } catch (error) {
    console.error(error);
    return createErrorResponse("Password update failed", 500);
  }
};
