import { Router } from 'express';
import multer from 'multer';
import * as xlsx from 'xlsx';
import ExcelJS from 'exceljs';
import fs from 'fs';
import path from 'path';
import db from '../db';

// ─── POINT CONSTANTS ───────────────────────────────────────────
const POINTS = {
  // Earned when submitting an insight
  REPORT_EMPTY:       10,   // room is empty — full points
  REPORT_PARTIAL:     8,    // room is partially full
  REPORT_FULL:        5,    // room is full — less points, less useful

  // Verification bonuses (2nd and 3rd person confirms the same status)
  VERIFY_2ND:         5,    // 2nd person confirms
  VERIFY_3RD:         3,    // 3rd person confirms

  // Informer gets a bonus when someone uses their report and heads there
  INFORMER_BONUS:     2,    // fixed small bonus per person who heads there

  // False report penalties — deducted from the original informer
  PENALTY_FULL_STATUS:    -10,  // reported status was wrong → full penalty, most harmful
  PENALTY_WIFI:           -5,   // wifi report was wrong → half penalty
  PENALTY_TEMP:           -5,   // temperature report was wrong → half penalty
  PENALTY_MULTI_FIELD:    -15,  // ALL three fields wrong → max penalty, clear false report

  // Reputation penalty (not points — affects reputation score)
  REPUTATION_HIT:      -5,
};
// ───────────────────────────────────────────────────────────────

const uploadDir = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

const upload = multer({ dest: uploadDir });
const router = Router();

