
      import { createRequire } from 'module';
      const require = createRequire(import.meta.url);
    

// src/app.ts
import express from "express";

// src/modules/auth/auth.route.ts
import { Router } from "express";

// src/modules/auth/auth.service.ts
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

// src/db/index.ts
import { Pool } from "pg";

// src/config/index.ts
import dotenv from "dotenv";
import { env } from "process";
dotenv.config({ quiet: true });
var config = {
  port: env.PORT,
  database_url: env.DATABASE_URL,
  jwt_secret: process.env.JWT_SECRET || "mySuperSecretLongTokenKey123456!",
  jwt_expires_in: process.env.JWT_EXPIRES_IN || "1d"
};
var config_default = config;

// src/db/index.ts
var pool = new Pool({
  connectionString: config_default.database_url
});
var initDB = async () => {
  try {
    await pool.query(`
        CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password TEXT NOT NULL,
        role VARCHAR(20) DEFAULT 'contributor' CHECK (role IN ('contributor', 'maintainer')),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);
    await pool.query(`
       CREATE TABLE IF NOT EXISTS issues (
  id SERIAL PRIMARY KEY,
        title VARCHAR(150) NOT NULL, -- \u09B8\u09B0\u09CD\u09AC\u09CB\u099A\u09CD\u099A \u09E7\u09EB\u09E6 \u0995\u09CD\u09AF\u09BE\u09B0\u09C7\u0995\u09CD\u099F\u09BE\u09B0
        description TEXT NOT NULL,
        type VARCHAR(30) NOT NULL CHECK (type IN ('bug', 'feature_request')),
        status VARCHAR(30) DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved')), 
        reporter_id INT NOT NULL,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);
      `);
    console.log("database connected successfully!");
  } catch (error) {
    console.log("DB error:", error);
  }
};

// src/modules/auth/auth.service.ts
var registerUserIntoDB = async (payload) => {
  const { name, email, password, role } = payload;
  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(password, saltRounds);
  const result = await pool.query(
    `INSERT INTO users (name, email, password, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, name, email, role, created_at, updated_at`,
    [name, email, hashedPassword, role || "contributor"]
  );
  return result.rows[0];
};
var loginUserFromDB = async (payload) => {
  const { email, password } = payload;
  const userData = await pool.query(
    `SELECT * FROM users WHERE email = $1`,
    [email]
  );
  if (userData.rows.length === 0) {
    throw new Error("Invalid Credentials");
  }
  const user = userData.rows[0];
  const matchPassword = await bcrypt.compare(password, user.password);
  if (!matchPassword) {
    throw new Error("Invalid Credentials");
  }
  const jwtPayload = {
    id: user.id,
    name: user.name,
    role: user.role
  };
  const secretKey = config_default && "secret" in config_default ? config_default.secret : "mySuperSecretLongTokenKey123456!";
  const token = jwt.sign(jwtPayload, secretKey, {
    expiresIn: "1d"
  });
  const { password: _, ...userWithoutPassword } = user;
  return {
    token,
    user: userWithoutPassword
  };
};
var authService = {
  registerUserIntoDB,
  loginUserFromDB
};

// src/utils/sendResponse.ts
var sendResponse = (res, data) => {
  res.status(data.statusCode).json({
    success: data.success,
    message: data.message,
    data: data.data
  });
};

// src/modules/auth/auth.controller.ts
var signupController = async (req, res) => {
  try {
    const result = await authService.registerUserIntoDB(req.body);
    sendResponse(res, {
      statusCode: 201,
      success: true,
      message: "User registered successfully",
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};
var loginController = async (req, res) => {
  try {
    const result = await authService.loginUserFromDB(req.body);
    sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Login successful",
      data: result
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Something went wrong";
    res.status(400).json({
      success: false,
      message: errorMessage
    });
  }
};
var auth_controller_default = {
  signupController,
  loginController
};

// src/modules/auth/auth.route.ts
var router = Router();
router.post("/signup", auth_controller_default.signupController);
router.post("/login", auth_controller_default.loginController);
var authRoute = router;

// src/middlewares/error.middleware.ts
var globalErrorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || err.stack || "Unexpected server or database error";
  res.status(statusCode).json({
    success: false,
    message,
    errors
  });
};

// src/modules/issues/issues.route.ts
import { Router as Router2 } from "express";

// src/modules/issues/issues.service.ts
var createIssueIntoDB = async (payload, reporterId) => {
  const { title, description, type } = payload;
  if (title.length > 150) {
    throw new Error("Title must be maximum 150 characters long");
  }
  if (description.length < 20) {
    throw new Error("Description must be minimum 20 characters long");
  }
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, reporterId]
  );
  return result.rows[0];
};
var getAllIssuesFromDB = async (filters) => {
  const { sort, type, status } = filters;
  let queryText = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
  const whereClauses = [];
  const queryParams = [];
  if (type) {
    queryParams.push(type);
    whereClauses.push(`type = $${queryParams.length}`);
  }
  if (status) {
    queryParams.push(status);
    whereClauses.push(`status = $${queryParams.length}`);
  }
  if (whereClauses.length > 0) {
    queryText += ` WHERE ${whereClauses.join(" AND ")}`;
  }
  if (sort === "oldest") {
    queryText += ` ORDER BY created_at ASC`;
  } else {
    queryText += ` ORDER BY created_at DESC`;
  }
  const issueResult = await pool.query(queryText, queryParams);
  const issues = issueResult.rows;
  if (issues.length === 0) {
    return [];
  }
  const reporterIds = [...new Set(issues.map((issue) => issue.reporter_id))];
  const userQueryText = `SELECT id, name, role FROM users WHERE id = ANY($1)`;
  const userResult = await pool.query(userQueryText, [reporterIds]);
  const users = userResult.rows;
  const userMap = users.reduce((acc, user) => {
    acc[user.id] = {
      id: user.id,
      name: user.name,
      role: user.role
    };
    return acc;
  }, {});
  const formattedIssues = issues.map((issue) => {
    return {
      id: issue.id,
      title: issue.title,
      description: issue.description,
      type: issue.type,
      status: issue.status,
      reporter: userMap[issue.reporter_id] || null,
      created_at: issue.created_at,
      updated_at: issue.updated_at
    };
  });
  return formattedIssues;
};
var getSingleIssueFromDB = async (id) => {
  const queryText = `
    SELECT id, title, description, type, status, reporter_id, created_at, updated_at 
    FROM issues 
    WHERE id = $1
  `;
  const result = await pool.query(queryText, [id]);
  if (result.rows.length === 0) {
    return null;
  }
  const issue = result.rows[0];
  const userQueryText = `SELECT id, name, role FROM users WHERE id = $1`;
  const userResult = await pool.query(userQueryText, [issue.reporter_id]);
  const user = userResult.rows[0];
  return {
    id: issue.id,
    title: issue.title,
    description: issue.description,
    type: issue.type,
    status: issue.status,
    reporter: user ? {
      id: user.id,
      name: user.name,
      role: user.role
    } : null,
    created_at: issue.created_at,
    updated_at: issue.updated_at
  };
};
var updateIssueInDB = async (id, userId, userRole, updateData) => {
  const findQuery = `SELECT * FROM issues WHERE id = $1`;
  const findResult = await pool.query(findQuery, [id]);
  if (findResult.rows.length === 0) {
    return { errorType: "NOT_FOUND", message: "Issue not found" };
  }
  const issue = findResult.rows[0];
  if (userRole === "contributor") {
    if (issue.reporter_id !== userId) {
      return { errorType: "FORBIDDEN", message: "You are not authorized to update this issue" };
    }
    if (issue.status !== "open") {
      return { errorType: "FORBIDDEN", message: "Contributors can only update issues with 'open' status" };
    }
  }
  const fields = [];
  const values = [];
  let paramIndex = 1;
  if (updateData.title) {
    fields.push(`title = $${paramIndex++}`);
    values.push(updateData.title);
  }
  if (updateData.description) {
    fields.push(`description = $${paramIndex++}`);
    values.push(updateData.description);
  }
  if (updateData.type) {
    fields.push(`type = $${paramIndex++}`);
    values.push(updateData.type);
  }
  if (fields.length === 0) {
    return { errorType: "BAD_REQUEST", message: "No fields provided for update" };
  }
  fields.push(`updated_at = NOW()`);
  values.push(id);
  const updateQuery = `
    UPDATE issues 
    SET ${fields.join(", ")} 
    WHERE id = $${paramIndex} 
    RETURNING id, title, description, type, status, reporter_id, created_at, updated_at
  `;
  const result = await pool.query(updateQuery, values);
  return { success: true, data: result.rows[0] };
};
var deleteIssueFromDB = async (id, userRole) => {
  if (userRole !== "maintainer") {
    return { errorType: "FORBIDDEN", message: "Only maintainers are allowed to delete issues" };
  }
  const findQuery = `SELECT id FROM issues WHERE id = $1`;
  const findResult = await pool.query(findQuery, [id]);
  if (findResult.rows.length === 0) {
    return { errorType: "NOT_FOUND", message: "Issue not found" };
  }
  const deleteQuery = `DELETE FROM issues WHERE id = $1`;
  await pool.query(deleteQuery, [id]);
  return { success: true };
};
var issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB,
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB
};

// src/modules/issues/issues.controller.ts
var createIssue = async (req, res, next) => {
  try {
    const issuePayload = req.body;
    const reporterId = req.user?.id;
    if (!reporterId) {
      res.status(401).json({
        success: false,
        message: "Unauthorized"
      });
      return;
    }
    const result = await issuesService.createIssueIntoDB(issuePayload, reporterId);
    res.status(201).json({
      success: true,
      message: "Issue created successfully",
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getAllIssues = async (req, res, next) => {
  try {
    const filters = {
      sort: req.query.sort,
      type: req.query.type,
      status: req.query.status
    };
    const result = await issuesService.getAllIssuesFromDB(filters);
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var getSingleIssue = async (req, res, next) => {
  const { id } = req.params;
  try {
    const result = await issuesService.getSingleIssueFromDB(id);
    if (!result) {
      res.status(404).json({
        success: false,
        message: "Issue not found"
      });
      return;
    }
    res.status(200).json({
      success: true,
      data: result
    });
  } catch (error) {
    next(error);
  }
};
var updateIssue = async (req, res, next) => {
  const { id } = req.params;
  const { title, description, type } = req.body;
  const userId = req.user.id;
  const userRole = req.user.role;
  try {
    const result = await issuesService.updateIssueInDB(
      id,
      userId,
      userRole,
      { title, description, type }
    );
    if (result.errorType) {
      if (result.errorType === "NOT_FOUND") {
        res.status(404).json({ success: false, message: result.message });
        return;
      }
      if (result.errorType === "FORBIDDEN") {
        res.status(403).json({ success: false, message: result.message });
        return;
      }
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Issue updated successfully",
      data: result.data
    });
  } catch (error) {
    next(error);
  }
};
var deleteIssue = async (req, res, next) => {
  const { id } = req.params;
  const userRole = req.user.role;
  try {
    const result = await issuesService.deleteIssueFromDB(id, userRole);
    if (result.errorType) {
      if (result.errorType === "NOT_FOUND") {
        res.status(404).json({ success: false, message: result.message });
        return;
      }
      if (result.errorType === "FORBIDDEN") {
        res.status(403).json({ success: false, message: result.message });
        return;
      }
      res.status(400).json({ success: false, message: result.message });
      return;
    }
    res.status(200).json({
      success: true,
      message: "Issue deleted successfully"
    });
  } catch (error) {
    next(error);
  }
};
var issuesController = {
  createIssue,
  getAllIssues,
  getSingleIssue,
  updateIssue,
  deleteIssue
};

// src/middlewares/auth.middleware.ts
import jwt2 from "jsonwebtoken";
var authMiddleware = (...requiredRoles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      const token = authHeader && authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : authHeader;
      if (!token) {
        res.status(401).json({
          success: false,
          message: "Unauthorized",
          errors: "Missing, expired, or invalid JWT token"
        });
        return;
      }
      const secretKey = config_default && "secret" in config_default ? config_default.secret : "mySuperSecretLongTokenKey123456!";
      const decoded = jwt2.verify(token, secretKey);
      req.user = decoded;
      if (requiredRoles.length && !requiredRoles.includes(decoded.role)) {
        res.status(403).json({
          success: false,
          message: "Forbidden",
          errors: "Valid token but insufficient role/permissions"
        });
        return;
      }
      next();
    } catch (error) {
      res.status(401).json({
        success: false,
        message: "Unauthorized",
        errors: "Missing, expired, or invalid JWT token"
      });
    }
  };
};

// src/modules/issues/issues.route.ts
var router2 = Router2();
router2.post("/", authMiddleware(), issuesController.createIssue);
router2.get("/", issuesController.getAllIssues);
router2.get("/:id", issuesController.getSingleIssue);
router2.patch("/:id", authMiddleware(), issuesController.updateIssue);
router2.delete("/:id", authMiddleware(), issuesController.deleteIssue);
var issuesRoute = router2;

// src/app.ts
var app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Welcome to DevPulse Server!",
    author: "DevPulse"
  });
});
app.use("/api/auth", authRoute);
app.use("/api/issues", issuesRoute);
app.use(globalErrorHandler);
var app_default = app;

// src/index.ts
var main = async () => {
  try {
    await initDB();
    app_default.listen(config_default.port, () => {
      console.log(`server is running on port ${config_default.port}`);
    });
  } catch (error) {
    console.error(" Failed to start the server:", error);
  }
};
main();
//# sourceMappingURL=index.js.map