import { pool } from "../../db";
import type { CreateIssuePayload, IssueDbRow } from "./issues.interface";

//  Create a new issue 
const createIssueIntoDB = async (payload: CreateIssuePayload, reporterId: number): Promise<IssueDbRow> => {
  const { title, description, type } = payload;

  // Logic Validation 
  if (title.length > 150) {
    throw new Error("Title must be maximum 150 characters long");
  }
  if (description.length < 20) {
    throw new Error("Description must be minimum 20 characters long");
  }

  // SQL Query 
  const result = await pool.query(
    `INSERT INTO issues (title, description, type, reporter_id) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, title, description, type, status, reporter_id, created_at, updated_at`,
    [title, description, type, reporterId]
  );

  return result.rows[0] as IssueDbRow;
};

//  Get all issues 
const getAllIssuesFromDB = async (filters: { sort?: string; type?: string; status?: string }) => {
  const { sort, type, status } = filters;
  
  let queryText = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues`;
  const whereClauses: string[] = [];
  const queryParams: any[] = [];

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

  // Sorting logic (Default: newest)
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

  
  const reporterIds = [...new Set(issues.map(issue => issue.reporter_id))];

  const userQueryText = `SELECT id, name, role FROM users WHERE id = ANY($1)`;
  const userResult = await pool.query(userQueryText, [reporterIds]);
  const users = userResult.rows;

  const userMap = users.reduce((acc: any, user: any) => {
    acc[user.id] = {
      id: user.id,
      name: user.name,
      role: user.role
    };
    return acc;
  }, {});

  
  const formattedIssues = issues.map(issue => {
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

//  Get Single Issue 
const getSingleIssueFromDB = async (id: string) => {
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

  // Separate query for single user details
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

//  Update Issue Service 
const updateIssueInDB = async (
  id: string,
  userId: number,
  userRole: string,
  updateData: { title?: string; description?: string; type?: string }
) => {
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

  const fields: string[] = [];
  const values: any[] = [];
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

// Delete Issue Service
const deleteIssueFromDB = async (id: string, userRole: string) => {
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

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB, 
  getSingleIssueFromDB,
  updateIssueInDB,
  deleteIssueFromDB 
};