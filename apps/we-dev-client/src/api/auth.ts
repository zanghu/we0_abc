import type { User } from "@/stores/userSlice";
export const authService = {
  async login(email: string, password: string) {
    const res = await fetch(`${process.env.APP_BASE_URL}/api/auth/login`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
  async getUserInfo(token: string) {
    const res = await fetch(`${process.env.APP_BASE_URL}/api/user`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });
    const data: {
      _id: string;
      username: string;
      email: string;
      githubId: string | null;
      token: number;
      avatar: string;
      createdAt: string;
      __v: number;
      wechatId: string | null;
    } = await res.json();

    const user: User = {
      id: data._id,
      username: data.username,
      email: data.email,
      avatar: data.avatar,
      githubId: data?.githubId,
      wechatId: data?.wechatId,
      createdAt: data.createdAt,
    };
    if (!res.ok) throw user;
    return user;
  },

  async register(username: string, email: string, password: string) {
    const res = await fetch(`${process.env.APP_BASE_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password }),
    });

    const data = await res.json();
    if (!res.ok) throw data;
    return data;
  },
};
