# ฟังดี

เว็บแอปสำหรับ iPhone ที่ค้นหาและเล่นเพลงอิสระจาก Jamendo มีค้นหาเพลง สุ่มเพลงใกล้เคียง เล่นวน และลิสต์เพลงที่กดใจ

## ใช้งานบน Netlify

ทำตามคู่มือ [NETLIFY-SETUP.md](NETLIFY-SETUP.md) โดยไม่ต้องใช้ Mac: เชื่อม repository กับ Netlify ตั้ง `JAMENDO_CLIENT_ID` แล้ว Deploy

เว็บไซต์อยู่ใน `web/` และ Netlify Function อยู่ใน `netlify/functions/` โดยมี `netlify.toml` ตั้งค่า publish directory ให้แล้ว หน้า `index.html` ในโฟลเดอร์หลักเปิดทางไปยังเว็บเวอร์ชันนี้เมื่อดูในเครื่อง

เว็บใช้ HTML audio player และ Media Session เพื่อให้ Safari แสดงการควบคุมเพลงที่หน้าจอล็อก การเล่นหลังล็อกหน้าจอขึ้นกับ iOS จึงไม่มีการรับประกันว่าเว็บจะเล่นต่อได้ทุกเครื่อง เว็บนี้ไม่มีตำแหน่งโฆษณา แต่สิทธิ์และข้อกำหนดของ Jamendo อาจเปลี่ยนได้

โปรเจกต์ iPhone native สำหรับ Xcode อยู่ใน `ios/` เป็นอีกทางเลือกหนึ่ง
