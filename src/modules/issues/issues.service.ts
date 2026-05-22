import { pool } from "../../db";
import type { CreateIssuePayload, IssueDbRow } from "./issues.interface";


// 1. Create a new issue 
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
  
  
  let queryText = `SELECT id, title, description, type, status, reporter_id, created_at, updated_at FROM issues WHERE 1=1`;
  const queryParams: any[] = [];

  if (type) {
    queryParams.push(type);
    queryText += ` AND type = $${queryParams.length}`;
  }

  //  open, in_progress, resolved 
  if (status) {
    queryParams.push(status);
    queryText += ` AND status = $${queryParams.length}`;
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

  //  reporter_id 
  const reporterIds = [...new Set(issues.map(issue => issue.reporter_id))];

  
  const userQueryText = `SELECT id, name, role FROM users WHERE id = ANY($1)`;
  const userResult = await pool.query(userQueryText, [reporterIds]);
  const users = userResult.rows;

  
  const userMap = users.reduce((acc: any, user: any) => {
    acc[user.id] = user;
    return acc;
  }, {});

  
  const formattedIssues = issues.map(issue => {
    const { reporter_id, ...issueData } = issue; 
    return {
      ...issueData,
      reporter: userMap[reporter_id] || null 
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

  
  const userQueryText = `SELECT id, name, role FROM users WHERE id = $1`;
  const userResult = await pool.query(userQueryText, [issue.reporter_id]);
  const user = userResult.rows[0];

  
  const { reporter_id, ...issueData } = issue;

 
  return {
    ...issueData,
    reporter: user ? {
      id: user.id,
      name: user.name,
      role: user.role
    } : null
  };
};

export const issuesService = {
  createIssueIntoDB,
  getAllIssuesFromDB, 
  getSingleIssueFromDB,
};