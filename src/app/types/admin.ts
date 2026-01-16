export interface User {
  id: string;
  fish: string; // F.I.Sh. - Full name
  lavozimi: string; // Position
  department?: string;
  departmentId?: string; // New field for relation
  username: string; // Login
  status: 'active' | 'disabled' | 'deleted';
  deletedAt?: string;
  createdDate: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  userCount: number;
  status: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
}

export interface Index {
  id: string;
  code: string; // e.g., "01-01"
  name: string; // Description
  status: 'active' | 'archived' | 'deleted';
  deletedAt?: string;
}

export interface Letter {
  id: string;
  letterNumber: string;
  indexCode: string;
  indexName: string;
  recipient: string;
  subject: string;
  content: string;
  pageCount: number;
  attachmentPageCount: number;
  userFish: string;
  userPosition: string;
  createdDate: string;
  signature?: string;
  elektronImzo?: string;
  xatFile?: File | string; // Main letter file
  xatFileId?: string;
  ilovaFiles?: (File | string)[]; // Attachment files
  ilovaFileIds?: string[];
}

export interface Credentials {
  username: string;
  password: string;
}
