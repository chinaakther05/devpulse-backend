import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import config from "../../config";

// টাইপ ডিফাইন
type TSignupPayload = {
  name: string;
  email: string;
  password: string;
  role?: "contributor" | "maintainer";
};

type TLoginPayload = {
  email: string;
  password: string;
};

// ১. ডাটাবেজে ইউজার রেজিস্ট্রেশন করা
const registerUserIntoDB = async (payload: TSignupPayload) => {
  const { name, email, password, role } = payload;

  // পাসওয়ার্ড হ্যাশ করা (Salt rounds: 10)
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // Raw SQL কুয়েরি (পাসওয়ার্ড ছাড়া বাকি ডাটা RETURNING করা হয়েছে)
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role || "contributor"]
  );

  return result.rows[0];
};

// ২. ইউজার লগইন ও টোকেন জেনারেট করা
const loginUserFromDB = async (payload: TLoginPayload) => {
  const { email, password } = payload;

  // ইমেইল দিয়ে ইউজার খুঁজে বের করা
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }

  const user = userData.rows[0];

  // পাসওয়ার্ড ম্যাচ করানো
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }

  // 💡 রিকোয়ারমেন্টের Hint অনুযায়ী JWT পেলোড সেট করা
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role, // পরবর্তীতে পারমিশন চেক করতে এটি লাগবে
  };

  // JWT সাইন করা
 const token = jwt.sign(jwtPayload, config.secret! as string, {
  expiresIn: "1d",
});
  // রেসপন্স থেকে পাসওয়ারড সিকিউরলি বাদ দেওয়া
  const { password: _, ...userWithoutPassword } = user;

  // রিকোয়ারমেন্টের সেম টু সেম প্রোপার্টি ফরম্যাট (token এবং user)
  return {
    token,
    user: userWithoutPassword,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUserFromDB,
};