import * as jose from "jose";

export const getJwtSecret = () => {
  return new TextEncoder().encode(process.env.JWT_SECRET);
};

export const verifyToken = async (token: string) => {
  try {
    const { payload } = await jose.jwtVerify(token, getJwtSecret());
    return payload as { userId: string };
  } catch (error) {
    console.error("Token 验证失败:", error);
    throw new Error("Invalid token");
  }
};

export const generateToken = async (userId: string): Promise<string> => {
  const token = await new jose.SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .setNotBefore(0)
    .sign(getJwtSecret());

  console.log("Generated token in auth.ts:", token);
  return token;
};
