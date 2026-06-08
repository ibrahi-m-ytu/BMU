# BMU Kampüs Derslik Uygulaması

## Kurulum (Setup)
1. `npm install`
2. `npm run dev` (veya production için `npm start`)
3. Tarayıcınızda Node server URL'ine gidin. (Eğer lokalde çalıştırıyorsanız http://localhost:3000)

## Özellikler (Features)
- Student registration with persistent SQLite storage
- Excel template download (pre-styled .xlsx)
- Excel upload with row validation and point awarding
- Upload history per student

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /api/auth/register | Register new student |
| GET  | /api/students/:student_no | Look up existing student |
| GET  | /api/students/:id/uploads | Get student upload history |
| GET  | /api/classrooms/template | Download Excel template |
| POST | /api/classrooms/upload | Upload filled Excel file |

## Database
SQLite file: bmu.db (auto-created on first run)
Tables: students, classrooms, upload_log

## Notes
- The /uploads/ directory is used temporarily during file processing and is auto-cleared.
- The app is mobile-first, max 480px wide, designed to match the BMU mobile app UI.
- Geliştirme ortamında Vite + React ve Tailwind CSS ile birlikte arkada SQLite tabanlı Node Express sunucusu çalışmaktadır.
