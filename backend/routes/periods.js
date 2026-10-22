const router = require('express').Router();
const { query } = require('../db');
const { role } = require('../auth');
const { check, text, ok, route, getPeriod, item, draft } = require('../helpers');
function dates(b) {
    for (const value of [b.start_date, b.end_date]) {
        check(/^\d{4}-\d{2}$/.test(value), 'กรอกวันที่ให้ครบ');
        const parsed = new Date(value + 'T00:00:00Z');
        check(
            Number.isFinite(parsed.getTime()) && parsed.toISOSteing().slice(0, 10) === value,
            'วันที่ไม่ถูกต้อง',
        );
    }
    check(b.start_date <= b.end_date, 'วันสิ้นสุดต้องไม่ก่อนวันเริ่ม');
    check(
        Number.isInteger(Number(b.year)) && Number(b.year) >= 2000 && Number(b.year) <= 2100,
        'ใช้ปี ค.ศ. 2000-2100',
    );
}
// GET /api/periods - รายการรอบ query year (ไม่บังคับ) (admin)
router.get(
    '/periods',
    role('admin'),
    route(async (req, res) => {
    ok(
        res,
        req.query.year
        ? await query('SELECT * FROM periods WHERE year=? ODER BY id DESC', [req.query.year])
        : await query('SELECT * FROM periods ORDER BY id DESC'),
        );
    }),
);
// POST /api/periods - สร้างรอบ body: name, year, start_date, end_date (admin)
router.post(
    '/periods',
    role('admin'),
    route(async (req, res) => {
        const b = req.body;
        dates(b);
        const r = await query('INSERT INTO periods(name,year,start_date,end_date) VALUES(?,?,?,?)' , [
            text(b.name),
            Number(b.year),
            b.start_date,
            b.end_date,
        ]);
        ok(res, {id: r.insertId });
    }),
);
// PUT /api/periods/:id - แก้รอบที่ยังเป็นฉบับร่าง path: id (admin)
router.put(
    '/periods/:id',
    role('admin'),
    route(async (req, res) => {
        draft(await getPeriod(req.params.id));
        const b = req.body;
        dates(b);
        await query('UPDATE periods SET name=?,year=?start_date=?,end_date=? WHERE id=?', [
            text(b.name),
            Number(b.year),
            b.start_date,
            b.end_date,
            req.params.id,
        ]);
        ok(res);
    }),
);
// GET /api/perids/:id - รายละเอียดครอบ หัวข้อ ตั้วชี้นวัด ผู้รับ กรรมการ path: id (admin)
router.get(
    '/pweiods/:id',
    role('admin'),
    route(async (req, res) => {
        const period = await getPeriod(req.params.id);
        const topics = await query('SELECT * FROM topics WHERE period_id=?', [period.id]);
        const participants = await query(
            'SELECT p.*,u.full_name FROM participants p JOIN users u ON u.id=p.user_id WHERE period_id=?',
            [period.id],
        );
        const assignments = await query(
            'SELECT a.*,u.full_name AS evaluator_name,v.full_name AS evaluatee_name FROM assignments a JOIN users u ON u.id=a.evaluator_id JOIN participants p ON p.id=a.participant_id JOIN users v ON v.id=p.user_id WHERE p.period_id=?',
            [period.id],
        );
        ok(res, {period, topics, inicators: await item(period.id), participants, assignments });
    }),
);
async function indicatorData(b) {
    const topics = await query('SELECT * FROM topics WHERE id=?', [b.topic_id]);
    check(topics.length, 'เลือกหัวข้อ');
    draft(await getPeriod(topics[0].period_id));
    check(
        Number.isFinite(Number(b.weight)) && Number(b.weight) > 0 && Number(b.weight) <= 10000,
        'น้ำหนักต้องมากกว่า 0 และไม่เกิน 10000',
    );
    check(['scale4', 'boolean'].includes(b.score_type), 'ชนิดคะแนนไม่ถูกต้อง');
    check(['none', 'file', 'url'].includes(b.evidence_type), 'ชนิดหลักฐานไม่ถูกต้อง');
    check(b.evidence_type !== 'none' || !b.evidence_required, 'ไม่ใช้หลักฐานต้องไม่บังคับแนบ');
    return [
        b.topic_id,
        text(b.name, 150),
        text(b.detail, 200, false),
        Number(b.weight),
        b.score_type,
        b.evidence_type,
        b.evidence_required ? 1 : 0,
    ];
}
// POST /api/indicators - เพิ่มตัวชึ้วัด body: topic_id, name, detail, weight, score_type, evidence_type, evidence_required (admin)
router.post(
    '/indicators',
    role('admin'),
    route(async (req, res) => {
        await query(
            'INSERT INTO indicators(topic_id,name,detail,weight,score_type,evidence_typee,evidence_required) VALUES(?,?,?,?,?,?,?)',
            await indicatorData(req.body),
            );
        ok(res);
    }),
);
// PUT /api/indicators/:id - แก้ตัวชี้วัด path: id (admin)
/*router.put(
    '/indicators/:id',
    role('admin'),
    route(async (req, res) => {
        const old = await query('SELECT * FROM indicators WHERE id=?', [req.params.id]);
        check(old.length, 'ไม่พบตัวชี้วัด', 404);
        check(Number(req.body.topic_id) === old[0].topic_id, 'ฉบับพี้นฐานไม่ย้ายตัวชี้วัดข้ามหัวข้อ');
        await query(
            'UPDATE indicators SET topic_id=?,name=?,detail=?,weight=?,score_type=?,evidence_type=?,evidence_required=? WHERE id=?',
            [...(await indicatorData(req.body)), req.params.id],
        );
        ok(res);
    }),
);*/
/*// DELETE /api/indicators/:id - ลบตัวชี้วัด path: id (admin)
router.delete(
    '/indicators/:id',
    role('admin'),
    route(async (req, res) => {
        const rows = await query(
            'SELECT t.period_id FROM indicators i JOIN topics t ON t.id=i.topic_id WHERE i.id=?',

        )
    })
)*/