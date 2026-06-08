import { Router } from 'express';
import db from '../db';
import fs from 'fs';
import path from 'path';

const router = Router();

const clearUploadsDirectory = () => {
  try {
    const uploadDir = path.resolve(process.cwd(), 'uploads');
    if (fs.existsSync(uploadDir)) {
      const files = fs.readdirSync(uploadDir);
      for (const file of files) {
        fs.unlinkSync(path.join(uploadDir, file));
      }
    }
  } catch (err) {
    console.error('[Admin] Error clearing uploads directory:', err);
  }
};

// SAFEGUARD: A helper function so code CANNOT run unless explicitly called by an HTTP request
const executeResetUploads = () => {
  db.transaction(() => {
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare('DELETE FROM upload_log').run();
    db.prepare('DELETE FROM classrooms').run();
    db.prepare('UPDATE students SET points = 0').run();
    db.prepare('PRAGMA foreign_keys = ON').run();
  })();
  clearUploadsDirectory();
};

const executeResetUsers = () => {
  db.transaction(() => {
    db.prepare('PRAGMA foreign_keys = OFF').run();
    db.prepare('DELETE FROM upload_log').run();
    db.prepare('DELETE FROM classrooms').run();
    db.prepare("DELETE FROM students WHERE student_no != 'admin'").run();
    db.prepare('PRAGMA foreign_keys = ON').run();
  })();
  clearUploadsDirectory();
};

// ─── ENDPOINTS ────────────────────────────────────────────────
router.post('/reset-uploads', (req, res) => {
  console.log('[Admin] Explicit POST request received for reset-uploads.');
  try {
    executeResetUploads();
    console.log('[Admin] upload_log and classrooms successfully wiped on disk.');
    res.json({ success: true, message: 'Tüm yükleme verileri ve derslikler başarıyla sıfırlandı.' });
  } catch (err: any) {
    console.error('[Admin] Reset-uploads failed:', err);
    res.status(500).json({ message: 'Sıfırlama hatası: ' + err.message });
  }
});

router.post('/reset-users', (req, res) => {
  console.log('[Admin] Explicit POST request received for reset-users.');
  try {
    executeResetUsers();
    console.log('[Admin] All user and classroom rows successfully wiped on disk.');
    res.json({ success: true, message: 'Tüm kullanıcı ve derslik verileri başarıyla temizlendi.' });
  } catch (err: any) {
    console.error('[Admin] Reset-users failed:', err);
    res.status(500).json({ message: 'Sıfırlama hatası: ' + err.message });
  }
});

export default router;