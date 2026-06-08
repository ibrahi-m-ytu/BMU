import { Router } from 'express';
import db from '../db';

const router = Router();

router.post('/register', (req, res) => {
  const { full_name, student_no, email, faculty } = req.body;

  if (!full_name || !student_no || !email || !faculty) {
    return res.status(400).json({ message: 'Lütfen tüm alanları doldurun.' });
  }

  try {
    const stmt = db.prepare(`
      INSERT INTO students (full_name, student_no, email, faculty)
      VALUES (?, ?, ?, ?)
    `);
    const info = stmt.run(full_name, student_no, email, faculty);
    
    res.status(201).json({
      message: 'Kayıt başarılı',
      student: { id: info.lastInsertRowid, full_name, student_no, email, faculty, points: 0 }
    });
  } catch (err: any) {
    if (err.message.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'Bu öğrenci numarası veya e-posta zaten kayıtlı.' });
    }
    res.status(500).json({ message: 'Sunucu hatası. Lütfen tekrar deneyin.' });
  }
});

export default router;
