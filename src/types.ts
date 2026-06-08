export interface Student {
  id: number;
  full_name: string;
  student_no: string;
  email: string;
  faculty: string;
  points: number;
}

export interface UploadLog {
  id: number;
  filename: string;
  row_count: number;
  points: number;
  uploaded_at: string;
  status?: string;
}
