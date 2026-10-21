// ลำดับสำคัญ: JSON → Login → ตรวจ Token → API ตามระบบ → error (ไม่ส่งหน้าเว็บ)
const express = require('express');
const { query } = require('./db');
const { ok, route } = require('./helpers');
 const { auth } = require('./auth'); // ชั้น 2
const app = express();
app.use(express.json());

// GET /api/health ตรวจค่า API ต่อฐานข้อมูลได้
app.get(
    '/api/health',
    route(async (req, res) => {
        await query('SELECT 1 FROM users LIMIT 1');
    ok(res, { ready: true });
}),
);
 app.use('/api', require('./routes/users')); // ชั้น 2
 app.use('/api', auth); // ชั้น 2
// app.use('/api', require('./routes/periods')); // ชั้น 3
// app.use('/api', require('/routes/self')); // ชั้น 4
// app.use('/api', require('./routes/files')); // ชั้น 4
// app.use('/api', require('./routes/evaluate')); //ชั้น 5
// app.use('/api', require('./routes/reports')); // ชั้น 6

//  ไม่พบ API → 404
app.use('/api', (req,res) =>
    res.status(404).json({ status: 'error' , message: 'ไม่พบ API', data: null }),
);
// จัดการ error ทุกชนิดที่เดียว (EXception Handling)
app.use((error, req, res, next) => {
    let message = error.message,
    status = error.status || 500;
    if (error.code === 'ER_DUP_ENTRY') {
        message = 'ข้อมูลซ้ำ กรุณาตรวจสอบชื่อผู้ใช้หรือรายการที่เพิ่ม';
        status = 400;
    }
    if (error.code === 'LIMIT_FILE_SIZE') {
        message = 'ไฟล์เกิน 5 MB';
        status = 400;
    }
    if (error.type === 'entity.parse.failed') {
        message = 'รูปแบบ JSON ไม่ถูกต้อง';
        status = 400;
    }
    if (status === 500) {
        console.error(error.code || error.message);
        message = 'ระบบขัดข้อง ตรวจ log ของ backend';
    }
    res.status(status).json({ status: 'error', message, data: null });
});
const port = Number(process.env.PORT || 3301);
// 0.0.0.0 = รับการเชื่อมต่อจากนอก container
app.listen(port, '0.0.0.0', () => console.log('API พร้อมที่ http://localhost:' + port));
