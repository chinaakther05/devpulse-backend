import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { pool } from "../../db";
import config from "../../config";

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


//  User Register 

const registerUserIntoDB = async (payload: TSignupPayload) => {
  const { name, email, password, role } = payload;

  // hash password
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);

  // user database
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role || "contributor"]
  );

  return result.rows[0];
};


// ২. User Login & Token Generate 

const loginUserFromDB = async (payload: TLoginPayload) => {
  const { email, password } = payload;

 // user  email
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );

  // user error handling
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }

  const user = userData.rows[0];

  
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }

  // JWT token
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role, 
  };

 // secret key geraret
  const secretKey = (config.secret || "mySuperSecretLongTokenKey123456!") as string;
  
  const token = jwt.sign(jwtPayload, secretKey, {
    expiresIn: "1d",
  });
  
  
  const { password: _, ...userWithoutPassword } = user;

  return {
    token,
    user: userWithoutPassword,
  };
};

export const authService = {
  registerUserIntoDB,
  loginUserFromDB,
};