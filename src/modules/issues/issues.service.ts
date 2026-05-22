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

export const issuesService = {
  createIssueIntoDB,
};