router.get('/', (req, res) => {
  try {
    const stmt = db.prepare('SELECT id, faculty_name, building, room_name, capacity, status, temp, net, occupancy as val, last_insight_at FROM classrooms ORDER BY faculty_name, room_name');
    const rows = stmt.all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/:id/occupy', (req, res) => {
  const { id } = req.params;
  const { student_id } = req.body; // Identifier of the student WHO is going

  try {
    const classroom = db.prepare('SELECT id, last_insight_id, last_insight_at FROM classrooms WHERE id = ?').get(id) as any;
    if (!classroom) return res.status(404).json({ message: 'Derslik bulunamadı.' });

    db.transaction(() => {
      db.prepare('UPDATE classrooms SET occupancy = occupancy + 1 WHERE id = ?').run(id);

      // Award +2 points to the person who gave the last insight, IF it was recent (< 45 mins)
      if (classroom.last_insight_id && classroom.last_insight_at) {
        const diff = Date.now() - new Date(classroom.last_insight_at).getTime();
        const FORTY_FIVE_MINS = 45 * 60 * 1000;

        if (diff < FORTY_FIVE_MINS) {
          const insight = db.prepare('SELECT student_id FROM insights WHERE id = ?').get(classroom.last_insight_id) as any;
          if (insight && insight.student_id !== Number(student_id)) {
            // Award bonus points to the reporter
            db.prepare('UPDATE students SET points = points + ? WHERE id = ?')
              .run(POINTS.INFORMER_BONUS, insight.student_id);
            
            db.prepare(`
              INSERT INTO point_log (student_id, amount, reason, insight_id)
              VALUES (?, ?, ?, ?)
            `).run(insight.student_id, POINTS.INFORMER_BONUS, 'bilgi_kullanildi_gidildi', classroom.last_insight_id);
          }
        }
      }
    })();

    res.json({ success: true });
  } catch (err: any) {
    console.error('[Occupy error]', err);
    res.status(500).json({ message: 'İşlem başarısız.' });
  }
});

router.post('/:id/status', (req, res) => {
  const { id } = req.params;
  const { status, temp, net, student_id } = req.body;

  if (!student_id) {
    return res.status(400).json({ message: 'Öğrenci kimliği gerekli.' });
  }

  try {
    const classroom = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(Number(id)) as any;
    if (!classroom) {
      return res.status(404).json({ message: 'Derslik bulunamadı.' });
    }

    const student = db.prepare('SELECT * FROM students WHERE id = ?').get(Number(student_id)) as any;
    if (!student) {
      return res.status(400).json({ message: 'Öğrenci bulunamadı.' });
    }

    // ── THROTTLE CHECK ─────────────────────────────────────────
    // Max 2 different classrooms in a rolling 1-hour window
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const recentInsights = db.prepare(`
      SELECT COUNT(DISTINCT classroom_id) as cnt
      FROM insights
      WHERE student_id = ? AND created_at >= ? AND classroom_id != ?
    `).get(Number(student_id), oneHourAgo, Number(id)) as any;

    if (recentInsights.cnt >= 2) {
      return res.status(429).json({
        message: '1 saat içinde en fazla 2 farklı derslik bildirebilirsin. Biraz bekle!'
      });
    }

    // Max once every 30 min for the SAME classroom
    const thirtyMinAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
    const recentSame = db.prepare(`
      SELECT COUNT(*) as cnt FROM insights
      WHERE student_id = ? AND classroom_id = ? AND created_at >= ?
    `).get(Number(student_id), Number(id), thirtyMinAgo) as any;

    if (recentSame.cnt > 0) {
      return res.status(429).json({
        message: 'Aynı derslik için 30 dakikada bir bildirim yapabilirsin.'
      });
    }

    // ── CALCULATE POINTS ───────────────────────────────────────
    let pointsToAward = 0;
    if (status === 'empty' || status === 'Boş') pointsToAward = POINTS.REPORT_EMPTY;
    else if (status === 'partial' || status === 'Yarı Dolu') pointsToAward = POINTS.REPORT_PARTIAL;
    else if (status === 'full' || status === 'Dolu') pointsToAward = POINTS.REPORT_FULL;

    // Check if this is a 2nd or 3rd verifier of the same status
    const lastInsight = db.prepare(`
      SELECT * FROM insights
      WHERE classroom_id = ? AND is_voided = 0
      ORDER BY created_at DESC LIMIT 1
    `).get(Number(id)) as any;

    let isVerifier = false;
    if (lastInsight && lastInsight.status === status && lastInsight.student_id !== Number(student_id)) {
      const verifierCount = db.prepare(`
        SELECT COUNT(DISTINCT student_id) as cnt FROM insights
        WHERE classroom_id = ? AND status = ? AND is_voided = 0
        AND created_at >= datetime('now', '-1 hour')
      `).get(Number(id), status) as any;

      if (verifierCount.cnt === 1) {
        pointsToAward = POINTS.VERIFY_2ND;
        isVerifier = true;
      } else if (verifierCount.cnt === 2) {
        pointsToAward = POINTS.VERIFY_3RD;
        isVerifier = true;
      }
    }

    db.transaction(() => {
      // Update classroom status
      const updates: string[] = [];
      const params: any[] = [];
      if (status)          { updates.push('status = ?'); params.push(status); }
      if (temp !== undefined) { updates.push('temp = ?'); params.push(temp); }
      if (net)             { updates.push('net = ?'); params.push(net); }

      if (updates.length > 0) {
        updates.push('last_insight_at = ?');
        params.push(new Date().toISOString());
        params.push(Number(id));
        db.prepare(`UPDATE classrooms SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }

      // Insert insight record
      const insightResult = db.prepare(`
        INSERT INTO insights (student_id, classroom_id, status, temp, net, points_awarded)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(Number(student_id), Number(id), status || '', temp || '', net || '', pointsToAward);

      const insightId = insightResult.lastInsertRowid;

      // Update classroom's last_insight_id
      db.prepare('UPDATE classrooms SET last_insight_id = ? WHERE id = ?').run(insightId, Number(id));

      // Award points to student
      if (pointsToAward > 0) {
        db.prepare('UPDATE students SET points = points + ? WHERE id = ?').run(pointsToAward, Number(student_id));
        db.prepare(`
          INSERT INTO point_log (student_id, amount, reason, insight_id)
          VALUES (?, ?, ?, ?)
        `).run(Number(student_id), pointsToAward, isVerifier ? 'dogrulama' : 'bildirim', insightId);
      }
    })();

    res.json({
      success: true,
      pointsAwarded: pointsToAward,
      message: pointsToAward > 0
        ? `Bildirim alındı! +${pointsToAward} puan kazandın.`
        : 'Bildirim alındı.'
    });

  } catch (err: any) {
    console.error('[Status Report Error]', err);
    res.status(500).json({ message: 'Rapor iletilemedi: ' + err.message });
  }
});

// ── FALSE REPORT ENDPOINT ──────────────────────────────────────
router.post('/:id/false-report', (req, res) => {
  const { id } = req.params;
  const { reporter_student_id, wrong_fields } = req.body;

  if (!reporter_student_id || !wrong_fields || !Array.isArray(wrong_fields) || wrong_fields.length === 0) {
    return res.status(400).json({ message: 'Eksik bilgi: reporter_student_id ve wrong_fields gerekli.' });
  }

  try {
    const classroom = db.prepare('SELECT * FROM classrooms WHERE id = ?').get(Number(id)) as any;
    if (!classroom || !classroom.last_insight_id) {
      return res.status(404).json({ message: 'Bu derslik için aktif bir bildirim bulunamadı.' });
    }

    const insight = db.prepare(`
      SELECT i.*, s.full_name as informer_name
      FROM insights i
      JOIN students s ON i.student_id = s.id
      WHERE i.classroom_id = ? AND i.is_voided = 0
      ORDER BY i.created_at DESC LIMIT 1
    `).get(Number(id)) as any;

    if (!insight) {
      return res.status(404).json({ message: 'Aktif bildirim bulunamadı.' });
    }

    const insightTime = new Date(insight.created_at).getTime();
    const now = Date.now();
    const minutesElapsed = (now - insightTime) / 1000 / 60;

    if (minutesElapsed > 20) {
      return res.status(400).json({
        message: `Yanlış bildirim süresi doldu. Bildirimler yalnızca ilk 15-20 dakika içinde şikâyet edilebilir. (${Math.floor(minutesElapsed)} dakika geçti)`
      });
    }

    if (insight.student_id === Number(reporter_student_id)) {
      return res.status(400).json({ message: 'Kendi bildirimine şikâyet edemezsin.' });
    }

    const alreadyReported = db.prepare(`
      SELECT id FROM false_reports
      WHERE insight_id = ? AND reporter_student_id = ?
    `).get(insight.id, Number(reporter_student_id)) as any;

    if (alreadyReported) {
      return res.status(400).json({ message: 'Bu bildirimi zaten şikâyet ettin.' });
    }

    let penalty = 0;
    const hasStatus = wrong_fields.includes('status');
    const hasNet    = wrong_fields.includes('net');
    const hasTemp   = wrong_fields.includes('temp');
    const allWrong  = hasStatus && hasNet && hasTemp;

    if (allWrong) {
      penalty = Math.abs(POINTS.PENALTY_MULTI_FIELD);
    } else if (hasStatus) {
      penalty = Math.abs(POINTS.PENALTY_FULL_STATUS);
    } else {
      if (hasNet)  penalty += Math.abs(POINTS.PENALTY_WIFI);
      if (hasTemp) penalty += Math.abs(POINTS.PENALTY_TEMP);
    }

    const clawback = insight.points_awarded || 0;
    const totalDeduction = penalty + clawback;

    db.transaction(() => {
      db.prepare('UPDATE insights SET is_voided = 1 WHERE id = ?').run(insight.id);

      const informer = db.prepare('SELECT points, reputation FROM students WHERE id = ?')
        .get(insight.student_id) as any;
      const newPoints = Math.max(0, informer.points - totalDeduction);
      const newReputation = Math.max(0, (informer.reputation || 100) + POINTS.REPUTATION_HIT);

      db.prepare('UPDATE students SET points = ?, reputation = ? WHERE id = ?')
        .run(newPoints, newReputation, insight.student_id);

      db.prepare(`
        INSERT INTO point_log (student_id, amount, reason, insight_id)
        VALUES (?, ?, ?, ?)
      `).run(insight.student_id, -totalDeduction, 'yanlis_bildirim_cezasi', insight.id);

      for (const field of wrong_fields) {
        db.prepare(`
          INSERT INTO false_reports (reporter_student_id, insight_id, classroom_id, field)
          VALUES (?, ?, ?, ?)
        `).run(Number(reporter_student_id), insight.id, Number(id), field);
      }

      db.prepare(`
        UPDATE classrooms SET status = NULL, temp = NULL, net = NULL,
        last_insight_id = NULL, last_insight_at = NULL WHERE id = ?
      `).run(Number(id));
    })();

    res.json({
      success: true,
      penaltyApplied: totalDeduction,
      clawback,
      penaltyBreakdown: {
        wrongFields: wrong_fields,
        basePenalty: penalty,
        clawback,
        total: totalDeduction
      },
      message: `Şikâyet alındı. Yanlış bildirim yapan öğrenciden ${totalDeduction} puan düşüldü.`
    });

  } catch (err: any) {
    console.error('[False Report Error]', err);
    res.status(500).json({ message: 'Şikâyet işlenirken hata oluştu: ' + err.message });
  }
});

router.get('/pending', (req, res) => {
  try {
    const stmt = db.prepare(`
      SELECT ul.id, ul.student_id, s.full_name as student_name, s.student_no, ul.filename, ul.row_count, ul.points, ul.status, ul.uploaded_at, ul.data 
      FROM upload_log ul
      JOIN students s ON ul.student_id = s.id
      WHERE ul.status = 'pending'
      ORDER BY ul.uploaded_at DESC
    `);
    const rows = stmt.all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.post('/pending/:id/resolve', (req, res) => {
  const { id } = req.params;
  const { action } = req.body; // 'accept' or 'reject'

  if (action !== 'accept' && action !== 'reject') {
    return res.status(400).json({ message: 'Geçersiz işlem.' });
  }

  try {
    const logStmt = db.prepare('SELECT * FROM upload_log WHERE id = ?');
    const uploadLog = logStmt.get(Number(id)) as any;

    if (!uploadLog || uploadLog.status !== 'pending') {
      console.warn(`[Resolve] Log not found or not pending: ID=${id}, Status=${uploadLog?.status}`);
      return res.status(404).json({ message: 'Kayıt bulunamadı veya zaten işlenmiş.' });
    }

    console.log(`[Resolve] Processing ID=${id}, Action=${action}, StudentID=${uploadLog.student_id}`);

    db.transaction(() => {
      if (action === 'accept') {
        const rows = JSON.parse(uploadLog.data || '[]');
        console.log(`[Resolve] Accepting. Total rows to sync: ${rows.length}`);
        
        // Removed: db.prepare('DELETE FROM classrooms').run();

        const insertStmt = db.prepare(`
          INSERT INTO classrooms (faculty_name, building, room_name, capacity, uploaded_by) 
          VALUES (?, ?, ?, ?, ?)
          ON CONFLICT(building, room_name) DO UPDATE SET
            faculty_name = excluded.faculty_name,
            capacity = excluded.capacity,
            uploaded_by = excluded.uploaded_by
        `);

        for (const r of rows) {
          insertStmt.run(r.faculty_name, r.building, r.room_name, r.capacity, uploadLog.student_id);
        }

        const updatePointsStmt = db.prepare('UPDATE students SET points = points + ? WHERE id = ?');
        updatePointsStmt.run(uploadLog.points, uploadLog.student_id);
        
        // Add to point_log for consistent history
        db.prepare('INSERT INTO point_log (student_id, amount, reason) VALUES (?, ?, ?)').run(
          uploadLog.student_id, uploadLog.points, `Derslik Yükleme: ${uploadLog.filename}`
        );
        
        db.prepare("UPDATE upload_log SET status = 'accepted' WHERE id = ?").run(Number(id));
      } else {
        console.log(`[Resolve] Rejecting ID=${id}`);
        db.prepare("UPDATE upload_log SET status = 'rejected' WHERE id = ?").run(Number(id));
        
        // Add to point_log as rejected (optional, but good for history if we show 0 points)
        // Actually, we'll just rely on upload_log for rejected items in the frontend if needed.
      }
    })();
    res.json({ message: 'İşlem başarılı.' });
  } catch (err: any) {
    console.error(`[Resolve] Error resolving ID=${id}:`, err);
    res.status(500).json({ message: 'İşlem sırasında hata oluştu.', error: err.message });
  }
});

router.get('/all-uploads', (req, res) => {
  try {
    const rows = db.prepare(`
      SELECT ul.id, ul.student_id, s.full_name as student_name, s.student_no,
             ul.filename, ul.row_count, ul.points, ul.status, ul.uploaded_at
      FROM upload_log ul
      JOIN students s ON ul.student_id = s.id
      WHERE ul.status IN ('accepted', 'rejected')
      ORDER BY ul.uploaded_at DESC
    `).all();
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: 'Sunucu hatası' });
  }
});

router.get('/template', async (req, res) => {
  try {
    const wb = new ExcelJS.Workbook();

    // 1. SEKME: Kullanım Talimatları
    const wsDocs = wb.addWorksheet("Kullanım Talimatları", { views: [{ showGridLines: true }] });
    
    const titleFont: Partial<ExcelJS.Font> = { bold: true, size: 16, color: { argb: "FF183CE6" }, name: "Arial" };
    const sectionFont: Partial<ExcelJS.Font> = { bold: true, size: 13, color: { argb: "FFD9381E" }, name: "Arial" };
    const boldFont: Partial<ExcelJS.Font> = { bold: true, size: 11, color: { argb: "FF000000" }, name: "Arial" };
    const regularFont: Partial<ExcelJS.Font> = { size: 11, color: { argb: "FF333333" }, name: "Arial" };
    const borderThin: Partial<ExcelJS.Borders> = {
      left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      right: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
      bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } }
    };
    
    wsDocs.getCell('A1').value = "BMU - Kampüs Derslik Veri Giriş Kılavuzu";
    wsDocs.getCell('A1').font = titleFont;
    
    const instructions = [
      "1. Sınıf ve derslik bilgilerini girmek için alttaki 'Kampüs Derslik Şablonu' sekmesini kullanın.",
      "2. Bölüm / Program ve Bina / Blok sütunlarındaki verileri açılır kutulardan (dropdown) seçerek doldurun.",
      "3. Tüm veri girişi işleminiz bittiğinde, web sitesine yükleme yapmadan önce aşağıdaki adımları MUTLAKA uygulayın:"
    ];
    
    instructions.forEach((txt, idx) => {
      const cell = wsDocs.getCell(3 + idx, 1);
      cell.value = txt;
      cell.font = regularFont;
    });
    
    wsDocs.getCell('A7').value = "SİSTEME YÜKLEMEDEN ÖNCE YAPILMASI ZORUNLU ADIMLAR:";
    wsDocs.getCell('A7').font = sectionFont;
    
    const steps = [
      "A) Başlık satırı hariç, şablonda doldurduğunuz tüm satır ve sütunları tamamen seçip kopyalayın.",
      "B) Bilgisayarınızda YENİ ve TAMAMEN BOŞ bir Excel dosyası açın.",
      "C) Yeni açtığınız boş dosyanın ilk hücresine (A1) tıklayın.",
      "D) Klavyenizden CTRL + SHIFT + V tuşlarına basın (veya Değerleri Yapıştır / Paste as Values kullanın).",
      "ÖNEMLİ UYARI: Sadece 'Değerleri Yapıştır' kullanın! Normal kopyala-yapıştır yaparsanız formüller sisteme hatalı aktarılır ve yükleme başarısız olur.",
      "E) Sadece düz yazı haline gelen bu yeni dosyayı kaydederek web sitesine yükleyin.",
      "KRİTİK UYARI: Şablonun arkasında çalışan 'DataLists' ve 'Giriş ve Ayarlar' sekmelerini KESİNLİKLE SİLMEYİN!"
    ];
    
    let startRow = 9;
    steps.forEach(txt => {
      const cell = wsDocs.getCell(startRow, 1);
      cell.value = txt;
      
      if (txt.includes("ÖNEMLİ UYARI:")) {
        cell.font = { bold: true, size: 11, color: { argb: "FFFFFFFF" }, name: "Arial" };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FFD9381E" } };
        cell.alignment = { wrapText: true };
        wsDocs.getRow(startRow).height = 32;
      } else if (txt.includes("KRİTİK UYARI:")) {
        cell.font = { bold: true, size: 11, color: { argb: "FFB22222" }, name: "Arial" };
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FFFFF0F0" } };
        cell.border = borderThin;
      } else if (txt.includes("ZORUNLU") || txt.includes("SHIFT") || txt.includes("Değerleri")) {
        cell.font = boldFont;
      } else {
        cell.font = regularFont;
      }
      startRow++;
    });
    wsDocs.getColumn(1).width = 120;
    
    // 2. SEKME: Giriş ve Ayarlar
    const wsSetup = wb.addWorksheet("Giriş ve Ayarlar", { views: [{ showGridLines: true }] });
    wsSetup.getCell('A1').value = "Fakülte ve Sınıf Sayısı Tanımlama";
    wsSetup.getCell('A1').font = { bold: true, size: 14, color: { argb: "FF183CE6" } };
    
    const setupHeaders = ["Fakülte Adı", "Açılacak Sınıf Sayısı"];
    setupHeaders.forEach((text, i) => {
      const cell = wsSetup.getCell(3, i + 1);
      cell.value = text;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FF5B5B5B" } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 11 };
      cell.alignment = { horizontal: 'center' };
      cell.border = borderThin;
    });
    
    const facultyMapping: any = {
      "Bilgisayar ve Bilişim Bilimleri Fakültesi": {
        key: "BilgisayarFak",
        depts: ["Bilgisayar Mühendisliği", "Yapay Zeka ve Veri Mühendisliği"]
      },
      "Eğitim Fakültesi": {
        key: "EgitimFak",
        depts: ["Bilgisayar ve Öğretim Tekn", "Fen Bilgisi", "İlköğretim Mat", "İngilizce Öğr", "Okul Öncesi", "Rehberlik"]
      },
      "Elektrik-Elektronik Fakültesi": {
        key: "ElektrikFak",
        depts: ["Biyomedikal", "Elektrik Müh", "Elektronik ve Haberleşme", "Kontrol ve Otomasyon"]
      },
      "Fen-Edebiyat Fakültesi": {
        key: "FenEdebiyatFak",
        depts: ["Fizik", "İstatistik", "Kimya", "Matematik", "Moleküler Biyoloji", "Türk Dili"]
      },
      "Gemi İnşaatı ve Denizcilik Fakültesi": {
        key: "GemiFak",
        depts: ["Gemi İnşaatı ve Gemi Mak", "Gemi Mak İşletme"]
      },
      "İktisadi ve İdari Bilimler Fakültesi": {
        key: "IktisatFak",
        depts: ["İktisat", "İşletme", "Siyaset Bilimi"]
      },
      "İnşaat Fakültesi": {
        key: "InsaatFak",
        depts: ["Çevre Mühendisliği", "Harita Mühendisliği", "İnşaat Mühendisliği"]
      },
      "Kimya-Metalurji Fakültesi": {
        key: "KimyaFak",
        depts: ["Biyomühendislik", "Gıda", "Kimya", "Matematik Müh", "Metalurji"]
      },
      "Makine Fakültesi": {
        key: "MakineFak",
        depts: ["Makine Mühendisliği", "Endüstri Mühendisliği", "Mekatronik"]
      },
      "Mimarlık Fakültesi": {
        key: "MimarlikFak",
        depts: ["Mimarlık", "Şehir ve Bölge Planlama"]
      },
      "Sanat ve Tasarım Fakültesi": {
        key: "SanatFak",
        depts: ["Bileşik Sanatlar", "Fotoğraf ve Video", "Grafik Tasarımı"]
      },
      "Uygulamalı Bilimler Fakültesi": {
        key: "UygulamaliFak",
        depts: ["Havacılık Yönetimi", "Lojistik Yönetimi"]
      }
    };
    
    const ytuFacs = Object.keys(facultyMapping);
    const counts = [3, 3, 4, 4, 2, 3, 3, 4, 3, 2, 2, 2];
    
    for (let i = 0; i < 15; i++) {
      const r = 4 + i;
      const c1 = wsSetup.getCell(r, 1);
      const c2 = wsSetup.getCell(r, 2);
      
      if (i < ytuFacs.length) {
        c1.value = ytuFacs[i];
        c2.value = counts[i];
      } else {
         c1.value = ""; c2.value = "";
      }
      c1.border = borderThin;
      c2.border = borderThin;
      c2.alignment = { horizontal: 'center' };
    }
    wsSetup.getColumn(1).width = 45;
    wsSetup.getColumn(2).width = 25;
    
    // 3. SEKME: Kampüs Derslik Şablonu
    const wsTemplate = wb.addWorksheet("Kampüs Derslik Şablonu", { views: [{ showGridLines: true }] });
    const headers = ["Fakülte Adı", "Bölüm / Program", "Bina / Blok", "Derslik No / Adı"];
    headers.forEach((h, i) => {
      const cell = wsTemplate.getCell(1, i + 1);
      cell.value = h;
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: "FF183CE6" } };
      cell.font = { color: { argb: "FFFFFFFF" }, bold: true, size: 12, name: "Plus Jakarta Sans" };
      cell.alignment = { horizontal: 'center' };
      cell.border = borderThin;
    });
    
    const blocks = ["A Blok", "B Blok", "C Blok", "D Blok", "E Blok", "Bina 1", "Bina 2", "Merkez Laboratuvar"];
    const blockList = '"' + blocks.join(',') + '"';

    for (let r = 2; r < 120; r++) {
      const fillColor = (r % 2 === 0) ? "FFF6F3F2" : "FFFFFFFF";
      const fill: any = { type: 'pattern', pattern: 'solid', fgColor: { argb: fillColor } };
      
      let formulaStr = "";
      let closeBrackets = 0;
      for (let i = 0; i < 15; i++) {
          let sr = 4 + i;
          let sumStr = `SUM('Giriş ve Ayarlar'!$B$4:$B$${sr})`;
          formulaStr += `IF(ROW()-1<=${sumStr}, IF('Giriş ve Ayarlar'!$A$${sr}="","", 'Giriş ve Ayarlar'!$A$${sr}), `;
          closeBrackets++;
      }
      formulaStr += '""' + (")".repeat(closeBrackets));
      
      const cellF = wsTemplate.getCell(r, 1);
      cellF.value = { formula: formulaStr };
      cellF.fill = fill; cellF.border = borderThin;
      
      const cellD = wsTemplate.getCell(r, 2);
      cellD.fill = fill; cellD.border = borderThin;
      cellD.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [`INDIRECT(VLOOKUP($A${r},FacultyLookupMap,2,FALSE))`]
      };
      
      const cellB = wsTemplate.getCell(r, 3);
      cellB.fill = fill; cellB.border = borderThin;
      cellB.dataValidation = {
        type: 'list',
        allowBlank: true,
        formulae: [blockList]
      };
      
      const cellN = wsTemplate.getCell(r, 4);
      cellN.fill = fill; cellN.border = borderThin;
    }
    
    wsTemplate.getColumn(1).width = 42;
    wsTemplate.getColumn(2).width = 42;
    wsTemplate.getColumn(3).width = 25;
    wsTemplate.getColumn(4).width = 25;
    wsTemplate.getRow(1).height = 32;

    // 4. SEKME: DataLists
    const wsLists = wb.addWorksheet("DataLists");
    wsLists.getCell(1, 1).value = "Official Faculty Name";
    wsLists.getCell(1, 2).value = "Excel Clean Key";
    
    let rowIdx = 2;
    for (const fac of Object.keys(facultyMapping)) {
      wsLists.getCell(rowIdx, 1).value = fac;
      wsLists.getCell(rowIdx, 2).value = facultyMapping[fac].key;
      rowIdx++;
    }
    
    wb.definedNames.add('DataLists!$A$2:$B$13', 'FacultyLookupMap');

    let colIdx = 4;
    for (const fac of Object.keys(facultyMapping)) {
      const key = facultyMapping[fac].key;
      const depts = facultyMapping[fac].depts;
      
      wsLists.getCell(1, colIdx).value = `LIST_FOR_${key}`;
      for(let rOffset = 0; rOffset < depts.length; rOffset++){
         wsLists.getCell(rOffset + 2, colIdx).value = depts[rOffset];
      }
      const colLetter = String.fromCharCode(64 + colIdx);
      if (depts.length > 0) {
        wb.definedNames.add(`DataLists!$${colLetter}$2:$${colLetter}$${depts.length + 1}`, key);
      }
      colIdx += 2;
    }
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="bmu_kampus_sablonu.xlsx"');
    
    await wb.xlsx.write(res);
    res.end();
  } catch (err: any) {
    res.status(500).json({ message: 'Template generasyon hatası' });
  }
});

