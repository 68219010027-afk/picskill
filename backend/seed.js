// รันทุกครั้งที่ backend เริ่ม: สร้างตารางจาก schema.sql และบัญชีฝึก ไม่ลบข้อมูลเดิม
const fs = require('node:fs');
const path = require('node:path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
const { settings } = require('./db');
async function seed() {
    const db = await mysql.createConnection({ ...settings, multipleStatements: true });
    try {
        await db.query(fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8'));
        const [columns] = await db.query('SHOW COLUMNS FROM users');
        const existingColumns = new Set(columns.map(({ Field }) => Field));
        const missingColumns = {
            department: 'VARCHAR(100) NULL',
            position: 'VARCHAR(100) NULL',
            active: 'TINYINT(1) NOT NULL DEFAULT 1',
            must_change_password: 'TINYINT(1) NOT NULL DEFAULT 0',
            token_version: 'INT UNSIGNED NOT NULL DEFAULT 0',
        };
        for (const [column, definition] of Object.entries(missingColumns)) {
            if (!existingColumns.has(column)) {
                await db.query(`ALTER TABLE users ADD COLUMN ${column} ${definition}`);
            }
        }
        const user = [
            ['admin', 'Admin1234!', 'ฝ่ายบุคลากร', 'admin'],
            ['emp001', 'Emp1234!', 'ผู้รับหนึ่ง', 'evaluatee'],
            ['emp02', 'Emp1234!', 'ผู้รับสอง', 'evaluatee'],
            ['eval01', 'Eval1234!', 'กรรมการหนึ่ง', 'evaluator'],
            ['eval02', 'Eval1234!', 'กรรมการสอง ', 'evaluator'],
        ];
        for (const [username, password, name , role] of user) {
            await db.execute(
                'INSERT IGNORE INTO users(username,password,full_name,role) VALUES(?,?,?,?)',
                [username, await bcrypt.hash(password, 10), name, role],
            );
        }
        console.log('seed เสร็จ ฐานข้อมูล:' , settings.database);
    } finally {
        await db.end();
    }
}
seed().catch((error) => {
    console.error('seed ไม่สำเร็จ:', error.code || error.message);
    process.exit(1);
});
