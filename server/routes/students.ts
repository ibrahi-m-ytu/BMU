import { Router } from 'express';
import db from '../db';

const router = Router();

router.get('/admin/stats', (req, res) => {
  try {
    const studentCountStmt = db.prepare('SELECT COUNT(*) as count FROM students');
    const studentCount = studentCountStmt.get() as any;

    const reportCountStmt = db.prepare('SELECT COUNT(*) as count FROM upload_log'); // simulating benefited students
    const reportCount = reportCountStmt.get() as any;

    res.json({
      registeredStudents: studentCount.count || 0,
      benefitedStudents: (reportCount.count || 0) * 15 // Mocking benefited students based on uploads
    });
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/:student_no', (req, res) => {
  const { student_no } = req.params;
  try {
    const stmt = db.prepare('SELECT id, full_name, student_no, email, faculty, points FROM students WHERE student_no = ?');
    const student = stmt.get(student_no);
    
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı: ' + student_no });
    }
    
    res.json(student);
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası. Lütfen tekrar deneyin.' });
  }
});

router.get('/:student_no/uploads', (req, res) => {
  const { student_no } = req.params;
  try {
    const student = db.prepare('SELECT id FROM students WHERE student_no = ?').get(student_no) as any;
    if (!student) return res.status(404).json({ message: 'Öğrenci bulunamadı: ' + student_no });

    const stmt = db.prepare(`
      SELECT id, filename, row_count, points, status, uploaded_at 
      FROM upload_log 
      WHERE student_id = ? 
      ORDER BY uploaded_at DESC
    `);
    const rows = stmt.all(student.id);
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası. Lütfen tekrar deneyin.' });
  }
});

router.post('/:student_no/spend-points', (req, res) => {
  const { student_no } = req.params;
  const { points, item_name } = req.body;

  if (!points || typeof points !== 'number' || points <= 0) {
    return res.status(400).json({ message: 'Geçersiz puan miktarı' });
  }

  try {
    const student = db.prepare('SELECT id, points FROM students WHERE student_no = ?').get(student_no) as any;
    if (!student) {
      return res.status(404).json({ message: 'Öğrenci bulunamadı: ' + student_no });
    }

    if (student.points < points) {
      return res.status(400).json({ message: 'Yetersiz puan.' });
    }

    db.transaction(() => {
      // Subtract points
      db.prepare('UPDATE students SET points = points - ? WHERE id = ?').run(points, student.id);
      
      // Log the usage in point_log
      db.prepare(`
        INSERT INTO point_log (student_id, amount, reason)
        VALUES (?, ?, ?)
      `).run(student.id, -points, 'odül_kullanımı');

      // (Compatibility) Log the usage using Negative points in upload_log
      db.prepare(`
        INSERT INTO upload_log (student_id, filename, row_count, points, status, data)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        student.id, 
        `${item_name || 'Ödül Kullanımı'}`, 
        0, 
        -points, 
        'accepted', 
        JSON.stringify({ type: 'redeem', item: item_name, points_spent: points })
      );
    })();

    res.json({ message: 'Puan başarıyla kullanıldı.', pointsSpent: points, remainingPoints: student.points - points });
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası: ' + err.message });
  }
});

router.get('/:student_no/point-log', (req, res) => {
  const { student_no } = req.params;
  try {
    const student = db.prepare('SELECT id FROM students WHERE student_no = ?').get(student_no) as any;
    if (!student) return res.status(404).json({ message: 'Öğrenci bulunamadı.' });

    const rows = db.prepare(`
      SELECT 
        pl.id, 
        pl.amount as points, 
        pl.reason as filename, 
        pl.created_at as uploaded_at,
        'accepted' as status
      FROM point_log pl
      WHERE pl.student_id = ?
      
      UNION ALL
      
      SELECT 
        ul.id, 
        0 as points, 
        ul.filename, 
        ul.uploaded_at,
        ul.status
      FROM upload_log ul
      WHERE ul.student_id = ? AND ul.status != 'accepted'
      
      ORDER BY uploaded_at DESC
      LIMIT 100
    `).all(student.id, student.id);

    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası.' });
  }
});

export default router;