router.post('/upload', (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err) {
      return res.status(400).json({ message: 'Multer hatası: ' + err.message });
    }
    next();
  });
}, (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'Lütfen bir Excel (.xlsx) dosyası yükleyin.' });
  }

  const student_id = req.body.student_id;
  if (!student_id) {
    fs.unlinkSync(req.file.path);
    return res.status(400).json({ message: 'Öğrenci kimliği (student_id) eksik.' });
  }

  try {
    const fileBuffer = fs.readFileSync(req.file.path);
    const wb = xlsx.read(fileBuffer, { type: 'buffer' });
    let ws = wb.Sheets['Kampüs Derslik Şablonu'];
    if (!ws) {
        // Fallback to first sheet if the user copied only values to a new file as instructed!
        ws = wb.Sheets[wb.SheetNames[0]];
    }
    
    const data = xlsx.utils.sheet_to_json<any[]>(ws, { header: 1 });
    const rows = data.slice(1).filter(r => r.length > 0 && r[0] !== undefined);

    let importCount = rows.length;
    let validRows = [];
    
    // Check existing
    const existingClassrooms = db.prepare('SELECT building, room_name FROM classrooms').all();
    const existingSet = new Set(existingClassrooms.map((c: any) => `${c.building}-${c.room_name}`));
    let newCount = 0;
    
    for (let i = 0; i < rows.length; i++) {
        const r = rows[i];
        if (r.length < 4 || !r[0] || !r[2] || !r[3]) {
            throw new Error('Eksik verili veya hatalı bir satır (Tüm sütunlar dolu olmalıdır).');
        }
        
        let building = r[2].toString();
        let roomName = r[3].toString();
        let capacity = 50; 
        
        const key = `${building}-${roomName}`;
        if (!existingSet.has(key)) {
            newCount++;
            existingSet.add(key);
        }
        
        validRows.push({ faculty_name: r[0].toString(), building, room_name: roomName, capacity });
    }

    const calculatedPoints = newCount * 2;

    const logStmt = db.prepare(`
        INSERT INTO upload_log (student_id, filename, row_count, points, status, data)
        VALUES (?, ?, ?, ?, ?, ?)
    `);
    
    logStmt.run(student_id, req.file?.originalname, validRows.length, calculatedPoints, 'pending', JSON.stringify(validRows));

    fs.unlinkSync(req.file.path);
    res.json({ message: 'Yükleme başarılı, yönetici onayına gönderildi.', status: 'pending' });

  } catch (err: any) {
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(422).json({ message: err.message || 'Dosya işlenirken bir sorun oluştu.' });
  }
});

export default router;
